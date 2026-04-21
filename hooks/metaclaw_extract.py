#!/usr/bin/env python3
"""
MetaClaw Extractor
Analyzes a Claude Code session transcript for failure+recovery patterns and
extracts a structured lesson via Haiku. Writes the lesson to the appropriate
file in skills/learned/.

Runs in the background from stop_hook.sh. Fails silently on missing deps so it
never blocks the user's terminal.

Usage:
    python3 hooks/metaclaw_extract.py <transcript_path> [session_id]
"""

import json
import os
import re
import subprocess
import sys
from datetime import datetime
from pathlib import Path

_SCRIPT_ROOT = Path(__file__).resolve().parent.parent
JARVIS_DIR = Path(os.environ.get("JARVIS_DIR", _SCRIPT_ROOT))
LEARNED_DIR = JARVIS_DIR / "skills" / "learned"
LOG_FILE = JARVIS_DIR / "logs" / "metaclaw.log"
HAIKU_MODEL = "claude-haiku-4-5-20251001"
MAX_TRANSCRIPT_MSGS = 200
MIN_ERROR_SIGNALS = 1
VALID_CATEGORIES = {
    "tool-routing",
    "error-recovery",
    "prompt-patterns",
    "workflow-patterns",
    "integration-gotchas",
}

EXTRACTION_PROMPT = """You are the MetaClaw lesson extractor. Analyze the failure+recovery transcript below and extract AT MOST ONE structured lesson per category.

Rules:
- Only extract a lesson if a REAL failure+recovery happened (tool errored then retried, wrong approach then corrected, etc.). If the session was clean, output exactly "NO_LESSON" and nothing else.
- Each lesson must be actionable — a future agent should apply the rule without re-reading the transcript.
- Do NOT quote conversation content. Distill into rules only.
- Keep each lesson under 180 words.

Output format (one block per lesson, no other text):

### [kebab-slug] — [category] (confidence: LOW, seen: 1x)
**When**: [trigger context]
**Rule**: [one-sentence rule]
**Why**: [root cause]
**Fix/Pattern**: [what resolved it]
**Applies to**: [comma-separated agents/tools/skills]
*Last seen: DATE_PLACEHOLDER*

CATEGORY: [one of: tool-routing, error-recovery, prompt-patterns, workflow-patterns, integration-gotchas]

If multiple categories apply, output multiple blocks separated by blank lines.
"""


def log(msg: str) -> None:
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    with LOG_FILE.open("a", encoding="utf-8") as f:
        f.write(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [extract] {msg}\n")


def count_error_signals(transcript_path: Path) -> int:
    """Count tool_result entries with is_error=true. Cheap pre-filter."""
    errors = 0
    with transcript_path.open("r", encoding="utf-8", errors="replace") as f:
        for line in f:
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue
            if entry.get("type") != "user":
                continue
            content = entry.get("message", {}).get("content")
            if not isinstance(content, list):
                continue
            for item in content:
                if (
                    isinstance(item, dict)
                    and item.get("type") == "tool_result"
                    and item.get("is_error") is True
                ):
                    errors += 1
    return errors


def load_compact_trace(transcript_path: Path, max_msgs: int) -> str:
    """Return the first N user/assistant messages as a newline-joined JSONL string."""
    lines = []
    with transcript_path.open("r", encoding="utf-8", errors="replace") as f:
        for line in f:
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue
            if entry.get("type") in ("user", "assistant"):
                lines.append(json.dumps(entry, ensure_ascii=False))
                if len(lines) >= max_msgs:
                    break
    return "\n".join(lines)


def call_haiku(prompt: str) -> str | None:
    """Invoke `claude -p` with Haiku. Return text output or None on failure."""
    try:
        result = subprocess.run(
            ["claude", "-p", "--model", HAIKU_MODEL, "--output-format", "text"],
            input=prompt,
            capture_output=True,
            text=True,
            timeout=120,
        )
    except FileNotFoundError:
        log("SKIP: claude CLI not found on PATH")
        return None
    except subprocess.TimeoutExpired:
        log("ERROR: claude CLI timed out after 120s")
        return None

    if result.returncode != 0:
        log(f"ERROR: claude returned {result.returncode}: {result.stderr[:200]}")
        return None

    return result.stdout.strip()


def parse_blocks(response: str) -> list[tuple[str, str]]:
    """Parse Haiku response into (category, block_markdown) pairs."""
    if not response or response.strip() == "NO_LESSON":
        return []

    blocks = re.split(r"\n(?=###\s)", response.strip())
    parsed = []
    for block in blocks:
        category_match = re.search(r"^CATEGORY:\s*([a-z-]+)\s*$", block, re.MULTILINE)
        if not category_match:
            continue
        category = category_match.group(1).strip()
        if category not in VALID_CATEGORIES:
            log(f"WARN: unknown category '{category}' — skipping block")
            continue
        clean = re.sub(r"\nCATEGORY:.*$", "", block, flags=re.MULTILINE).rstrip()
        parsed.append((category, clean))
    return parsed


def append_lesson(category: str, block: str) -> None:
    """Append a lesson block to the matching learned/*.md file, stripping placeholder text."""
    target = LEARNED_DIR / f"{category}.md"
    LEARNED_DIR.mkdir(parents=True, exist_ok=True)

    if target.exists():
        existing = target.read_text(encoding="utf-8")
        existing = re.sub(
            r"\*No lessons yet[^*]*\*\n*", "", existing, flags=re.DOTALL
        ).rstrip()
        new_content = existing + "\n\n" + block + "\n"
    else:
        title = category.replace("-", " ").title()
        header = (
            f"# Learned Lessons: {title}\n\n"
            "> Auto-maintained by MetaClaw Learning System. Do not edit manually unless pruning.\n"
        )
        new_content = header + "\n" + block + "\n"

    target.write_text(new_content, encoding="utf-8")


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: metaclaw_extract.py <transcript_path> [session_id]", file=sys.stderr)
        return 1

    transcript = Path(sys.argv[1])
    session_id = sys.argv[2] if len(sys.argv) > 2 else "unknown"

    if not transcript.is_file():
        log(f"ERROR: transcript not found: {transcript}")
        return 1

    error_count = count_error_signals(transcript)
    if error_count < MIN_ERROR_SIGNALS:
        log(f"SKIP session {session_id}: {error_count} error signals (need {MIN_ERROR_SIGNALS})")
        return 0

    log(f"Session {session_id}: {error_count} error signals — extracting")

    trace = load_compact_trace(transcript, MAX_TRANSCRIPT_MSGS)
    if not trace:
        log(f"SKIP session {session_id}: empty trace")
        return 0

    prompt = EXTRACTION_PROMPT + "\n\nTRANSCRIPT (JSONL):\n" + trace
    response = call_haiku(prompt)
    if response is None:
        return 1

    today = datetime.now().strftime("%Y-%m-%d")
    response = response.replace("DATE_PLACEHOLDER", today)

    blocks = parse_blocks(response)
    if not blocks:
        log(f"Session {session_id}: Haiku found no extractable lessons")
        return 0

    for category, block in blocks:
        append_lesson(category, block)
        log(f"Session {session_id}: wrote lesson to {category}.md")

    return 0


if __name__ == "__main__":
    sys.exit(main())
