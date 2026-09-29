const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const dir = path.join(__dirname, 'wave8-whole-evidence');
fs.mkdirSync(dir, { recursive: true });
const log = [];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, hasTouch: true });
  const page = await context.newPage();
  page.on('pageerror', error => log.push({ type: 'pageerror', text: error.message }));
  page.on('console', message => { if (message.type() === 'error') log.push({ type: 'consoleerror', text: message.text() }); });
  const snap = async name => {
    await page.screenshot({ path: path.join(dir, name + '.png'), fullPage: false });
    const text = await page.locator('body').innerText();
    fs.writeFileSync(path.join(dir, name + '.txt'), text);
    return text;
  };
  await page.goto('http://127.0.0.1:3017', { waitUntil: 'networkidle' });
  console.log('READY\n' + await snap('01-title-desktop'));
  const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  for await (const line of rl) {
    try {
      const command = JSON.parse(line);
      if (command.close) { fs.writeFileSync(path.join(dir, 'browser-errors.json'), JSON.stringify(log, null, 2)); await context.close(); await browser.close(); console.log('BROWSER CLOSED'); break; }
      const run = new Function('page', 'snap', 'log', 'return (async () => {' + command.code + '\n})()');
      const value = await run(page, snap, log);
      console.log('RESULT ' + JSON.stringify(value));
    } catch (error) { console.log('ERROR ' + error.stack); }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
