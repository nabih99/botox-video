# Botox Sale Video · Smooth Dysport Challenge

A six-second pause challenge built with Remotion, React, and TypeScript. The product moves continuously from the first frame, passes through the target without a hold, and wraps only while fully offscreen. The loop seam advances by one normal motion step. The dark petrol background, transparent 3D-style Dysport render based on the supplied reference, Hebrew copy, and original soundtrack remain. There is no clinic logo, clinic name, intro, or ending scene.

## Deliverables

| File | Contents |
| --- | --- |
| `deliverables/botox-sale-smooth-dysport.mp4` | Main Dysport challenge with continuous motion |
| `deliverables/botox-sale-smooth-syringe.mp4` | Smooth syringe alternate |
| `deliverables/botox-sale-smooth-slower.mp4` | Slower syringe alternate with continuous motion |
| `deliverables/botox-sale-smooth-cover.png` | Instagram cover with no offer reveal |
| `deliverables/botox-sale-smooth-project.zip` | Editable project, assets, instructions, and finished videos |
| `deliverables/quality-control-smooth.json` | Results produced by the validation command |
| `deliverables/qc-stills/smooth-*.png` | Frames for visual review |

Each video is 6 seconds: 1080 × 1920, 9:16, 30 fps, 180 frames, H.264/yuv420p MP4 with stereo AAC at 48 kHz. All assets are local. The challenge is active throughout the video, and the moving product is visible at both ends of the loop.

## Install and preview

Use Node.js 22 or newer and npm. The prepared cloud environment includes Chromium at `/usr/bin/chromium`, Python 3, FFmpeg, and FFprobe. Set `CHROME_PATH` if Chromium is elsewhere. Use the existing checkout: cloud tasks are already isolated, so do not create another Git worktree for ordinary work.

```bash
cd /workspace/botox-video
npm ci
npm run typecheck
npm run sale:preview
```

Choose `BotoxSale` for the configured main version (Dysport by default), `BotoxSaleVial` for Dysport, `BotoxSaleSyringe` for the syringe, or `BotoxSaleSlow` for the slower syringe. `BotoxSaleCover` is the still-image composition. Stop active render jobs before reinstalling dependencies.

## Edit the video

Edit **`src/pause-sale/config.ts`**.

| Setting | Effect |
| --- | --- |
| `price` / `currency` | Default `900` / `₪`; assembled with the offer prefix and suffix |
| `mainVariant` | `'vial'`, `'syringe'`, or `'slow'` for `BotoxSale` |
| `text` | Hebrew headline, support, object instructions, offer prefix/suffix, and screenshot instruction |
| `colors` | Dark petrol background, warm-white text, and champagne accents; historical keys `ivory` and `black` hold background and text colors respectively |
| `timeline.winningStarts` | Zero-based first offer frames, default `[8, 68, 128]` |
| `timeline.winningFrames` | Default `6` frames per offer flash, 0.2 seconds at 30 fps |
| `timeline.difficulty` | Adjusts the offer flash length |
| `motion.speed` | Scales the travel distance and constant speed while preserving the pass timing; the distance has a 720 px minimum so wraps stay offscreen |
| `motion.slowSpeedMultiplier` | Relative speed for the slower syringe version, subject to the same offscreen-distance minimum |

Keep offer windows ordered, separated, and within frames 0–179. Render and validate again after edits. `text.brand` and `text.retry` remain blank; clinic-brand and ending-card elements are absent from the scene.

Default offer: **בוטוקס ב־900₪ בלבד**

Screenshot instruction: **צלמו מסך ושלחו לנו בפרטי**

| Pass | Offer flash, inclusive frames | Flash interval | Exact alignment |
| --- | --- | --- | --- |
| 1 | 8–13 | 0.267 s to before 0.467 s | Frame 10, 0.333 s |
| 2 | 68–73 | 2.267 s to before 2.467 s | Frame 70, 2.333 s |
| 3 | 128–133 | 4.267 s to before 4.467 s | Frame 130, 4.333 s |

The offer and screenshot instruction appear only in these short windows. The moving product crosses the exact target position, scale, and angle once per pass, then continues moving. The six-frame offer flash does not freeze the product. Default movement is 28.333 px per frame for the main version and 24 px per frame for the slower syringe; the loop seam advances by the same amount. An MP4 cannot detect a viewer pressing pause; the message is encoded into those frames. The cover keeps the offer hidden.

## Render again

Render all three current MP4s, the cover, and QC stills:

```bash
cd /workspace/botox-video
npm run sale:render
npm run sale:validate
```

The renderer uses three workers, CRF 16, PNG source frames, and 192 kbps audio. The final video, audio, and MP4 container are trimmed to exactly 6.000 seconds so AAC padding does not extend the loop. It writes the smooth-version files and preserves previous exports. For only the main Dysport Reel:

```bash
npx remotion render src/pause-sale/index.tsx BotoxSale deliverables/botox-sale-smooth-dysport.mp4
```

For another version, choose `BotoxSaleSyringe`, `BotoxSaleSlow`, or `BotoxSaleVial` and its matching output filename. The root checkout also provides `npm run sale:cover`. The separate project ZIP provides the shorter `npm run preview`, `npm run render`, `npm run cover`, and `npm run validate` commands.

## Quality control

`node scripts/check-pause-sale.cjs` checks scene frames for shared product/outline geometry, exact alignment at the crossing frames, correct RTL copy, continuous movement, a normal motion step at the loop seam, no clinic branding, and offer visibility only in its flash windows. It probes and fully decodes the finished MP4s, verifies format and exact six-second stream/container durations, and checks decoded frames for offer visibility and motion. Results are written to `deliverables/quality-control-smooth.json`; failure returns a nonzero exit status. `--model-only` runs the scene checks without requiring finished MP4s.

Inspect rendered stills and finished videos as well. Automated text-region checks do not perform OCR or replace visual review of Hebrew shaping and composition.

## Assets and audio

- `src/pause-sale/PauseSale.tsx`: continuous challenge layout, cover, and audio.
- `src/pause-sale/DysportProduct.tsx`: reference-based Dysport render and shared silhouette.
- `public/products/dysport-3d.png`: transparent 3D-style Dysport product asset.
- `src/pause-sale/Products.tsx`: syringe artwork and geometry.
- `src/pause-sale/timeline.ts`: constant motion, loop timing, alignment frames, and offer gates.
- `public/audio/pause-challenge-smooth.wav`: original six-second ambient pulse loop with swishes at the three crossing times.

Optional audio regeneration uses Python's standard library only:

```bash
python3 scripts/generate-smooth-audio.py
```

The soundtrack contains original synthesized pulses and airy swishes.
