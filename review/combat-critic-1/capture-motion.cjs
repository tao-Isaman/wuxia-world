const {chromium} = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
async function main() {
 const browser = await chromium.launch({headless:true});
 const context = await browser.newContext({viewport:{width:1440,height:900}});
 const page = await context.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});
 await page.goto('http://127.0.0.1:3017');
 const clean=JSON.parse(fs.readFileSync(path.join(__dirname,'starter-save.json'),'utf8'));
 clean.state.pendingBattle={opponentId:'petty_thief',onWin:'home_player',onLose:'home_player',nonFatal:true};
 await page.evaluate(state=>localStorage.setItem('wusia-world-v1',JSON.stringify(state)),clean);
 await page.reload();
 await page.waitForFunction(()=>[...document.querySelectorAll('button')].some(x=>x.innerText.includes('หมัดตรง')&&!x.disabled),null,{timeout:60000});
 const before=await page.locator('body').innerText();
 await page.waitForTimeout(6000);
 const after=await page.locator('body').innerText();
 const cdp=await context.newCDPSession(page);
 let n=0;
 const frames=[];
 cdp.on('Page.screencastFrame',event=>{
   const id=n++;
   fs.writeFileSync(path.join(__dirname,`motion-${String(id).padStart(3,'0')}.jpg`),Buffer.from(event.data,'base64'));
   frames.push({id,metadata:event.metadata});
   cdp.send('Page.screencastFrameAck',{sessionId:event.sessionId}).catch(()=>{});
 });
 await cdp.send('Page.startScreencast',{format:'jpeg',quality:82,everyNthFrame:1});
 await page.getByRole('button',{name:/หมัดตรง/}).click();
 await page.waitForTimeout(2400);
 await cdp.send('Page.stopScreencast');
 fs.writeFileSync(path.join(__dirname,'motion-capture.json'),JSON.stringify({errors,decisionHeldWithoutChange:before===after,before,after,frames},null,2));
 console.log(JSON.stringify({errors,frames:n,decisionHeldWithoutChange:before===after}));
 await browser.close();
}
main().catch(error=>{console.error(error);process.exit(1);});
