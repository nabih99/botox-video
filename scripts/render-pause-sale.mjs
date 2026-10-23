import path from 'node:path';
import {mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {bundle} from '@remotion/bundler';
import {getCompositions, openBrowser, renderMedia, renderStill} from '@remotion/renderer';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
process.chdir(root);
const out=path.join(root,'deliverables');
mkdirSync(out,{recursive:true});
mkdirSync(path.join(out,'qc-stills'),{recursive:true});
const serveUrl=await bundle({entryPoint:path.join(root,'src/pause-sale/index.tsx'),publicDir:path.join(root,'public')});
const browser=await openBrowser('chrome',{browserExecutable:process.env.CHROME_PATH||'/usr/bin/chromium'});
try {
  const compositions=await getCompositions(serveUrl,{puppeteerInstance:browser});
  const jobs=[['BotoxSale','syringe'],['BotoxSaleSlow','slow'],['BotoxSaleVial','vial']];
  for(const [id,name] of jobs){
    const composition=compositions.find(c=>c.id===id);
    if(!composition)throw new Error(`Missing composition ${id}`);
    let last=-1;
    console.log(`Rendering ${name}: ${composition.durationInFrames} frames`);
    await renderMedia({serveUrl,composition,puppeteerInstance:browser,codec:'h264',pixelFormat:'yuv420p',
      crf:16,imageFormat:'png',concurrency:3,audioBitrate:'192k',sampleRate:48000,overwrite:true,
      outputLocation:path.join(out,`nn-aesthetics-${name}.mp4`),
      onProgress:({progress})=>{const p=Math.floor(progress*10);if(p!==last){last=p;console.log(`${name}: ${p*10}%`);}}
    });
    // Adjacent losing/winning frames, a moving frame, and outro for visual review.
    for(const frame of [78,97,98,103,104,165,230,306]){
      await renderStill({serveUrl,composition,puppeteerInstance:browser,frame,imageFormat:'png',
        output:path.join(out,'qc-stills',`${name}-${String(frame).padStart(3,'0')}.png`),overwrite:true});
    }
  }
  const cover=compositions.find(c=>c.id==='BotoxSaleCover');
  await renderStill({serveUrl,composition:cover,puppeteerInstance:browser,frame:0,imageFormat:'png',
    output:path.join(out,'nn-aesthetics-cover.png'),overwrite:true});
}finally{await browser.close({silent:true});}
console.log('Finished: all three MP4s, cover, and QC stills.');
