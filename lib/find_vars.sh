#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

target="${1:-}"
if [[ -z "$target" ]]; then
  echo "Usage: find_vars.sh /full/path/to/script.sh" >&2
  exit 2
fi
[[ -r "$target" ]] || { echo "Not readable: $target" >&2; exit 2; }

# 1) collect referenced variables like $FOO, ${BAR}, skipping known shell specials
grep -oE '\$[{]?[_A-Za-z][_A-Za-z0-9]*' "$target" \
  | sed -E 's/^\$\{?//' \
  | grep -vE '^(#|[0-9]|[$@*?#!-]|PWD|OLDPWD|HOME|PATH|SHELL|USER|UID|IFS)$' \
  | sort -u > /tmp/ref.$$ || true

# 2) collect names that are clearly defined: VAR=…, local VAR, export VAR, declare VAR
awk '
  # capture foo=bar forms (not inside ${})
  match($0,/(^|[^A-Za-z0-9_])([_A-Za-z][_A-Za-z0-9]*)=/,m){ print m[2] }
  /(^|[^A-Za-z0-9_])local[[:space:]]+[_A-Za-z][_A-Za-z0-9]*/{
    gsub(/,/," "); for(i=1;i<=NF;i++) if($i=="local") print $(i+1)
  }
  /(^|[^A-Za-z0-9_])export[[:space:]]+[_A-Za-z][_A-Za-z0-9]*/{
    gsub(/,/," "); for(i=1;i<=NF;i++) if($i=="export") print $(i+1)
  }
  /(^|[^A-Za-z0-9_])declare[[:space:]-a-zA-Z]*[[:space:]]+[_A-Za-z][_A-Za-z0-9]*/{
    gsub(/,/," "); for(i=1;i<=NF;i++) if($i=="declare") print $(i+1)
  }
' "$target" \
| sed -E 's/[;(){}].*$//' \
| sed -E 's/^[^A-Za-z_]*//' \
| grep -E '^[_A-Za-z][_A-Za-z0-9]*$' \
| sort -u > /tmp/def.$$ || true

# 3) referenced minus defined => suspicious
comm -23 /tmp/ref.$$ /tmp/def.$$ > /tmp/missing.$$

echo "🔎 Variable check for: $target"
echo "— referenced: $(wc -l </tmp/ref.$$)"
echo "— defined   : $(wc -l </tmp/def.$$)"

if [[ -s /tmp/missing.$$ ]]; then
  echo
  echo "⚠️  Possibly used but not defined here:"
  nl -ba /tmp/missing.$$
  echo
  echo "Tip: define with 'local NAME=…' in a function, or guard with ': \${NAME:=default}'"
  exit 1
else
  echo "✅ No obvious undefined variables found."
fi
rm -f /tmp/ref.$$ /tmp/def.$$ /tmp/missing.$$ 2>/dev/null || true
