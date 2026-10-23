#!/usr/bin/env node
'use strict';

/** Checks the immediate six-second scene DOM and every decoded offer region. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');

const root = path.resolve(__dirname, '..');
for (const ext of ['.ts', '.tsx']) {
  require.extensions[ext] = (module, filename) => {
    const source = fs.readFileSync(filename, 'utf8');
    const output = ts.transpileModule(source, {
      fileName: filename,
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    });
    module._compile(output.outputText, filename);
  };
}

const {PauseScene} = require(path.join(root, 'src/pause-sale/PauseSale.tsx'));
const {PAUSE_SALE: config, getOfferText} = require(path.join(root, 'src/pause-sale/config.ts'));
const {WINNING_WINDOWS, getChallengeState} = require(path.join(root, 'src/pause-sale/timeline.ts'));
const {Product, PRODUCT_SILHOUETTES} = require(path.join(root, 'src/pause-sale/Products.tsx'));
const dysportModule = path.join(root, 'src/pause-sale/DysportProduct.tsx');
const dysport = fs.existsSync(dysportModule) ? require(dysportModule) : null;
const variants = ['syringe', 'slow', 'vial'];
const exportFiles = {
  syringe: 'botox-sale-fast-syringe.mp4',
  slow: 'botox-sale-fast-slower.mp4',
  vial: 'botox-sale-fast-dysport.mp4',
};
const report = {
  checkedAt: new Date().toISOString(),
  result: 'running',
  modelOnly: process.argv.includes('--model-only'),
  windows: WINNING_WINDOWS.map(({start, end}) => ({
    startFrame: start,
    endFrameInclusive: end,
    startSeconds: start / config.fps,
    endSecondsExclusive: (end + 1) / config.fps,
  })),
  sceneChecks: [],
  assets: [],
  exports: [],
  limitations: [
    'DOM checks prove text content, RTL attributes, conditional rendering and exact transforms; visual Hebrew glyph shaping and overall design additionally require rendered-image review.',
    'Decoded offer-region checks detect the light offer card and its dark lettering on each encoded frame; they do not perform OCR.',
  ],
};

const plainText = (html) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const tagWith = (html, attr) => {
  const match = html.match(new RegExp(`<[^>]*\\b${attr}(?:="[^"]*")?[^>]*>`));
  assert(match, `Missing ${attr} node`);
  return match[0];
};
const hasAttr = (tag, name, value) => tag.includes(`${name}="${value}"`);
const styleOf = (tag) => Object.fromEntries(
  (tag.match(/style="([^"]*)"/)?.[1] || '').split(';').filter(Boolean).map((declaration) => {
    const separator = declaration.indexOf(':');
    return [declaration.slice(0, separator), declaration.slice(separator + 1)];
  }),
);
const expectedWins = WINNING_WINDOWS.reduce((n, w) => n + w.end - w.start + 1, 0);

function checkDysportAsset() {
  const asset = path.join(root, 'public/products/dysport-3d.png');
  assert(fs.existsSync(asset), 'Missing supplied-reference Dysport product asset');
  const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-of', 'json', asset], {encoding:'utf8'}));
  const image = probe.streams[0];
  assert(image && image.width > 0 && image.height > 0, 'Dysport PNG dimensions are invalid');
  const alpha = execFileSync('ffmpeg', ['-v', 'error', '-i', asset, '-vf', 'alphaextract', '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'gray', 'pipe:1'], {maxBuffer:16*1024*1024});
  assert.equal(alpha.length, image.width * image.height);
  let transparent = 0;
  let visible = 0;
  for (const value of alpha) {
    if (value < 8) transparent++;
    if (value > 128) visible++;
  }
  const transparentFraction = transparent / alpha.length;
  const visibleFraction = visible / alpha.length;
  assert(transparentFraction > 0.25, `Dysport image still has a solid background (${transparentFraction} transparent)`);
  assert(visibleFraction > 0.1, 'Dysport vial is missing from its transparent PNG');
  report.assets.push({filename:'public/products/dysport-3d.png', width:image.width, height:image.height, transparentFraction, visibleFraction, backgroundRemoved:true});
  console.log(`PASS Dysport asset: ${image.width}×${image.height}; ${(transparentFraction*100).toFixed(1)}% transparent background, visible product retained.`);
}

function checkScene(variant) {
  let winningFrames = 0;
  const checked = [];
  const kind = variant === 'vial' ? 'vial' : 'syringe';
  if (kind === 'vial') assert(dysport, 'The supplied Dysport reference must be used by DysportProduct.tsx');
  const Component = kind === 'vial' ? dysport.DysportProduct : Product;
  const silhouette = kind === 'vial' ? dysport.DYSPORT_SILHOUETTE : PRODUCT_SILHOUETTES[kind];
  for (const outline of [false, true]) {
    const objectSvg = renderToStaticMarkup(React.createElement(Component, {kind, outline, id:`qc-${outline}`}));
    assert(objectSvg.includes(`d="${silhouette}"`), `${variant}: outline and object must share exact silhouette geometry`);
  }
  for (let frame = 0; frame < config.durationInFrames; frame++) {
    const expected = WINNING_WINDOWS.some(({start, end}) => frame >= start && frame <= end);
    const state = getChallengeState(frame, variant);
    assert(state.active, `${variant} frame ${frame}: challenge must start immediately and continue through the last frame`);
    const html = renderToStaticMarkup(React.createElement(PauseScene, {frame, variant}));
    const scene = tagWith(html, 'data-scene');
    assert.equal(hasAttr(scene, 'data-winning', 'true'), expected, `${variant} frame ${frame}: DOM winning flag`);
    assert.equal(state.winning, expected, `${variant} frame ${frame}: model winning flag`);
    assert.equal(html.includes('data-offer="winning-only"'), expected, `${variant} frame ${frame}: offer node visibility`);
    assert.equal(html.includes(getOfferText()), expected, `${variant} frame ${frame}: offer text visibility`);
    assert.equal(html.includes(config.text.screenshot), expected, `${variant} frame ${frame}: screenshot instruction visibility`);
    const target = tagWith(html, 'data-target');
    assert(hasAttr(target, 'data-transform', '0,0,0,1'), 'Fixed target moved');
    const moving = tagWith(html, 'data-moving');
    if (expected) {
      assert.deepEqual([state.x, state.y, state.rotation, state.scale], [0, 0, 0, 1]);
      assert(hasAttr(moving, 'data-transform', '0,0,0,1'), `${variant} frame ${frame}: product does not match fixed target`);
      const targetStyle = styleOf(target);
      const movingStyle = styleOf(moving);
      for (const key of ['left', 'top', 'width', 'height']) assert.equal(movingStyle[key], targetStyle[key], `${variant} frame ${frame}: actual ${key} differs`);
      assert.equal(movingStyle.transform, targetStyle.transform, `${variant} frame ${frame}: actual 3D CSS transform differs`);
      assert(hasAttr(tagWith(html, 'data-offer'), 'dir', 'rtl'), 'Offer must use RTL');
      winningFrames++;
      checked.push(frame);
    } else if (state.active) {
      assert.notEqual(state.x, 0, `${variant} frame ${frame}: accidental extra alignment`);
      assert(!hasAttr(moving, 'data-transform', '0,0,0,1'), `${variant} frame ${frame}: accidental DOM alignment`);
    }
    const text = plainText(html);
    assert(!/\bNN\b|AESTHETICS/i.test(text), `${variant} frame ${frame}: clinic name or logo remains visible`);
    assert(text.includes(config.text.headline), `${variant} frame ${frame}: headline content`);
    const instruction = variant === 'vial' ? config.text.vialInstruction : config.text.syringeInstruction;
    assert(text.includes(instruction), `${variant} frame ${frame}: correct object instruction`);
    assert(hasAttr(tagWith(html, 'data-instruction'), 'dir', 'rtl'), 'Challenge instructions must use RTL');
  }
  assert.equal(winningFrames, expectedWins);
  const cover = renderToStaticMarkup(React.createElement(PauseScene, {frame:WINNING_WINDOWS[0].start, variant, cover:true}));
  assert(!cover.includes('data-offer="winning-only"'), 'Cover must not spoil offer');
  assert(!cover.includes(getOfferText()), 'Cover reveals offer');
  assert(!/\bNN\b|AESTHETICS/i.test(plainText(cover)), 'Cover contains removed clinic branding');
  const record = {variant, framesChecked: config.durationInFrames, winningFrames, exactAlignmentFrames: checked, offerOutsideWinningWindows: false, rtlAttributes: 'passed', coverOfferHidden: true, clinicBrandingAbsent:true, immediateChallengeEveryFrame:true};
  report.sceneChecks.push(record);
  console.log(`PASS scene ${variant}: ${config.durationInFrames} frames; ${winningFrames} exact alignments; offer hidden on every other frame.`);
}

function checkExport(variant) {
  const filename = exportFiles[variant];
  const file = path.join(root, 'deliverables', filename);
  assert(fs.existsSync(file), `Missing finished export: ${file}`);
  const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', file], {encoding:'utf8'}));
  const video = probe.streams.find((s) => s.codec_type === 'video');
  const audio = probe.streams.find((s) => s.codec_type === 'audio');
  assert(video, `${filename}: no video`);
  assert(audio, `${filename}: no audio`);
  assert.equal(video.codec_name, 'h264');
  assert.equal(video.width, config.width);
  assert.equal(video.height, config.height);
  assert.equal(video.pix_fmt, 'yuv420p');
  assert.equal(video.avg_frame_rate, `${config.fps}/1`);
  assert.equal(Number(video.nb_read_frames), config.durationInFrames);
  assert(Math.abs(Number(video.duration) - config.durationInFrames / config.fps) < 1/config.fps);
  assert.equal(audio.codec_name, 'aac');
  assert.equal(audio.channels, 2);
  assert.equal(Number(audio.sample_rate), 48000);
  assert(Math.abs(Number(audio.duration) - config.durationInFrames / config.fps) < 0.05);
  execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'null', '-'], {stdio:['ignore', 'pipe', 'pipe']});

  // Only the winning card is light in this rectangle. Count its light pixels
  // and dark lettering in EVERY decoded frame, including adjacent losing frames.
  const roi = {x:100, y:1468, width:880, height:192};
  const bytesPerFrame = roi.width * roi.height;
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-vf', `crop=${roi.width}:${roi.height}:${roi.x}:${roi.y},format=gray`, '-an', '-f', 'rawvideo', '-pix_fmt', 'gray', 'pipe:1'], {maxBuffer:128*1024*1024});
  assert.equal(raw.length, bytesPerFrame * config.durationInFrames, `${filename}: crop frame count`);
  const lightPixelCounts = [];
  const darkPixelCounts = [];
  const detectedFrames = [];
  let minimumWinningCount = Infinity;
  let minimumWinningTextCount = Infinity;
  let maximumNonwinningCount = 0;
  for (let frame = 0; frame < config.durationInFrames; frame++) {
    let lightCount = 0;
    let darkCount = 0;
    const offset = frame * bytesPerFrame;
    for (let i = offset; i < offset + bytesPerFrame; i++) {
      if (raw[i] > 180) lightCount++;
      if (raw[i] < 90) darkCount++;
    }
    lightPixelCounts.push(lightCount);
    darkPixelCounts.push(darkCount);
    const expected = WINNING_WINDOWS.some(({start, end}) => frame >= start && frame <= end);
    if (expected) {
      minimumWinningCount = Math.min(minimumWinningCount, lightCount);
      minimumWinningTextCount = Math.min(minimumWinningTextCount, darkCount);
      assert(darkCount > 1000, `${filename} decoded frame ${frame}: offer card is missing its dark lettering (${darkCount})`);
    } else maximumNonwinningCount = Math.max(maximumNonwinningCount, lightCount);
    if (lightCount > 50000) detectedFrames.push(frame);
    assert.equal(lightCount > 50000, expected, `${filename} decoded frame ${frame}: expected offer=${expected}, light pixels=${lightCount}`);
    if (!expected) assert(lightCount < 200, `${filename} decoded frame ${frame}: unexpected offer pixels outside winning window (${lightCount})`);
  }
  const record = {
    filename, bytes:fs.statSync(file).size, codec:video.codec_name,
    width:video.width, height:video.height, fps:video.avg_frame_rate,
    frames:Number(video.nb_read_frames), durationSeconds:Number(video.duration),
    pixelFormat:video.pix_fmt, audio:{codec:audio.codec_name, channels:audio.channels, sampleRate:Number(audio.sample_rate)},
    completeDecode:'passed', decodedOfferCheck:{roi, lightPixelThreshold:180, cardPixelCountThreshold:50000, darkTextPixelThreshold:90, minimumDarkTextPixelCount:1000, minimumWinningCount, minimumWinningTextCount, maximumNonwinningCount, detectedFrames, lightPixelCounts, darkPixelCounts},
  };
  report.exports.push(record);
  console.log(`PASS encoded ${variant}: ${config.width}×${config.height} H.264, ${config.durationInFrames} frames, stereo AAC, complete decode; decoded offer found on exactly ${detectedFrames.length} frames (min winning=${minimumWinningCount}; max other=${maximumNonwinningCount}).`);
}

try {
  assert.equal(config.fps, 30);
  assert.equal(config.durationInFrames, 180, 'Revised video must be six seconds');
  assert.equal(config.timeline.challengeStart, 0, 'No starting scene is allowed');
  assert.equal(config.timeline.challengeEnd, config.durationInFrames, 'No ending scene is allowed');
  checkDysportAsset();
  for (const variant of variants) checkScene(variant);
  const adjacentFrame = WINNING_WINDOWS[0].start - 1;
  assert(Math.abs(getChallengeState(adjacentFrame, 'slow').x) < Math.abs(getChallengeState(adjacentFrame, 'syringe').x), 'Slow version must be gentler near the catch');
  if (!report.modelOnly) for (const variant of variants) checkExport(variant);
  report.result = report.modelOnly ? 'scene-passed-encoded-unrun' : 'passed';
} catch (error) {
  report.result = 'failed';
  report.error = error.stack || String(error);
  console.error(report.error);
  process.exitCode = 1;
} finally {
  const output = path.join(root, 'deliverables');
  fs.mkdirSync(output, {recursive:true});
  fs.writeFileSync(path.join(output, report.modelOnly ? 'quality-control-fast-model.json' : 'quality-control-fast.json'), JSON.stringify(report, null, 2) + '\n');
}
