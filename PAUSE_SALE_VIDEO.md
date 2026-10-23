# NN Aesthetics · Botox Sale Video

An original luxury pause challenge, built in Remotion with React and TypeScript. The project includes a syringe Reel, a gentler syringe version, a generic medical vial Reel, and an Instagram cover. The older texting Reel remains available separately.

## Finished files

| File | Contents |
| --- | --- |
| `deliverables/nn-aesthetics-syringe.mp4` | Main syringe challenge |
| `deliverables/nn-aesthetics-slow.mp4` | Slower movement near the target |
| `deliverables/nn-aesthetics-vial.mp4` | Alternate vial challenge |
| `deliverables/nn-aesthetics-cover.png` | Instagram cover; does not reveal the offer |
| `deliverables/quality-control.json` | Results from the validation command |
| `deliverables/qc-stills/` | Rendered frames for visual review |

Each video is 12 seconds: 1080 × 1920, 9:16, 30 fps, 360 frames, H.264/yuv420p MP4 with stereo AAC at 48 kHz. No watermark. All product illustrations, fonts, and audio are local; rendering uses no remote assets. No Dysport reference image was supplied, so the alternate uses original generic medical vial artwork rather than a claimed reproduction of a branded product.

## Install and preview

Use Node.js 22 or newer and npm. The prepared cloud environment includes Chromium at `/usr/bin/chromium`, Python 3, FFmpeg, and FFprobe. Set `CHROME_PATH` if your browser executable is elsewhere. Use the existing checkout; cloud tasks are already isolated, so there is no need for another Git worktree.

```bash
cd /workspace/botox-video
npm ci
npm run typecheck
npx remotion studio src/pause-sale/index.tsx --port=3000
```

Select `BotoxSale`, `BotoxSaleSlow`, or `BotoxSaleVial` in Studio. `BotoxSaleCover` is the still-image composition. Stop active rendering before reinstalling dependencies.

## Edit price, copy, colors, and difficulty

Edit **`src/pause-sale/config.ts`**. The settings apply to all three videos.

| Setting | Change |
| --- | --- |
| `price` / `currency` | Default `900` / `₪`; the offer is assembled from these and the text below |
| `mainVariant` | `'syringe'`, `'vial'`, or `'slow'` for the primary `BotoxSale` composition; alternate compositions remain available |
| `text` | Exact Hebrew headline, support, object instructions, offer prefix/suffix, screenshot request, brand, and retry message |
| `colors` | Ivory, warm beige, champagne gold, and black palette |
| `timeline.winningStarts` | Zero-based first winning frames; default `[98, 163, 228]` |
| `timeline.winningFrames` | Default `6` consecutive frames, or 0.2 seconds at 30 fps |
| `timeline.difficulty` | Default `1`; `1.5` gives four-frame windows, while lower values make the catch easier |
| `motion.speed` | Main movement speed |
| `motion.slowSpeedMultiplier` | Relative speed for the gentler version; default `0.76` |

Keep winning windows ordered, separated, and within the challenge section (frames 60–269), leaving room for travel between them. Adjusting difficulty can change the effective winning-window length. Re-run validation after edits. Choose syringe versus vial through the composition name; there is no need to replace the artwork manually. The slower composition retains the same winning timestamps and offer-window length while easing movement near the target.

Default offer: **בוטוקס ב־900₪ בלבד**

Default screenshot instruction: **צלמו מסך ושלחו לנו בפרטי**

| Winning moment | Inclusive frames | Time interval |
| --- | --- | --- |
| 1 | 98–103 | 3.267 s to before 3.467 s |
| 2 | 163–168 | 5.433 s to before 5.633 s |
| 3 | 228–233 | 7.600 s to before 7.800 s |

The object and target share silhouette geometry. During every winning frame, the moving object has exactly the target's position, scale, and angle. The offer and screenshot instruction are conditionally rendered only within these windows. An MP4 cannot detect an Instagram viewer pressing pause: the offer is encoded into those six frames so pausing there captures it. The outro and cover keep the offer hidden.

## Render the deliverables

Render all three MP4s, the cover, and QC stills:

```bash
cd /workspace/botox-video
node scripts/render-pause-sale.mjs
node scripts/check-pause-sale.cjs
```

The renderer uses three workers, CRF 16, PNG source frames, and 192 kbps audio. It overwrites the corresponding files under `deliverables/`. To render only the main Reel:

```bash
npx remotion render src/pause-sale/index.tsx BotoxSale deliverables/nn-aesthetics-syringe.mp4
```

Replace `BotoxSale` with `BotoxSaleSlow` or `BotoxSaleVial` and choose the matching output filename for either alternate. Use the new entry point above; the repository's original `npm run render` command still targets the older texting video.

## Quality control

`node scripts/check-pause-sale.cjs` checks every scene frame for exact product alignment, shared silhouette geometry, correct object instructions, RTL attributes, and offer visibility only in the expected windows. It then probes and fully decodes each exported MP4, verifies video/audio specifications, and inspects the offer region on every decoded frame. The report records the actual results in `deliverables/quality-control.json`; a failing check returns a nonzero exit status. `--model-only` runs the scene checks without validating exported MP4s.

Inspect the QC stills and watch the finished exports as well. Automated text-region checks are not OCR and do not replace visual review of Hebrew glyph shaping, typography, and the overall design.

## Source files and original audio

- `src/pause-sale/PauseSale.tsx`: layout, RTL typography, transitions, cover, and audio integration.
- `src/pause-sale/Products.tsx`: syringe/vial materials, details, and shared outline geometry.
- `src/pause-sale/timeline.ts`: deterministic motion and winning-window logic.
- `src/pause-sale/index.tsx`: composition registration.
- `public/audio/pause-challenge.wav`: original synthesized 12-second soundtrack.

Audio regeneration is optional and requires only Python's standard library:

```bash
python3 scripts/generate-pause-audio.py
```

The soundtrack combines a restrained ambient bed, soft pulses, and airy travel swishes, with no licensed samples or external music dependency.
