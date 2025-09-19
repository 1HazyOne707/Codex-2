#!/data/data/com.termux/files/usr/bin/bash
. "$HOME/codex/lib/common.sh" 2>/dev/null || true
SAFEDIR="${SAFEDIR:-$HOME/codex/logs/safety}"; mkdir -p "$SAFEDIR"

ts(){ date '+%Y-%m-%d %H:%M:%S %Z'; }
safety_stamp(){ date +%Y-%m-%d_%H%M%S; }
safety_file(){ echo "$SAFEDIR/$(safety_stamp).txt"; }

safety_report(){        # usage: safety_report "message" [context...]
  local msg="${1:-Unknown failure}"; shift || true
  local log; log="$(safety_file)"
  {
    echo "=== SAFETY REPORT $(ts) ==="
    echo "$msg"
    [ $# -gt 0 ] && { echo "--- context ---"; printf '%s\n' "$@"; }
    echo "==========================="
  } | tee -a "$log" >/dev/null
  echo "$log"
}

safety_show(){          # shows most-recent safety report
  local f; f="$(ls -t "$SAFEDIR"/*.txt 2>/dev/null | head -1)" || true
  if [ -n "$f" ] && [ -r "$f" ]; then
     printf '%s\n' "Most recent safety report:" "file: $f" ""
     sed -n '1,160p' "$f"
  else
     printf '%s\n' "No safety report found."
  fi
}
