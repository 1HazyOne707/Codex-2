#!/usr/bin/env bash
set -euo pipefail

LOG="$HOME/codex/logs/runner.log"
mkdir -p "$HOME/codex/logs" "$HOME/codex/queue" "$HOME/codex/bin" >/dev/null 2>&1 || true

task="${1:-$HOME/codex/do_the_thing.sh}"

# --- allowlist (observe/enforce) ---
ALLOW_MODE="${ALLOWLIST_MODE:-observe}"   # observe|enforce
PAT="$HOME/codex/allowlist.patterns"
TMP="$HOME/codex/.allowlist.compiled"
sed -E '/^\s*(#|$)/d' "$PAT" > "$TMP" 2>/dev/null || true

if [ -s "$TMP" ] && ! grep -Eqf "$TMP" "$task"; then
  if [ "$ALLOW_MODE" = "enforce" ]; then
    echo "[one] BLOCKED by allowlist: $task" >>"$LOG"
    /system/bin/sh "$HOME/codex/bin/codex-stash-save-lite" 2>>"$LOG" || true
    exit 99
  else
    echo "[one] ⚠ observe: allowlist would block $task" >>"$LOG"
  fi
fi
# -----------------------------------

# run the task; bless on success else rewind
if bash "$task"; then
  "$HOME/codex/bin/sands-bless" 2>>"$LOG" || true
else
  echo "❌ fail → rewind" | tee -a "$LOG"
  "$HOME/codex/bin/sands-rewind" 2>>"$LOG" || true
  exit 1
fi
