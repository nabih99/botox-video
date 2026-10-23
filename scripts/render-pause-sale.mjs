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
  const cover=compositions.find(c=>c.id==='BotoxSaleCover');
  await renderStill({serveUrl,composition:cover,puppeteerInstance:browser,frame:0,imageFormat:'png',
    output:path.join(out,'botox-sale-fast-cover.png'),overwrite:true});
  const jobs=[['BotoxSale','dysport'],['BotoxSaleSyringe','syringe'],['BotoxSaleSlow','slower']];
  for(const [id,name] of jobs){
    const composition=compositions.find(c=>c.id===id);
    if(!composition)throw new Error(`Missing composition ${id}`);
    let last=-1;
    console.log(`Rendering ${name}: ${composition.durationInFrames} frames`);
    if(!process.argv.includes('--stills-only')) await renderMedia({serveUrl,composition,puppeteerInstance:browser,codec:'h264',pixelFormat:'yuv420p',
      crf:16,imageFormat:'png',concurrency:3,audioBitrate:'192k',sampleRate:48000,overwrite:true,
      outputLocation:path.join(out,`botox-sale-fast-${name}.mp4`),
      onProgress:({progress})=>{const p=Math.floor(progress*10);if(p!==last){last=p;console.log(`${name}: ${p*10}%`);}}
    });
    // First/last frames and all three catches, including adjacent losing frames.
    for(const frame of [0,25,26,31,32,86,146,179]){
      await renderStill({serveUrl,composition,puppeteerInstance:browser,frame,imageFormat:'png',
        output:path.join(out,'qc-stills',`fast-${name}-${String(frame).padStart(3,'0')}.png`),overwrite:true});
    }
  }
}finally{await browser.close({silent:true});}
console.log(process.argv.includes('--stills-only')?'Finished: cover and QC stills.':'Finished: all three fast MP4s, cover, and QC stills.');
