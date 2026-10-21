# Original sound effects

These quiet, original synthesized effects were created for this project. They do
not contain downloaded samples or recordings of Apple's proprietary sounds.

Regenerate from the repository root with:

```sh
python3 scripts/generate-audio.py
```

All files are stereo, 48 kHz, signed 16-bit PCM WAV:

| File | Duration | Purpose |
| --- | ---: | --- |
| `incoming.wav` | 0.58 s | Soft two-note glassy message chime |
| `outgoing.wav` | 0.42 s | Airy upward sending swoosh |
| `handwriting.wav` | 3.10 s | Optional quiet writing texture |
| `punchline.wav` | 0.38 s | Muted, low, playful pluck |

The masters already have conservative levels and short attack/release fades.
Suggested playback gains: incoming 0.65, outgoing 0.65, handwriting 0.4, punchline
0.7. Adjust in the Remotion composition to taste. No external audio dependency is
needed to regenerate them; the generator uses only the Python 3 standard library.
