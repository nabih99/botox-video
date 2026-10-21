/** All creative controls live here. Times are in seconds, dimensions in pixels. */
export const REEL = {
  width: 1080,
  height: 1920,
  fps: 30,
  duration: 18,
  text: {
    opener: 'Babe',
    question: 'Complete it? 🥺',
    response: 'Of course',
    receipt: 'Read 19:24',
    priceQuestion: 'BOTOX? How much??',
    priceReply: 'For only 900!!!',
    surprise: 'OMG 900 ONLYY!!!',
    locationQuestion: 'WHERE???',
    locationReply: 'At NN Aesthetics!',
    signature: 'NN Aesthetics',
  },
  colors: {
    background: '#000000',
    incoming: '#252527',
    outgoing: '#0a84ff',
    text: '#f7f7f7',
    paper: '#fafafa',
    receipt: '#8e8e93',
    signature: '#66666a',
  },
  layout: {
    gutter: 100,
    cardWidth: 680,
    cardHeight: 410,
    cardRadius: 37,
    bubbleRadius: 48,
    fontSize: 43,
    bubbleHeight: 86,
    gap: 10,
    turnGap: 20,
    receiptHeight: 54,
    initialTop: 600,
    finalTop: 307,
  },
  timing: {
    babe: 0.3,
    incomingCard: 0.83,
    partialDrawStart: 1.02,
    partialDrawEnd: 1.52,
    question: 1.9,
    outgoingTypingStart: 2.9,
    outgoingTypingEnd: 3.53,
    response: 3.6,
    outgoingCard: 4.2,
    fullDrawStart: 4.43,
    fullDrawEnd: 7.33,
    read: 7.6,
    incomingTypingStart: 8.33,
    incomingTypingEnd: 9.17,
    priceQuestion: 9.23,
    priceReply: 11.1,
    surprise: 13,
    locationQuestion: 14.1,
    locationReply: 15.7,
    signature: 16.5,
  },
  motion: {
    appearSeconds: 0.34,
    scrollSeconds: 0.68,
    typingDotCycleSeconds: 0.95,
  },
  sound: {
    incomingVolume: 0.67,
    outgoingVolume: 0.63,
    handwritingVolume: 0.28,
    punchlineVolume: 0.63,
  },
  showSignature: true,
} as const;

export type FollowUpMessage = {
  id: string;
  text: string;
  direction: 'incoming' | 'outgoing';
  at: number;
  width: number;
  tail?: boolean;
  typing?: {start: number; end: number};
};

/** The gray sender reacts; the blue sender answers the price and location. */
export const FOLLOW_UP_MESSAGES: readonly FollowUpMessage[] = [
  {id: 'price-question', text: REEL.text.priceQuestion, direction: 'incoming', at: REEL.timing.priceQuestion, width: 520, typing: {start: REEL.timing.incomingTypingStart, end: REEL.timing.incomingTypingEnd}},
  {id: 'price-reply', text: REEL.text.priceReply, direction: 'outgoing', at: REEL.timing.priceReply, width: 385, typing: {start: 10.4, end: 11.03}},
  {id: 'surprise', text: REEL.text.surprise, direction: 'incoming', at: REEL.timing.surprise, width: 460, tail: false, typing: {start: 12.3, end: 12.93}},
  {id: 'location-question', text: REEL.text.locationQuestion, direction: 'incoming', at: REEL.timing.locationQuestion, width: 285},
  {id: 'location-reply', text: REEL.text.locationReply, direction: 'outgoing', at: REEL.timing.locationReply, width: 415, typing: {start: 15, end: 15.63}},
];

export const secondsToFrame = (seconds: number) => Math.round(seconds * REEL.fps);
export const DURATION_IN_FRAMES = secondsToFrame(REEL.duration);
