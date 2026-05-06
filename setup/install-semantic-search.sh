#!/usr/bin/env bash
# JARVIS Universal — Semantic Code Search Installer
#
# One-command install for the optional semantic search stack:
#   - Ollama (local embedding server) + nomic-embed-text model
#   - Milvus standalone (vector DB) in Docker
#   - claude-context MCP registered with Claude Code
#   - First full index of the JARVIS repo
#
# This is the long version of docs/semantic-code-search-setup.md — anything
# the doc walks through manually, this script does automatically (with
# confirmation prompts for the heavyweight installs).
#
# Idempotent. Safe to re-run — skips anything already installed.
#
# Usage:
#   bash setup/install-semantic-search.sh         # interactive
#   bash setup/install-semantic-search.sh --yes   # skip confirmations
#   bash setup/install-semantic-search.sh --check # report state, install nothing

set -euo pipefail

# ─── Setup ────────────────────────────────────────────────────────────────
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
JARVIS_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"
LOG_DIR="$JARVIS_ROOT/logs"
mkdir -p "$LOG_DIR"

YES=0
CHECK_ONLY=0
DRY_RUN=0
for arg in "$@"; do
  case "$arg" in
    --yes|-y)   YES=1 ;;
    --check)    CHECK_ONLY=1 ;;
    --dry-run)  DRY_RUN=1 ;;
    -h|--help)
      sed -n '2,15p' "$0" | sed 's/^# //; s/^#//'
      exit 0 ;;
  esac
done

if [[ -t 1 ]]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; DIM='\033[2m'; NC='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; BLUE=''; DIM=''; NC=''
fi

# Portable timeout wrapper. macOS doesn't ship `timeout` by default; if the
# user has GNU coreutils (brew install coreutils) they get either `timeout`
# or `gtimeout`. If neither, use a pure-bash subshell + watchdog so docker
# calls can never hang the script even on a stuck daemon.
if command -v timeout >/dev/null 2>&1; then
  with_timeout() { timeout "$@"; }
elif command -v gtimeout >/dev/null 2>&1; then
  with_timeout() { gtimeout "$@"; }
else
  # Pure-bash fallback: run the command in a background subshell, kill it
  # if it doesn't finish in time. Returns 124 on timeout (matching GNU timeout).
  with_timeout() {
    local secs="$1"; shift
    ( "$@" ) &
    local pid=$!
    ( sleep "$secs"; kill -9 "$pid" 2>/dev/null ) &
    local watcher=$!
    wait "$pid" 2>/dev/null
    local rc=$?
    kill -9 "$watcher" 2>/dev/null
    wait "$watcher" 2>/dev/null
    # If watcher already killed pid, $rc will be 137 (SIGKILL); normalize to 124
    [[ $rc -eq 137 ]] && return 124
    return $rc
  }
fi

ok()    { echo -e "${GREEN}✓${NC} $1"; }
warn()  { echo -e "${YELLOW}!${NC} $1"; }
fail()  { echo -e "${RED}✗${NC} $1" >&2; exit 1; }
info()  { echo -e "${DIM}  $1${NC}"; }
hdr()   { echo ""; echo -e "${BLUE}== $1 ==${NC}"; }

confirm() {
  local prompt="$1"
  if [[ $YES -eq 1 ]]; then
    info "$prompt → auto-yes (--yes)"
    return 0
  fi
  read -r -p "$prompt [y/N] " response
  [[ "$response" =~ ^[Yy]$ ]]
}

# ─── Detect OS ────────────────────────────────────────────────────────────
OS="unknown"
case "$(uname -s)" in
  Darwin) OS="macos" ;;
  Linux)  OS="linux" ;;
  *) fail "Unsupported OS: $(uname -s). Only macOS and Linux are supported." ;;
esac

echo -e "${BLUE}JARVIS — Semantic Code Search Installer${NC}"
info "OS: $OS · Repo: $JARVIS_ROOT"
[[ $CHECK_ONLY -eq 1 ]] && warn "Running in --check mode — no installs will happen"
[[ $DRY_RUN -eq 1 ]]    && warn "Running in --dry-run mode — will print what would happen, no installs"

# ─── Preflight: disk space (need ~2 GB free for Milvus image + model) ─────
hdr "0. Preflight"

if command -v df >/dev/null 2>&1; then
  # Free space on the partition that holds $HOME, in MB
  FREE_MB=$(df -m "$HOME" 2>/dev/null | awk 'NR==2 {print $4}')
  if [[ -n "$FREE_MB" ]]; then
    if [[ "$FREE_MB" -lt 2048 ]]; then
      warn "Only ${FREE_MB} MB free on $HOME partition — recommend 2 GB+ for Milvus image + embedding model"
      [[ $CHECK_ONLY -eq 0 && $YES -eq 0 ]] && {
        confirm "Continue anyway?" || fail "Aborted — free up disk space and re-run"
      }
    else
      ok "Disk space: ${FREE_MB} MB free on $HOME partition (need ~2 GB)"
    fi
  fi
fi

# Network reachability — fail fast if offline
if [[ $CHECK_ONLY -eq 0 && $DRY_RUN -eq 0 ]]; then
  if curl -sf --max-time 3 https://registry.npmjs.org/ >/dev/null 2>&1; then
    ok "Network: npm registry reachable"
  else
    warn "npm registry unreachable — npx -y @zilliz/claude-context-mcp will fail. Check connectivity."
  fi
fi

# Helper: run a command in normal mode, just echo it in dry-run
maybe_run() {
  if [[ $DRY_RUN -eq 1 ]]; then
    info "[dry-run] would run: $*"
    return 0
  fi
  "$@"
}

# Helper: retry a flaky command (network ops) up to 3 times with backoff
retry() {
  local n=0 max=3
  until "$@"; do
    n=$((n+1))
    [[ $n -ge $max ]] && return 1
    warn "command failed (attempt $n/$max), retrying in $((n*5))s..."
    sleep $((n*5))
  done
}

# ─── Phase 1: Prerequisites ───────────────────────────────────────────────
hdr "1. Prerequisites"

# Docker — wrap with timeout so a stuck/slow Docker daemon can't hang the script
docker_running() {
  command -v docker >/dev/null 2>&1 && with_timeout 5 docker info >/dev/null 2>&1
}
if docker_running; then
  ok "Docker present and running"
else
  if [[ $CHECK_ONLY -eq 1 ]]; then
    if command -v docker >/dev/null 2>&1; then
      warn "Docker installed but not responding (is Docker Desktop running?)"
    else
      warn "Docker missing"
    fi
  else
    fail "Docker is required and must be running.
  macOS: install Docker Desktop from https://www.docker.com/products/docker-desktop, then OPEN it
  Linux: sudo apt install docker.io && sudo systemctl start docker
  After Docker is running: re-run this script."
  fi
fi

# Node.js
if command -v node >/dev/null 2>&1; then
  NODE_VER=$(node --version | sed 's/v//' | cut -d. -f1)
  if [[ $NODE_VER -lt 18 ]]; then
    warn "Node $(node --version) found — claude-context MCP needs 18+. Upgrade recommended."
  else
    ok "Node $(node --version)"
  fi
else
  if [[ $CHECK_ONLY -eq 1 ]]; then
    warn "Node.js missing"
  else
    if [[ "$OS" == "macos" ]] && command -v brew >/dev/null 2>&1; then
      if confirm "Install Node via Homebrew?"; then
        brew install node && ok "Node installed"
      else
        fail "Node.js 18+ is required. Install from https://nodejs.org and re-run."
      fi
    else
      fail "Node.js 18+ is required. Install from https://nodejs.org and re-run."
    fi
  fi
fi

# Python 3
command -v python3 >/dev/null 2>&1 && ok "Python $(python3 --version 2>&1 | awk '{print $2}')" || warn "python3 missing — needed for the index helper"

# Claude CLI
command -v claude >/dev/null 2>&1 && ok "Claude Code CLI installed" || warn "claude CLI missing — install from https://claude.ai/code"

# ─── Phase 2: Ollama ──────────────────────────────────────────────────────
hdr "2. Ollama + embedding model"

if command -v ollama >/dev/null 2>&1; then
  ok "Ollama installed ($(ollama --version 2>&1 | head -1))"
else
  if [[ $CHECK_ONLY -eq 1 ]]; then
    warn "Ollama missing"
  elif confirm "Install Ollama?"; then
    if [[ "$OS" == "macos" ]]; then
      command -v brew >/dev/null 2>&1 || fail "Homebrew required to install Ollama on macOS. Install brew first or install Ollama manually from https://ollama.com"
      brew install ollama
      brew services start ollama
    else
      curl -fsSL https://ollama.com/install.sh | sh
      systemctl --user enable --now ollama 2>/dev/null || true
    fi
    ok "Ollama installed and started"
  else
    fail "Ollama is required. Install manually from https://ollama.com and re-run."
  fi
fi

# Wait for Ollama to be reachable (it can take a few seconds to start)
if [[ $CHECK_ONLY -eq 0 ]]; then
  for i in 1 2 3 4 5; do
    if curl -sf http://127.0.0.1:11434/ >/dev/null 2>&1; then
      ok "Ollama reachable at http://127.0.0.1:11434"
      break
    fi
    [[ $i -eq 5 ]] && warn "Ollama not reachable yet — try: brew services restart ollama (macOS) or systemctl --user restart ollama (Linux)"
    sleep 2
  done
fi

# Pull embedding model
if command -v ollama >/dev/null 2>&1 && ollama list 2>/dev/null | grep -q "nomic-embed-text"; then
  ok "nomic-embed-text model present"
else
  if [[ $CHECK_ONLY -eq 1 ]]; then
    warn "nomic-embed-text not pulled (~274 MB)"
  elif [[ $DRY_RUN -eq 1 ]]; then
    info "[dry-run] would: ollama pull nomic-embed-text"
  else
    info "Pulling nomic-embed-text (~274 MB)..."
    if retry ollama pull nomic-embed-text; then
      ok "Model pulled"
    else
      fail "Failed to pull nomic-embed-text after 3 attempts. Check network connectivity and re-run."
    fi
  fi
fi

# ─── Phase 3: Milvus ──────────────────────────────────────────────────────
hdr "3. Milvus (Docker)"

MILVUS_DIR="$HOME/.milvus-standalone"
MILVUS_SCRIPT="$MILVUS_DIR/standalone_embed.sh"

if ! docker_running; then
  warn "Docker not responding — skipping Milvus phase. Start Docker Desktop / dockerd, then re-run."
elif with_timeout 10 docker ps --filter name=milvus-standalone --format '{{.Status}}' 2>/dev/null | grep -q "Up"; then
  ok "Milvus container running ($(with_timeout 10 docker ps --filter name=milvus-standalone --format '{{.Status}}'))"
elif with_timeout 10 docker ps -a --filter name=milvus-standalone --format '{{.Names}}' 2>/dev/null | grep -q milvus; then
  warn "Milvus container exists but is stopped"
  if [[ $CHECK_ONLY -eq 0 ]] && confirm "Start it?"; then
    with_timeout 30 docker start milvus-standalone && ok "Milvus started"
  fi
else
  if [[ $CHECK_ONLY -eq 1 ]]; then
    warn "Milvus container not installed"
  elif confirm "Set up Milvus standalone container? (~1 GB Docker image, persistent at $MILVUS_DIR)"; then
    mkdir -p "$MILVUS_DIR"
    if [[ ! -f "$MILVUS_SCRIPT" ]]; then
      if [[ $DRY_RUN -eq 1 ]]; then
        info "[dry-run] would download standalone_embed.sh from milvus-io/milvus"
      else
        info "Downloading standalone_embed.sh..."
        if ! retry curl -sfL https://raw.githubusercontent.com/milvus-io/milvus/master/scripts/standalone_embed.sh -o "$MILVUS_SCRIPT"; then
          fail "Failed to download Milvus standalone script after 3 attempts."
        fi
        chmod +x "$MILVUS_SCRIPT"
      fi
    fi
    # Patch out 'sudo' if Docker Desktop / rootless Docker
    if with_timeout 5 docker info 2>&1 | grep -q "Docker Desktop\|rootless"; then
      sed -i.bak 's/sudo docker/docker/g; s/sudo rm/rm/g' "$MILVUS_SCRIPT" 2>/dev/null || true
      info "Patched script (no sudo needed for Docker Desktop / rootless)"
    fi
    info "Starting Milvus (first run pulls ~1 GB image — be patient)..."
    bash "$MILVUS_SCRIPT" start
    ok "Milvus standalone started"
  else
    fail "Milvus is required for semantic code search. Re-run when ready."
  fi
fi

# Wait for Milvus health endpoint
if [[ $CHECK_ONLY -eq 0 ]]; then
  for i in 1 2 3 4 5 6 7 8 9 10; do
    if curl -sf http://127.0.0.1:9091/healthz >/dev/null 2>&1; then
      ok "Milvus healthy at http://127.0.0.1:19530 (mgmt :9091)"
      break
    fi
    [[ $i -eq 10 ]] && warn "Milvus not responding to health check yet. Wait a moment then re-run --check."
    sleep 3
  done
fi

# ─── Phase 4: Register MCP ────────────────────────────────────────────────
hdr "4. claude-context MCP"

if command -v claude >/dev/null 2>&1 && claude mcp list 2>/dev/null | grep -q "claude-context"; then
  ok "claude-context MCP already registered"
else
  if [[ $CHECK_ONLY -eq 1 ]]; then
    warn "claude-context MCP not registered"
  elif confirm "Register claude-context MCP with Claude Code?"; then
    claude mcp add claude-context --scope user \
      -e EMBEDDING_PROVIDER=Ollama \
      -e EMBEDDING_MODEL=nomic-embed-text \
      -e OLLAMA_HOST=http://127.0.0.1:11434 \
      -e MILVUS_ADDRESS=127.0.0.1:19530 \
      -e MILVUS_TOKEN=local \
      -e EMBEDDING_BATCH_SIZE=64 \
      -e "CUSTOM_EXTENSIONS=.md,.markdown,.mdx" \
      -e "CUSTOM_IGNORE_PATTERNS=logs/**,data/**,**/*.db,**/*.sqlite,**/.next/**,**/dist/**,**/build/**,**/node_modules/**,**/.venv/**,**/venv/**,**/.git/**,**/.DS_Store,owners-inbox/archive/**,assets/**,projects/*/node_modules/**,projects/*/.next/**" \
      -e CODE_CHUNKS_COLLECTION_NAME_OVERRIDE=jarvis \
      -- npx -y @zilliz/claude-context-mcp@latest \
      && ok "MCP registered"
  fi
fi

# ─── Phase 5: First index ─────────────────────────────────────────────────
hdr "5. Initial index"

INDEX_LOG="$LOG_DIR/claude-context-indexer.log"
if [[ -f "$INDEX_LOG" ]] && grep -q "COMPLETE\|fully indexed" "$INDEX_LOG" 2>/dev/null; then
  ok "Initial index already completed (see $INDEX_LOG)"
  info "To re-index later: python3 $JARVIS_ROOT/scripts/claude_context_indexer.py"
else
  if [[ $CHECK_ONLY -eq 1 ]]; then
    warn "Initial index not yet run"
  elif confirm "Run initial index now? (~8–20 minutes for the JARVIS repo, runs in foreground with progress)"; then
    info "Indexing... watch progress in another terminal: tail -f $INDEX_LOG"
    python3 "$JARVIS_ROOT/scripts/claude_context_indexer.py" "$JARVIS_ROOT"
    ok "Initial index complete"
  else
    info "Skipped. Run later with: python3 scripts/claude_context_indexer.py"
  fi
fi

# ─── Summary ──────────────────────────────────────────────────────────────
hdr "Summary"

if [[ $CHECK_ONLY -eq 1 ]]; then
  echo "Check complete. Re-run without --check to install missing pieces."
else
  echo -e "${GREEN}✓ Semantic code search is set up.${NC}"
  echo ""
  echo "Try it:"
  echo -e "  ${BLUE}claude${NC}"
  echo "  Then ask: 'find where we handle user input validation'"
  echo ""
  echo "Maintenance:"
  echo -e "  Re-index:        ${BLUE}python3 scripts/claude_context_indexer.py${NC}"
  echo -e "  Restart Milvus:  ${BLUE}bash ~/.milvus-standalone/standalone_embed.sh restart${NC}"
  echo -e "  Restart Ollama:  ${BLUE}brew services restart ollama${NC}  (macOS)"
  echo -e "  Status check:    ${BLUE}bash setup/install-semantic-search.sh --check${NC}"
fi
