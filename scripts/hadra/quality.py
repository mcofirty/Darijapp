"""Contrôles techniques : aucune certification linguistique n'est produite."""

import json
import math
import subprocess
from pathlib import Path

import numpy as np

QUALITY_VERSION = 1
SAMPLE_RATE = 24000


def waveform_metrics(samples, sample_rate: int, kind: str) -> dict:
    samples = np.asarray(samples)
    failures, warnings = [], []
    if samples.ndim != 1 or samples.size == 0:
        return {"passed": False, "failures": ["empty_or_non_mono"], "warnings": []}
    if not np.isfinite(samples).all():
        return {"passed": False, "failures": ["non_finite_samples"], "warnings": []}
    if sample_rate != SAMPLE_RATE:
        failures.append("unexpected_sample_rate")
    duration = samples.size / sample_rate
    peak = float(np.max(np.abs(samples)))
    rms = float(np.sqrt(np.mean(samples.astype(np.float64) ** 2)))
    clipped = float(np.mean(np.abs(samples) >= 0.999))
    if rms < 1e-5 or peak < 1e-4:
        failures.append("silent_signal")
    if clipped > 0.001 or peak > 1:
        failures.append("clipping")
    low, high = (0.15, 4) if kind in ["word", "syllable", "phoneme_in_context"] else (0.3, 20)
    if duration < 0.08 or duration > 30:
        failures.append("invalid_duration")
    elif not low <= duration <= high:
        warnings.append("duration_outside_expected_range")
    frame = max(1, int(sample_rate * 0.01))
    frames = samples[: samples.size // frame * frame].reshape(-1, frame)
    energy = np.sqrt(np.mean(frames.astype(np.float64) ** 2, axis=1))
    active = np.flatnonzero(energy > max(1e-4, rms * 0.05))
    leading = float(active[0] * 0.01) if active.size else duration
    trailing = float((len(energy) - 1 - active[-1]) * 0.01) if active.size else duration
    if leading > 0.3 or trailing > 0.3:
        warnings.append("long_edge_silence")
    longest, streak = 0, 0
    if active.size:
        for quiet in energy[active[0]: active[-1] + 1] <= max(1e-4, rms * 0.05):
            streak = streak + 1 if quiet else 0
            longest = max(longest, streak)
    if longest * 0.01 > 0.5 and kind != "phrase":
        warnings.append("long_internal_silence")
    return {"passed": not failures, "failures": failures, "warnings": warnings,
            "duration_seconds": duration, "sample_rate": sample_rate, "peak": peak,
            "rms_dbfs": 20 * math.log10(max(rms, 1e-12)), "clipped_fraction": clipped,
            "leading_silence_seconds": leading, "trailing_silence_seconds": trailing,
            "max_internal_silence_seconds": longest * 0.01, "quality_version": QUALITY_VERSION}


def verify_encoded(path: Path, kind: str) -> dict:
    result = subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-of", "json", str(path)],
                            check=True, capture_output=True)
    streams = json.loads(result.stdout)["streams"]
    if len(streams) != 1 or streams[0].get("codec_name") != "mp3" or streams[0].get("channels") != 1:
        raise ValueError("Le fichier exporté doit être un MP3 mono sans autre flux")
    rate = int(streams[0]["sample_rate"])
    raw = subprocess.run(["ffmpeg", "-v", "error", "-xerror", "-i", str(path), "-f", "f32le", "-"],
                         check=True, capture_output=True).stdout
    return waveform_metrics(np.frombuffer(raw, dtype="<f4"), rate, kind)
