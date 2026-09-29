const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(String(error)));
  const snap = async name => page.screenshot({ path: path.join(__dirname, name + '.png'), fullPage: false });
  const run = Object.getPrototypeOf(async function () {}).constructor;
  let active = false;
  const server = http.createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    if (req.url === '/close') {
      await browser.close();
      res.end(JSON.stringify({ closed: true, errors }));
      server.close();
      return;
    }
    if (active) { res.statusCode = 409; res.end('busy'); return; }
    active = true;
    try {
      const { code } = JSON.parse(body);
      const output = await new run('page', 'context', 'browser', 'snap', 'errors', code)(page, context, browser, snap, errors);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ output }));
    } catch (error) { res.statusCode = 500; res.end(JSON.stringify({ error: String(error) })); }
    finally { active = false; }
  });
  server.listen(9138, '127.0.0.1', () => console.log('World critic browser ready on 9138'));
})();
