#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
LOG="$HOME/codex/logs/repair.$(date +%Y%m%d-%H%M%S).log"
exec > >(tee -a "$LOG") 2>&1

say(){ printf '%s\n' "$*"; }

say "🔧 Repair Protocol: Scholar+Medic+Historian engaged."
say "• Scope: all seeds in ~/codex/lib/*.sh"

shopt -s nullglob
fixed=0 bad=0 ok=0

for f in "$HOME"/codex/lib/*.sh; do
  bn=$(basename "$f")
  # skip this script itself
  [[ "$bn" == "repair_seeds.sh" ]] && continue

  say "— inspecting: $bn"

  # Historian: keep a quick backup
  cp -f "$f" "$f.bak.$(date +%s)" || true

  # Scholar + Medic: normalize line endings + shebang
  dos2unix "$f" >/dev/null 2>&1 || true
  sed -i '1s|^#!.*bash$|#!/data/data/com.termux/files/usr/bin/bash|' "$f"

  # Ensure executable
  chmod 755 "$f" || true

  # Nyx Hound: quick guard lint
  if command -v codex-guard >/dev/null 2>&1; then
    if ! codex-guard "$f" >/dev/null 2>&1; then
      say "  ⚠ guard flagged $bn — attempting gentle mend…"
      # common gentle mend: ensure file has a body & not empty
      if [[ ! -s "$f" ]]; then echo 'exit 2' >>"$f"; fi
      if ! codex-guard "$f" >/dev/null 2>&1; then
        say "  ❌ still failing guard: $bn"
        ((bad++))
        continue
      fi
    fi
  fi

  say "  ✅ seed healthy: $bn"
  ((ok++))
done

say "🔚 Repair summary — ok: $ok, bad: $bad (backups kept *.bak.TIMESTAMP)"
exit 0
