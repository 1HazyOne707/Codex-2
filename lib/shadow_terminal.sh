#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
say(){ printf '%s\n' "$*"; }
say "🕶  Shadow Terminal: isolated, clean environment."
say "• PATH: \$PREFIX/bin + ~/bin"
say "• No profile files are loaded."
env -i HOME="$HOME" TERM="$TERM" PREFIX="/data/data/com.termux/files/usr" \
  PATH="/data/data/com.termux/files/usr/bin:$HOME/bin" \
  bash --noprofile --norc -i
