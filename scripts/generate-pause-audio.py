#!/usr/bin/env python3
"""Render the original, seamless 12-second NN Aesthetics challenge sound bed.

Python standard library only. No samples, external music, or downloads.
Run from any directory: python3 scripts/generate-pause-audio.py
"""

from array import array
import math
from pathlib import Path
import random
import wave

RATE = 48_000
DURATION = 12
COUNT = RATE * DURATION
TAU = math.tau
OUTPUT = Path(__file__).resolve().parents[1] / 'public/audio/pause-challenge.wav'


def nearest_loop_frequency(frequency):
    return round(frequency * DURATION) / DURATION


def main():
    # Every sustained oscillator completes an integer number of cycles in 12 s.
    # Modulation is periodic too: the render can replay without a seam or click.
    left = array('d', [0.0]) * COUNT
    right = array('d', [0.0]) * COUNT
    notes = [(130.81, .070), (196.00, .046), (246.94, .027),
             (293.66, .034), (329.63, .024), (523.25, .008)]
    for voice, (frequency, amplitude) in enumerate(notes):
        frequency = nearest_loop_frequency(frequency)
        phase = voice * .83
        for i in range(COUNT):
            t = i / RATE
            breath = .82 + .18 * math.sin(TAU * t / DURATION + phase)
            tone = math.sin(TAU * frequency * t + phase)
            overtone = .10 * math.sin(TAU * frequency * 2 * t + phase)
            left[i] += amplitude * breath * (tone + overtone)
            right[i] += amplitude * breath * (
                math.sin(TAU * frequency * t + phase + .12)
                + .10 * math.sin(TAU * frequency * 2 * t + phase + .09))

    # Fine filtered air, like a studio product swish. The short gestures are
    # placed on travel, rather than acting as an obvious winning-frame signal.
    rng = random.Random(900)
    for center, width, pan in [(2.84, .34, -.5), (4.99, .38, .5),
                               (7.16, .35, -.4)]:
        low = 0.0
        smooth = 0.0
        start = max(0, int((center - width * 3) * RATE))
        stop = min(COUNT, int((center + width * 3) * RATE))
        for i in range(start, stop):
            t = i / RATE
            raw = rng.uniform(-1, 1)
            low += .10 * (raw - low)
            high = raw - low
            smooth += .32 * (high - smooth)
            envelope = math.exp(-.5 * ((t - center) / (width * .45)) ** 2)
            sound = smooth * envelope * .095
            left[i] += sound * (1 - pan * .38)
            right[i] += sound * (1 + pan * .38)

    # Restrained felt-like rhythmic touches; no arcade or notification sounds.
    for beat in [.45, 1.95, 3.45, 4.95, 6.45, 7.95, 9.45, 10.95]:
        for j in range(int(.42 * RATE)):
            i = int(beat * RATE) + j
            if i >= COUNT:
                break
            t = j / RATE
            attack = min(1, t / .012)
            sound = .044 * attack * math.exp(-t * 14) * (
                math.sin(TAU * 174.6 * t) + .22 * math.sin(TAU * 349.2 * t))
            left[i] += sound
            right[i] += sound * .94

    # A light editorial shimmer at the end of the intro and on the brand outro.
    for cue in [1.75, 9.12]:
        for j in range(int(1.25 * RATE)):
            i = int(cue * RATE) + j
            if i >= COUNT:
                break
            t = j / RATE
            envelope = min(1, t / .025) * math.exp(-t * 4.5)
            sound = .012 * envelope * (math.sin(TAU * 1046.5 * t)
                                      + .4 * math.sin(TAU * 1568 * t))
            left[i] += sound
            right[i] += sound * .83

    # Remove DC globally, then retain ample headroom for Instagram encoding.
    mean_l, mean_r = sum(left) / COUNT, sum(right) / COUNT
    peak = max(max(abs(s - mean_l) for s in left),
               max(abs(s - mean_r) for s in right))
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
    print(f'Created {OUTPUT}: {DURATION}s, stereo {RATE}Hz, peak -8 dBFS')


if __name__ == '__main__':
    main()
