import React from 'react';
import {AbsoluteFill, Audio, staticFile, useCurrentFrame} from 'remotion';
import {PAUSE_SALE as C, getOfferText, type ChallengeVariant} from './config';
import {getChallengeState} from './timeline';
import {Product} from './Products';
import {DysportProduct} from './DysportProduct';

const hebrew = '"NN Hebrew", sans-serif';
const Eyes = () => <svg width="33" height="29" viewBox="0 0 42 34" aria-label="👀" style={{marginInlineStart:10,verticalAlign:'-5px'}}><ellipse cx="12" cy="17" rx="9" ry="13" fill="#fff" stroke="#C6A77B" strokeWidth="1.2"/><ellipse cx="31" cy="17" rx="9" ry="13" fill="#fff" stroke="#C6A77B" strokeWidth="1.2"/><ellipse cx="9" cy="18" rx="4" ry="6.5" fill="#101C20"/><ellipse cx="28" cy="18" rx="4" ry="6.5" fill="#101C20"/></svg>;

const Background = () => <AbsoluteFill style={{background:C.colors.ivory,overflow:'hidden'}}>
  <AbsoluteFill style={{background:`radial-gradient(ellipse at 50% 58%, ${C.colors.beige} 0%, #15282D 36%, transparent 72%), linear-gradient(132deg, #182D33, transparent 38%, #0B1418 100%)`}}/>
  <div style={{position:'absolute',left:-215,top:-240,width:370,height:2550,transform:'rotate(29deg)',background:'linear-gradient(90deg, transparent, #BDDFD910, transparent)',filter:'blur(35px)'}}/>
  <div style={{position:'absolute',right:-520,top:700,width:1100,height:1100,border:'1px solid #AECBC012',borderRadius:'50%'}}/>
  <div style={{position:'absolute',left:84,right:84,top:202,height:1,background:`linear-gradient(90deg,transparent,${C.colors.gold}70,transparent)`}}/>
</AbsoluteFill>;

/** The light card exists for exactly the six winning frames in each pass. */
export const Offer:React.FC = () => <div data-offer="winning-only" dir="rtl" style={{position:'absolute',top:1468,left:100,width:880,height:192,background:'#F5F0E8',color:'#171717',borderTop:`2px solid ${C.colors.gold}`,borderBottom:`2px solid ${C.colors.gold}`,textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:18,boxShadow:'0 14px 80px #00000033'}}>
  <div data-offer-text style={{fontSize:58,fontWeight:700,lineHeight:1.3,whiteSpace:'nowrap'}}>{getOfferText()}</div>
  <div style={{fontSize:31,lineHeight:1.4}}>{C.text.screenshot}</div>
</div>;

/** Continuous six-second challenge: no opening scene, ending scene or clinic branding. */
export const PauseScene:React.FC<{frame:number;variant:ChallengeVariant;cover?:boolean}> = ({frame,variant,cover=false}) => {
  const kind=variant==='vial'?'vial':'syringe';
  const state=getChallengeState(frame,variant);
  const baseScale=kind==='vial'?1.08:.85;
  const liveX=cover?190:state.x;
  const liveY=cover?0:state.y;
  const liveRotation=cover?-8:state.rotation*.55;
  const depthRotation=cover?-12:state.rotation*3;
  const liveScale=cover?1:state.scale;
  const drawProduct=(outline:boolean,id:string) => kind==='vial'?<DysportProduct outline={outline} id={id}/>:<Product kind="syringe" outline={outline} id={id}/>;
  const transform=(x:number,y:number,z:number,depth:number,scale:number) => `perspective(1400px) translate(${x}px,${y}px) rotate(${z}deg) rotateY(${depth}deg) scale(${scale})`;
  return <AbsoluteFill data-scene data-frame={frame} data-variant={variant} data-winning={state.winning&&!cover?'true':'false'} style={{color:C.colors.black,fontFamily:hebrew,overflow:'hidden'}}>
    <Background/>
    <div dir="rtl" style={{position:'absolute',top:266,left:100,width:880,textAlign:'center'}}>
      <div data-headline style={{fontSize:74,fontWeight:700,lineHeight:1.36,letterSpacing:-2}}>{C.text.headline.includes('לעצור')?<>{C.text.headline.split('לעצור')[0].trim()}<br/>לעצור{C.text.headline.split('לעצור')[1]}</>:C.text.headline}</div>
      <div data-support style={{fontSize:32,lineHeight:1.6,marginTop:22,color:'#BED0CC'}}>{C.text.support.replace('👀','').trim()}<Eyes/></div>
    </div>
    <div data-instruction dir="rtl" style={{position:'absolute',top:575,left:95,width:890,textAlign:'center',fontSize:30,color:'#D1BC99'}}>{kind==='vial'?C.text.vialInstruction:C.text.syringeInstruction}</div>
    <div style={{position:'absolute',left:0,top:0,width:1080,height:1450}}>
      <svg width="1080" height="1450" style={{position:'absolute',left:0,top:0}}>
        <defs><radialGradient id="spotlight"><stop stopColor="#C6DBCF" stopOpacity=".07"/><stop offset="1" stopColor="#C6DBCF" stopOpacity="0"/></radialGradient><radialGradient id="shadow"><stop stopColor="#000" stopOpacity=".5"/><stop offset="1" stopColor="#000" stopOpacity="0"/></radialGradient></defs>
        <ellipse cx="540" cy="1055" rx="350" ry="395" fill="url(#spotlight)"/>
        <ellipse cx="540" cy="1420" rx="220" ry="28" fill="url(#shadow)"/>
        <path d="M285 1060 H307 M773 1060 H795" stroke={C.colors.gold} strokeWidth="1.5" opacity=".65"/>
      </svg>
      <div data-target data-transform="0,0,0,1" style={{position:'absolute',left:360,top:610,width:360,height:900,transform:transform(0,0,0,0,baseScale),opacity:.9,filter:'drop-shadow(0 0 7px #C6A77B18)'}}>{drawProduct(true,'fixed')}</div>
      <div data-moving data-transform={`${state.x},${state.y},${state.rotation},${state.scale}`} style={{position:'absolute',left:360,top:610,width:360,height:900,transform:transform(liveX,liveY,liveRotation,depthRotation,baseScale*liveScale),filter:'drop-shadow(18px 23px 18px #00000048)'}}>{drawProduct(false,'moving')}</div>
    </div>
    {state.winning&&!cover&&<Offer/>}
    <div dir="ltr" style={{position:'absolute',top:1700,width:'100%',fontFamily:'Arial,sans-serif',fontSize:17,letterSpacing:5,textAlign:'center',color:'#9FB1AB'}}>PAUSE <span style={{padding:'0 16px',color:C.colors.gold}}>·</span> ALIGN <span style={{padding:'0 16px',color:C.colors.gold}}>·</span> REPLAY</div>
  </AbsoluteFill>;
};

export const PauseSale:React.FC<{variant:ChallengeVariant}> = ({variant}) => <><PauseScene frame={useCurrentFrame()} variant={variant}/><Audio src={staticFile('audio/pause-challenge-fast.wav')} volume={.78}/></>;
export const PauseCover:React.FC = () => <PauseScene frame={0} variant="vial" cover/>;
