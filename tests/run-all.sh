#!/usr/bin/env bash
# JARVIS Universal — Test Suite Runner
#
# Runs every test in tests/test-*.sh sequentially. Reports pass/fail counts
# at the end. Exit code: 0 if all pass, 1 if any fail.
#
# Usage:
#   bash tests/run-all.sh
#   bash tests/run-all.sh --verbose   # show full output of each test
#   bash tests/run-all.sh --quiet     # only print failures + summary

set -uo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
JARVIS_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

VERBOSE=0
QUIET=0
case "${1:-}" in
  --verbose|-v) VERBOSE=1 ;;
  --quiet|-q)   QUIET=1 ;;
esac

if [[ -t 1 ]]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; DIM='\033[2m'; NC='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; BLUE=''; DIM=''; NC=''
fi

PASSES=0; FAILS=0
FAIL_NAMES=()

[[ $QUIET -eq 0 ]] && echo -e "${BLUE}JARVIS Test Suite${NC}  ${DIM}($JARVIS_ROOT)${NC}"

for test in "$SCRIPT_DIR"/test-*.sh; do
  [[ ! -f "$test" ]] && continue
  name=$(basename "$test" .sh)

  if [[ $VERBOSE -eq 1 ]]; then
    echo ""
    echo -e "${BLUE}── $name ──${NC}"
    if bash "$test" "$JARVIS_ROOT"; then
      PASSES=$((PASSES+1))
      echo -e "${GREEN}✓ $name${NC}"
    else
      FAILS=$((FAILS+1))
      FAIL_NAMES+=("$name")
      echo -e "${RED}✗ $name${NC}"
    fi
  else
    output=$(bash "$test" "$JARVIS_ROOT" 2>&1)
    rc=$?
    if [[ $rc -eq 0 ]]; then
      PASSES=$((PASSES+1))
      [[ $QUIET -eq 0 ]] && echo -e "${GREEN}✓${NC} $name"
    else
      FAILS=$((FAILS+1))
      FAIL_NAMES+=("$name")
      echo -e "${RED}✗${NC} $name"
      echo -e "${DIM}$output${NC}" | head -20
    fi
  fi
done

[[ $QUIET -eq 0 ]] && echo ""
echo -e "${BLUE}Result:${NC} ${GREEN}$PASSES passed${NC}, ${RED}$FAILS failed${NC}"

if [[ $FAILS -gt 0 ]]; then
  echo -e "${RED}Failed tests:${NC} ${FAIL_NAMES[*]}"
  exit 1
fi
exit 0
