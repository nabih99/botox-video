#!/usr/bin/env python3
"""Original six-second, 120 BPM product-ad loop; Python standard library only."""

from array import array
import math
from pathlib import Path
import random
import wave

RATE = 48_000
DURATION = 6
COUNT = RATE * DURATION
OUTPUT = Path(__file__).resolve().parents[1] / 'public/audio/pause-challenge-fast.wav'
TAU = math.tau


def add_gesture(left, right, start, length, render, pan=0.0):
    """Wrap tails across the seam so the finished loop has no truncated events."""
    for j in range(round(length * RATE)):
        t = j / RATE
        edge = min(1.0, (length - t) / .025)
        sound = render(t) * max(0.0, edge)
        i = (round(start * RATE) + j) % COUNT
        left[i] += sound * (1 - pan * .35)
        right[i] += sound * (1 + pan * .35)


def main():
    left = array('d', [0.0]) * COUNT
    right = array('d', [0.0]) * COUNT

    # Restrained, warm extended harmony under a cool, dark product visual.
    # Sustained frequencies and stereo modulation complete integer cycles.
    for voice, (frequency, amplitude) in enumerate([
        (98, .032), (146.83, .027), (220, .021),
        (261.63, .020), (329.63, .012), (440, .006),
    ]):
        frequency = round(frequency * DURATION) / DURATION
        phase = voice * .74
        for i in range(COUNT):
            t = i / RATE
            breath = .83 + .17 * math.sin(TAU * t / DURATION + phase)
            left[i] += amplitude * breath * (
                math.sin(TAU * frequency * t + phase)
                + .06 * math.sin(TAU * frequency * 2 * t + phase))
            right[i] += amplitude * breath * (
                math.sin(TAU * frequency * t + phase + .11)
                + .06 * math.sin(TAU * frequency * 2 * t + phase + .08))

    # Twelve soft felt pulses: 120 BPM. They start at frame zero without a lead-in.
    for beat in range(12):
        weight = .036 if beat % 2 == 0 else .021
        def pulse(t, weight=weight):
            attack = min(1, t / .006)
            envelope = attack * math.exp(-t * 21)
            return weight * envelope * (
                math.sin(TAU * 98 * t) + .18 * math.sin(TAU * 196 * t))
        add_gesture(left, right, beat * .5, .29, pulse)

    # Light filtered-air passes, offset slightly ahead of the catches. No chime
    # or notification cue reveals the winning windows to the viewer.
    rng = random.Random(600900)
    for center, pan in [(.80, -.65), (2.80, .65), (4.80, -.5)]:
        low = smooth = 0.0
        length = .34
        for j in range(round(length * RATE)):
            t = j / RATE
            raw = rng.uniform(-1, 1)
            low += .07 * (raw - low)
            smooth += .22 * ((raw - low) - smooth)
            envelope = math.sin(math.pi * t / length) ** 3
            sound = .070 * smooth * envelope
            i = (round((center - length / 2) * RATE) + j) % COUNT
            left[i] += sound * (1 - pan * .35)
            right[i] += sound * (1 + pan * .35)

    # A quiet, periodic high sheen adds movement without sounding like a game.
    for i in range(COUNT):
        t = i / RATE
        shimmer = .0018 * (.5 + .5 * math.cos(TAU * 2 * t))
        left[i] += shimmer * math.sin(TAU * 1320 * t)
        right[i] += shimmer * math.sin(TAU * 1320 * t + .18)

    mean_l, mean_r = sum(left) / COUNT, sum(right) / COUNT
    peak = max(max(abs(x - mean_l) for x in left), max(abs(x - mean_r) for x in right))
    gain = 10 ** (-8 / 20) / peak
    pcm = array('h')
    for l, r in zip(left, right):
        pcm.append(round((l - mean_l) * gain * 32767))
        pcm.append(round((r - mean_r) * gain * 32767))
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(OUTPUT), 'wb') as handle:
        handle.setnchannels(2)
        handle.setsampwidth(2)
        handle.setframerate(RATE)
        handle.writeframes(pcm.tobytes())
    rms = math.sqrt(sum(x*x for x in pcm) / len(pcm)) / 32767
    jumps = [abs(pcm[c] - pcm[-2+c]) / 32767 for c in range(2)]
    print(f'Created {OUTPUT}: 6s, stereo 48000Hz, 120 BPM; peak -8.0dBFS, RMS {20*math.log10(rms):.2f}dBFS; loop-boundary steps {jumps}')


if __name__ == '__main__':
    main()
