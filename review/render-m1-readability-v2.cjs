/** Diagnostic only. node review/render-m1-readability-v2.cjs --compile-only
 * Run browser only when coordinated: node review/render-m1-readability-v2.cjs --run
 * Never changes active catalog, artwork, production server, saves or runtime source.
 */
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdirSync, readFileSync, writeFileSync, existsSync, unlinkSync } = require('node:fs');
const { resolve, sep } = require('node:path');
const { randomInt, createHash } = require('node:crypto');
const { chromium } = require('@playwright/test');
const root = resolve(__dirname, '..');
const out = resolve(root, 'review/m1-readability-v2');
const entry = resolve(out, 'readability-entry.js');
const bundle = resolve(out, 'readability-bundle.js');
const origin = process.env.READABILITY_AUDIT_URL || 'http://127.0.0.1:3017';
const run = process.argv.includes('--run');
if (!run && !process.argv.includes('--compile-only')) {
  console.log('Use --compile-only to check the bundle, or --run after browser coordination.');
  process.exit(0);
}
mkdirSync(out, { recursive: true });
const source = `
import { createWorldRuntime } from '../../lib/three/world-runtime';
import { loadCharacterAtlas } from '../../lib/characters/sheet';
import { CHARACTER_CLIPS, CHARACTER_SHEET_LAYOUTS } from '../../lib/characters/catalog';
if (window.__readabilityCandidate) {
  CHARACTER_SHEET_LAYOUTS.m1 = { width:1199, height:1312,
    columns:[0,326,610,920,1199], rows:[0,359,674,970,1312] };
}
const host=document.createElement('main'); host.id='world'; host.tabIndex=0;
host.style.cssText='width:1440px;height:900px;position:relative;outline:none';
document.body.style.cssText='margin:0;background:#172723;overflow:hidden;font-family:serif';
document.body.append(host);
const presentation={key:'city_capital',name:'Capital diagnostic',image:'/maps/city_capital.png',
  playerImage:'/player/body/m1.png',spawn:{x:45,y:31.5},markers:[],time:8,
  rememberPosition:false,paused:true,props:[{id:'archive-chest',image:'/art/props/archive-chest.png',
    x:37.8,y:31.4,width:31,height:25,visible:true}]};
const idleFrames=[...CHARACTER_CLIPS.idle.frames];
window.__diagnosticState={ready:false,error:null};
const runtime=createWorldRuntime(host,()=>presentation,()=>{window.__diagnosticState.ready=true;},
  message=>{window.__diagnosticState.error=message;});
window.__setPose=(frame)=>{presentation.paused=true;CHARACTER_CLIPS.idle.frames=[frame];window.__advanceWorld(12);};
window.__startWalk=()=>{CHARACTER_CLIPS.idle.frames=idleFrames;presentation.paused=false;
  window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyD',key:'d',bubbles:true}));};
window.__stopWalk=()=>{window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyD',key:'d',bubbles:true}));};
window.__destroyDiagnostic=()=>runtime.destroy();
window.__measureAtlas=async()=>{const atlas=await loadCharacterAtlas('m1');
  const ctx=atlas.image.getContext('2d',{willReadFrequently:true});const frames=[];
  for(let f=0;f<16;f++){const p=ctx.getImageData(f%4*128,Math.floor(f/4)*128,128,128).data;
    let left=128,top=128,right=-1,bottom=-1,count=0,edge=0;
    for(let a=3;a<p.length;a+=4){if(p[a]<32)continue;let point=(a-3)/4,x=point%128,y=Math.floor(point/128);
      count++;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
      if(x===0||x===127||y===0||y===127)edge++;}
    frames.push({frame:f,pixels:count,edgePixels:edge,bounds:{x:left,y:top,width:right-left+1,height:bottom-top+1}});}
  return {frameSize:atlas.frameSize,feetY:atlas.feetY,rows:atlas.rows,directional:atlas.directional,frames};};
`;
let browser;
(async()=>{
  try {
    writeFileSync(entry, source);
    execFileSync('bun',['build',entry,'--target=browser','--format=esm',`--outfile=${bundle}`],{cwd:root,stdio:'pipe'});
    if (!run) { console.log('Diagnostic bundle compiled; browser not launched.'); return; }
    const bundleText=readFileSync(bundle,'utf8');
    const variants=randomInt(2)?['original','candidate']:['candidate','original'];
    const mapping={A:variants[0],B:variants[1]};
    writeFileSync(resolve(out,'mapping.json'),JSON.stringify(mapping,null,2));
    const report={context:'Diagnostic import of actual workspace atlas loader and Three world runtime, not production UI.',
      origin,viewport:{width:1440,height:900},spawn:{x:45,y:31.5},time:8,
      staticPoses:'Frames forced through diagnostic idle-clip selection; attack is posed, not a combat action.',
      genuineWalking:'Real KeyD event and actual world movement/animation, advanced at deterministic 60 Hz RAF steps.',
      environment:'Actual capital ground, foreground, lighting, world shader and closed archive chest; NPC/UI layers omitted equally.',
      directions:'Existing m1 north/south supplement loaded unchanged for both. Candidate has no new direction supplement; vertical walking not validated.',
      variants:{},errors:[]};
    browser=await chromium.launch({headless:true,timeout:30000});
    for (const [label,variant] of Object.entries(mapping)) {
      const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1,reducedMotion:'no-preference'});
      try {
        const page=await context.newPage();
        const errors=[];page.on('pageerror',error=>errors.push(error.message));
        await page.addInitScript(({candidate})=>{
          window.__readabilityCandidate=candidate;
          // Only this diagnostic context controls the runtime animation clock.
          let next=0,time=1000;const callbacks=new Map();
          window.requestAnimationFrame=fn=>{callbacks.set(++next,fn);return next;};
          window.cancelAnimationFrame=id=>callbacks.delete(id);
          window.__advanceWorld=(count=1)=>{for(let n=0;n<count;n++){
            time+=1000/60;const batch=[...callbacks.values()];callbacks.clear();batch.forEach(fn=>fn(time));}};
        },{candidate:variant==='candidate'});
        await page.route(`${origin}/__readability-audit.html`,route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html><head><title>Character comparison</title></head><body></body></html>'}));
        await page.route(/\/(art|maps|icons)\//,async route=>{
          const url=new URL(route.request().url());
          let path=resolve(root,'public','.'+decodeURIComponent(url.pathname));
          if(!path.startsWith(resolve(root,'public')+sep)) throw new Error('Invalid diagnostic asset path');
          if(variant==='candidate'&&url.pathname==='/art/characters/m1.png')path=resolve(root,'public/art/characters/m1-readability-v2.png');
          if(!existsSync(path))return route.continue();
          await route.fulfill({path});
        });
        await page.goto(`${origin}/__readability-audit.html`);
        await page.addScriptTag({type:'module',content:bundleText});
        // Poll from Node: main-world requestAnimationFrame is intentionally manual.
        const deadline=Date.now()+60000;
        while(true){const state=await page.evaluate(()=>window.__diagnosticState);
          if(state?.error)throw new Error(state.error);if(state?.ready)break;
          if(Date.now()>deadline)throw new Error('World diagnostic did not become ready');
          await new Promise(resolve=>setTimeout(resolve,100));}
        await page.evaluate(()=>window.__advanceWorld(12));
        const atlas=await page.evaluate(()=>window.__measureAtlas());
        for(const frame of atlas.frames){assert.ok(frame.pixels>0);assert.equal(frame.edgePixels,0);}
        const frames=[];
        async function capture(name,kind){
          const state=await page.locator('#world').evaluate(node=>({...node.dataset}));
          const x=Number(state.playerScreenX),y=Number(state.playerScreenY);
          const clip={x:Math.round(x-64),y:Math.round(y-106),width:128,height:128};
          await page.screenshot({path:resolve(out,`${label}-${name}.png`),clip});
          frames.push({name,kind,clip,worldX:Number(state.playerX),worldY:Number(state.playerY),
            screenX:x,screenY:y,nominalScreenHeight:Number(state.playerScreenHeight),frame:Number(state.playerFrame)});
        }
        for(let f=0;f<16;f++){
          await page.evaluate(frame=>window.__setPose(frame),f);
          await capture(`pose-${String(f).padStart(2,'0')}`,'forced static base-frame pose');
          if(f===0||f===10)await page.screenshot({path:resolve(out,`${label}-${f===0?'idle':'attack'}-world.png`)});
        }
        await page.evaluate(()=>{window.__setPose(0);window.__startWalk();});
        const seen=new Set();
        for(let tick=0;tick<90&&seen.size<4;tick++){
          await page.evaluate(()=>window.__advanceWorld(1));
          const frame=await page.locator('#world').getAttribute('data-player-frame');
          if(['4','5','6','7'].includes(frame)&&!seen.has(frame)){
            seen.add(frame);await capture(`walk-${frame}`,'genuine walking from keyboard input');
          }
        }
        await page.evaluate(()=>window.__stopWalk());
        assert.equal(seen.size,4,'Actual runtime walked through all four eastward frames');
        assert.deepEqual(errors,[]);
        const file=resolve(root,'public/art/characters',variant==='candidate'?'m1-readability-v2.png':'m1.png');
        report.variants[label]={sha256:createHash('sha256').update(readFileSync(file)).digest('hex'),atlas,frames};
        await page.evaluate(()=>window.__destroyDiagnostic());
      } finally { await context.close(); }
    }
    const a=report.variants.A.frames,b=report.variants.B.frames;
    assert.deepEqual(a.map(({worldX,worldY,screenX,screenY,frame})=>({worldX,worldY,screenX,screenY,frame})),
      b.map(({worldX,worldY,screenX,screenY,frame})=>({worldX,worldY,screenX,screenY,frame})), 'Matched placements and genuine walk simulation');
    writeFileSync(resolve(out,'rendered-report.json'),JSON.stringify(report,null,2));
    const sections=[['Idle poses',[0,1,2,3].map(f=>`pose-${String(f).padStart(2,'0')}`)],
      ['Walking poses at fixed position',[4,5,6,7].map(f=>`pose-${String(f).padStart(2,'0')}`)],
      ['Genuine walking — real movement and animation',[4,5,6,7].map(f=>`walk-${f}`)],
      ['Attack poses — diagnostic posing, not combat',[8,9,10,11].map(f=>`pose-${String(f).padStart(2,'0')}`)],
      ['Hit / guard / victory / defeat poses',[12,13,14,15].map(f=>`pose-${f}`)]];
    const html=`<!doctype html><html><head><meta charset="utf-8"><title>Character A/B comparison</title><style>
      body{margin:24px;background:#172723;color:#eee7d2;font:15px system-ui}h1{font-size:24px}p{max-width:1050px;line-height:1.5}
      section{margin:24px 0}h2{font-size:18px}article{display:flex;gap:24px}.variant{display:grid;grid-template-columns:repeat(4,128px)}
      .label{grid-column:1/-1;margin:0 0 8px;font-weight:700}.variant img{display:block;width:128px;height:128px;image-rendering:pixelated}
      .full{display:flex;gap:24px}.full figure{margin:0}.full img{width:512px;height:320px;image-rendering:pixelated}</style></head><body>
      <h1>Character A / B</h1><p>Same Three.js world renderer, capital placement, camera and light. Crops below are at actual captured display scale (128 × 128 pixels), without enlargement. The source-image identities are kept separately until judgement.</p>
      <p>Static poses use selected base frames. Attack is a diagnostic pose, not a played battle. Genuine walking uses the real keyboard input and motion system. This inspection omits NPC and UI layers equally. Neither comparison validates a new north/south sheet.</p>
      ${sections.map(([title,names])=>`<section><h2>${title}</h2><article>${['A','B'].map(label=>`<div class="variant"><div class="label">${label}</div>${names.map(name=>`<img src="${label}-${name}.png" alt="${label} ${name}">`).join('')}</div>`).join('')}</article></section>`).join('')}
      <section><h2>Full capital context (scaled overview; open images for 1:1)</h2><div class="full">${['A','B'].map(label=>`<figure><figcaption>${label}</figcaption><a href="${label}-idle-world.png"><img src="${label}-idle-world.png"></a></figure>`).join('')}</div></section>
      </body></html>`;
    writeFileSync(resolve(out,'comparison.html'),html);
    const compare=await browser.newContext({viewport:{width:1100,height:1800},deviceScaleFactor:1});
    try{const page=await compare.newPage();await page.route(`${origin}/__readability-comparison.html`,route=>route.fulfill({contentType:'text/html',body:html}));
      await page.route(/\/[AB]-(?:pose-\d+|walk-\d+|idle-world|attack-world)\.png$/,route=>route.fulfill({path:resolve(out,new URL(route.request().url()).pathname.split('/').pop())}));
      await page.goto(`${origin}/__readability-comparison.html`);await page.locator('img').evaluateAll(nodes=>Promise.all(nodes.map(image=>image.decode())));
      await page.screenshot({path:resolve(out,'comparison.png'),fullPage:true});
    }finally{await compare.close();}
    console.log('A/B actual-render evidence written to '+out+'. Mapping is separate. Browser closed on completion.');
  } finally {
    await browser?.close();
    for(const file of [entry,bundle])if(existsSync(file))unlinkSync(file);
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
