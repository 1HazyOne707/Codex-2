#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
say(){ printf '%s\n' "$*"; }
LOG="$HOME/codex/logs/doctor.$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG") 2>&1

say "🪄 Witch Doctor: diagnostics + remedies"
echo "—— env ——";  printf 'HOME=%s\nPATH=%s\n' "$HOME" "$PATH"
echo "—— perms ——"; ls -l "$HOME/codex/lib"/*.sh 2>/dev/null || true

# Normalize all seed shebangs/CRLF/executable bits
for f in "$HOME"/codex/lib/*.sh; do
  [ -f "$f" ] || continue
  dos2unix "$f" >/dev/null 2>&1 || true
  sed -i '1s|^#!.*bash$|#!/data/data/com.termux/files/usr/bin/bash|' "$f"
  chmod 755 "$f" || true
done

# Guard scan
if command -v codex-guard >/dev/null 2>&1; then
  echo "—— guard scan ——"
  ok=0; bad=0
  for f in "$HOME"/codex/lib/*.sh; do
    if codex-guard "$f" >/dev/null 2>&1; then
      printf "  ✅ %s\n" "$(basename "$f")"; ((ok++))
    else
      printf "  ❌ %s\n" "$(basename "$f")"; ((bad++))
    fi
  done
  echo "—— summary ——"; echo "ok=$ok bad=$bad (log saved: $LOG)"
else
  say "⚠ codex-guard not found — running light checks only."
fi

say "✨ Doctor ritual complete."
