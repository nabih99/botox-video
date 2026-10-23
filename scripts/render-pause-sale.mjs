import path from 'node:path';
import {mkdirSync, renameSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
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
    output:path.join(out,'botox-sale-smooth-cover.png'),overwrite:true});
  const jobs=[['BotoxSale','dysport'],['BotoxSaleSyringe','syringe'],['BotoxSaleSlow','slower']];
  for(const [id,name] of jobs){
    const composition=compositions.find(c=>c.id===id);
    if(!composition)throw new Error(`Missing composition ${id}`);
    let last=-1;
    console.log(`Rendering ${name}: ${composition.durationInFrames} frames`);
    if(!process.argv.includes('--stills-only')) {
      const outputLocation=path.join(out,`botox-sale-smooth-${name}.mp4`);
      await renderMedia({serveUrl,composition,puppeteerInstance:browser,codec:'h264',pixelFormat:'yuv420p',
      crf:16,imageFormat:'png',concurrency:3,audioBitrate:'192k',sampleRate:48000,overwrite:true,
      outputLocation,
      onProgress:({progress})=>{const p=Math.floor(progress*10);if(p!==last){last=p;console.log(`${name}: ${p*10}%`);}}
      });
      // Remux against the exact-length WAV so AAC padding cannot extend the
      // container and hold its last video frame at the replay seam.
      const trimmed=path.join(out,`.smooth-${name}-exact.mp4`);
      execFileSync('ffmpeg',['-v','error','-y','-i',outputLocation,
        '-i',path.join(root,'public/audio/pause-challenge-smooth.wav'),
        '-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','192k',
        '-ar','48000','-af','volume=0.78','-t',String(composition.durationInFrames/composition.fps),
        '-movflags','+faststart',trimmed],{stdio:['ignore','pipe','pipe']});
      renameSync(trimmed,outputLocation);
    }
    // First/last frames and all three catches, including adjacent losing frames.
    for(const frame of [0,1,7,8,10,13,14,70,130,179]){
      await renderStill({serveUrl,composition,puppeteerInstance:browser,frame,imageFormat:'png',
        output:path.join(out,'qc-stills',`smooth-${name}-${String(frame).padStart(3,'0')}.png`),overwrite:true});
    }
  }
}finally{await browser.close({silent:true});}
console.log(process.argv.includes('--stills-only')?'Finished: cover and QC stills.':'Finished: all three smooth MP4s, cover, and QC stills.');
