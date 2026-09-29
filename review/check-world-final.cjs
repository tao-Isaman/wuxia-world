const { chromium, expect } = require('@playwright/test');
(async () => {
 const browser = await chromium.launch({headless:true});
 const context = await browser.newContext({viewport:{width:1440,height:900},hasTouch:true});
 const page=await context.newPage(); const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:3017',{timeout:90000});
 await page.locator('#hero-name').fill('นักเดินทาง');
 await page.getByRole('button',{name:'เริ่มเกมใหม่'}).click();
 const world=page.getByTestId('world-canvas');await expect(world).toHaveAttribute('data-ready','true',{timeout:60000});
 await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('wusia-world-v1'));Object.assign(s.state,{currentSceneId:'city_capital',lastLocationId:'city_capital',pendingEncounter:null,time:0});localStorage.setItem('wusia-world-v1',JSON.stringify(s));});
 await page.reload();await expect(world).toHaveAttribute('data-ready','true');
 await page.screenshot({path:'review/world-final-desktop.png'});
 const observations=[];
 for(const [name,width,height] of [['portrait',390,844],['landscape',844,390]]) {
   await page.setViewportSize({width,height});
   for(const [spot,id] of [['market','service-0'],['physician','npc-city_capital_physician_lin'],['magistrate','npc-city_capital_magistrate_wu']]) {
     await page.getByRole('button',{name:/จุดหมาย/}).click();
     await page.locator(`[data-marker-id="${id}"]`).click();
     await expect(page.getByRole('dialog')).toBeVisible({timeout:20000});
     await page.getByRole('button',{name:'ปิด',exact:true}).click();
     await page.waitForTimeout(450);
     const geometry=await page.evaluate(()=>{
       const host=document.querySelector('[data-testid="world-canvas"]');const r=document.querySelector('.journey-guide').getBoundingClientRect();
       const x=Number(host.dataset.playerScreenX),y=Number(host.dataset.playerScreenY),h=Number(host.dataset.playerScreenHeight);
       const a={left:x-h*.42,top:y-h,width:h*.84,height:h};
       return {actor:a,guide:{left:r.left,top:r.top,width:r.width,height:r.height},overlap:a.left<r.right&&a.left+a.width>r.left&&a.top<r.bottom&&a.top+a.height>r.top};
     });
     observations.push({name,spot,...geometry});expect(geometry.overlap,`${name}/${spot} guide covers hero`).toBe(false);
     await page.screenshot({path:`review/world-final-${name}-${spot}.png`});
   }
 }
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('button',{name:/จุดหมาย/}).click();
 const nav=page.locator('.world-places');const box=await nav.boundingBox();
 const cdp=await context.newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height-25,id:0}]});
 for(let i=1;i<=12;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+box.width/2,y:box.y+box.height-25-i*20,id:0}]});await page.waitForTimeout(20);}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await page.waitForTimeout(250);const scroll=await nav.evaluate(n=>n.scrollTop);expect(scroll).toBeGreaterThan(20);
 await page.screenshot({path:'review/world-final-touch-scroll.png'});
 await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('wusia-world-v1'));s.state.time=9;localStorage.setItem('wusia-world-v1',JSON.stringify(s));});
 await page.reload();await expect(world).toHaveAttribute('data-ready','true');await page.setViewportSize({width:1440,height:900});
 await page.waitForTimeout(350);await page.screenshot({path:'review/world-final-night.png'});
 console.log(JSON.stringify({observations,scroll,errors},null,2));
 await browser.close();
})();
