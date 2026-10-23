import {PAUSE_SALE, type ChallengeVariant} from './config';

export type WinningWindow = {start: number; end: number};
export type ChallengeState = {
  /** Translation from the fixed outline, in composition pixels. */
  x: number;
  y: number;
  /** Rotation in degrees. */
  rotation: number;
  scale: number;
  winning: boolean;
  active: boolean;
  /** The exact winning window index; -1 on every nonwinning frame. */
  windowIndex: number;
};

export const getWinningWindows = (): WinningWindow[] => {
  const {winningStarts, winningFrames, difficulty, challengeStart, challengeEnd} =
    PAUSE_SALE.timeline;
  const count = Math.max(1, Math.round(winningFrames / difficulty));
  const windows = winningStarts.map((start) => ({start, end: start + count - 1}));
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

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smoothstep = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

/**
 * Three fast rightward passes, with a six-frame EXACT identity plateau at each
 * catch. The object wraps from +distance to -distance while fully offscreen.
 * It is already visible and moving on frame zero. The periodic continuation
 * satisfies state(frame + duration) === state(frame), so the last-to-first
 * transition advances by one normal frame rather than duplicating an endpoint.
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
  if (windowIndex >= 0) {
    return {x: 0, y: 0, rotation: 0, scale: 1, winning: true, active, windowIndex};
  }

  // Find the neighbouring winning holds on a cyclic timeline. Working with
  // their actual boundaries keeps editable timestamps/difficulty meaningful.
  const nextIndex = WINNING_WINDOWS.findIndex(({start}) => start > localFrame);
  const next = nextIndex < 0
    ? {...WINNING_WINDOWS[0], start: WINNING_WINDOWS[0].start + duration}
    : WINNING_WINDOWS[nextIndex];
  const previousIndex = nextIndex < 0 ? WINNING_WINDOWS.length - 1 : nextIndex - 1;
  const previousEnd = previousIndex < 0
    ? WINNING_WINDOWS[WINNING_WINDOWS.length - 1].end - duration
    : WINNING_WINDOWS[previousIndex].end;
  const gap = next.start - previousEnd;
  const elapsed = localFrame - previousEnd;
  const exitFrames = Math.min(12, gap / 3);
  const entryFrames = gap - exitFrames;
  const distance = PAUSE_SALE.motion.distance;
  const requestedSpeed = Math.max(0.15, PAUSE_SALE.motion.speed *
    (variant === 'slow' ? PAUSE_SALE.motion.slowSpeedMultiplier : 1));

  // The exponential kick makes the adjacent losing frame ~43px away instead
  // of the former ~14px, with slower travel only far away from the target.
  const rawDistance = (d: number) => 120 * (1 - Math.exp(-d / 3)) + 8.5 * d;
  const scale = Math.min(requestedSpeed, distance * 0.72 / rawDistance(entryFrames));
  const nearCenter = (d: number) => {
    if (d >= 1) return rawDistance(d) * scale;
    const end = rawDistance(1);
    const velocity = 40 * Math.exp(-1 / 3) + 8.5;
    // Cubic Hermite softens only the final fractional frame; exact window
    // boundaries have zero velocity without making catches visually easy.
    return ((-2*d*d*d+3*d*d)*end + (d*d*d-d*d)*velocity) * scale;
  };
  const travel = (d: number, length: number, rampStart: number) => {
    const bonus = Math.max(0, distance - nearCenter(length));
    return Math.min(distance, nearCenter(d) + bonus * smoothstep((d-rampStart)/(length-rampStart)));
  };
  const x = elapsed <= exitFrames
    ? travel(elapsed, exitFrames, Math.min(1, exitFrames * 0.2))
    : -travel(next.start-localFrame, entryFrames, Math.min(26, entryFrames * 0.7));
  const edge = Math.abs(x / distance);
  return {
    x,
    y: edge * edge * PAUSE_SALE.motion.verticalDrift,
    rotation: (x / distance) * PAUSE_SALE.motion.maximumRotation,
    scale: 1 - edge * 0.012,
    winning: false,
    active,
    windowIndex: -1,
  };
};
