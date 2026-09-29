const { chromium } = require('playwright');
const http = require('http');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, recordVideo: { dir: path.join(__dirname, 'video'), size: { width: 1440, height: 900 } }, hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const server = http.createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk;
    try {
      const { code } = JSON.parse(body);
      const result = await new (Object.getPrototypeOf(async function(){}).constructor)('page', 'context', 'browser', 'errors', 'dir', code)(page, context, browser, errors, __dirname);
      res.end(JSON.stringify({ ok: true, result }));
    } catch (error) {
      res.end(JSON.stringify({ ok: false, error: error.stack }));
    }
  });
  server.listen(3185, '127.0.0.1', () => console.log('Critic browser driver ready on 3185'));
})();
