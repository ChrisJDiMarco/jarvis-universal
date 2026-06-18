"""
fal_client_wrapper.py — Phase E execution helper for viral-tiktok-forge.

v1.1: refactored to submit+poll pattern (Hard Rule 9 — bash 45s timeout vs Seedance 60-90s
generation). Adds image-to-video for multi-clip continuity (Hard Rule 12) and Flux
text-to-image for keyframes.

Pipelines this supports:

  Single-clip:
    submit_seedance_video(prompt) → request_id
    poll_until_complete(request_id, endpoint) → video URL
    download_video(url, dest)

  Multi-clip continuity:
    flux_text_to_image(keyframe_prompt) → keyframe URL
    submit_seedance_image_to_video(image_url=keyframe_url, prompt=clip_1_prompt) → request_id
    poll_until_complete(...) → clip_1 URL
    [extract last frame via ffmpeg_helpers.extract_last_frame()]
    [upload last frame via upload_file_to_fal()]
    submit_seedance_image_to_video(image_url=last_frame_url, prompt=clip_2_prompt)
    ... repeat ...

The legacy generate_seedance_video() is retained for callers that want blocking
behavior despite the bash-timeout risk. Prefer submit+poll for any FAL call run
through bash.

Hard Rules referenced (see SKILL.md):
- 2: numeric-input string coercion
- 5: Fast tier default
- 6: generate_audio=True
- 7: endpoint namespace bytedance/seedance-2.0/...
- 9: submit+poll, not blocking subscribe
- 12: multi-clip via image-to-video chain
"""

from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.request
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

try:
    import fal_client
except ImportError as e:
    raise ImportError("fal-client not installed. Run: pip install fal-client") from e


# ---- Endpoint registry (Hard Rule 7) ----
# Validated 2026-05-06 from a real run — bytedance/seedance-2.0/* is the correct
# namespace; no fal-ai/ prefix needed for Seedance. Flux uses fal-ai/flux/dev.
VALID_ENDPOINTS = {
    "fast_t2v":     "bytedance/seedance-2.0/fast/text-to-video",
    "std_t2v":      "bytedance/seedance-2.0/text-to-video",
    "fast_i2v":     "bytedance/seedance-2.0/fast/image-to-video",
    "std_i2v":      "bytedance/seedance-2.0/image-to-video",
    "ref_video":    "bytedance/seedance-2.0/reference-to-video",
    "flux_t2i":     "fal-ai/flux/dev",
}

# Pricing per-second (USD) where applicable. Flux is per-image flat.
PRICING_PER_SECOND = {
    "fast_t2v":   0.2419,
    "std_t2v":    0.3034,
    "fast_i2v":   0.2419,
    "std_i2v":    0.3024,
    "ref_video":  0.3024,
}
PRICING_FLAT = {
    "flux_t2i":   0.025,  # Flux dev approx per image; verify on first run
}


# ---- Failure categorization ----
class FALError(Exception):
    """Base for FAL-related failures."""

    def __init__(self, category: str, message: str, original: Exception | None = None):
        self.category = category
        self.message = message
        self.original = original
        super().__init__(f"[{category}] {message}")


def _categorize_exception(e: Exception) -> FALError:
    """Map a raw fal-client exception to one of 5 categories the skill surfaces."""
    msg = str(e).lower()
    if "401" in msg or "unauthorized" in msg or "invalid api key" in msg:
        return FALError("auth_failure", "FAL_KEY missing, invalid, or expired", e)
    if "429" in msg or "rate limit" in msg:
        return FALError("rate_limited", "FAL rate limit hit; retry with backoff", e)
    if "safety" in msg or "filter" in msg or "rejected" in msg or "policy" in msg:
        return FALError("safety_rejection", "Seedance safety filter rejected the prompt", e)
    if "timeout" in msg or "url" in msg or "network" in msg:
        return FALError("download_failure", f"Network/timeout failure: {e}", e)
    return FALError("generation_failure", f"Generation failed: {e}", e)


# ---- String coercion (Hard Rule 2) ----
def _coerce_to_strings(payload: dict[str, Any]) -> dict[str, Any]:
    """Force all numeric-looking inputs to strings. Seedance API requires this."""
    string_fields = {"duration", "resolution", "aspect_ratio"}
    return {k: (str(v) if k in string_fields else v) for k, v in payload.items()}


# ---- Pre-flight ----
def _ensure_fal_key() -> None:
    if not os.getenv("FAL_KEY"):
        raise ValueError("FAL_KEY env var is not set. Add to ~/.zshrc.")


# ============================================================
#  SUBMIT + POLL PATTERN (preferred — Hard Rule 9)
# ============================================================

@dataclass
class SubmitResult:
    request_id: str
    endpoint: str
    submitted_at: float


def submit_seedance_video(
    prompt: str,
    duration: int | str = 10,
    resolution: str = "720p",
    aspect_ratio: str = "9:16",
    final: bool = False,
    music_driven: bool = False,
    audio_url: str | None = None,
    seed: int | None = None,
) -> SubmitResult:
    """Submit a text-to-video Seedance call. Returns request_id immediately."""
    _ensure_fal_key()
    if music_driven and not audio_url:
        raise ValueError("music_driven=True requires audio_url.")
    if not 4 <= int(duration) <= 15:
        raise ValueError(f"duration must be 4-15; got {duration}")

    if music_driven:
        endpoint = VALID_ENDPOINTS["ref_video"]
    elif final:
        endpoint = VALID_ENDPOINTS["std_t2v"]
    else:
        endpoint = VALID_ENDPOINTS["fast_t2v"]

    final_prompt = prompt
    if music_driven and "@Audio 1" not in prompt:
        final_prompt = prompt.rstrip(". ") + ". Scene transitions should align with @Audio 1 beat positions."

    payload = {
        "prompt": final_prompt,
        "duration": duration,
        "resolution": resolution,
        "aspect_ratio": aspect_ratio,
        "generate_audio": True,
    }
    if seed is not None:
        payload["seed"] = seed
    if music_driven:
        payload["audio_url"] = audio_url
    payload = _coerce_to_strings(payload)

    try:
        handle = fal_client.submit(endpoint, arguments=payload)
        return SubmitResult(request_id=handle.request_id, endpoint=endpoint, submitted_at=time.time())
    except Exception as e:
        raise _categorize_exception(e) from e


def submit_seedance_image_to_video(
    image_url: str,
    prompt: str,
    duration: int | str = 10,
    resolution: str = "720p",
    aspect_ratio: str = "9:16",
    final: bool = False,
    seed: int | None = None,
) -> SubmitResult:
    """
    Submit an image-to-video Seedance call. The first frame of the output video
    will start from image_url (uploaded to FAL storage or already on a public URL).

    Used in multi-clip continuity mode — Hard Rule 12.
    """
    _ensure_fal_key()
    if not 4 <= int(duration) <= 15:
        raise ValueError(f"duration must be 4-15; got {duration}")

    endpoint = VALID_ENDPOINTS["std_i2v" if final else "fast_i2v"]

    payload = {
        "image_url": image_url,
        "prompt": prompt,
        "duration": duration,
        "resolution": resolution,
        "aspect_ratio": aspect_ratio,
        "generate_audio": True,
    }
    if seed is not None:
        payload["seed"] = seed
    payload = _coerce_to_strings(payload)

    try:
        handle = fal_client.submit(endpoint, arguments=payload)
        return SubmitResult(request_id=handle.request_id, endpoint=endpoint, submitted_at=time.time())
    except Exception as e:
        raise _categorize_exception(e) from e


def poll_until_complete(
    request_id: str,
    endpoint: str,
    deadline_seconds: int = 35,
    poll_interval: int = 3,
    state_file: str | None = None,
) -> dict[str, Any] | None:
    """
    Poll FAL queue until generation completes OR deadline_seconds elapses.

    If deadline hits, persist state to state_file (default /tmp/fal_state_<request_id>.json)
    so the next bash call can resume by reading the file and calling this function again.

    Returns:
        dict with the FAL result if completed within deadline, OR None if deadline hit
        (caller should resume in next bash invocation).

    Default deadline (35s) leaves headroom under bash's 45s cap.
    """
    _ensure_fal_key()
    deadline = time.time() + deadline_seconds

    while time.time() < deadline:
        try:
            status = fal_client.status(endpoint, request_id, with_logs=False)
            status_type = type(status).__name__
            if status_type == "Completed":
                return fal_client.result(endpoint, request_id)
        except Exception as e:
            # Status endpoint failures are usually transient; log and continue
            print(f"[poll error] {type(e).__name__}: {e}")
        time.sleep(poll_interval)

    # Deadline hit — persist state if requested
    if state_file is None:
        state_file = f"/tmp/fal_state_{request_id}.json"
    Path(state_file).write_text(json.dumps({
        "request_id": request_id,
        "endpoint": endpoint,
        "submitted_at": time.time() - deadline_seconds,  # approximate
    }))
    return None


def resume_poll(state_file: str, deadline_seconds: int = 35) -> dict[str, Any] | None:
    """Read state from state_file and resume polling. Returns result or None (deadline)."""
    state = json.loads(Path(state_file).read_text())
    return poll_until_complete(
        request_id=state["request_id"],
        endpoint=state["endpoint"],
        deadline_seconds=deadline_seconds,
        state_file=state_file,
    )


# ============================================================
#  FLUX TEXT-TO-IMAGE (multi-clip keyframe generation)
# ============================================================

def flux_text_to_image(
    prompt: str,
    image_size: str = "portrait_16_9",
    num_inference_steps: int = 28,
    guidance_scale: float = 3.5,
    seed: int | None = None,
) -> dict[str, Any]:
    """
    Generate a keyframe image via fal-ai/flux/dev. Returns dict with image URL.

    For TikTok 9:16, use image_size="portrait_16_9" (which Flux interprets as portrait
    9:16 in modern terminology). Output is typically 720x1280 or similar.

    This is a blocking call (Flux is fast — usually <10s, well under bash timeout).
    For very long Flux runs, switch to submit+poll pattern.
    """
    _ensure_fal_key()
    endpoint = VALID_ENDPOINTS["flux_t2i"]

    payload = {
        "prompt": prompt,
        "image_size": image_size,
        "num_inference_steps": num_inference_steps,
        "guidance_scale": guidance_scale,
        "num_images": 1,
        "enable_safety_checker": True,
    }
    if seed is not None:
        payload["seed"] = seed

    try:
        result = fal_client.subscribe(endpoint, arguments=payload, with_logs=False)
        return {
            "image_url": result["images"][0]["url"],
            "width": result["images"][0].get("width"),
            "height": result["images"][0].get("height"),
            "seed": result.get("seed"),
            "endpoint_used": endpoint,
        }
    except Exception as e:
        raise _categorize_exception(e) from e


# ============================================================
#  FILE UPLOAD (multi-clip frame upload to FAL storage)
# ============================================================

def upload_file_to_fal(local_path: str) -> str:
    """
    Upload a local file to FAL storage and return its public URL.
    Used to upload extracted last-frame images for image-to-video chaining.
    """
    _ensure_fal_key()
    try:
        url = fal_client.upload_file(local_path)
        return url
    except Exception as e:
        raise _categorize_exception(e) from e


# ============================================================
#  DOWNLOAD (MP4 to workspace — FAL URLs have TTL)
# ============================================================

def download_video(video_url: str, dest_path: str) -> str:
    """
    Download a video MP4 from a FAL URL to a local path.
    FAL CDN URLs have TTLs (typically 24h); always download immediately.
    """
    dest = Path(dest_path).expanduser()
    dest.parent.mkdir(parents=True, exist_ok=True)
    try:
        with urllib.request.urlopen(video_url, timeout=60) as response:
            data = response.read()
    except (urllib.error.URLError, TimeoutError) as e:
        raise FALError("download_failure", f"Could not download {video_url}: {e}", e) from e
    dest.write_bytes(data)
    return str(dest)


def download_image(image_url: str, dest_path: str) -> str:
    """Download a Flux/keyframe image to a local path. Same pattern as download_video."""
    return download_video(image_url, dest_path)


# ============================================================
#  COST CALCULATION
# ============================================================

def estimate_cost(
    *,
    n_text_to_video_calls: int = 0,
    n_image_to_video_calls: int = 0,
    n_flux_calls: int = 0,
    duration_per_video: int = 10,
    final_tier: bool = False,
) -> float:
    """Estimate total FAL cost in USD for a multi-clip run."""
    t2v_key = "std_t2v" if final_tier else "fast_t2v"
    i2v_key = "std_i2v" if final_tier else "fast_i2v"

    cost = 0.0
    cost += n_text_to_video_calls * PRICING_PER_SECOND[t2v_key] * duration_per_video
    cost += n_image_to_video_calls * PRICING_PER_SECOND[i2v_key] * duration_per_video
    cost += n_flux_calls * PRICING_FLAT["flux_t2i"]
    return round(cost, 4)


# ============================================================
#  LEGACY: blocking subscribe (kept for callers that want it)
#  Prefer submit+poll for any bash-driven invocation.
# ============================================================

@dataclass
class GenerationResult:
    video_url: str
    seed: int | None
    endpoint_used: str
    duration_seconds: int
    cost_usd: float
    request_id: str | None
    retry_count: int
    elapsed_ms: int


def generate_seedance_video(
    prompt: str,
    duration: int | str = 10,
    resolution: str = "720p",
    aspect_ratio: str = "9:16",
    final: bool = False,
    music_driven: bool = False,
    audio_url: str | None = None,
    seed: int | None = None,
) -> GenerationResult:
    """
    LEGACY blocking generation. Risk: bash timeout at 45s. Prefer submit+poll.
    """
    _ensure_fal_key()
    submit_result = submit_seedance_video(
        prompt=prompt,
        duration=duration,
        resolution=resolution,
        aspect_ratio=aspect_ratio,
        final=final,
        music_driven=music_driven,
        audio_url=audio_url,
        seed=seed,
    )
    start = time.monotonic()
    # Block on subscribe is what made v1 hit timeouts. Use poll loop with no deadline.
    while True:
        try:
            status = fal_client.status(submit_result.endpoint, submit_result.request_id, with_logs=False)
            if type(status).__name__ == "Completed":
                result = fal_client.result(submit_result.endpoint, submit_result.request_id)
                break
        except Exception as e:
            raise _categorize_exception(e) from e
        time.sleep(3)

    elapsed = int((time.monotonic() - start) * 1000)
    key = "std_t2v" if final else ("ref_video" if music_driven else "fast_t2v")
    cost = PRICING_PER_SECOND[key] * int(duration)
    if music_driven and audio_url:
        cost *= 0.6

    return GenerationResult(
        video_url=result["video"]["url"],
        seed=result.get("seed"),
        endpoint_used=submit_result.endpoint,
        duration_seconds=int(duration),
        cost_usd=round(cost, 4),
        request_id=submit_result.request_id,
        retry_count=0,
        elapsed_ms=elapsed,
    )


# ============================================================
#  CLI mode (ad-hoc testing)
# ============================================================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Test FAL Seedance 2.0 + Flux")
    sub = parser.add_subparsers(dest="cmd", required=True)

    # submit
    p_submit = sub.add_parser("submit", help="Submit text-to-video, print request_id")
    p_submit.add_argument("--prompt", required=True)
    p_submit.add_argument("--duration", type=int, default=10)
    p_submit.add_argument("--final", action="store_true")

    # poll
    p_poll = sub.add_parser("poll", help="Poll for completion, returns result or None")
    p_poll.add_argument("--state-file", required=True)
    p_poll.add_argument("--deadline", type=int, default=35)

    # i2v
    p_i2v = sub.add_parser("i2v", help="Submit image-to-video")
    p_i2v.add_argument("--image-url", required=True)
    p_i2v.add_argument("--prompt", required=True)
    p_i2v.add_argument("--duration", type=int, default=10)
    p_i2v.add_argument("--final", action="store_true")

    # flux
    p_flux = sub.add_parser("flux", help="Generate keyframe via Flux text-to-image")
    p_flux.add_argument("--prompt", required=True)
    p_flux.add_argument("--download-to", help="Local path to save image")

    # upload
    p_up = sub.add_parser("upload", help="Upload a local file to FAL storage")
    p_up.add_argument("--path", required=True)

    args = parser.parse_args()

    if args.cmd == "submit":
        r = submit_seedance_video(prompt=args.prompt, duration=args.duration, final=args.final)
        Path(f"/tmp/fal_state_{r.request_id}.json").write_text(json.dumps(asdict(r)))
        print(json.dumps(asdict(r), indent=2))

    elif args.cmd == "poll":
        result = resume_poll(args.state_file, deadline_seconds=args.deadline)
        if result is None:
            print(json.dumps({"status": "incomplete_deadline_hit", "state_file": args.state_file}))
            raise SystemExit(2)
        print(json.dumps(result, indent=2))

    elif args.cmd == "i2v":
        r = submit_seedance_image_to_video(
            image_url=args.image_url, prompt=args.prompt,
            duration=args.duration, final=args.final,
        )
        Path(f"/tmp/fal_state_{r.request_id}.json").write_text(json.dumps(asdict(r)))
        print(json.dumps(asdict(r), indent=2))

    elif args.cmd == "flux":
        r = flux_text_to_image(prompt=args.prompt)
        print(json.dumps(r, indent=2))
        if args.download_to:
            local = download_image(r["image_url"], args.download_to)
            print(f"\n[downloaded] {local}")

    elif args.cmd == "upload":
        url = upload_file_to_fal(args.path)
        print(json.dumps({"url": url}))
