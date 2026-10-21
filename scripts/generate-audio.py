#!/usr/bin/env python3
"""Generate the Reel's original, quiet UI sounds. Python 3 standard library only.

These are synthesized sounds, not samples of Apple's proprietary notifications.
Run from any directory: python3 scripts/generate-audio.py
"""

from __future__ import annotations

import math
import random
import struct
import wave
from pathlib import Path


SAMPLE_RATE = 48_000
OUTPUT = Path(__file__).resolve().parents[1] / "public" / "audio"
TAU = 2 * math.pi


def smoothstep(value: float) -> float:
    value = max(0.0, min(1.0, value))
    return value * value * (3 - 2 * value)


def envelope(t: float, duration: float, attack: float = 0.008, release: float = 0.04) -> float:
    return smoothstep(t / attack) * smoothstep((duration - t) / release)


def write_sound(name: str, samples: list[float], peak: float, width: float = 0.025) -> None:
    """Peak-limit, dither and write a near-mono stereo PCM master."""
    maximum = max(abs(sample) for sample in samples) or 1.0
    scale = peak / maximum
    rng = random.Random(418)
    frames = bytearray()
    # Tiny inter-channel delay keeps effects centered while avoiding sterile mono.
    delay = round(SAMPLE_RATE * 0.00018)
    for i, sample in enumerate(samples):
        left = scale * sample
        delayed = samples[max(0, i - delay)]
        right = scale * ((1 - width) * sample + width * delayed)
        for value in (left, right):
            dither = (rng.random() - rng.random()) / 65536
            pcm = round(max(-1.0, min(1.0, value + dither)) * 32767)
            frames.extend(struct.pack("<h", pcm))
    with wave.open(str(OUTPUT / name), "wb") as sound:
        sound.setnchannels(2)
        sound.setsampwidth(2)
        sound.setframerate(SAMPLE_RATE)
        sound.writeframes(frames)
    rms = math.sqrt(sum((sample * scale) ** 2 for sample in samples) / len(samples))
    print(f"{name}: {len(samples) / SAMPLE_RATE:.3f}s, peak {20 * math.log10(peak):.1f} dBFS, RMS {20 * math.log10(rms):.1f} dBFS")


def incoming() -> list[float]:
    duration = 0.58
    result = []
    for i in range(round(duration * SAMPLE_RATE)):
        t = i / SAMPLE_RATE
        value = 0.0
        for start, frequency, strength in ((0.012, 1174.66, 0.8), (0.115, 1567.98, 1.0)):
            u = t - start
            if u >= 0:
                # Soft glassy two-note message chime, with no sharp click.
                decay = math.exp(-u * 12.5)
                tone = math.sin(TAU * frequency * u)
                tone += 0.19 * math.sin(TAU * frequency * 2.002 * u) * math.exp(-u * 10)
                tone += 0.035 * math.sin(TAU * frequency * 3.98 * u) * math.exp(-u * 20)
                value += strength * smoothstep(u / 0.006) * decay * tone
        result.append(value * envelope(t, duration, 0.005, 0.09))
    return result


def outgoing() -> list[float]:
    duration = 0.42
    rng = random.Random(9901)
    lowpass = 0.0
    slow = 0.0
    phase = 0.0
    result = []
    for i in range(round(duration * SAMPLE_RATE)):
        t = i / SAMPLE_RATE
        p = t / duration
        lowpass += 0.12 * (rng.uniform(-1, 1) - lowpass)
        slow += 0.012 * (lowpass - slow)
        air = lowpass - slow
        phase += TAU * (360 + 900 * p * p) / SAMPLE_RATE
        swell = math.sin(math.pi * p) ** 1.7
        chirp = 0.075 * math.sin(phase) * (1 - p)
        result.append((air * 0.75 + chirp) * swell * envelope(t, duration))
    return result


def handwriting() -> list[float]:
    duration = 3.1
    rng = random.Random(201)
    previous = 0.0
    lowpass = 0.0
    result = []
    for i in range(round(duration * SAMPLE_RATE)):
        t = i / SAMPLE_RATE
        lowpass += 0.3 * (rng.uniform(-1, 1) - lowpass)
        friction = lowpass - previous
        previous += 0.018 * (lowpass - previous)
        # Imperfect little gestures and lifts, matching the B-o-t-o-x rhythm.
        gesture = (0.38 + 0.62 * abs(math.sin(TAU * 1.65 * t + 0.3)))
        gesture *= 0.63 + 0.37 * math.sin(TAU * 7.1 * t) ** 2
        lifts = 1.0
        for lift in (0.67, 1.2, 1.94, 2.48):
            lifts *= 1 - 0.93 * math.exp(-((t - lift) / 0.048) ** 2)
        result.append(friction * gesture * lifts * envelope(t, duration, 0.05, 0.1))
    return result


def punchline() -> list[float]:
    duration = 0.38
    phase = 0.0
    result = []
    for i in range(round(duration * SAMPLE_RATE)):
        t = i / SAMPLE_RATE
        frequency = 145 + 53 * math.exp(-t * 27)
        phase += TAU * frequency / SAMPLE_RATE
        body = math.sin(phase) + 0.16 * math.sin(2 * phase)
        value = body * math.exp(-t * 13) * envelope(t, duration, 0.003, 0.06)
        result.append(value)
    return result


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    write_sound("incoming.wav", incoming(), peak=0.22)
    write_sound("outgoing.wav", outgoing(), peak=0.19)
    write_sound("handwriting.wav", handwriting(), peak=0.08, width=0.1)
    write_sound("punchline.wav", punchline(), peak=0.16)


if __name__ == "__main__":
    main()
