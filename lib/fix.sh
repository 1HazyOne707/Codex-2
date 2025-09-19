#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
. "$HOME/codex/lib/common.sh" 2>/dev/null || true
. "$HOME/codex/lib/safety.sh" 2>/dev/null || true

if codex-run-queue; then
  printf '%s\n' "[watch] queue ok."
else
  ec=$?
  rpt="$(safety_report "Queue processing failed (exit $ec)." \
        "Tip: say 'show last error' to view details.")"
  printf '%s\n' "[watch] auto-safety report: $rpt"
  exit "$ec"
fi
