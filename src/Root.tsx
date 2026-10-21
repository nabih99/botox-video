import React from 'react';
import {Composition} from 'remotion';
import {BotoxTextingReel} from './BotoxTextingReel';
import {DURATION_IN_FRAMES, REEL} from './config';

export const RemotionRoot: React.FC = () => <Composition
  id="BotoxTextingReel"
  component={BotoxTextingReel}
  durationInFrames={DURATION_IN_FRAMES}
  fps={REEL.fps}
  width={REEL.width}
  height={REEL.height}
/>;
