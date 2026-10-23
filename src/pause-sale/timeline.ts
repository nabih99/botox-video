import {PAUSE_SALE, type ChallengeVariant} from './config';

export type WinningWindow = {start: number; end: number};
export type ChallengeState = {
  /** Translation from the fixed outline, in composition pixels. */
  x: number;
  y: number;
  /** Rotation in degrees. */
  rotation: number;
  scale: number;
  /** Brief offer window; movement continues throughout this interval. */
  winning: boolean;
  /** Exact outline alignment occurs on one frame within each offer window. */
  aligned: boolean;
  active: boolean;
  windowIndex: number;
};

export const getWinningWindows = (): WinningWindow[] => {
  const {winningStarts, winningFrames, difficulty, challengeStart, challengeEnd} =
    PAUSE_SALE.timeline;
  const count = Math.max(1, Math.round(winningFrames / difficulty));
  const windows = winningStarts.map((start) => ({start, end: start + count - 1}));
  if (!windows.length) throw new Error('At least one offer window is required.');
  for (let i = 0; i < windows.length; i++) {
    const {start, end} = windows[i];
    if (!Number.isInteger(start) || start < challengeStart || end >= challengeEnd) {
      throw new Error(`Winning window ${i} must fit within the challenge.`);
    }
    if (i > 0 && start <= windows[i - 1].end + 2) {
      throw new Error('Winning windows must be ordered and separated by motion.');
    }
  }
  return windows;
};

export const WINNING_WINDOWS = getWinningWindows();
export const getAlignmentFrames = (): number[] =>
  getWinningWindows().map(({start, end}) => start + Math.floor((end - start) / 2));
export const ALIGNMENT_FRAMES = getAlignmentFrames();

/** Half of the offscreen wrap distance, in composition pixels. */
export const getTravelDistance = (variant: ChallengeVariant = 'syringe'): number => {
  const speed = Math.max(0.15, PAUSE_SALE.motion.speed *
    (variant === 'slow' ? PAUSE_SALE.motion.slowSpeedMultiplier : 1));
  return Math.max(PAUSE_SALE.motion.minimumDistance, PAUSE_SALE.motion.distance * speed);
};

/**
 * Continuous rightward movement with no easing, holds, or frozen catch frames.
 * Each center-to-center pass traverses one full wrap distance at constant speed.
 * Wrapping happens only while the complete product is beyond the screen edge.
 * The modulo timeline makes the last-to-first transition one ordinary motion
 * step, including when the exported clip is played at a higher playback speed.
 */
export const getChallengeState = (
  frame: number,
  variant: ChallengeVariant = 'syringe',
): ChallengeState => {
  const {challengeStart, challengeEnd} = PAUSE_SALE.timeline;
  const duration = challengeEnd - challengeStart;
  const active = frame >= challengeStart && frame < challengeEnd;
  const localFrame = ((frame - challengeStart) % duration + duration) % duration + challengeStart;
  const windowIndex = active
    ? WINNING_WINDOWS.findIndex(({start, end}) => frame >= start && frame <= end)
    : -1;

  // The slower alternate reduces travel distance rather than introducing
  // deceleration. Clamp the distance so every wrap remains fully offscreen.
  const distance = getTravelDistance(variant);
  const nextIndex = ALIGNMENT_FRAMES.findIndex((center) => center > localFrame);
  const next = nextIndex < 0 ? ALIGNMENT_FRAMES[0] + duration : ALIGNMENT_FRAMES[nextIndex];
  const previous = nextIndex < 0
    ? ALIGNMENT_FRAMES[ALIGNMENT_FRAMES.length - 1]
    : nextIndex === 0
      ? ALIGNMENT_FRAMES[ALIGNMENT_FRAMES.length - 1] - duration
      : ALIGNMENT_FRAMES[nextIndex - 1];
  const passDuration = next - previous;
  const progress = (localFrame - previous) / passDuration;
  const x = progress < 0.5 ? 2 * distance * progress : 2 * distance * (progress - 1);
  const aligned = active && ALIGNMENT_FRAMES.includes(localFrame);

  return {
    x,
    y: 0,
    rotation: 0,
    scale: 1,
    winning: windowIndex >= 0,
    aligned,
    active,
    windowIndex,
  };
};
