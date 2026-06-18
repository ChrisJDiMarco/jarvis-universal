#!/usr/bin/env bash
# Regression guard: memory caps must live ONLY in config/memory-caps.conf.
# Fails if any enforcement script re-hardcodes a cap (the drift that this
# whole single-source-of-truth refactor exists to prevent).
cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 1

fail=0

if [[ ! -f config/memory-caps.conf ]]; then
  echo "FAIL: config/memory-caps.conf (single source of truth) is missing"
  fail=1
fi

# The old drift pattern was inline entries like "memory/soul.md:18000" in scripts.
for f in scripts/check-memory-caps.sh setup/check.sh; do
  if grep -Eq '"memory/[^"]+\.md:[0-9]{3,}"' "$f" 2>/dev/null; then
    echo "FAIL: $f hardcodes a memory cap — move it to config/memory-caps.conf"
    fail=1
  fi
done

# Both scripts must actually reference the conf.
for f in scripts/check-memory-caps.sh setup/check.sh; do
  if ! grep -q 'memory-caps.conf' "$f" 2>/dev/null; then
    echo "FAIL: $f does not read config/memory-caps.conf"
    fail=1
  fi
done

if [[ $fail -eq 0 ]]; then
  echo "PASS: memory caps are single-sourced (config/memory-caps.conf)"
fi
exit $fail
