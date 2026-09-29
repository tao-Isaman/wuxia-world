const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const out = path.join(__dirname);
const base = 'http://127.0.0.1:3017';
async function ready(page, id) {
  await page.getByTestId(id).waitFor({ state: 'visible', timeout: 60000 });
  await page.waitForFunction((key) => document.querySelector(`[data-testid="${key}"]`)?.getAttribute('data-ready') === 'true', id);
}
async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(base);
  await page.locator('#hero-name').fill('Reviewer');
  await page.getByRole('button', { name: 'เริ่มเกมใหม่' }).click();
  await ready(page, 'world-canvas');
  const clean = await page.evaluate(() => JSON.parse(localStorage.getItem('wusia-world-v1')));
  fs.writeFileSync(path.join(out, 'starter-save.json'), JSON.stringify(clean, null, 2));
  await page.evaluate(() => {
    const persisted = JSON.parse(localStorage.getItem('wusia-world-v1'));
    persisted.state.pendingBattle = { opponentId: 'petty_thief', onWin: 'home_player', onLose: 'home_player', nonFatal: true };
    localStorage.setItem('wusia-world-v1', JSON.stringify(persisted));
  });
  await page.reload();
  await ready(page, 'battle-canvas');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(out, 'A-battle-desktop.png') });
  const data = await page.evaluate(() => ({
    text: document.body.innerText,
    buttons: [...document.querySelectorAll('button')].map(el => ({text: el.innerText, disabled: el.disabled, rect: el.getBoundingClientRect().toJSON()})),
    canvases: [...document.querySelectorAll('canvas')].map(el => ({width: el.width, height: el.height, parent: el.parentElement.outerHTML.slice(0, 1400)})),
  }));
  fs.writeFileSync(path.join(out, 'initial-live-observation.json'), JSON.stringify({ ...data, errors }, null, 2));
  console.log(JSON.stringify(data, null, 2));
  await browser.close();
}
main().catch(error => { console.error(error); process.exit(1); });
