import React from 'react';
import {Composition, registerRoot, delayRender, continueRender, cancelRender, staticFile} from 'remotion';
import {PauseSale, PauseCover} from './PauseSale';
import {PAUSE_SALE} from './config';
import './styles.css';

if (typeof document !== 'undefined') {
  const fonts = delayRender('Load bundled Hebrew and editorial fonts');
  const product = new Image();
  product.src = staticFile('products/dysport-3d.png');
  Promise.all([
    document.fonts.load('700 74px "NN Hebrew"'),
    document.fonts.load('400 33px "NN Hebrew"'),
    document.fonts.load('500 65px "Cormorant Garamond"'),
    product.decode(),
  ]).then(() => continueRender(fonts)).catch(cancelRender);
}

const Root:React.FC = () => <>
  {([{id:'BotoxSale',variant:PAUSE_SALE.mainVariant},{id:'BotoxSaleSyringe',variant:'syringe'},{id:'BotoxSaleSlow',variant:'slow'},{id:'BotoxSaleVial',variant:'vial'}] as const).map(({id,variant})=><Composition
    key={id} id={id}
    component={PauseSale} defaultProps={{variant}} durationInFrames={PAUSE_SALE.durationInFrames}
    fps={PAUSE_SALE.fps} width={PAUSE_SALE.width} height={PAUSE_SALE.height}
  />)}
  <Composition id="BotoxSaleCover" component={PauseCover} durationInFrames={1} fps={30} width={1080} height={1920}/>
</>;
registerRoot(Root);
