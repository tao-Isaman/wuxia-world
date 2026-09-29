const { chromium } = require('playwright');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
(async () => {
  const output = path.join(__dirname, 'wave9-evidence');
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  page.setDefaultTimeout(7000);
  page.on('pageerror', error => fs.appendFileSync(path.join(output, 'browser-errors.txt'), error.stack + '\n'));
  await page.goto('http://127.0.0.1:3017');
  await page.waitForTimeout(1200);
  console.log('READY\n' + await page.locator('body').innerText());
  const lines = readline.createInterface({ input: process.stdin, terminal: false });
  for await (const line of lines) {
    try {
      if (line === 'CLOSE') { await browser.close(); console.log('BROWSER_CLOSED'); break; }
      const fn = new Function('page', 'context', 'browser', 'fs', 'path', 'output', 'return (async()=>{' + line + '})()');
      console.log(JSON.stringify(await fn(page,context,browser,fs,path,output)) ?? 'OK');
    } catch(error) { console.log('ERROR ' + error.stack); }
  }
})().catch(error => {console.error(error);process.exit(1);});
