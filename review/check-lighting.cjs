const {chromium,expect}=require('@playwright/test');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:900}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:3017');
 await page.locator('#hero-name').fill('นักเดินทาง');
 await page.getByRole('button',{name:'เริ่มเกมใหม่'}).click();
 const world=page.getByTestId('world-canvas');await expect(world).toHaveAttribute('data-ready','true',{timeout:60000});
 for(const location of ['home_player','city_capital'])for(const time of [0,9]){
   await page.evaluate(({location,time})=>{const s=JSON.parse(localStorage.getItem('wusia-world-v1'));Object.assign(s.state,{currentSceneId:location,lastLocationId:location,time,pendingEncounter:null,pendingBattle:null});localStorage.setItem('wusia-world-v1',JSON.stringify(s));},{location,time});
   await page.reload();await expect(world).toHaveAttribute('data-ready','true');await page.waitForTimeout(600);
   await page.screenshot({path:`review/lighting-${location}-${time===0?'day':'night'}.png`});
 }
 console.log({errors});await browser.close();
})();
