import React, {CSSProperties} from 'react';

export type HandwritingProps = {
  /** The incoming drawing is the same stem and upper bowl used by the full B. */
  variant: 'partial' | 'full';
  /** Drawing progress, from 0 to 1. All geometry stays editable below. */
  progress: number;
  style?: CSSProperties;
  /** Replay the first strokes in the outgoing image, instead of starting at the seed. */
  replaySeed?: boolean;
};

type PenStroke = {
  id: string;
  d: string;
  start: number;
  end: number;
  width?: number;
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));

// A little acceleration and deceleration at each pen lift makes the line feel
// written, while most of each stroke moves at a steady, readable speed.
const penTiming = (value: number) => {
  const t = clamp(value);
  return t * t * (3 - 2 * t);
};

// The seed is deliberately shared by both images: the punchline really does
// complete the original mark. Its upper bowl hooks back short of the tilted
// stem. Keeping the bowls open makes this feel like a loose finger drawing,
// rather than a closed P turning into a typeset B.
const seed: PenStroke[] = [
  {
    id: 'B-stem-and-upper-bowl',
    d: 'M 118 215 C 106 168, 91 108, 80 70 C 74 49, 100 43, 124 48 C 153 52, 175 65, 179 85 C 184 108, 153 128, 119 134',
    start: 0,
    end: 1,
    width: 8.4,
  },
];

const completion: PenStroke[] = [
  {
    id: 'B-lower-bowl',
    d: 'M 119 134 C 154 124, 192 136, 200 160 C 213 198, 169 231, 131 245',
    start: 0,
    end: 0.235,
    width: 8.4,
  },
  {
    id: 'first-o',
    d: 'M 253 147 C 240 136, 220 145, 216 166 C 211 190, 225 208, 243 198 C 260 189, 269 162, 253 147 C 249 143, 243 143, 239 145',
    start: 0.265,
    end: 0.445,
    width: 8.2,
  },
  {
    id: 't-upright',
    d: 'M 304 111 C 298 133, 289 160, 288 180 C 287 201, 300 204, 314 190',
    start: 0.47,
    end: 0.575,
    width: 8.1,
  },
  {
    id: 't-crossbar',
    d: 'M 272 151 C 286 147, 306 146, 323 145',
    start: 0.6,
    end: 0.65,
    width: 7.8,
  },
  {
    id: 'second-o',
    d: 'M 374 148 C 360 137, 338 149, 335 170 C 331 193, 347 208, 365 196 C 382 185, 388 161, 374 148 C 370 145, 365 144, 361 146',
    start: 0.675,
    end: 0.835,
    width: 8.2,
  },
  {
    id: 'x-downstroke',
    d: 'M 407 148 C 420 164, 436 181, 454 200',
    start: 0.86,
    end: 0.925,
    width: 8.3,
  },
  {
    id: 'x-upstroke',
    d: 'M 454 145 C 441 160, 424 185, 408 204',
    start: 0.94,
    end: 1,
    width: 8,
  },
];

const Stroke: React.FC<{stroke: PenStroke; progress: number}> = ({
  stroke,
  progress,
}) => {
  const drawn = penTiming((progress - stroke.start) / (stroke.end - stroke.start));
  return (
    <path
      d={stroke.d}
      fill="none"
      stroke="#111111"
      strokeWidth={stroke.width ?? 8.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray="1 1"
      strokeDashoffset={1 - drawn}
      // A fully hidden path must not leave a round-cap dot at its origin.
      opacity={drawn > 0 ? 1 : 0}
    />
  );
};

/** Pure vector handwriting: no font, image, mask video, or time-based CSS. */
export const Handwriting: React.FC<HandwritingProps> = ({
  variant,
  progress,
  style,
  replaySeed = false,
}) => {
  const p = clamp(progress);
  const seedProgress = variant === 'partial' ? p : replaySeed ? p / 0.25 : 1;
  const completionProgress = replaySeed ? (p - 0.25) / 0.75 : p;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 560 280"
      role="img"
      aria-label={variant === 'partial' ? 'An unfinished handwritten B' : 'Botox'}
      style={{width: '100%', height: '100%', display: 'block', ...style}}
    >
      <g transform="translate(14 -1)">
        {seed.map((stroke) => (
          <Stroke key={stroke.id} stroke={stroke} progress={seedProgress} />
        ))}
        {variant === 'full'
          ? completion.map((stroke) => (
              <Stroke key={stroke.id} stroke={stroke} progress={completionProgress} />
            ))
          : null}
      </g>
    </svg>
  );
};
