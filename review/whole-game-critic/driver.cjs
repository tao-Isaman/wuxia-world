const { chromium } = require('@playwright/test');
const http = require('http');
const fs = require('fs');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const out = path.resolve('review/whole-game-critic');
  const shot = async name => { await page.screenshot({ path: path.join(out, name + '.png') }); return name; };
  const inspect = async () => ({ text: await page.locator('body').innerText(), buttons: await page.getByRole('button').evaluateAll(es => es.map(e => ({text:e.innerText,aria:e.getAttribute('aria-label'),disabled:e.disabled}))), errors });
  await page.goto('http://127.0.0.1:3017');
  await page.waitForTimeout(1500);
  const server = http.createServer(async (req,res) => {
    let data = ''; req.on('data',chunk => data += chunk); req.on('end', async () => {
      try { const { code } = JSON.parse(data); const result = await eval('(async()=>{' + code + '})()'); res.writeHead(200,{'Content-Type':'application/json; charset=utf-8'}); res.end(JSON.stringify(result === undefined ? {ok:true} : result)); }
      catch(e) {res.writeHead(500,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify({error:String(e)}));}
    });
  });
  server.listen(9327,'127.0.0.1',()=>console.log('Reviewer browser ready on 9327'));
})().catch(e=>{console.error(e);process.exit(1)});
