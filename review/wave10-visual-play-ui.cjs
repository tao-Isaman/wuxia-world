const { chromium } = require('playwright');
const readline = require('node:readline');
const fs = require('node:fs');
const path = require('node:path');

// Independent review driver: UI interactions and rendered DOM only.
// No product source, application stores, save editing, or diagnostic fixtures.
(async () => {
  const evidence = path.join(__dirname, 'wave10-visual-play');
  fs.mkdirSync(evidence, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, hasTouch: true });
  const page = await context.newPage();
  page.setDefaultTimeout(4000);
  await page.goto('http://127.0.0.1:3017/', { waitUntil: 'networkidle' });
  const report = async () => ({
    text: await page.locator('body').innerText(),
    controls: await page.locator('button, input, select, textarea, [role="button"]').evaluateAll(nodes => nodes.map((el, index) => {
      const box = el.getBoundingClientRect();
      return { index, tag: el.tagName, role: el.getAttribute('role'), ariaLabel: el.getAttribute('aria-label'), text: el.innerText || el.getAttribute('placeholder') || '', type: el.getAttribute('type'), disabled: el.disabled, box: { x: box.x, y: box.y, width: box.width, height: box.height } };
    }).filter(el => el.box.width && el.box.height)),
  });
  const emit = async (value) => {
    const state = { ...value, ...(value.command?.op === 'capture' ? {} : await report()) };
    fs.writeFileSync(path.join(evidence, 'latest-ui.json'), JSON.stringify(state, null, 2));
    fs.appendFileSync(path.join(evidence, 'ui-session.jsonl'), JSON.stringify(state) + '\n');
    console.log(JSON.stringify(value));
  };
  await emit({ ready: true });
  const lines = readline.createInterface({ input: process.stdin });
  let queue = Promise.resolve();
  lines.on('line', raw => {
    queue = queue.then(async () => {
      const command = JSON.parse(raw);
      switch (command.op) {
        case 'click': await page.getByRole(command.role || 'button', { name: command.name, exact: command.exact !== false }).nth(command.nth || 0).click(); break;
        case 'textclick': await page.getByText(command.text, { exact: command.exact !== false }).nth(command.nth || 0).click(); break;
        case 'fill': await page.getByRole(command.role || 'textbox', { name: command.name, exact: command.exact !== false }).nth(command.nth || 0).fill(command.value); break;
        case 'input': await page.locator('input').nth(command.nth || 0).fill(command.value); break;
        case 'press': await page.keyboard.press(command.key); break;
        case 'hold': await page.keyboard.down(command.key); await page.waitForTimeout(command.ms || 250); await page.keyboard.up(command.key); break;
        case 'point': await page.mouse.click(command.x, command.y); break;
        case 'tap': await page.touchscreen.tap(command.x, command.y); break;
        case 'resize': await page.setViewportSize({ width: command.width, height: command.height }); break;
        case 'scroll': await page.mouse.wheel(command.x || 0, command.y || 400); break;
        case 'wait': await page.waitForTimeout(Math.min(command.ms || 1000, 5000)); break;
        case 'reload': await page.reload({ waitUntil: 'networkidle' }); break;
        case 'capture': await page.screenshot({ path: path.join(evidence, command.file), fullPage: command.fullPage || false }); break;
        case 'burst': {
          const started = Date.now();
          await page.getByRole(command.role || 'button', { name: command.name, exact: command.exact !== false }).nth(command.nth || 0).click();
          const timings = [];
          for (let frame = 0; frame < (command.frames || 8); frame++) {
            timings.push({ frame, elapsedMs: Date.now() - started });
            await page.screenshot({ path: path.join(evidence, `${command.prefix}-${frame}.png`) });
            await page.waitForTimeout(command.intervalMs || 90);
          }
          fs.writeFileSync(path.join(evidence, `${command.prefix}-timings.json`), JSON.stringify(timings, null, 2));
          break;
        }
        case 'inspect': break;
        case 'close': await browser.close(); process.exit(0);
        default: throw new Error('Unknown UI operation');
      }
      await page.waitForTimeout(command.settle === undefined ? 180 : command.settle);
      await emit({ ok: true, command });
    }).catch(error => console.log(JSON.stringify({ error: String(error) })));
  });
})().catch(error => { console.error(error); process.exit(1); });
