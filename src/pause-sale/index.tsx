import React from 'react';
import {Composition, registerRoot, delayRender, continueRender, cancelRender} from 'remotion';
import {PauseSale, PauseCover} from './PauseSale';
import {PAUSE_SALE} from './config';
import './styles.css';

if (typeof document !== 'undefined') {
  const fonts = delayRender('Load bundled Hebrew and editorial fonts');
  Promise.all([
    document.fonts.load('700 74px "NN Hebrew"'),
    document.fonts.load('400 33px "NN Hebrew"'),
    document.fonts.load('500 65px "Cormorant Garamond"'),
  ]).then(() => continueRender(fonts)).catch(cancelRender);
}

const Root:React.FC = () => <>
  {(['syringe','slow','vial'] as const).map(variant=><Composition
    key={variant} id={variant==='syringe'?'BotoxSale':variant==='slow'?'BotoxSaleSlow':'BotoxSaleVial'}
    component={PauseSale} defaultProps={{variant:variant==='syringe'?PAUSE_SALE.mainVariant:variant}} durationInFrames={PAUSE_SALE.durationInFrames}
    fps={PAUSE_SALE.fps} width={PAUSE_SALE.width} height={PAUSE_SALE.height}
  />)}
  <Composition id="BotoxSaleCover" component={PauseCover} durationInFrames={1} fps={30} width={1080} height={1920}/>
</>;
registerRoot(Root);
