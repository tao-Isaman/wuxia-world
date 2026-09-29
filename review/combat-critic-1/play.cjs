const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const out = __dirname;
const mode = process.argv[2] || 'attack';
const snapshots = [];
const errors = [];
const clean = JSON.parse(fs.readFileSync(path.join(out, 'starter-save.json'), 'utf8'));
const stamp = () => new Date().toISOString();
async function read(page) {
  return page.evaluate(() => ({
    text: document.body.innerText,
    buttons: [...document.querySelectorAll('button')].map(el => ({text:el.innerText, disabled:el.disabled, rect:el.getBoundingClientRect().toJSON()})),
    canvas: {...document.querySelector('[data-testid="battle-canvas"]')?.dataset},
    viewport: {width:innerWidth, height:innerHeight, scrollWidth:document.documentElement.scrollWidth, scrollHeight:document.documentElement.scrollHeight, scrollY},
  }));
}
async function screenshot(page, name) {
  await page.screenshot({path: path.join(out, name + '.png')});
}
async function startRecord(page) {
  await page.evaluate(() => {
    window.__reviewFrames = [];
    window.__reviewStart = performance.now();
    let prev = '';
    window.__reviewInterval = setInterval(() => {
      const canvas = document.querySelector('[data-testid="battle-canvas"]');
      const state = {text: document.body.innerText, canvas: {...canvas?.dataset}};
      const value = JSON.stringify(state);
      if (value !== prev) window.__reviewFrames.push({ms: performance.now()-window.__reviewStart, ...state});
      prev = value;
    }, 16);
  });
}
async function stopRecord(page, name) {
  const frames = await page.evaluate(() => {clearInterval(window.__reviewInterval);return window.__reviewFrames;});
  fs.writeFileSync(path.join(out, name + '-timeline.json'), JSON.stringify(frames, null, 2));
}
async function action(page, kind, name, frames = false) {
  const pattern = kind === 'guard' ? /ตั้งรับ/ : kind === 'recover' ? /รวบรวมปราณ/ : /หมัดตรง/;
  const button = page.getByRole('button', {name:pattern}).first();
  await button.waitFor({state:'visible', timeout:20000});
  await page.waitForFunction((label) => [...document.querySelectorAll('button')].some(b => b.innerText.includes(label) && !b.disabled), kind === 'guard' ? 'ตั้งรับ' : kind === 'recover' ? 'รวบรวมปราณ' : 'หมัดตรง', {timeout:30000});
  snapshots.push({step: name+'-before', at:stamp(), ...await read(page)});
  if (frames) {await screenshot(page, name+'-ready'); await startRecord(page);}
  await button.click();
  if (frames) {
    for (let i=0; i<9; i++) {
      await screenshot(page, name+'-frame-'+i);
      await page.waitForTimeout(90);
    }
    await page.waitForTimeout(1000);
    await stopRecord(page, name);
  } else await page.waitForTimeout(1500);
  snapshots.push({step: name+'-after', at:stamp(), ...await read(page)});
}
async function main() {
  const browser = await chromium.launch({headless:true});
  const context = await browser.newContext({viewport:{width:mode==='mobile'?390:1440,height:mode==='mobile'?844:900}, hasTouch:mode==='mobile', recordVideo: {dir:path.join(out, 'videos'), size:mode==='mobile'?{width:390,height:844}:{width:1440,height:900}}});
  const page = await context.newPage();
  page.on('pageerror', err => errors.push({type:'pageerror', message:err.message}));
  page.on('console', msg => {if(msg.type()==='error') errors.push({type:'console', message:msg.text()});});
  page.on('response', response => {if(response.status()>=400)errors.push({type:'http',url:response.url(),status:response.status()});});
  await page.goto('http://127.0.0.1:3017');
  clean.state.pendingBattle = {opponentId:'petty_thief',onWin:'home_player',onLose:'home_player',nonFatal:true};
  if(mode==='recover') clean.state.currentMp=0;
  await page.evaluate(state => localStorage.setItem('wusia-world-v1',JSON.stringify(state)),clean);
  await page.reload();
  await page.waitForFunction(() => document.querySelector('[data-testid="battle-canvas"]')?.getAttribute('data-ready')==='true', null, {timeout:60000});
  snapshots.push({step:'initial',at:stamp(),...await read(page)});
  if(mode==='mobile') {
    await action(page,'attack','mobile-portrait-strike',true);
    await screenshot(page,'mobile-portrait-after');
    await page.setViewportSize({width:844,height:390});
    await page.waitForTimeout(500);
    await screenshot(page,'mobile-landscape-top');
    snapshots.push({step:'landscape-top',...await read(page)});
    await page.getByRole('button',{name:/หมัดตรง/}).scrollIntoViewIfNeeded();
    await screenshot(page,'mobile-landscape-controls');
    snapshots.push({step:'landscape-controls',...await read(page)});
    await action(page,'guard','mobile-landscape-guard',true);
    await page.setViewportSize({width:390,height:844});
    await screenshot(page,'mobile-portrait-resize-return');
    snapshots.push({step:'portrait-return',...await read(page)});
  } else {
    if(mode==='guard') {
      await action(page,'guard','guard-first',true);
      await action(page,'attack','guard-followup-strike',true);
    } else if(mode==='recover') {
      await action(page,'recover','low-mp-recover',true);
      await action(page,'guard','recovered-guard',true);
    } else await action(page,'attack','attack-first',true);
    const outcome = page.getByRole('button',{name:/ดำเนินเรื่อง/});
    for(let i=0;i<30;i++) {
      if(await outcome.isVisible())break;
      await action(page,'attack',mode+'-continue-'+i,false);
    }
    await outcome.waitFor({state:'visible',timeout:15000});
    await screenshot(page,mode+'-outcome');
    snapshots.push({step:'outcome',...await read(page)});
    const log = page.getByRole('button',{name:/บันทึกการต่อสู้/});
    if(await log.isVisible()) {await log.click(); await screenshot(page,mode+'-outcome-log'); snapshots.push({step:'outcome-log',...await read(page)});}
    await outcome.click();
    await page.waitForFunction(() => document.querySelector('[data-testid="world-canvas"]')?.getAttribute('data-ready')==='true',null,{timeout:60000});
    snapshots.push({step:'returned',...await read(page),save:await page.evaluate(()=>JSON.parse(localStorage.getItem('wusia-world-v1')))});
    await screenshot(page,mode+'-world-return');
  }
  fs.writeFileSync(path.join(out,mode+'-observations.json'),JSON.stringify({mode,errors,snapshots},null,2));
  console.log(JSON.stringify({mode,errors,steps:snapshots.map(x=>({step:x.step,text:x.text,viewport:x.viewport}))},null,2));
  const video = page.video();
  await context.close();
  await video.saveAs(path.join(out,mode+'-play.webm'));
  await browser.close();
}
main().catch(error=>{fs.writeFileSync(path.join(out,mode+'-failure.json'),JSON.stringify({error:error.stack,errors,snapshots},null,2));console.error(error);process.exit(1);});
