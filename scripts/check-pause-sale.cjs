#!/usr/bin/env node
'use strict';

/** Checks continuous six-second motion, decoded playback, and brief offer windows. */
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
const timeline = require(path.join(root, 'src/pause-sale/timeline.ts'));
const {WINNING_WINDOWS, getChallengeState, ALIGNMENT_FRAMES, getTravelDistance} = timeline;
const {Product, PRODUCT_SILHOUETTES} = require(path.join(root, 'src/pause-sale/Products.tsx'));
const dysportModule = path.join(root, 'src/pause-sale/DysportProduct.tsx');
const dysport = fs.existsSync(dysportModule) ? require(dysportModule) : null;
const variants = ['syringe', 'slow', 'vial'];
const exportFiles = {
  syringe: 'botox-sale-smooth-syringe.mp4',
  slow: 'botox-sale-smooth-slower.mp4',
  vial: 'botox-sale-smooth-dysport.mp4',
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

/** Bounds of the opaque product at its fixed center, excluding shadows. */
function productBounds(variant, state) {
  const baseScale = variant === 'vial' ? 1.08 : 0.85;
  const bounds = variant === 'vial' ? dysport.DYSPORT_BOUNDS : {left:105, right:255};
  return {left:540 + (bounds.left - 180) * baseScale + state.x, right:540 + (bounds.right - 180) * baseScale + state.x};
}

function checkContinuousMotion(variant) {
  const states = Array.from({length:config.durationInFrames}, (_, frame) => getChallengeState(frame, variant));
  const circumference = 2 * getTravelDistance(variant);
  const pixelsPerFrame = states[1].x - states[0].x;
  assert(pixelsPerFrame > 1, `${variant}: opening frame is held or moves imperceptibly`);
  let wraps = 0;
  for (let frame = 0; frame < states.length; frame++) {
    const from = states[frame];
    const to = states[(frame + 1) % states.length];
    let dx = to.x - from.x;
    if (dx < 0) {
      dx += circumference;
      wraps++;
      const before = productBounds(variant, from);
      const after = productBounds(variant, to);
      assert(before.left >= config.width && after.right <= 0, `${variant} frame ${frame}: product wraps while visible`);
    }
    assert(Math.abs(dx - pixelsPerFrame) < 1e-7, `${variant} frame ${frame}: velocity changed or product paused (${dx} versus ${pixelsPerFrame})`);
    for (const key of ['y', 'rotation', 'scale']) assert.equal(to[key], from[key], `${variant} frame ${frame}: secondary transform jumps`);
  }
  const repeated = getChallengeState(config.durationInFrames, variant);
  for (const key of ['x', 'y', 'rotation', 'scale']) assert.equal(repeated[key], states[0][key], `${variant}: motion is not periodic across the replay seam`);
  const openingBounds = productBounds(variant, states[0]);
  assert(openingBounds.left >= 0 && openingBounds.right <= config.width, `${variant}: product must already be fully visible on frame zero`);
  assert.equal(wraps, ALIGNMENT_FRAMES.length);
  return {pixelsPerFrame, checkedTransitions:states.length, wrapsOffscreenOnly:wraps, zeroVelocityTransitions:0, firstFrameFullyVisible:true, lastToFirstNormalAdvance:true};
}

/** Inspect the actual encoded moving area so a frozen opening cannot pass. */
function checkDecodedMotion(file, variant) {
  const width = 216;
  const height = 152;
  const frameBytes = width * height;
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-vf', `crop=1080:760:0:680,scale=${width}:${height}:flags=area,format=gray`, '-an', '-f', 'rawvideo', '-pix_fmt', 'gray', 'pipe:1'], {maxBuffer:16*1024*1024});
  assert.equal(raw.length, frameBytes * config.durationInFrames, 'Decoded motion crop frame count');
  const motionDifferences = [];
  const visibleTransitions = [];
  for (let frame = 0; frame < config.durationInFrames; frame++) {
    const next = (frame + 1) % config.durationInFrames;
    let difference = 0;
    for (let pixel = 0; pixel < frameBytes; pixel++) difference += Math.abs(raw[frame * frameBytes + pixel] - raw[next * frameBytes + pixel]);
    const meanAbsoluteDifference = difference / frameBytes;
    motionDifferences.push(meanAbsoluteDifference);
    const bounds = productBounds(variant, getChallengeState(frame, variant));
    const nextBounds = productBounds(variant, getChallengeState(next, variant));
    const clearlyVisible = bounds.left >= 20 && bounds.right <= config.width - 20 && nextBounds.left >= 20 && nextBounds.right <= config.width - 20;
    if (clearlyVisible) {
      visibleTransitions.push(frame);
      assert(meanAbsoluteDifference > 0.05, `${variant} encoded frame ${frame}->${next}: visible product froze (${meanAbsoluteDifference})`);
    }
  }
  for (let frame = 0; frame < 15; frame++) {
    assert(visibleTransitions.includes(frame), `${variant}: startup verification must inspect visible motion on frame ${frame}`);
    assert(motionDifferences[frame] > 0.05, `${variant}: encoded startup pause at frame ${frame}`);
  }
  assert(visibleTransitions.includes(config.durationInFrames - 1), `${variant}: replay seam must contain visible product motion`);
  const seamDifference = motionDifferences[config.durationInFrames - 1];
  assert(seamDifference > 0.05, `${variant}: encoded last-to-first frame is frozen`);
  console.log(`PASS encoded motion ${variant}: first 15 transitions and replay seam move; ${visibleTransitions.length} visible transitions without frozen frames.`);
  return {crop:{x:0,y:680,width:1080,height:760},downsample:{width,height},visibleTransitionsChecked:visibleTransitions.length,openingTransitionsChecked:15,minimumVisibleDifference:Math.min(...visibleTransitions.map(frame=>motionDifferences[frame])),seamMeanAbsoluteDifference:seamDifference,meanAbsoluteDifferences:motionDifferences};
}

function checkScene(variant) {
  let winningFrames = 0;
  let exactAlignmentCount = 0;
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
      assert(hasAttr(tagWith(html, 'data-offer'), 'dir', 'rtl'), 'Offer must use RTL');
      winningFrames++;
    }
    const aligned = ALIGNMENT_FRAMES.includes(frame);
    assert.equal(state.aligned, aligned, `${variant} frame ${frame}: exact alignment flag`);
    if (aligned) {
      assert(expected, `${variant} frame ${frame}: center alignment must occur within the offer window`);
      assert.deepEqual([state.x, state.y, state.rotation, state.scale], [0, 0, 0, 1]);
      assert(hasAttr(moving, 'data-transform', '0,0,0,1'), `${variant} frame ${frame}: product does not match fixed target`);
      const targetStyle = styleOf(target);
      const movingStyle = styleOf(moving);
      for (const key of ['left', 'top', 'width', 'height']) assert.equal(movingStyle[key], targetStyle[key], `${variant} frame ${frame}: actual ${key} differs`);
      assert.equal(movingStyle.transform, targetStyle.transform, `${variant} frame ${frame}: actual 3D CSS transform differs`);
      exactAlignmentCount++;
      checked.push(frame);
    } else {
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
  assert.equal(exactAlignmentCount, ALIGNMENT_FRAMES.length);
  const motionCheck = checkContinuousMotion(variant);
  const cover = renderToStaticMarkup(React.createElement(PauseScene, {frame:WINNING_WINDOWS[0].start, variant, cover:true}));
  assert(!cover.includes('data-offer="winning-only"'), 'Cover must not spoil offer');
  assert(!cover.includes(getOfferText()), 'Cover reveals offer');
  assert(!/\bNN\b|AESTHETICS/i.test(plainText(cover)), 'Cover contains removed clinic branding');
  const record = {variant, framesChecked: config.durationInFrames, winningFrames, exactAlignmentFrames: checked, offerOutsideWinningWindows: false, rtlAttributes: 'passed', coverOfferHidden: true, clinicBrandingAbsent:true, immediateChallengeEveryFrame:true, continuousMotion:motionCheck};
  report.sceneChecks.push(record);
  console.log(`PASS scene ${variant}: ${config.durationInFrames} frames; ${winningFrames} offer frames, ${exactAlignmentCount} exact center passes; constant motion and seamless loop.`);
}

/** Decode two consecutive copies at 2x speed to inspect the actual replay. */
function checkAcceleratedReplay(file) {
  const playbackRate = 2;
  const loops = 2;
  const width = 216;
  const height = 152;
  const frameBytes = width * height;
  const expectedFrames = config.durationInFrames * loops / playbackRate;
  const seamIndex = config.durationInFrames / playbackRate;
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-stream_loop', String(loops - 1), '-i', file,
    '-vf', `setpts=0.5*(PTS-STARTPTS),fps=${config.fps},crop=1080:760:0:680,scale=${width}:${height}:flags=area,format=gray`,
    '-an', '-f', 'rawvideo', '-pix_fmt', 'gray', 'pipe:1'], {maxBuffer:16*1024*1024});
  assert.equal(raw.length, frameBytes * expectedFrames, 'Two 2x-speed replays must decode to exactly six seconds without a padded frame');
  const differenceAt = (frame) => {
    assert(frame >= 0 && frame + 1 < expectedFrames, 'Invalid accelerated transition');
    let difference = 0;
    for (let pixel = 0; pixel < frameBytes; pixel++) difference += Math.abs(raw[frame * frameBytes + pixel] - raw[(frame + 1) * frameBytes + pixel]);
    return difference / frameBytes;
  };
  const startupTransitions = Array.from({length:8}, (_, frame) => ({fromFrame:frame, toFrame:frame + 1, meanAbsoluteDifference:differenceAt(frame)}));
  const seamTransitions = [seamIndex - 2, seamIndex - 1, seamIndex, seamIndex + 1].map(frame => ({fromFrame:frame, toFrame:frame + 1, meanAbsoluteDifference:differenceAt(frame)}));
  for (const transition of [...startupTransitions, ...seamTransitions]) {
    assert(transition.meanAbsoluteDifference > 0.05, `2x playback freezes at frame ${transition.fromFrame}->${transition.toFrame}`);
  }
  console.log(`PASS accelerated replay vial: ${loops} loops at ${playbackRate}x, ${expectedFrames} decoded frames; startup and frame ${seamIndex} replay seam stay in motion.`);
  return {playbackRate, loops, decodedFrames:expectedFrames, durationSeconds:expectedFrames / config.fps, firstLoopStartFrame:0, secondLoopStartFrame:seamIndex, seamIndex, startupTransitions, seamTransitions};
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
  const expectedSeconds = config.durationInFrames / config.fps;
  assert(Math.abs(Number(video.duration) - expectedSeconds) < 0.001, `${filename}: video has a padded tail`);
  assert(Math.abs(Number(probe.format.duration) - expectedSeconds) < 0.001, `${filename}: container has a padded replay tail`);
  assert(Math.abs(Number(video.start_time)) < 1e-6, `${filename}: video starts late`);
  assert(Math.abs(Number(probe.format.start_time)) < 1e-6, `${filename}: container starts late`);
  assert.equal(audio.codec_name, 'aac');
  assert.equal(audio.channels, 2);
  assert.equal(Number(audio.sample_rate), 48000);
  assert(Math.abs(Number(audio.duration) - expectedSeconds) < 0.001, `${filename}: audio has a padded replay tail`);
  assert(Math.abs(Number(audio.start_time)) < 1e-6, `${filename}: audio starts late`);
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
    pixelFormat:video.pix_fmt, containerDurationSeconds:Number(probe.format.duration), containerStartSeconds:Number(probe.format.start_time), videoStartSeconds:Number(video.start_time), audio:{codec:audio.codec_name, channels:audio.channels, sampleRate:Number(audio.sample_rate), durationSeconds:Number(audio.duration), startSeconds:Number(audio.start_time)},
    completeDecode:'passed', decodedMotion:checkDecodedMotion(file, variant), ...(variant === 'vial' ? {acceleratedReplay:checkAcceleratedReplay(file)} : {}), decodedOfferCheck:{roi, lightPixelThreshold:180, cardPixelCountThreshold:50000, darkTextPixelThreshold:90, minimumDarkTextPixelCount:1000, minimumWinningCount, minimumWinningTextCount, maximumNonwinningCount, detectedFrames, lightPixelCounts, darkPixelCounts},
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
  fs.writeFileSync(path.join(output, report.modelOnly ? 'quality-control-smooth-model.json' : 'quality-control-smooth.json'), JSON.stringify(report, null, 2) + '\n');
}
