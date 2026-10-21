import React, {useEffect, useState} from 'react';
import {AbsoluteFill, Audio, cancelRender, continueRender, delayRender, Easing, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {REEL, secondsToFrame} from './config';
import {Handwriting} from './components/Handwriting';
import {BubbleTail, Direction, MessageArrival, MessageBubble, TypingIndicator} from './components/MessageBubble';
import '@fontsource/inter/400.css';
import './styles.css';

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const curve = Easing.bezier(0.22, 1, 0.36, 1);
const {layout: L, timing: T} = REEL;
const positions = {
  babe: 0,
  incomingCard: L.bubbleHeight + L.gap,
  question: L.bubbleHeight + L.gap + L.cardHeight + L.gap,
  response: 2 * L.bubbleHeight + L.cardHeight + 2 * L.gap + L.turnGap,
  outgoingCard: 3 * L.bubbleHeight + L.cardHeight + 3 * L.gap + L.turnGap,
  punchline: 3 * L.bubbleHeight + 2 * L.cardHeight + 3 * L.gap + 2 * L.turnGap + L.receiptHeight,
};

const DrawingCard: React.FC<{direction: Direction; at: number; top: number; progress: number; full: boolean}> = ({direction, at, top, progress, full}) => <MessageArrival at={at} direction={direction} style={{position: 'absolute', top, [direction === 'incoming' ? 'left' : 'right']: 0}}>
  <div style={{position: 'relative', width: L.cardWidth, height: L.cardHeight, borderRadius: L.cardRadius, backgroundColor: REEL.colors.paper}}>
    {full && <BubbleTail direction={direction} color={REEL.colors.paper} size={29}/>}
    <div style={{width: '100%', height: '100%', overflow: 'hidden', borderRadius: L.cardRadius}}>
      <Handwriting variant={full ? 'full' : 'partial'} progress={progress} replaySeed={full} style={{width: '100%', height: '100%'}}/>
    </div>
  </div>
</MessageArrival>;

const Sound: React.FC<{at: number; file: string; volume: number; duration: number}> = ({at, file, volume, duration}) => <Sequence from={secondsToFrame(at)} durationInFrames={secondsToFrame(duration)} layout="none">
  <Audio src={staticFile(`audio/${file}.wav`)} volume={volume}/>
</Sequence>;

export const BotoxTextingReel: React.FC = () => {
  const [fontsReady] = useState(() => delayRender('Loading bundled conversation fonts'));
  useEffect(() => {
    Promise.all([document.fonts.load('43px Inter'), document.fonts.load('43px "Reel Emoji"', '🥺')])
      .then(() => document.fonts.ready)
      .then(() => continueRender(fontsReady))
      .catch(cancelRender);
  }, [fontsReady]);
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const progress = (start: number, end: number) => interpolate(t, [start, end], [0, 1], clamp);
  // A single conversation canvas scrolls as messages arrive; its children stay editable.
  const scroll1 = interpolate(t, [T.response - 0.12, T.response + 0.48], [0, 85], {...clamp, easing: curve});
  const scroll2 = interpolate(t, [T.outgoingCard - 0.08, T.outgoingCard + REEL.motion.scrollSeconds], [0, L.initialTop - L.finalTop - 85], {...clamp, easing: curve});
  const receiptOpacity = interpolate(t, [T.read, T.read + 0.18], [0, 1], clamp);
  const signatureOpacity = interpolate(t, [T.signature, T.signature + 0.5], [0, 1], clamp);

  return <AbsoluteFill style={{backgroundColor: REEL.colors.background, fontFamily: 'Inter, "Reel Emoji", -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif'}}>
    <style>{`@font-face {font-family: 'Reel Emoji'; src: url('${staticFile('fonts/pleading-emoji.ttf')}') format('truetype'); font-weight: 400; font-display: block; unicode-range: U+1F97A;}`}</style>
    <div style={{position: 'absolute', left: L.gutter, right: L.gutter, top: L.initialTop - scroll1 - scroll2}}>
      <MessageBubble text={REEL.text.opener} direction="incoming" at={T.babe} top={positions.babe} width={157}/>
      <DrawingCard direction="incoming" at={T.incomingCard} top={positions.incomingCard} progress={progress(T.partialDrawStart, T.partialDrawEnd)} full={false}/>
      <MessageBubble text={REEL.text.question} direction="incoming" at={T.question} top={positions.question} width={350}/>
      <TypingIndicator direction="outgoing" start={T.outgoingTypingStart} end={T.outgoingTypingEnd} top={positions.response}/>
      <MessageBubble text={REEL.text.response} direction="outgoing" at={T.response} top={positions.response} width={246} tail={false}/>
      <DrawingCard direction="outgoing" at={T.outgoingCard} top={positions.outgoingCard} progress={progress(T.fullDrawStart, T.fullDrawEnd)} full/>
      <div style={{position: 'absolute', right: 14, top: positions.outgoingCard + L.cardHeight + 15, color: REEL.colors.receipt, fontSize: 27, letterSpacing: '-0.5px', opacity: receiptOpacity}}>{REEL.text.receipt}</div>
      <TypingIndicator direction="incoming" start={T.incomingTypingStart} end={T.incomingTypingEnd} top={positions.punchline}/>
      <MessageBubble text={REEL.text.punchline} direction="incoming" at={T.punchline} top={positions.punchline} width={133}/>
    </div>
    {REEL.showSignature && <div style={{position: 'absolute', bottom: 123, left: 0, right: 0, textAlign: 'center', color: REEL.colors.signature, fontSize: 24, letterSpacing: 0.35, opacity: signatureOpacity}}>{REEL.text.signature}</div>}
    <Sound at={T.babe} file="incoming" volume={REEL.sound.incomingVolume} duration={0.6}/>
    <Sound at={T.incomingCard} file="incoming" volume={0.36} duration={0.6}/>
    <Sound at={T.question} file="incoming" volume={0.44} duration={0.6}/>
    <Sound at={T.response} file="outgoing" volume={REEL.sound.outgoingVolume} duration={0.45}/>
    <Sound at={T.outgoingCard} file="outgoing" volume={0.37} duration={0.45}/>
    <Sound at={T.fullDrawStart} file="handwriting" volume={REEL.sound.handwritingVolume} duration={T.fullDrawEnd - T.fullDrawStart}/>
    <Sound at={T.punchline} file="incoming" volume={0.41} duration={0.6}/>
    <Sound at={T.punchline + 0.06} file="punchline" volume={REEL.sound.punchlineVolume} duration={0.4}/>
  </AbsoluteFill>;
};
