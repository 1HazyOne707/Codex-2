#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
. "$HOME/codex/lib/common.sh" 2>/dev/null || true

LOGDIR="$HOME/codex/logs"; mkdir -p "$LOGDIR"
OUT="$LOGDIR/guard.$(date +%Y%m%d_%H%M%S).log"
touch "$OUT"

say "🔒 Running Codex safety check… (report: $OUT)"

fails=0
for f in "$HOME"/codex/lib/*.sh; do
  [ -f "$f" ] || continue
  printf "%s\n" "---- checking: $f ----" | tee -a "$OUT"
  if codex-guard "$f" >>"$OUT" 2>&1; then
    printf "OK  %s\n" "$f" | tee -a "$OUT"
  else
    printf "FAIL %s\n" "$f" | tee -a "$OUT"
    fails=$((fails+1))
  fi
done

# Also sanity-check queue.sh (it may live outside the glob while editing)
if [ -f "$HOME/codex/lib/queue.sh" ]; then
  printf "%s\n" "---- checking: queue.sh ----" | tee -a "$OUT"
  codex-guard "$HOME/codex/lib/queue.sh" >>"$OUT" 2>&1 || fails=$((fails+1))
fi

if [ "$fails" -gt 0 ]; then
  err "Safety check found $fails problem(s). See $OUT"
  exit 1
fi

say "✅ Safety check passed."
exit 0
