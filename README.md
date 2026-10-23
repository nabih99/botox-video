# NN Aesthetics — Botox Sale Video

New: an original luxury **pause challenge** with three finished 12-second, 1080 × 1920 Reels, exact six-frame winning moments, Hebrew RTL typography, and original audio.

**[Download the main syringe MP4](https://github.com/nabih99/botox-video/raw/refs/heads/main/deliverables/nn-aesthetics-syringe.mp4)** · **[Slower MP4](https://github.com/nabih99/botox-video/raw/refs/heads/main/deliverables/nn-aesthetics-slow.mp4)** · **[Vial MP4](https://github.com/nabih99/botox-video/raw/refs/heads/main/deliverables/nn-aesthetics-vial.mp4)**

**[Instagram cover PNG](https://github.com/nabih99/botox-video/raw/refs/heads/main/deliverables/nn-aesthetics-cover.png)** · **[Complete editable project + videos ZIP](https://github.com/nabih99/botox-video/raw/refs/heads/main/deliverables/botox-sale-video-project.zip)** · **[Editing and rendering instructions](PAUSE_SALE_VIDEO.md)**

The new entry point is `src/pause-sale/index.tsx`. Run `npm run sale:preview`, `npm run sale:render`, or `npm run sale:validate`. Edit price, Hebrew copy, colors, winning frames, motion speed, difficulty, and primary product in `src/pause-sale/config.ts`.

## Original Botox texting reel

An 18-second, 1080 × 1920 Instagram Reel at 30 fps, rebuilt as separate editable React/SVG elements in Remotion. The final export is **`botox_texting_reel.mp4`** (H.264, yuv420p, stereo AAC). No screenshot, video clips, or remote assets are used in the render.

The luxury version uses an ivory background, soft-beige incoming bubbles, champagne-gold outgoing bubbles, elegant black text and warm-white drawing cards. An understated serif **NN Aesthetics** signature finishes the minimalist composition. Dialogue, drawings, animation timing and sound remain unchanged.

**[Download the finished MP4](https://github.com/nabih99/botox-video/raw/refs/heads/main/botox_texting_reel.mp4)** · **[Download the complete project ZIP](https://github.com/nabih99/botox-video/archive/refs/heads/main.zip)**

## Preview and export

Prerequisites: Node.js 22 or newer and npm. The cloud environment has Chromium, Python 3, FFmpeg and FFprobe installed. Python is only needed to regenerate sound effects; FFmpeg/FFprobe are only needed by the validation command. Remotion can obtain its supported headless browser on machines without Chromium. To use another installed browser, set `CHROME_PATH` to its executable.

```bash
cd /workspace/botox-video
npm ci
npm run typecheck
npm run preview
```

Open Remotion Studio using your development environment's supported port forwarding, select `BotoxTextingReel`, then play or scrub the timeline. Studio uses port 3000. The onboarding interface itself does not provide web previews.

Export the actual video from the same directory:

```bash
npm run render
```

The output is `botox_texting_reel.mp4` in the project root. The renderer uses three workers, CRF 16, 192 kbps audio, PNG source frames and an H.264/yuv420p encode suitable for Instagram. Its duration is exactly 540 frames / 18 seconds. To render a single final frame or validate the finished file:

```bash
npm run still
npm run validate
```

Validation checks dimensions, codec, frame rate, frame count, duration and audio, then decodes the entire file. It writes `out/validation.json`. The final still is `out/final-frame.png`, rendered at frame 510 (17 seconds).

## Creative controls

- **`src/config.ts`**: exact message text, the ivory/beige/champagne/black palette, font size, dimensions, appearance times, drawing times, pauses, scroll duration, audio volume and the optional small signature. Edit the palette here to adjust the luxury styling. All timing values are seconds, converted to frames consistently. Set `showSignature: false` to remove the signature.
- **`src/components/MessageBubble.tsx`**: reusable text bubbles, SVG tails, spring arrival transitions and staggered typing dots. `MessageArrival` also animates the image cards.
- **`src/components/Handwriting.tsx`**: manually authored cubic SVG pen paths. `progress` controls drawing; `variant="partial"` draws the incoming open heart-like curve from the replacement reference, while `variant="full" replaySeed` draws the original **Botox** lettering. The incoming curve is independent of the outgoing drawing. Stroke widths, geometry and relative letter timing are editable here. No text glyphs are used for the handwriting.
- **`src/BotoxTextingReel.tsx`**: conversation layout, smooth upward movement, receipt, sound sequencing and image cards. Text, colors and major timing controls are imported from the config.
- **`remotion.config.ts`**: codec, quality, browser and worker settings. `src/Root.tsx` registers the composition.

Inter 400 is bundled through `@fontsource/inter` for clean, readable conversation text. Cormorant Garamond 500, bundled through `@fontsource/cormorant-garamond`, gives the small signature its refined serif finish. The palette uses ivory `#F7F3EA`, beige `#E9E1D5`, champagne `#DCC9A6`, warm white `#FFFDFA` and near-black `#1B1916`. Subtle champagne card edges and a fine line above the signature complete the styling. The pleading-face emoji is a bundled Noto Color Emoji subset, so renders do not depend on host emoji fonts.

## Timeline

| Time | Action |
| --- | --- |
| 0.00–0.30 | Ivory opening |
| 0.30 | Incoming **Babe** |
| 0.83–1.52 | Incoming warm-white image, open heart-like curve drawn |
| 1.90 | **Complete it? 🥺** |
| 2.90–3.53 | Outgoing typing dots |
| 3.60 | Champagne-gold **Of course** |
| 4.20 | Blank outgoing image; conversation scrolls up |
| 4.43–7.33 | Original B draws and completes, then **o**, **t**, **o**, **x** |
| 7.60 | **Read 19:24**, then a quiet reveal hold |
| 8.33–9.17 | Incoming typing dots |
| 9.23 | Incoming **BOTOX? How much??** |
| 11.10 | Champagne-gold outgoing **For only 900!!!** |
| 13.00 | Incoming **OMG 900 ONLYY!!!** |
| 14.10 | Incoming **WHERE???** |
| 15.70 | Champagne-gold outgoing **At NN Aesthetics!** |
| 16.50–18.00 | Small **NN Aesthetics** signature; final conversation holds |

The conversation scrolls upward naturally as the added messages arrive, keeping the latest exchange readable. The original drawing sequence remains unchanged.

## Audio and assets

The four audio effects in `public/audio/` are original synthesized WAVs. Their source is `scripts/generate-audio.py` (Python standard library only). Regenerate deterministically with `npm run audio`. They are deliberately quiet and can be mixed through `REEL.sound` in `src/config.ts`.

The emoji font and its license are in `public/fonts/`. Audio and fonts are included project assets; no download is needed when rendering after dependency installation. Dependency versions are pinned and `package-lock.json` supports reproducible installation. `.npmrc` puts the npm cache in an ignored local directory so the cloud environment does not need write access to the home directory.

The setup and preview commands use the existing checkout. Cloud tasks are already isolated; do not create another worktree for ordinary work here.
