const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const readline = require('node:readline');
const path = require('node:path');
const out = path.resolve(__dirname);
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const timeout = setTimeout(async () => { await browser.close(); process.exit(0); }, 12 * 60 * 1000);
  const snap = async name => page.screenshot({ path: path.join(out, name + '.png') });
  const info = async () => ({ text: await page.locator('body').innerText(), buttons: await page.locator('button').evaluateAll(bs => bs.map(b => ({ text: b.innerText, label: b.getAttribute('aria-label'), disabled: b.disabled, box: b.getBoundingClientRect().toJSON() }))), canvas: await page.locator('canvas').evaluateAll(cs => cs.map(c => ({ width:c.width, height:c.height, box:c.getBoundingClientRect().toJSON(), parent:c.parentElement.outerHTML.slice(0,1000) }))), scroll: await page.evaluate(() => ({width:innerWidth,height:innerHeight,x:scrollX,y:scrollY,sw:document.documentElement.scrollWidth,sh:document.documentElement.scrollHeight})) });
  await page.goto('http://127.0.0.1:3017');
  console.log('READY ' + JSON.stringify(await info()));
  for await (const line of readline.createInterface({ input: process.stdin, terminal: false })) {
    try {
      if (line.trim() === 'CLOSE') { clearTimeout(timeout); await browser.close(); console.log('CLOSED ' + JSON.stringify(errors)); break; }
      const result = await eval('(async()=>{' + line + '})()');
      console.log('RESULT ' + JSON.stringify(result));
    } catch (error) { console.log('ERROR ' + error.stack); }
  }
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
