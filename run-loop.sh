#!/usr/bin/env bash
set -euo pipefail
cd "$HOME/codex"

LOG="$HOME/codex/logs/loop.log"
mkdir -p "$(dirname "$LOG")"

mapfile -t TASKS < <(ls -1 tasks.d/*.sh 2>/dev/null | sort)

pick_tasks() {
  if [[ "${STRESS:-0}" == "1" ]]; then
    printf '%s\n' "${TASKS[@]}"
  else
    for t in "${TASKS[@]}"; do
      [[ "$t" =~ good ]] && echo "$t"
    done
  fi
}

echo "[loop] start $(date -Is) stress=${STRESS:-0}" >>"$LOG"

tick=0
while : ; do
  any=0
  while IFS= read -r task; do
    [[ -z "$task" ]] && continue
    any=1
    echo "[loop] run $(basename "$task") @ $(date -Is)" >>"$LOG"
    if ! "$HOME/codex/run-one.sh" "$task"; then
      echo "[loop] ^ failed -> rewound @ $(date -Is)" >>"$LOG"
      sleep 2
    fi
    sleep 1
  done < <(pick_tasks)

  # Fallback if nothing matched
  if [[ $any -eq 0 ]]; then
    echo "[loop] fallback to do_the_thing.sh @ $(date -Is)" >>"$LOG"
    "$HOME/codex/run-one.sh" "$HOME/codex/do_the_thing.sh" || true
    sleep 1
  fi

  # Heartbeat every 60 seconds
  tick=$((tick+1))
  if (( tick >= 60 )); then
    echo "[loop] heartbeat @ $(date -Is)" >>"$LOG"
    tick=0
  fi
done
