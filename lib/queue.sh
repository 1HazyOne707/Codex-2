#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
: "${task:=}"
: "${action_script:=}"
: "${work_item:=}"
: "${QUEUE_FAILED:=$HOME/codex/failed}"
: "${ROOT:=$HOME/codex}"
set -euo pipefail

# --- Safe defaults (avoid unbound var errors) ---
: "${task:=}"
: "${action_script:=}"
: "${work_item:=}"
: "${QUEUE_FAILED:=$HOME/codex/failed}"
: "${ROOT:=$HOME/codex}"
set -euo pipefail
# --- safe defaults to satisfy `set -u` ---
: "${task:=}"
: "${action_script:=}"
: "${work_item:=}"
: "${task:=}"
# --- Sands of Time: pre-run checkpoint ---
if command -v sands >/dev/null 2>&1; then
  sands save || true
fi

# run the action (whatever your current code does)
if "$action_script"; then
  # success → bless this state
  if command -v sands >/dev/null 2>&1; then
    sands bless || true
  fi
  # (your existing success handling/logging remains)
else
  # failure → rewind and mark failed
  printf '❌ task failed, rewinding state\n'
  if command -v sands >/dev/null 2>&1; then
    sands rewind || true
  fi
  # move the work item to failed and continue
  mv -f "$work_item" "$QUEUE_FAILED/" 2>/dev/null || true
  continue
fi
: "${action_script:=}"

# --- quick test actions (micro-seeds) ---
act_good(){  echo "Running the good micro-seed."; "$HOME/codex/lib/good.sh"; }
act_bad(){   echo "Running the bad micro-seed (guard will block)."; "$HOME/codex/lib/bad.sh"; }

# map phrases to actions (keep your existing map; add ours if not present)
dispatch(){
  # preflight guard if available
  if command -v codex-guard >/dev/null 2>&1; then
    cand="$HOME/codex/lib/${*// /.}.sh"
    [[ -f "$cand" ]] || true
  fi
  text="$(echo "$*" | tr '[:upper:]' '[:lower:]')"
  if   [[ "$text" =~ ^(run[[:space:]]+good[[:space:]]+seed)$ ]]; then act_good
  elif [[ "$text" =~ ^(run[[:space:]]+bad[[:space:]]+seed)$  ]]; then act_bad
  else echo "I didn't understand: '$*'"; echo "Try: run good seed | run bad seed"
  fi
}

# run when called directly
if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  dispatch "$@"
fi
