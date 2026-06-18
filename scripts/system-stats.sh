#!/usr/bin/env bash
# JARVIS system stats — SINGLE SOURCE OF TRUTH for COUNTS.
#
# Counts are COMPUTED from the filesystem here, never hand-typed in docs.
# When a doc needs a number (agents, skills, etc.), it should cite this script's
# output rather than baking its own — that's what stops count drift.
#
# Usage:
#   bash scripts/system-stats.sh          # key=value lines
#   bash scripts/system-stats.sh --human  # readable summary
set -uo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.." || exit 1

active_agents=$(ls .claude/agents/*.md 2>/dev/null | wc -l | tr -d ' ')
retired_agents=$(ls .claude/agents/_retired/*.md 2>/dev/null | wc -l | tr -d ' ')
skills=$(ls skills/*.md 2>/dev/null | grep -vi 'INDEX.md' | wc -l | tr -d ' ')
skill_dirs=$(find skills -maxdepth 1 -mindepth 1 -type d ! -name '_retired' ! -name 'ecc' ! -name 'learned' 2>/dev/null | wc -l | tr -d ' ')
retired_skills=$(ls skills/_retired 2>/dev/null | wc -l | tr -d ' ')
ecc_skills=$(ls skills/ecc 2>/dev/null | wc -l | tr -d ' ')
codex_skills=$(ls .agents/skills 2>/dev/null | wc -l | tr -d ' ')
memory_files=$(ls memory/*.md 2>/dev/null | wc -l | tr -d ' ')
wiki_nodes=$(ls wiki/*.md 2>/dev/null | wc -l | tr -d ' ')

if [[ "${1:-}" == "--human" ]]; then
  cat <<EOF
JARVIS system stats (computed $(date -u +%Y-%m-%dT%H:%MZ))
  Active agents : $active_agents   (retired: $retired_agents)
  Skills        : $skills top-level + $skill_dirs dirs   (ecc: $ecc_skills, codex: $codex_skills, retired: $retired_skills)
  Memory files  : $memory_files
  Wiki nodes    : $wiki_nodes
EOF
else
  echo "active_agents=$active_agents"
  echo "retired_agents=$retired_agents"
  echo "skills=$skills"
  echo "skill_dirs=$skill_dirs"
  echo "retired_skills=$retired_skills"
  echo "ecc_skills=$ecc_skills"
  echo "codex_skills=$codex_skills"
  echo "memory_files=$memory_files"
  echo "wiki_nodes=$wiki_nodes"
fi
