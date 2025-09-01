#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
ts(){ date +%F_%H%M%S; }
log(){ printf '%s %s\n' "$(date +%T)" "$*" ; }

# --- dirs (logs & safety) ---
LOGDIR="${LOGDIR:-$HOME/codex/logs}"; mkdir -p "$LOGDIR"
SAFEDIR="${SAFEDIR:-$HOME/codex/logs/safety}"; mkdir -p "$SAFEDIR"

# --- plain-speak result emitters ---
ok ()  { printf "✅ %s\n" "${*:-Done.}"; }
bad()  { printf "❌ %s\n" "${*:-Blocked or failed.}"; }
