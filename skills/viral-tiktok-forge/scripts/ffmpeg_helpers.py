"""
ffmpeg_helpers.py — Phase E2 post-production helpers for viral-tiktok-forge.

Four operations the skill needs from FFmpeg:
  1. extract_last_frame(video_path) → JPG of the final frame (for image-to-video chaining)
  2. concat_clips([clip_paths], output_path) → stitched MP4 (no re-encode where possible)
  3. mix_audio(video, voiceover, output, music=None) → MP4 with layered audio
  4. replace_audio(video, audio, output) → MP4 with audio fully replaced

All operations require ffmpeg + ffprobe on PATH. The skill checks this in setup.

Failure mode: if ffmpeg isn't installed or a clip is malformed, raises FFmpegError
with a category the skill can route to the operator.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
from pathlib import Path


class FFmpegError(Exception):
    """Raised on FFmpeg failures so the skill can categorize."""

    def __init__(self, category: str, message: str, stderr: str | None = None):
        self.category = category
        self.message = message
        self.stderr = stderr
        super().__init__(f"[{category}] {message}")


def _ensure_ffmpeg() -> None:
    if not shutil.which("ffmpeg"):
        raise FFmpegError("missing_dependency", "ffmpeg not found on PATH. Install: brew install ffmpeg")
    if not shutil.which("ffprobe"):
        raise FFmpegError("missing_dependency", "ffprobe not found on PATH (usually bundled with ffmpeg).")


def _run(cmd: list[str], description: str) -> subprocess.CompletedProcess:
    """Run an ffmpeg/ffprobe command, raising FFmpegError on failure."""
    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True, timeout=120)
        return result
    except subprocess.CalledProcessError as e:
        raise FFmpegError("command_failed", f"{description} failed: {e}", stderr=e.stderr) from e
    except subprocess.TimeoutExpired as e:
        raise FFmpegError("timeout", f"{description} timed out after 120s") from e


# ============================================================
#  1. Extract last frame
# ============================================================

def extract_last_frame(video_path: str, output_path: str | None = None) -> str:
    """
    Extract the last frame of a video as a JPG, suitable for use as a starting image
    in the next image-to-video call.

    The trick: -sseof seeks N seconds before the end of the file. Then we take 1 frame.
    -update 1 + -q:v 1 gives a single high-quality JPG.

    Args:
        video_path: input MP4 path
        output_path: optional output JPG path. If omitted, uses {input}_last_frame.jpg

    Returns:
        Path to the extracted JPG.
    """
    _ensure_ffmpeg()
    src = Path(video_path).expanduser()
    if not src.exists():
        raise FFmpegError("missing_input", f"Video not found: {src}")

    if output_path is None:
        output_path = str(src.with_name(f"{src.stem}_last_frame.jpg"))
    dest = Path(output_path).expanduser()
    dest.parent.mkdir(parents=True, exist_ok=True)

    cmd = [
        "ffmpeg", "-y",
        "-sseof", "-0.5",       # seek to 0.5s before end
        "-i", str(src),
        "-update", "1",          # one image, overwrite if exists
        "-q:v", "1",             # max quality JPG
        "-frames:v", "1",
        str(dest),
    ]
    _run(cmd, "extract_last_frame")

    if not dest.exists() or dest.stat().st_size == 0:
        raise FFmpegError("empty_output", f"Last frame extraction produced empty file: {dest}")
    return str(dest)


# ============================================================
#  2. Concat clips (stitch)
# ============================================================

def concat_clips(clip_paths: list[str], output_path: str, re_encode: bool = False) -> str:
    """
    Concatenate multiple MP4 clips into a single output file.

    Default uses the FFmpeg concat demuxer (no re-encoding — fast, lossless), which
    requires all clips to share codec/resolution/framerate. Seedance outputs are
    consistent enough that this works in practice.

    If clips fail to concat (codec mismatch error), set re_encode=True to force
    re-encoding to a common H.264 + AAC profile.
    """
    _ensure_ffmpeg()
    if len(clip_paths) < 2:
        raise FFmpegError("invalid_input", "concat_clips requires at least 2 clips.")

    for p in clip_paths:
        if not Path(p).expanduser().exists():
            raise FFmpegError("missing_input", f"Clip not found: {p}")

    dest = Path(output_path).expanduser()
    dest.parent.mkdir(parents=True, exist_ok=True)

    if re_encode:
        # Use filter_complex concat — re-encodes, slower but tolerant of mismatches
        inputs: list[str] = []
        for p in clip_paths:
            inputs.extend(["-i", str(Path(p).expanduser())])
        # Build the filter graph: [0:v][0:a][1:v][1:a]... concat=n=N:v=1:a=1[v][a]
        n = len(clip_paths)
        filter_parts = []
        for i in range(n):
            filter_parts.append(f"[{i}:v][{i}:a]")
        filter_str = "".join(filter_parts) + f"concat=n={n}:v=1:a=1[v][a]"
        cmd = [
            "ffmpeg", "-y", *inputs,
            "-filter_complex", filter_str,
            "-map", "[v]", "-map", "[a]",
            "-c:v", "libx264", "-c:a", "aac",
            "-preset", "fast", "-crf", "20",
            str(dest),
        ]
        _run(cmd, "concat_clips_reencode")
    else:
        # Concat demuxer — fastest path, no re-encoding
        with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as f:
            for p in clip_paths:
                # Concat demuxer requires escaped single-quoted absolute paths
                abs_path = str(Path(p).expanduser().resolve())
                f.write(f"file '{abs_path}'\n")
            list_file = f.name

        try:
            cmd = [
                "ffmpeg", "-y",
                "-f", "concat",
                "-safe", "0",
                "-i", list_file,
                "-c", "copy",
                str(dest),
            ]
            _run(cmd, "concat_clips_demuxer")
        finally:
            os.unlink(list_file)

    if not dest.exists() or dest.stat().st_size == 0:
        raise FFmpegError("empty_output", f"Concat produced empty file: {dest}")
    return str(dest)


# ============================================================
#  3. Mix audio (voiceover + duck native)
# ============================================================

def mix_audio(
    video_path: str,
    voiceover_path: str,
    output_path: str,
    voice_volume: float = 0.85,
    native_volume: float = 0.40,
    voiceover_offset_seconds: float = 0.0,
) -> str:
    """
    Mix a voiceover audio file ON TOP of the video's existing audio (Seedance-native),
    with the native audio ducked. The voiceover sits prominent; native audio remains
    as ambient bed.

    Args:
        video_path: input MP4 (with native Seedance audio)
        voiceover_path: input MP3/WAV from ElevenLabs (or any TTS)
        output_path: output MP4
        voice_volume: 0.0–1.0 — voiceover prominence (default 0.85)
        native_volume: 0.0–1.0 — native audio ducked level (default 0.40)
        voiceover_offset_seconds: delay voiceover start by N seconds (default 0)

    Output is H.264 + AAC for TikTok compatibility.
    """
    _ensure_ffmpeg()
    src = Path(video_path).expanduser()
    voice = Path(voiceover_path).expanduser()
    if not src.exists():
        raise FFmpegError("missing_input", f"Video not found: {src}")
    if not voice.exists():
        raise FFmpegError("missing_input", f"Voiceover not found: {voice}")

    dest = Path(output_path).expanduser()
    dest.parent.mkdir(parents=True, exist_ok=True)

    # Build the audio filter chain
    # [0:a] is video's native audio, [1:a] is voiceover
    voice_input = f"adelay={int(voiceover_offset_seconds * 1000)}|{int(voiceover_offset_seconds * 1000)}," if voiceover_offset_seconds > 0 else ""
    filter_str = (
        f"[0:a]volume={native_volume}[native];"
        f"[1:a]{voice_input}volume={voice_volume}[voice];"
        f"[native][voice]amix=inputs=2:duration=longest:dropout_transition=0[a]"
    )

    cmd = [
        "ffmpeg", "-y",
        "-i", str(src),
        "-i", str(voice),
        "-filter_complex", filter_str,
        "-map", "0:v",
        "-map", "[a]",
        "-c:v", "copy",     # no video re-encode (fast, lossless)
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        str(dest),
    ]
    _run(cmd, "mix_audio")

    if not dest.exists() or dest.stat().st_size == 0:
        raise FFmpegError("empty_output", f"Audio mix produced empty file: {dest}")
    return str(dest)


# ============================================================
#  4. Replace audio (full replacement)
# ============================================================

def replace_audio(video_path: str, audio_path: str, output_path: str) -> str:
    """
    Replace the video's audio entirely with a new track. Use when you want voiceover
    or music to be the ONLY audio (e.g., music-driven content where Seedance native
    audio would clash).

    Trims to the shorter of (video, audio) duration via -shortest.
    """
    _ensure_ffmpeg()
    src = Path(video_path).expanduser()
    audio = Path(audio_path).expanduser()
    if not src.exists():
        raise FFmpegError("missing_input", f"Video not found: {src}")
    if not audio.exists():
        raise FFmpegError("missing_input", f"Audio not found: {audio}")

    dest = Path(output_path).expanduser()
    dest.parent.mkdir(parents=True, exist_ok=True)

    cmd = [
        "ffmpeg", "-y",
        "-i", str(src),
        "-i", str(audio),
        "-map", "0:v",
        "-map", "1:a",
        "-c:v", "copy",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        str(dest),
    ]
    _run(cmd, "replace_audio")

    if not dest.exists() or dest.stat().st_size == 0:
        raise FFmpegError("empty_output", f"Audio replace produced empty file: {dest}")
    return str(dest)


# ============================================================
#  Probe helper (duration, codec, etc.)
# ============================================================

def probe_video(video_path: str) -> dict:
    """Return basic metadata about a video (duration, codec, resolution, fps)."""
    _ensure_ffmpeg()
    src = Path(video_path).expanduser()
    if not src.exists():
        raise FFmpegError("missing_input", f"Video not found: {src}")

    cmd = [
        "ffprobe", "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        "-show_streams",
        str(src),
    ]
    result = _run(cmd, "probe_video")
    import json as _json
    data = _json.loads(result.stdout)
    video_stream = next((s for s in data.get("streams", []) if s.get("codec_type") == "video"), {})
    return {
        "duration_seconds": float(data.get("format", {}).get("duration", 0)),
        "size_bytes": int(data.get("format", {}).get("size", 0)),
        "codec": video_stream.get("codec_name"),
        "width": video_stream.get("width"),
        "height": video_stream.get("height"),
        "fps": video_stream.get("r_frame_rate"),
    }


# ============================================================
#  CLI mode
# ============================================================

if __name__ == "__main__":
    import argparse
    import json

    parser = argparse.ArgumentParser(description="FFmpeg helpers for viral-tiktok-forge")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_last = sub.add_parser("last-frame")
    p_last.add_argument("--video", required=True)
    p_last.add_argument("--out", required=False)

    p_concat = sub.add_parser("concat")
    p_concat.add_argument("--clips", nargs="+", required=True)
    p_concat.add_argument("--out", required=True)
    p_concat.add_argument("--re-encode", action="store_true")

    p_mix = sub.add_parser("mix-audio")
    p_mix.add_argument("--video", required=True)
    p_mix.add_argument("--voice", required=True)
    p_mix.add_argument("--out", required=True)
    p_mix.add_argument("--voice-volume", type=float, default=0.85)
    p_mix.add_argument("--native-volume", type=float, default=0.40)

    p_repl = sub.add_parser("replace-audio")
    p_repl.add_argument("--video", required=True)
    p_repl.add_argument("--audio", required=True)
    p_repl.add_argument("--out", required=True)

    p_probe = sub.add_parser("probe")
    p_probe.add_argument("--video", required=True)

    args = parser.parse_args()

    if args.cmd == "last-frame":
        out = extract_last_frame(args.video, args.out)
        print(json.dumps({"output": out}))
    elif args.cmd == "concat":
        out = concat_clips(args.clips, args.out, re_encode=args.re_encode)
        print(json.dumps({"output": out}))
    elif args.cmd == "mix-audio":
        out = mix_audio(args.video, args.voice, args.out,
                        voice_volume=args.voice_volume, native_volume=args.native_volume)
        print(json.dumps({"output": out}))
    elif args.cmd == "replace-audio":
        out = replace_audio(args.video, args.audio, args.out)
        print(json.dumps({"output": out}))
    elif args.cmd == "probe":
        print(json.dumps(probe_video(args.video), indent=2))
