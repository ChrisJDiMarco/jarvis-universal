"""
elevenlabs_tts.py — Generate voiceover MP3 from caption text via ElevenLabs API.

Reads ELEVENLABS_KEY from env. Never embeds the key, never writes it to files.

The skill calls this in Phase E2 when:
  - Operator says "with voiceover" / "narrate it" explicitly, OR
  - Topic warrants narration (educational/explanatory) AND operator agrees at gate

Default voice: a "casual conversational" voice profile that pairs with the skill's
caption voice contract ("casual, specific, slightly understated"). Operator can
override via voice_id parameter or by setting ELEVENLABS_VOICE_ID env var.

Voice IDs (ElevenLabs library — these are the most common defaults):
  - "21m00Tcm4TlvDq8ikWAM"  Rachel — calm, clear, narration-friendly (default)
  - "AZnzlk1XvdvUeBnXmlld"  Domi — confident, slightly edgy
  - "EXAVITQu4vr4xnSDxMaL"  Bella — warm, soft, conversational
  - "ErXwobaYiN019PkySvjV"  Antoni — well-rounded male, warm
  - "MF3mGyEYCl7XYWbV9V6O"  Elli — youthful, expressive
  - "TxGEqnHWrfWFTfGW9XjX"  Josh — deep, narrative

Override defaults at runtime via:
  ELEVENLABS_VOICE_ID="..." python -m elevenlabs_tts ...
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from pathlib import Path


DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"  # Rachel — narration-friendly default
DEFAULT_MODEL = "eleven_multilingual_v2"   # ElevenLabs current best general model
ELEVENLABS_BASE = "https://api.elevenlabs.io/v1/text-to-speech"


class ElevenLabsError(Exception):
    """Raised on ElevenLabs API failures so the skill can categorize."""

    def __init__(self, category: str, message: str, http_status: int | None = None):
        self.category = category
        self.message = message
        self.http_status = http_status
        super().__init__(f"[{category}] {message}")


def _ensure_key() -> str:
    key = os.getenv("ELEVENLABS_KEY")
    if not key:
        raise ElevenLabsError("auth_failure", "ELEVENLABS_KEY env var is not set. Add to ~/.zshrc.")
    return key


def generate_voiceover(
    text: str,
    output_path: str,
    voice_id: str | None = None,
    model: str = DEFAULT_MODEL,
    stability: float = 0.50,
    similarity_boost: float = 0.75,
    style: float = 0.30,
    use_speaker_boost: bool = True,
) -> str:
    """
    Generate a voiceover MP3 from text via ElevenLabs API.

    Args:
        text: caption text (the verbal hook + arc; typically the same text as caption.md
              minus hashtags). Strip emojis if present — TTS reads them aloud as words.
        output_path: absolute path to save the MP3 (e.g., workspace/voiceover.mp3)
        voice_id: ElevenLabs voice ID. Defaults to ELEVENLABS_VOICE_ID env var or Rachel.
        model: ElevenLabs model. Default eleven_multilingual_v2.
        stability: 0.0–1.0. Lower = more expressive, higher = more consistent. 0.50 is balanced.
        similarity_boost: 0.0–1.0. Higher = more similar to base voice. 0.75 is good for narration.
        style: 0.0–1.0. Higher = more emotional inflection. 0.30 keeps it natural-conversational.
        use_speaker_boost: True for clearer voice separation from any background mix.

    Returns:
        Path to the saved MP3.

    Raises:
        ElevenLabsError with category in {auth_failure, rate_limited, content_rejected,
        api_failure, download_failure}.
    """
    api_key = _ensure_key()
    voice = voice_id or os.getenv("ELEVENLABS_VOICE_ID") or DEFAULT_VOICE_ID

    if not text.strip():
        raise ValueError("text cannot be empty")

    # Strip emojis — TTS reads them as words ("smiling face emoji")
    cleaned_text = _strip_emojis(text)

    dest = Path(output_path).expanduser()
    dest.parent.mkdir(parents=True, exist_ok=True)

    url = f"{ELEVENLABS_BASE}/{voice}"
    payload = {
        "text": cleaned_text,
        "model_id": model,
        "voice_settings": {
            "stability": stability,
            "similarity_boost": similarity_boost,
            "style": style,
            "use_speaker_boost": use_speaker_boost,
        },
    }
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg",
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=60) as response:
            audio_bytes = response.read()
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        if e.code == 401:
            raise ElevenLabsError("auth_failure", f"ELEVENLABS_KEY invalid or expired. Body: {body}", e.code) from e
        if e.code == 429:
            raise ElevenLabsError("rate_limited", f"ElevenLabs rate limit hit. Body: {body}", e.code) from e
        if e.code == 422:
            raise ElevenLabsError("content_rejected", f"ElevenLabs rejected text. Body: {body}", e.code) from e
        raise ElevenLabsError("api_failure", f"HTTP {e.code}: {body}", e.code) from e
    except urllib.error.URLError as e:
        raise ElevenLabsError("api_failure", f"Network failure: {e}") from e

    if not audio_bytes:
        raise ElevenLabsError("api_failure", "ElevenLabs returned empty audio bytes.")

    dest.write_bytes(audio_bytes)
    return str(dest)


def _strip_emojis(text: str) -> str:
    """Remove emojis and other non-printable Unicode that TTS reads as words."""
    import re
    # Strip a broad emoji range — pragmatic, not exhaustive
    emoji_pattern = re.compile(
        "["
        "\U0001F600-\U0001F64F"  # emoticons
        "\U0001F300-\U0001F5FF"  # symbols & pictographs
        "\U0001F680-\U0001F6FF"  # transport & map symbols
        "\U0001F1E0-\U0001F1FF"  # flags
        "\U00002702-\U000027B0"
        "\U000024C2-\U0001F251"
        "\U0001F900-\U0001F9FF"  # supplemental symbols
        "\U0001FA70-\U0001FAFF"  # extended-A
        "]+",
        flags=re.UNICODE,
    )
    return emoji_pattern.sub("", text).strip()


def list_voices() -> list[dict]:
    """Fetch the user's available voices from ElevenLabs. Useful for picking voice_id."""
    api_key = _ensure_key()
    req = urllib.request.Request(
        "https://api.elevenlabs.io/v1/voices",
        headers={"xi-api-key": api_key},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            data = json.loads(response.read())
        return data.get("voices", [])
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise ElevenLabsError("api_failure", f"List voices failed HTTP {e.code}: {body}", e.code) from e


# ============================================================
#  CLI mode
# ============================================================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="ElevenLabs TTS for viral-tiktok-forge")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_gen = sub.add_parser("generate")
    p_gen.add_argument("--text", required=True, help="Text to speak")
    p_gen.add_argument("--out", required=True, help="Output MP3 path")
    p_gen.add_argument("--voice", help="Voice ID (default Rachel)")
    p_gen.add_argument("--stability", type=float, default=0.50)
    p_gen.add_argument("--style", type=float, default=0.30)

    p_voices = sub.add_parser("voices", help="List available voices")

    args = parser.parse_args()

    if args.cmd == "generate":
        out = generate_voiceover(
            text=args.text,
            output_path=args.out,
            voice_id=args.voice,
            stability=args.stability,
            style=args.style,
        )
        print(json.dumps({"output": out}))
    elif args.cmd == "voices":
        voices = list_voices()
        for v in voices:
            print(f"{v.get('voice_id')}\t{v.get('name')}\t{v.get('category', '')}")
