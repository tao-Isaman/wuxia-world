const { chromium } = require('@playwright/test');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
const dir = __dirname;
(async () => {
  const browser = await chromium.launch({headless: true});
  const context = await browser.newContext({ viewport: {width:1440,height:900}, hasTouch:true });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const shot = async name => { const file = path.join(dir, name + '.png'); await page.screenshot({path:file}); return file; };
  const server = http.createServer(async (req, res) => {
    let code=''; for await (const chunk of req) code+=chunk.toString('utf8');
    try {
      if (code === 'CLOSE') {
        fs.writeFileSync(path.join(dir,'page-errors.json'), JSON.stringify(errors,null,2));
        await browser.close(); res.end(JSON.stringify({closed:true,errors})); server.close(); return;
      }
      fs.appendFileSync(path.join(dir,'actions.jsonl'),JSON.stringify({time:new Date().toISOString(),code})+'\n');
      const value = await new AsyncFunction('page','shot','errors',code)(page,shot,errors);
      res.setHeader('Content-Type','application/json; charset=utf-8'); res.end(JSON.stringify({ok:true,value}));
    } catch(e) { res.end(JSON.stringify({ok:false,error:e.stack})); }
  });
  server.listen(3028,'127.0.0.1',()=>console.log('OPENING REVIEW BROWSER READY 3028'));
})();
