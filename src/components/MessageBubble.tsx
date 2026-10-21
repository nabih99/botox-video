import React from 'react';
import {Easing, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {REEL, secondsToFrame} from '../config';

export type Direction = 'incoming' | 'outgoing';

export const MessageArrival: React.FC<{
  at: number;
  direction: Direction;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({at, direction, children, style}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const local = frame - secondsToFrame(at);
  if (local < 0) return null;
  const settle = spring({frame: local, fps, config: {damping: 19, stiffness: 260, mass: 0.65}, durationInFrames: secondsToFrame(REEL.motion.appearSeconds)});
  const opacity = interpolate(local, [0, 5], [0, 1], {extrapolateRight: 'clamp'});
  const x = (direction === 'incoming' ? -1 : 1) * (1 - settle) * 29;
  return <div style={{...style, opacity, transformOrigin: direction === 'incoming' ? 'left bottom' : 'right bottom', transform: `translate(${x}px, ${(1 - settle) * 13}px) scale(${0.92 + 0.08 * settle})`}}>{children}</div>;
};

export const BubbleTail: React.FC<{direction: Direction; color: string; size?: number}> = ({direction, color, size = 28}) => (
  <svg width={size} height={size} viewBox="0 0 28 28" style={{position: 'absolute', bottom: -2, [direction === 'incoming' ? 'left' : 'right']: -10, transform: direction === 'outgoing' ? 'scaleX(-1)' : undefined, overflow: 'visible'}}>
    <path d="M 23 0 C 25 12 18 23 0 27 C 7 20 9 11 8 0 Z" fill={color}/>
  </svg>
);

export const MessageBubble: React.FC<{text: string; direction: Direction; at: number; width: number; top: number; tail?: boolean}> = ({text, direction, at, width, top, tail = true}) => {
  const color = direction === 'incoming' ? REEL.colors.incoming : REEL.colors.outgoing;
  return <MessageArrival at={at} direction={direction} style={{position: 'absolute', top, [direction === 'incoming' ? 'left' : 'right']: 0}}>
    <div style={{position: 'relative', width, height: REEL.layout.bubbleHeight, borderRadius: REEL.layout.bubbleRadius, backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: REEL.layout.fontSize, fontWeight: 400, letterSpacing: '-1.2px', lineHeight: 1, color: REEL.colors.text, whiteSpace: 'nowrap'}}>
      {tail && <BubbleTail direction={direction} color={color}/>}
      <span style={{position: 'relative'}}>{text}</span>
    </div>
  </MessageArrival>;
};

export const TypingIndicator: React.FC<{direction: Direction; start: number; end: number; top: number}> = ({direction, start, end, top}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const color = direction === 'incoming' ? REEL.colors.incoming : REEL.colors.outgoing;
  if (frame < secondsToFrame(start) || frame >= secondsToFrame(end)) return null;
  const fadeOut = interpolate(frame, [secondsToFrame(end) - 3, secondsToFrame(end)], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad)});
  return <MessageArrival at={start} direction={direction} style={{position: 'absolute', top, [direction === 'incoming' ? 'left' : 'right']: 0}}>
    <div style={{position: 'relative', width: 140, height: 78, borderRadius: 44, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 11, opacity: fadeOut}}>
      <BubbleTail direction={direction} color={color} size={22}/>
      {[0, 1, 2].map((i) => {
        const phase = (frame / fps - start) / REEL.motion.typingDotCycleSeconds * Math.PI * 2 - i * 0.8;
        const pulse = Math.pow(Math.max(0, Math.sin(phase)), 2);
        return <div key={i} style={{width: 16, height: 16, borderRadius: '50%', backgroundColor: REEL.colors.typingDots, opacity: 0.45 + pulse * 0.55, transform: `translateY(${-pulse * 5}px)`}}/>;
      })}
    </div>
  </MessageArrival>;
};
