const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
(async () => {
  const out = 'review/journey-guide-compact';
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  const errors = [], records = [];
  page.on('pageerror', e => errors.push(e.message));
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('wusia-world-v1')).state);
  async function ready() { await expect(page.getByTestId('world-canvas')).toHaveAttribute('data-ready', 'true', { timeout: 60000 }); }
  async function shot(name) {
    await expect(page.locator('.journey-guide')).toHaveAttribute('data-collapsed', 'true');
    const result = await page.evaluate(() => {
      const r = document.querySelector('.journey-guide').getBoundingClientRect();
      const host = document.querySelector('[data-testid="world-canvas"]');
      const x = Number(host.dataset.playerX), y = Number(host.dataset.playerY), scale = Math.max(innerWidth / 960, innerHeight / 640);
      const vw = innerWidth / scale, vh = innerHeight / scale;
      const cx = vw >= 960 ? 480 : Math.max(vw / 2, Math.min(x, 960 - vw / 2));
      const cy = vh >= 640 ? 320 : Math.max(vh / 2, Math.min(y, 640 - vh / 2));
      const hero = { x: (x - cx) * scale + innerWidth / 2, y: (y - cy) * scale + innerHeight / 2 };
      return { guide: { x: r.x, y: r.y, width: r.width, height: r.height }, heroFoot: hero,
        heroTopElement: document.elementFromPoint(hero.x, hero.y - 30)?.tagName,
        text: document.querySelector('.journey-guide').innerText, viewport: { width: innerWidth, height: innerHeight } };
    });
    expect(result.guide.height).toBeLessThanOrEqual(48);
    expect(result.heroTopElement).toBe('CANVAS');
    await page.screenshot({ path: `${out}/${name}.png` });
    records.push({ name, ...result });
    console.log(name, JSON.stringify(result));
  }
  await page.goto('http://127.0.0.1:3017');
  await page.locator('#hero-name').fill('ทางสายใหม่');
  await page.getByRole('button', { name: 'เริ่มเกมใหม่' }).click();
  await ready();
  await shot('01-home-portrait');
  await page.setViewportSize({ width: 844, height: 390 });
  await shot('02-home-landscape');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: /จุดหมาย/ }).click();
  await page.locator('[data-marker-id="route_home_player__to__city_capital"]').click();
  await expect.poll(async () => (await state()).currentSceneId, { timeout: 30000 }).toBe('route_home_player__to__city_capital');
  await ready();
  await page.getByRole('button', { name: /จุดหมาย/ }).click();
  await page.locator('[data-marker-id="destination-0"]').click();
  await expect.poll(async () => (await state()).lastLocationId, { timeout: 30000 }).toBe('city_capital');
  for (let i = 0; i < 8; i++) {
    const s = await state();
    if (s.pendingEncounter) await page.getByRole('button', { name: /หนี/ }).click();
    else if (s.currentSceneId !== 'city_capital') await page.getByRole('button', { name: 'ปิด', exact: true }).click();
    else break;
  }
  await ready();
  await shot('03-capital-portrait');
  await page.setViewportSize({ width: 844, height: 390 });
  await shot('04-capital-landscape');
  await page.setViewportSize({ width: 390, height: 844 });
  const before = await page.getByTestId('world-canvas').getAttribute('data-player-y');
  expect(await page.evaluate(() => document.elementFromPoint(240, 510)?.tagName)).toBe('CANVAS');
  await page.touchscreen.tap(240, 510);
  await expect.poll(async () => page.getByTestId('world-canvas').getAttribute('data-player-y')).not.toBe(before);
  await page.waitForTimeout(1500);
  await shot('05-capital-after-touch');
  const saved = await page.evaluate(() => localStorage.getItem('wusia-world-v1'));
  await page.getByRole('button', { name: 'แสดงคำแนะนำการเดินทาง' }).click();
  await expect(page.locator('.journey-guide-content')).toBeVisible();
  await expect(page.locator('.journey-guide-content')).toContainText('หมอหลินต้องการบัวหิมะ');
  expect(await page.evaluate(() => localStorage.getItem('wusia-world-v1'))).toBe(saved);
  await page.screenshot({ path: `${out}/06-capital-expanded-on-request.png` });
  await page.reload(); await ready();
  await expect(page.locator('.journey-guide')).toHaveAttribute('data-collapsed', 'false');
  await page.getByRole('button', { name: 'ย่อคำแนะนำการเดินทาง' }).click();
  await page.reload(); await ready();
  await expect(page.locator('.journey-guide')).toHaveAttribute('data-collapsed', 'true');
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator('.journey-guide')).toHaveAttribute('data-collapsed', 'true');
  expect(errors).toEqual([]);
  fs.writeFileSync(`${out}/observations.json`, JSON.stringify({ records, errors, checks: [
    'actual new-game home-road-capital navigation', 'default compact portrait and landscape',
    'hero pixels directly target canvas at all four spawn shots', 'portrait ground touch moves hero',
    'explicit expand/collapse reload preference retained', 'guide toggle leaves game save unchanged',
  ] }, null, 2));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
