import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {PAUSE_SALE as C, getOfferText, type ChallengeVariant} from './config';
import {getChallengeState} from './timeline';
import {Product} from './Products';

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (v: number) => { const p = clamp(v); return p*p*(3-2*p); };
const hebrew = '"NN Hebrew", sans-serif';
const serif = '"Cormorant Garamond", Georgia, serif';
const EYES = <svg width="35" height="30" viewBox="0 0 42 34" aria-label="👀" style={{marginInlineStart: 9, verticalAlign: '-5px'}}><ellipse cx="12" cy="17" rx="9" ry="13" fill="#fff" stroke="#B5A58E" strokeWidth="1.4"/><ellipse cx="31" cy="17" rx="9" ry="13" fill="#fff" stroke="#B5A58E" strokeWidth="1.4"/><ellipse cx="9" cy="18" rx="4" ry="6.5" fill="#171717"/><ellipse cx="28" cy="18" rx="4" ry="6.5" fill="#171717"/></svg>;

const Brand: React.FC<{large?: boolean}> = ({large = false}) => <div dir="ltr" style={{fontFamily:serif, fontSize:large?65:30, letterSpacing:large?8:5, fontWeight:500, whiteSpace:'nowrap'}}>{C.text.brand}</div>;

const Background = () => <AbsoluteFill style={{background:C.colors.ivory, overflow:'hidden'}}>
  <AbsoluteFill style={{background:'radial-gradient(ellipse at 32% 40%, #FFFFFF 0%, transparent 53%), radial-gradient(ellipse at 85% 75%, #DED0BE55, transparent 55%)'}}/>
  <div style={{position:'absolute',left:-450,top:580,width:1050,height:1050,borderRadius:'50%',border:'1px solid #C6A77B22'}}/>
  <div style={{position:'absolute',right:-580,top:100,width:1140,height:1140,borderRadius:'50%',border:'1px solid #C6A77B1C'}}/>
  <div style={{position:'absolute',left:70,right:70,top:139,height:1,background:`linear-gradient(90deg, transparent, ${C.colors.gold}88, transparent)`}}/>
  <div style={{position:'absolute',left:70,right:70,bottom:208,height:1,background:`linear-gradient(90deg, transparent, ${C.colors.gold}88, transparent)`}}/>
</AbsoluteFill>;

export const Offer: React.FC = () => <div data-offer="winning-only" dir="rtl" style={{position:'absolute',top:1468,left:100,width:880,height:192,textAlign:'center',background:'linear-gradient(105deg, #DED0BE66, #FBF8F1, #DED0BE66)',borderTop:`1px solid ${C.colors.gold}`,borderBottom:`1px solid ${C.colors.gold}`,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:18}}>
  <div data-offer-text style={{fontSize:58,fontWeight:700,lineHeight:1.3,whiteSpace:'nowrap'}}>{getOfferText()}</div>
  <div style={{fontSize:31,lineHeight:1.4}}>{C.text.screenshot}</div>
</div>;

/** A pure frame-driven scene; the QC script inspects its actual DOM at every frame. */
export const PauseScene: React.FC<{frame:number;variant:ChallengeVariant;cover?:boolean}> = ({frame,variant,cover=false}) => {
  const kind = variant === 'vial' ? 'vial' : 'syringe';
  const s = getChallengeState(frame,variant);
  const intro = smooth(frame/22);
  const outro = smooth((frame-270)/22);
  const loop = smooth((frame-336)/23);
  const challengeOpacity = (1-outro);
  const hookOpacity = cover ? 1 : (1-outro)+loop;
  const baseScale = kind==='vial'?1.25:0.85;
  const enter = smooth((frame-28)/26);
  const challengeVisible = cover ? 1 : challengeOpacity * enter;
  const liveX = cover ? 0 : s.active ? s.x : frame < 60 ? -820 : 820;
  const liveY = cover ? 0 : s.y;
  const liveRotation = cover ? -19 : s.rotation;
  const liveScale = cover ? 1.04 : s.scale;
  const instruction = kind==='vial'?C.text.vialInstruction:C.text.syringeInstruction;
  return <AbsoluteFill data-scene data-frame={frame} data-variant={variant} data-winning={s.winning&&!cover?'true':'false'} style={{color:C.colors.black,fontFamily:hebrew,overflow:'hidden'}}>
    <Background/>
    <div style={{position:'absolute',top:192,width:'100%',textAlign:'center',opacity:cover?1:0.72+0.28*intro*(1-loop)}}><Brand/></div>
    <div dir="rtl" style={{position:'absolute',top:315,left:100,width:880,textAlign:'center',opacity:hookOpacity,transform:`translateY(${cover?0:20*(1-intro+loop)}px)`}}>
      <div data-headline style={{fontSize:74,fontWeight:700,lineHeight:1.36,letterSpacing:-2}}>{C.text.headline.includes('לעצור')?<>{C.text.headline.split('לעצור')[0].trim()}<br/>לעצור{C.text.headline.split('לעצור')[1]}</>:C.text.headline}</div>
      <div data-support style={{fontSize:33,lineHeight:1.6,marginTop:24,color:'#5B5146',fontWeight:400}}>{C.text.support.replace('👀','').trim()}{EYES}</div>
    </div>
    <div dir="rtl" data-instruction style={{position:'absolute',top:621,left:95,width:890,textAlign:'center',fontSize:29,color:'#6B5B46',opacity:cover?1:challengeOpacity*smooth((frame-32)/19)}}>{instruction}</div>

    <div style={{position:'absolute',left:0,top:0,width:1080,height:1450,opacity:challengeVisible}}>
      <svg width="1080" height="1450" style={{position:'absolute',top:0,left:0}}>
        <defs><radialGradient id="floor"><stop stopColor="#9E8766" stopOpacity=".17"/><stop offset="1" stopColor="#9E8766" stopOpacity="0"/></radialGradient></defs>
        <ellipse cx="540" cy="1415" rx="206" ry="25" fill="url(#floor)"/>
        <path d="M282 1045 H305 M775 1045 H798" stroke={C.colors.gold} strokeWidth="1.3" opacity=".6"/>
        <circle cx="540" cy="1045" r="305" fill="none" stroke={C.colors.gold} strokeOpacity=".10" strokeWidth="1"/>
        <path d="M530 727 H550 M530 1363 H550" stroke={C.colors.gold} strokeWidth="1" opacity=".3"/>
      </svg>
      <div data-target data-transform={`0,0,0,1`} style={{position:'absolute',left:360,top:595,width:360,height:900,transform:`scale(${baseScale})`,opacity:cover?.7:1}}><Product kind={kind} outline id="fixed"/></div>
      <div data-moving data-transform={`${liveX},${liveY},${liveRotation},${liveScale}`} style={{position:'absolute',left:360,top:595,width:360,height:900,transform:`translate(${liveX}px,${liveY}px) rotate(${liveRotation}deg) scale(${baseScale*liveScale})`}}><Product kind={kind} id="moving"/></div>
      {s.winning&&!cover&&<svg width="1080" height="1450" style={{position:'absolute',left:0,top:0,pointerEvents:'none'}}><path d="M760 848 V872 M748 860 H772" stroke={C.colors.gold} strokeWidth="1.8"/><circle cx="315" cy="1190" r="3" fill={C.colors.gold}/></svg>}
    </div>

    {s.winning&&!cover&&<Offer/>}
    {!cover&&<div style={{position:'absolute',left:0,top:830,width:1080,textAlign:'center',opacity:outro*(1-loop),transform:`translateY(${24*(1-outro)}px)`}}>
      <div style={{fontFamily:serif,fontSize:220,lineHeight:1.05,letterSpacing:-18,color:'#A78B61',fontWeight:500}}>NN</div>
      <div style={{width:84,height:1,background:C.colors.gold,margin:'36px auto 38px'}}/>
      <Brand large/>
      <div dir="rtl" style={{fontSize:40,marginTop:42,color:'#5B5146'}}>{C.text.retry}</div>
    </div>}
    {cover&&<div dir="ltr" style={{position:'absolute',top:1519,width:'100%',textAlign:'center',fontSize:22,letterSpacing:7,color:'#8B7455'}}>THE PAUSE CHALLENGE</div>}
    <div dir="ltr" style={{position:'absolute',top:1674,width:'100%',fontFamily:'Arial,sans-serif',fontSize:18,letterSpacing:5,textAlign:'center',color:'#8C785C'}}>PAUSE <span style={{padding:'0 19px',opacity:.5}}>·</span> ALIGN <span style={{padding:'0 19px',opacity:.5}}>·</span> REPLAY</div>
  </AbsoluteFill>;
};

export const PauseSale: React.FC<{variant:ChallengeVariant}> = ({variant}) => {
  const frame = useCurrentFrame();
  return <><PauseScene frame={frame} variant={variant}/><Audio src={staticFile('audio/pause-challenge.wav')} volume={0.75}/></>;
};

export const PauseCover: React.FC = () => <PauseScene frame={98} variant="syringe" cover/>;
