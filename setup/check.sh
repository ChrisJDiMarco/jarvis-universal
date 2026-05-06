#!/usr/bin/env bash
# JARVIS Universal — Health check
#
# Run anytime to verify the install is healthy. Returns exit 0 if everything
# critical passes, 1 if any critical issue, 2 if only warnings.
#
# Categories:
#   CRITICAL — JARVIS will not work without these
#   WARN     — JARVIS works but some features will be silently disabled
#   INFO     — Status only, not a problem
#
# Usage:
#   bash setup/check.sh           # full report
#   bash setup/check.sh --terse   # only print failures + summary
#   bash setup/check.sh --json    # machine-readable output

set -uo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
JARVIS_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

MODE="full"
RUN_TESTS=0
for arg in "$@"; do
  case "$arg" in
    --terse) MODE="terse" ;;
    --json)  MODE="json" ;;
    --full-suite) MODE="full"; RUN_TESTS=1 ;;
  esac
done

if [[ -t 1 && "$MODE" != "json" ]]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; DIM='\033[2m'; NC='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; BLUE=''; DIM=''; NC=''
fi

CRIT=0; WARNS=0; PASSES=0
RESULTS=()  # for json mode

record() {
  local level="$1" name="$2" detail="$3"
  RESULTS+=("$level|$name|$detail")
  case "$level" in
    PASS) PASSES=$((PASSES+1)); [[ "$MODE" == "full" ]] && echo -e "${GREEN}✓${NC} $name ${DIM}$detail${NC}" ;;
    WARN) WARNS=$((WARNS+1));   [[ "$MODE" != "json" ]] && echo -e "${YELLOW}!${NC} $name ${DIM}$detail${NC}" ;;
    CRIT) CRIT=$((CRIT+1));     [[ "$MODE" != "json" ]] && echo -e "${RED}✗${NC} $name ${DIM}$detail${NC}" ;;
  esac
}

section() { [[ "$MODE" == "full" ]] && echo -e "\n${BLUE}== $1 ==${NC}"; }

# ─────────────────────────────────────────────────────────────────────────
section "Install marker"
if [[ -f "$JARVIS_ROOT/.jarvis-installed" ]]; then
  record PASS ".jarvis-installed" "$(cat "$JARVIS_ROOT/.jarvis-installed" 2>/dev/null)"
else
  record WARN ".jarvis-installed" "missing — run setup/install.sh first"
fi

# ─────────────────────────────────────────────────────────────────────────
section "Dependencies"
command -v jq      >/dev/null 2>&1 && record PASS "jq" "$(jq --version)"           || record CRIT "jq" "missing — hooks will fail"
command -v python3 >/dev/null 2>&1 && record PASS "python3" "$(python3 --version 2>&1)" || record WARN "python3" "missing — memory search disabled"
command -v git     >/dev/null 2>&1 && record PASS "git" "$(git --version | awk '{print $3}')" || record WARN "git" "missing"
command -v claude  >/dev/null 2>&1 && record PASS "claude CLI" "installed"          || record WARN "claude CLI" "missing — install from claude.ai/code"

# ─────────────────────────────────────────────────────────────────────────
section "Directory structure"
for d in memory memory/raw .claude/agents .claude/rules skills owners-inbox team-inbox projects logs hooks scripts setup team docs; do
  if [[ -d "$JARVIS_ROOT/$d" ]]; then
    record PASS "$d/" "exists"
  else
    record CRIT "$d/" "missing"
  fi
done

# ─────────────────────────────────────────────────────────────────────────
section "Hook executability"
for f in hooks/stop_hook.sh hooks/precompact_hook.sh; do
  if [[ -f "$JARVIS_ROOT/$f" ]]; then
    if [[ -x "$JARVIS_ROOT/$f" ]]; then
      record PASS "$f" "executable"
    else
      record CRIT "$f" "exists but NOT executable — run setup/install.sh"
    fi
  else
    record WARN "$f" "missing"
  fi
done

# ─────────────────────────────────────────────────────────────────────────
section "Claude Code wiring"
SETTINGS="$JARVIS_ROOT/.claude/settings.local.json"
if [[ -f "$SETTINGS" ]]; then
  record PASS "settings.local.json" "present"
  if grep -q "PreCompact" "$SETTINGS" 2>/dev/null; then
    record PASS "  PreCompact hook" "wired"
  else
    record WARN "  PreCompact hook" "not wired"
  fi
  if grep -q "Stop" "$SETTINGS" 2>/dev/null; then
    record PASS "  Stop hook" "wired"
  else
    record WARN "  Stop hook" "not wired"
  fi
else
  record CRIT "settings.local.json" "missing — Claude Code can't run hooks"
fi

# ─────────────────────────────────────────────────────────────────────────
section "Memory file caps"
# Cap definitions (chars). Source of truth: CLAUDE.md memory file caps table.
declare -a MEM_FILES=(
  "memory/L1-critical-facts.md:5000"
  "memory/core.md:8000"
  "memory/context.md:25000"
  "memory/decisions.md:15000"
  "memory/learnings.md:20000"
  "memory/relationships.md:15000"
  "memory/ai-intelligence.md:25000"
  "memory/soul.md:16000"
)
for entry in "${MEM_FILES[@]}"; do
  file="${entry%:*}"; cap="${entry##*:}"
  if [[ -f "$JARVIS_ROOT/$file" ]]; then
    size=$(wc -c < "$JARVIS_ROOT/$file" | tr -d ' ')
    pct=$(( size * 100 / cap ))
    if [[ $size -gt $cap ]]; then
      record CRIT "$file" "$size / $cap chars (${pct}%) — OVER cap"
    elif [[ $pct -ge 80 ]]; then
      record WARN "$file" "$size / $cap chars (${pct}%) — approaching cap"
    else
      record PASS "$file" "$size / $cap chars (${pct}%)"
    fi
  else
    record WARN "$file" "missing (will be created by first-run wizard)"
  fi
done

# ─────────────────────────────────────────────────────────────────────────
section "First-run state"
CORE_FILE="$JARVIS_ROOT/memory/core.md"
if [[ -f "$CORE_FILE" ]] && grep -q "^# JARVIS Universal — Setup Needed" "$CORE_FILE"; then
  record WARN "first-run wizard" "pending — memory/core.md is still the template"
else
  record PASS "first-run wizard" "complete"
fi

# ─────────────────────────────────────────────────────────────────────────
section "Inbox health"
if [[ -d "$JARVIS_ROOT/owners-inbox" ]]; then
  count=$(find "$JARVIS_ROOT/owners-inbox" -maxdepth 1 -type f ! -name ".gitkeep" 2>/dev/null | wc -l | tr -d ' ')
  if [[ $count -gt 20 ]]; then
    record WARN "owners-inbox" "$count files at root — exceeds 20-file cap, run scripts/cleanup-inbox.sh"
  elif [[ $count -gt 15 ]]; then
    record WARN "owners-inbox" "$count files at root (cap: 20)"
  else
    record PASS "owners-inbox" "$count files at root"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────
# Optional: full test suite
if [[ $RUN_TESTS -eq 1 && -f "$JARVIS_ROOT/tests/run-all.sh" ]]; then
  section "Full test suite"
  if bash "$JARVIS_ROOT/tests/run-all.sh" --quiet; then
    record PASS "tests/run-all.sh" "all tests passed"
  else
    record CRIT "tests/run-all.sh" "one or more tests failed — run 'bash tests/run-all.sh' for details"
  fi
fi

# ─────────────────────────────────────────────────────────────────────────
# Summary
if [[ "$MODE" == "json" ]]; then
  printf '{"passes":%d,"warnings":%d,"critical":%d,"results":[' "$PASSES" "$WARNS" "$CRIT"
  first=1
  for r in "${RESULTS[@]}"; do
    level="${r%%|*}"; rest="${r#*|}"; name="${rest%%|*}"; detail="${rest#*|}"
    [[ $first -eq 0 ]] && printf ','
    first=0
    printf '{"level":"%s","name":"%s","detail":"%s"}' "$level" "$name" "${detail//\"/\\\"}"
  done
  printf ']}\n'
else
  echo ""
  echo -e "${BLUE}Summary:${NC} ${GREEN}$PASSES pass${NC}  ${YELLOW}$WARNS warn${NC}  ${RED}$CRIT critical${NC}"
fi

if [[ $CRIT -gt 0 ]]; then exit 1; fi
if [[ $WARNS -gt 0 ]]; then exit 2; fi
exit 0
