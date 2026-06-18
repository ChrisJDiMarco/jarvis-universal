"""
strip_ai_smell.py — Phase F caption sanitizer for viral-tiktok-forge.

Two responsibilities:
1. Em-dash regex strip (Hard Rule 3) — auto-applied.
2. Forbidden-phrase scan (Tier 1/2/3) — flags issues for operator review.

Usage:
    from strip_ai_smell import sanitize_caption

    cleaned, flags = sanitize_caption(raw_caption)
    print(cleaned)         # em-dashes stripped
    print(flags)           # list of phrases that need operator attention
"""

from __future__ import annotations

import re
from dataclasses import dataclass


# ---- Tier 1: Auto-flag (highest AI-smell signal) ----
TIER_1_PHRASES = [
    "isn't just",
    "not just",
    "transforms",
    "elevate",
    "unleash",
    "harness",
    "leverage",
    "embark",
    "dive into",
    "revolutionary",
    "groundbreaking",
    "transformative",
    "game-changer",
    "paradigm shift",
    "in a world where",
    "whether you're",
]

# ---- Tier 2: Warn (sometimes appropriate) ----
TIER_2_PHRASES = [
    "journey",
    "adventure",
    "ultimate",
    "essential",
    "must-have",
    "key to",
    "unlock",
    "mastery",
    "discover",
    "explore",
    "empower",
]

# ---- Tier 3: adjective-stack pattern ----
ADJ_STACK_PATTERN = re.compile(
    r"\b(\w+),\s+(\w+),\s+(\w+)\b",
    flags=re.IGNORECASE,
)


@dataclass
class SmellFlag:
    tier: int  # 1, 2, or 3
    phrase: str
    position: int  # character offset in caption
    note: str


def strip_em_dashes(text: str) -> str:
    """Hard Rule 3: regex-strip em-dashes and en-dashes. Auto-applied."""
    text = text.replace("—", ", ")  # em-dash
    text = text.replace("–", ", ")   # en-dash
    text = text.replace("…", "...")  # ellipsis char to 3 periods
    # Collapse any double-commas the substitution might have created
    text = re.sub(r",\s*,", ",", text)
    # Collapse double spaces
    text = re.sub(r"  +", " ", text)
    return text.strip()


def scan_forbidden_phrases(text: str) -> list[SmellFlag]:
    """Scan for AI-smell phrases. Returns flags; operator decides whether to rewrite."""
    flags: list[SmellFlag] = []
    text_lower = text.lower()

    # Tier 1 — auto-flag
    for phrase in TIER_1_PHRASES:
        for match in re.finditer(re.escape(phrase), text_lower):
            flags.append(SmellFlag(
                tier=1,
                phrase=phrase,
                position=match.start(),
                note="High AI-smell signal. Strongly recommend rewrite.",
            ))

    # Tier 2 — warn
    for phrase in TIER_2_PHRASES:
        for match in re.finditer(re.escape(phrase), text_lower):
            flags.append(SmellFlag(
                tier=2,
                phrase=phrase,
                position=match.start(),
                note="Potential AI-smell. Consider rewrite if not domain-specific.",
            ))

    # Tier 3 — adjective stacks
    for match in ADJ_STACK_PATTERN.finditer(text):
        candidate = match.group(0)
        # Filter false positives — only flag if all 3 are likely adjectives
        # Heuristic: check for adjective-y suffixes or short common adjectives
        words = [w.strip().lower() for w in candidate.split(",")]
        if _looks_like_adjective_stack(words):
            flags.append(SmellFlag(
                tier=3,
                phrase=candidate,
                position=match.start(),
                note="Adjective stack (3+). Often signals marketing voice.",
            ))

    return flags


def _looks_like_adjective_stack(words: list[str]) -> bool:
    """Heuristic for adjective-stack detection. Tunable."""
    adj_signals = (
        "ly", "ful", "ous", "ive", "able", "ible", "ic", "al", "ish", "ant", "ent"
    )
    common_short_adjectives = {
        "fast", "easy", "free", "cheap", "good", "best", "new", "old",
        "big", "small", "bold", "cold", "hot", "rich", "poor", "smart",
        "clean", "raw", "bare", "deep", "high", "low", "wide", "narrow",
        "soft", "hard", "fresh", "pure", "premium", "elite",
    }
    matches = 0
    for w in words:
        if any(w.endswith(suf) for suf in adj_signals):
            matches += 1
        elif w in common_short_adjectives:
            matches += 1
    return matches >= 2  # 2+ of 3 looks adjectivey → flag


def sanitize_caption(text: str) -> tuple[str, list[SmellFlag]]:
    """
    End-to-end caption sanitization.

    Returns:
        (cleaned_text, flags)
        - cleaned_text has em-dashes/en-dashes/ellipsis-chars normalized.
        - flags lists Tier 1/2/3 issues for operator review.
    """
    cleaned = strip_em_dashes(text)
    flags = scan_forbidden_phrases(cleaned)
    return cleaned, flags


def format_flags_report(flags: list[SmellFlag]) -> str:
    """Pretty-print flag report for the caption.md output file."""
    if not flags:
        return "✅ No AI-smell flags detected."

    lines = []
    by_tier: dict[int, list[SmellFlag]] = {1: [], 2: [], 3: []}
    for f in flags:
        by_tier[f.tier].append(f)

    if by_tier[1]:
        lines.append("### 🚨 Tier 1 (high AI-smell — strongly recommend rewrite)")
        for f in by_tier[1]:
            lines.append(f"- `{f.phrase}` at position {f.position} — {f.note}")
    if by_tier[2]:
        lines.append("\n### ⚠️ Tier 2 (potential AI-smell — review)")
        for f in by_tier[2]:
            lines.append(f"- `{f.phrase}` at position {f.position} — {f.note}")
    if by_tier[3]:
        lines.append("\n### 📝 Tier 3 (adjective stacks)")
        for f in by_tier[3]:
            lines.append(f"- `{f.phrase}` at position {f.position} — {f.note}")

    return "\n".join(lines)


# ---- CLI mode ----
if __name__ == "__main__":
    import sys
    raw = sys.stdin.read()
    cleaned, flags = sanitize_caption(raw)
    print("=== CLEANED ===")
    print(cleaned)
    print("\n=== FLAGS ===")
    print(format_flags_report(flags))
