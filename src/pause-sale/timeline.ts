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
 * Shared analytical motion for the product and QC. The outline never moves.
 * Each six-frame winning plateau returns an EXACT identity transform. Between
 * catches the object turns around offscreen, alternating direction. No other
 * challenge frame has x=0. Slow mode changes the travel curve, not offer gates.
 */
export const getChallengeState = (
  frame: number,
  variant: ChallengeVariant = 'syringe',
): ChallengeState => {
  const {challengeStart, challengeEnd} = PAUSE_SALE.timeline;
  const active = frame >= challengeStart && frame < challengeEnd;
  const windowIndex = active
    ? WINNING_WINDOWS.findIndex(({start, end}) => frame >= start && frame <= end)
    : -1;
  if (windowIndex >= 0) {
    return {x: 0, y: 0, rotation: 0, scale: 1, winning: true, active, windowIndex};
  }

  const speed = Math.max(
    0.15,
    PAUSE_SALE.motion.speed * (variant === 'slow' ? PAUSE_SALE.motion.slowSpeedMultiplier : 1),
  );
  // Larger exponents flatten travel near the target: the slower variant is
  // measurably closer to center on the same adjacent nonwinning frames.
  const exponent = 0.66 / speed;
  const distanceCurve = (t: number) => Math.pow(smoothstep(t), exponent);
  let normalized = -1;

  if (frame < WINNING_WINDOWS[0].start) {
    normalized = -distanceCurve(
      (WINNING_WINDOWS[0].start - frame) /
        (WINNING_WINDOWS[0].start - challengeStart),
    );
  } else if (frame > WINNING_WINDOWS[WINNING_WINDOWS.length - 1].end) {
    const last = WINNING_WINDOWS[WINNING_WINDOWS.length - 1];
    const sign = WINNING_WINDOWS.length % 2 === 1 ? 1 : -1;
    normalized = sign * distanceCurve((frame - last.end) / (challengeEnd - 1 - last.end));
  } else {
    for (let i = 0; i < WINNING_WINDOWS.length - 1; i++) {
      const previous = WINNING_WINDOWS[i];
      const next = WINNING_WINDOWS[i + 1];
      if (frame > previous.end && frame < next.start) {
        const turn = (previous.end + next.start) / 2;
        const sign = i % 2 === 0 ? 1 : -1;
        const t = frame <= turn
          ? (frame - previous.end) / (turn - previous.end)
          : (next.start - frame) / (next.start - turn);
        normalized = sign * distanceCurve(t);
        break;
      }
    }
  }

  const edge = Math.abs(normalized);
  return {
    x: normalized * PAUSE_SALE.motion.distance,
    y: edge * edge * PAUSE_SALE.motion.verticalDrift,
    rotation: normalized * PAUSE_SALE.motion.maximumRotation,
    scale: 1 - edge * 0.012,
    winning: false,
    active,
    windowIndex: -1,
  };
};
