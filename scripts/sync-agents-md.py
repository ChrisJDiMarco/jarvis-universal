#!/usr/bin/env python3
"""
sync-agents-md.py — Generate AGENTS.md from CLAUDE.md (single source of truth).

WHY THIS EXISTS
  CLAUDE.md (Claude Code / Cowork) and AGENTS.md (Codex, Gemini CLI, and any
  other engine that reads AGENTS.md) must carry the SAME rules. Maintaining two
  full copies by hand let them drift — they had even contradicted each other on
  a core rule (memory caps: "advisory" vs "never exceed"). The video lesson and
  JARVIS's own single-source discipline (config/memory-caps.conf) say the same
  thing: write the rules ONCE.

  So CLAUDE.md is canonical. AGENTS.md is DERIVED from it. The only difference
  between the two is the "which file am I" annotation in the File System Layout
  block — everything else is identical by construction, so they cannot drift.

USAGE
  python3 scripts/sync-agents-md.py            # regenerate AGENTS.md in place
  python3 scripts/sync-agents-md.py --check    # print the expected AGENTS.md to
                                               # stdout, write nothing. Used by
                                               # tests/test-agents-md-sync.sh as a
                                               # drift guard.

EXIT CODES
  0  success
  2  CLAUDE.md changed shape — the layout anchor below was not found. Update the
     anchor here, then rerun. (Fails loud rather than emit a wrong AGENTS.md.)
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CLAUDE = ROOT / "CLAUDE.md"
AGENTS = ROOT / "AGENTS.md"

HEADER = """<!-- ============================================================
     AGENTS.md — AUTO-GENERATED FROM CLAUDE.md. DO NOT EDIT BY HAND.

     CLAUDE.md is the single source of truth for JARVIS's rules. This file is
     what non-Claude engines (Codex, Gemini CLI, Hermes, etc.) read, and it is
     a faithful mirror of CLAUDE.md so the two can never drift.

     To change the rules: edit CLAUDE.md, then run
         python3 scripts/sync-agents-md.py
     A drift guard (tests/test-agents-md-sync.sh, run by tests/run-all.sh) fails
     if this file is ever out of sync with CLAUDE.md.
     ============================================================ -->

"""

# The ONLY engine-specific divergence. CLAUDE.md's content is otherwise
# engine-agnostic (it describes JARVIS's behavior, not Claude's), so it is
# mirrored verbatim. This regex tolerates whatever whitespace CLAUDE.md uses to
# align the layout tree, and rewrites the "YOU ARE HERE" line into two lines
# that name AGENTS.md as the non-Claude entry point and CLAUDE.md as canonical.
LAYOUT_ANCHOR = re.compile(
    r"^(?P<indent>.*?)CLAUDE\.md(?P<pad>[ \t]+)← YOU ARE HERE[ \t]*$",
    re.MULTILINE,
)


def build() -> str:
    """Return the full text AGENTS.md should contain, derived from CLAUDE.md."""
    text = CLAUDE.read_text(encoding="utf-8")

    match = LAYOUT_ANCHOR.search(text)
    if not match:
        sys.stderr.write(
            "ERROR: could not find the 'CLAUDE.md  ← YOU ARE HERE' line in the "
            "File System Layout block of CLAUDE.md.\n"
            "The layout changed — update LAYOUT_ANCHOR in scripts/sync-agents-md.py, "
            "then rerun. Refusing to emit a possibly-wrong AGENTS.md.\n"
        )
        sys.exit(2)

    indent = match.group("indent")
    pad = match.group("pad")
    # "AGENTS.md" and "CLAUDE.md" are both 9 chars, so reusing `pad` keeps the
    # tree aligned for both lines.
    replacement = (
        f"{indent}AGENTS.md{pad}← this file (entry point for non-Claude engines: Codex, Gemini CLI, Hermes…)\n"
        f"{indent}CLAUDE.md{pad}← Claude Code / Cowork runtime — CANONICAL source for both files"
    )
    text = LAYOUT_ANCHOR.sub(lambda _m: replacement, text, count=1)

    return HEADER + text


def main() -> None:
    out = build()
    if "--check" in sys.argv[1:]:
        sys.stdout.write(out)
        return
    AGENTS.write_text(out, encoding="utf-8")
    sys.stderr.write(
        f"Wrote {AGENTS.name} ({len(out):,} chars) from {CLAUDE.name}.\n"
    )


if __name__ == "__main__":
    main()
