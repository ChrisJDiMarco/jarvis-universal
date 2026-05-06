#!/usr/bin/env bash
# JARVIS Universal — One-shot installer
#
# Verifies dependencies, makes hooks executable, validates the directory
# structure, suggests optional MCPs, and writes a marker so subsequent
# checks can tell whether the install ever ran.
#
# Idempotent. Safe to re-run. Pass --quiet to suppress all but errors.

set -euo pipefail

QUIET=0
[[ "${1:-}" == "--quiet" ]] && QUIET=1

# Resolve the JARVIS root from this script's location: setup/install.sh -> root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
JARVIS_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# ANSI colors (no-op if not a tty)
if [[ -t 1 ]]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; DIM='\033[2m'; NC='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; BLUE=''; DIM=''; NC=''
fi

say()  { [[ $QUIET -eq 1 ]] || echo -e "$@"; }
ok()   { say "${GREEN}✓${NC} $1"; }
warn() { say "${YELLOW}!${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1" >&2; exit 1; }
hdr()  { say ""; say "${BLUE}== $1 ==${NC}"; }

say "${BLUE}JARVIS Universal — Installer${NC}"
say "${DIM}Root: $JARVIS_ROOT${NC}"

hdr "1. Dependencies"

command -v bash    >/dev/null 2>&1 || fail "bash not found (this script requires bash 4+)"
ok "bash present"

if command -v jq >/dev/null 2>&1; then
  ok "jq present (required for hooks)"
else
  fail "jq not found. Install with: brew install jq  (macOS) or apt install jq (Linux)"
fi

if command -v python3 >/dev/null 2>&1; then
  PY_VER="$(python3 --version 2>&1 | awk '{print $2}')"
  ok "python3 present ($PY_VER) — required for memory indexer"
else
  warn "python3 not found — memory_search.py and memory_indexer.py will not work"
fi

if command -v git >/dev/null 2>&1; then
  ok "git present"
else
  warn "git not found — version-controlled memory writes will not work"
fi

if command -v claude >/dev/null 2>&1; then
  ok "claude (Claude Code CLI) present"
else
  warn "claude CLI not found — install from https://claude.ai/code"
fi

hdr "2. Directory structure"

REQUIRED_DIRS=(
  "memory" "memory/raw" ".claude/agents" ".claude/rules"
  "skills" "skills/learned" "owners-inbox" "team-inbox"
  "projects" "logs" "hooks" "scripts" "setup" "team" "docs"
)
for d in "${REQUIRED_DIRS[@]}"; do
  if [[ -d "$JARVIS_ROOT/$d" ]]; then
    ok "$d/"
  else
    mkdir -p "$JARVIS_ROOT/$d"
    warn "$d/ — created (was missing)"
  fi
done

# Ensure inbox subfolders exist + .gitkeep so empty dirs survive git
for d in "owners-inbox/archive" "owners-inbox/briefings" "owners-inbox/research" "owners-inbox/content" "owners-inbox/designs"; do
  mkdir -p "$JARVIS_ROOT/$d"
  touch "$JARVIS_ROOT/$d/.gitkeep"
done
ok "owners-inbox subfolders present"

hdr "3. Hook + script permissions"

mark_executable() {
  local f="$1"
  if [[ -f "$JARVIS_ROOT/$f" ]]; then
    chmod +x "$JARVIS_ROOT/$f"
    ok "+x $f"
  fi
}

# Hooks
for f in hooks/stop_hook.sh hooks/precompact_hook.sh hooks/metaclaw_extract.py hooks/metaclaw_inject.py; do
  mark_executable "$f"
done

# Scripts
for f in scripts/cleanup-inbox.sh scripts/check-memory-caps.sh scripts/dashboard.sh scripts/claude_context_indexer.py; do
  mark_executable "$f"
done

# Setup scripts (this script + check)
for f in setup/install.sh setup/check.sh; do
  mark_executable "$f"
done

# Memory indexer
for f in memory/memory_indexer.py memory/memory_search.py; do
  mark_executable "$f"
done

hdr "4. Claude Code settings"

SETTINGS_FILE="$JARVIS_ROOT/.claude/settings.local.json"
if [[ -f "$SETTINGS_FILE" ]]; then
  ok "settings.local.json present"
  if grep -q "hooks" "$SETTINGS_FILE" 2>/dev/null; then
    ok "  hooks wired (PreCompact + Stop)"
  else
    warn "  hooks not wired — see hooks/README.md"
  fi
else
  warn "settings.local.json missing — Claude Code will run JARVIS without hooks"
fi

hdr "5. First-run state"

CORE_FILE="$JARVIS_ROOT/memory/core.md"
if [[ -f "$CORE_FILE" ]] && grep -q "^# JARVIS Universal — Setup Needed" "$CORE_FILE"; then
  warn "memory/core.md is still the template — first session will trigger the wizard"
else
  ok "memory/core.md is populated (first-run wizard already complete)"
fi

# Drop the install marker so check.sh can verify install.sh has run
INSTALL_MARKER="$JARVIS_ROOT/.jarvis-installed"
date -u +"%Y-%m-%dT%H:%M:%SZ" > "$INSTALL_MARKER"
ok "install marker written: .jarvis-installed"

hdr "6. Optional MCPs (recommended)"

cat <<EOF
${DIM}JARVIS works without MCPs but unlocks more with them. To install:${NC}
${DIM}  claude mcp add <name>${NC}

  ${BLUE}firecrawl${NC}   — web research (highest leverage)
  ${BLUE}gmail${NC}       — read + draft email
  ${BLUE}gcal${NC}        — calendar queries + meeting prep
  ${BLUE}notion${NC}      — search + write your workspace
  ${BLUE}slack${NC}       — send + read messages
  ${BLUE}n8n${NC}         — trigger workflows
  ${BLUE}imessage${NC}    — proactive alerts to your phone
EOF

say ""
say "${GREEN}✓ Install complete.${NC}"
say ""
say "Next steps:"
say "  1. ${BLUE}cd $JARVIS_ROOT${NC}"
say "  2. ${BLUE}claude${NC}"
say "  3. The first-run wizard activates automatically and asks 3 quick questions."
say ""
say "${DIM}If JARVIS doesn't trigger the wizard for any reason, type:${NC}"
say "  ${BLUE}\"run first-run wizard\"${NC}  — forces the setup conversation"
say ""
say "Other helpful commands:"
say "  ${BLUE}bash setup/check.sh${NC}              — health check (deps + caps + state)"
say "  ${BLUE}bash setup/check.sh --full-suite${NC} — health check + full test suite"
say "  ${BLUE}bash tests/run-all.sh${NC}            — run the test suite directly"
say "  ${BLUE}bash setup/install-semantic-search.sh${NC}  — add semantic code search (optional)"
