const { chromium } = require('@playwright/test');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const errors = [];
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, hasTouch: true });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);
  page.on('pageerror', error => errors.push(String(error)));
  page.on('console', message => { if(message.type() === 'error') errors.push(message.text()); });
  const snap = async name => {
    await page.screenshot({ path: path.join(root, name + '.png') });
    const text = await page.locator('body').innerText();
    fs.writeFileSync(path.join(root, name + '.txt'), text);
    return text;
  };
  await page.goto('http://127.0.0.1:3017', { waitUntil: 'networkidle' });
  const server = http.createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    try {
      if(req.url === '/close') {
        fs.writeFileSync(path.join(root, 'browser-errors.json'), JSON.stringify(errors, null, 2));
        await browser.close();
        res.end('closed');
        server.close();
        return;
      }
      const fn = new Function('page', 'context', 'browser', 'snap', 'fs', 'root', 'errors', 'return (async () => {' + body + '\n})()');
      const result = await fn(page, context, browser, snap, fs, root, errors);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(result ?? null));
    } catch (error) { res.statusCode = 500; res.end(String(error.stack)); }
  });
  server.listen(9187, '127.0.0.1', () => console.log('Reviewer browser ready at 9187'));
})();
