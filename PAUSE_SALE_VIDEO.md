# Botox Sale Video · Fast Dysport Challenge

A six-second, immediate-start pause challenge built with Remotion, React, and TypeScript. The current version has a dark petrol background, no clinic logo or clinic name, and no intro or ending scene. The Dysport artwork is a transparent 3D-style product render based on the supplied reference, with perspective, lighting, and depth treatment in the animation.

## Deliverables

| File | Contents |
| --- | --- |
| `deliverables/botox-sale-fast-dysport.mp4` | Main fast Dysport challenge |
| `deliverables/botox-sale-fast-syringe.mp4` | Fast syringe alternate |
| `deliverables/botox-sale-fast-slower.mp4` | Syringe version with gentler movement near the catch |
| `deliverables/botox-sale-fast-cover.png` | Instagram cover with no offer reveal |
| `deliverables/quality-control-fast.json` | Results produced by the validation command |
| `deliverables/qc-stills/fast-*.png` | First/last frames and catches for visual review |

Each video is 6 seconds: 1080 × 1920, 9:16, 30 fps, 180 frames, H.264/yuv420p MP4 with stereo AAC at 48 kHz. All rendering assets are local. The challenge is active on every frame; the object is already visible and moving when the video starts. The motion repeats through offscreen wraps rather than an ending card.

## Install and preview

Use Node.js 22 or newer and npm. The prepared cloud environment includes Chromium at `/usr/bin/chromium`, Python 3, FFmpeg, and FFprobe. Set `CHROME_PATH` if Chromium is installed elsewhere. Use the existing checkout: cloud tasks are already isolated, so do not create another Git worktree for ordinary work.

```bash
cd /workspace/botox-video
npm ci
npm run typecheck
npx remotion studio src/pause-sale/index.tsx --port=3000
```

Choose `BotoxSale` for the configured main version (Dysport by default), `BotoxSaleVial` for Dysport, `BotoxSaleSyringe` for the fast syringe, or `BotoxSaleSlow` for the gentler syringe. `BotoxSaleCover` is the still-image composition. Stop active render jobs before reinstalling dependencies.

## Edit the video

Edit **`src/pause-sale/config.ts`**.

| Setting | Effect |
| --- | --- |
| `price` / `currency` | Default `900` / `₪`; assembled with the offer prefix and suffix |
| `mainVariant` | `'vial'`, `'syringe'`, or `'slow'` for `BotoxSale` |
| `text` | Hebrew headline, support, object instructions, offer prefix/suffix, and screenshot instruction |
| `colors` | Dark petrol background, warm-white text, and champagne accents; historical keys `ivory` and `black` now hold background and text colors respectively |
| `timeline.winningStarts` | Zero-based first winning frames, default `[26, 86, 146]` |
| `timeline.winningFrames` | Default `6` consecutive frames, 0.2 seconds at 30 fps |
| `timeline.difficulty` | Default `1`; `1.5` gives four-frame catches, lower values make them easier |
| `motion.speed` | Movement speed around the catches |
| `motion.slowSpeedMultiplier` | Gentler version's relative speed, default `0.82` |

Keep windows ordered, separated, and inside frames 0–179. Re-run rendering and validation after edits. `text.brand` and `text.retry` are blank and no clinic-brand or outro elements are rendered.

Default offer: **בוטוקס ב־900₪ בלבד**

Screenshot instruction: **צלמו מסך ושלחו לנו בפרטי**

| Winning moment | Inclusive frames | Time interval |
| --- | --- | --- |
| 1 | 26–31 | 0.867 s to before 1.067 s |
| 2 | 86–91 | 2.867 s to before 3.067 s |
| 3 | 146–151 | 4.867 s to before 5.067 s |

Every winning frame has exactly matching object/target position, scale, and angle. The offer and screenshot instruction are conditionally rendered only in these windows. An MP4 cannot detect a viewer pressing pause; the message is encoded into those frames so pausing there captures it. The cover does not reveal the offer.

## Render again

Render all three current MP4s, the cover, and QC stills:

```bash
cd /workspace/botox-video
node scripts/render-pause-sale.mjs
node scripts/check-pause-sale.cjs
```

The renderer uses three workers, CRF 16, PNG source frames, and 192 kbps audio. It overwrites the current fast files, preserving earlier 12-second exports. For only the main Dysport Reel:

```bash
npx remotion render src/pause-sale/index.tsx BotoxSale deliverables/botox-sale-fast-dysport.mp4
```

For another version, use `BotoxSaleSyringe`, `BotoxSaleSlow`, or `BotoxSaleVial` with the matching output filename. The root checkout also provides `npm run sale:preview`, `npm run sale:render`, `npm run sale:cover`, and `npm run sale:validate`. The separate project ZIP provides the shorter `npm run preview`, `npm run render`, `npm run cover`, and `npm run validate` commands.

## Quality control

`node scripts/check-pause-sale.cjs` checks every scene frame for exact alignment, shared product/outline silhouette, correct RTL copy, an active immediate challenge, absence of clinic branding, and offer visibility only in the intended windows. It probes and fully decodes each MP4, verifies format and duration, and inspects the offer region on every decoded frame. Results are written to `deliverables/quality-control-fast.json`; failure returns a nonzero exit status. `--model-only` runs scene checks without requiring finished MP4s.

Inspect rendered stills and finished videos too: text-region checks are not OCR and do not replace visual review of Hebrew shaping and composition.

## Assets and audio

- `src/pause-sale/PauseSale.tsx`: immediate challenge layout, perspective motion, cover, and audio.
- `src/pause-sale/DysportProduct.tsx`: reference-based Dysport render and shared silhouette.
- `public/products/dysport-3d.png`: transparent 3D-style Dysport product asset.
- `src/pause-sale/Products.tsx`: syringe artwork and geometry.
- `src/pause-sale/timeline.ts`: deterministic fast motion and winning gates.
- `public/audio/pause-challenge-fast.wav`: original six-second, 120 BPM ambient pulse loop.

Optional audio regeneration uses Python's standard library only:

```bash
python3 scripts/generate-fast-audio.py
```

The soundtrack has restrained pulses and airy swishes, with no sampled or externally licensed music dependency.
