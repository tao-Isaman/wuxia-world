const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const out = path.join(__dirname, 'journey-guide');
fs.mkdirSync(out, { recursive: true });
const state = page => page.evaluate(() => JSON.parse(localStorage.getItem('wusia-world-v1')).state);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const observations = [];
  async function settleArrival() {
    for (let i = 0; i < 8; i++) {
      const current = await state(page);
      if (current.pendingEncounter) {
        await page.getByRole('button', { name: /หนี/ }).click();
      } else if (current.currentSceneId !== 'city_capital') {
        await page.getByRole('button', { name: 'ปิด', exact: true }).click();
      } else return;
    }
    throw new Error('Arrival did not settle after eight normal event dismissals');
  }
  async function record(name) {
    const geometry = await page.evaluate(() => {
      const rect = element => { const r = element.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; };
      const guide = document.querySelector('.journey-guide');
      const box = rect(guide);
      const controls = [...document.querySelectorAll('.player-hud, .location-hud, .world-controls, .game-menu, .journey-extras')].map(element => ({ className: element.className, ...rect(element) }));
      return { box, controls, overflow: document.documentElement.scrollWidth > innerWidth,
        text: guide.innerText, bodyScroll: document.querySelector('.journey-guide-content').scrollHeight > document.querySelector('.journey-guide-content').clientHeight };
    });
    expect(geometry.overflow).toBe(false);
    const a = geometry.box;
    for (const b of geometry.controls) expect(a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y, `${name} overlap ${b.className}`).toBe(false);
    await page.screenshot({ path: path.join(out, `${name}.png`) });
    observations.push({ name, ...geometry });
    console.log(name, JSON.stringify(geometry));
  }
  await page.goto('http://127.0.0.1:3017');
  await page.locator('#hero-name').fill('นักเดินทาง');
  await page.getByRole('button', { name: 'เริ่มเกมใหม่' }).click();
  const canvas = page.getByTestId('world-canvas');
  await expect(canvas).toHaveAttribute('data-ready', 'true', { timeout: 60000 });
  await expect(page.locator('.journey-guide')).toContainText('พลังรวม 20');
  await record('home-desktop');
  await page.setViewportSize({ width: 390, height: 844 });
  await record('home-portrait');
  await page.setViewportSize({ width: 844, height: 390 });
  await record('home-landscape');
  const savedBefore = await page.evaluate(() => localStorage.getItem('wusia-world-v1'));
  await page.getByRole('button', { name: 'ย่อคำแนะนำการเดินทาง' }).click();
  expect(await page.evaluate(() => localStorage.getItem('wusia-world-v1'))).toBe(savedBefore);
  await record('home-collapsed');
  await page.reload();
  await expect(page.locator('.journey-guide')).toHaveAttribute('data-collapsed', 'true');
  await page.getByRole('button', { name: 'แสดงคำแนะนำการเดินทาง' }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(canvas).toHaveAttribute('data-ready', 'true');
  await page.getByRole('button', { name: /จุดหมาย/ }).click();
  await expect(page.locator('.journey-guide')).toBeHidden();
  await page.locator('[data-marker-id="route_home_player__to__city_capital"]').click();
  await expect.poll(async () => (await state(page)).currentSceneId).toBe('route_home_player__to__city_capital');
  await expect(canvas).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.journey-guide')).toContainText('เข้าเมืองใช้พลังอีก 10');
  await record('route-portrait');
  await page.setViewportSize({ width: 844, height: 390 });
  await record('route-landscape');
  await page.setViewportSize({ width: 390, height: 844 });
  expect((await state(page)).stamina).toBe(90);
  await page.getByRole('button', { name: /จุดหมาย/ }).click();
  await page.locator('[data-marker-id="destination-0"]').click();
  await expect.poll(async () => (await state(page)).lastLocationId).toBe('city_capital');
  await settleArrival();
  await expect(canvas).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.journey-guide')).toContainText('พบหมอหลิน');
  await record('capital-portrait');
  await page.setViewportSize({ width: 844, height: 390 });
  await record('capital-landscape');
  await page.setViewportSize({ width: 390, height: 844 });
  expect((await state(page)).stamina).toBe(80);
  await page.getByRole('button', { name: /จุดหมาย/ }).click();
  await page.locator('[data-marker-id="npc-city_capital_physician_lin"]').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.screenshot({ path: path.join(out, 'physician-offer.png') });
  await page.getByRole('button', { name: /บัวหิมะเพื่อผู้ป่วย/ }).click();
  await page.getByRole('button', { name: /รับหาบัวหิมะ/ }).click();
  await page.getByRole('button', { name: /รับทราบ/ }).click();
  await settleArrival();
  await expect(canvas).toHaveAttribute('data-ready', 'true');
  expect((await state(page)).quests.qc_capital_rare_herb.status).toBe('active');
  await expect(page.locator('.journey-guide')).toContainText('ก้นหุบเขาตัดใจ');
  await record('quest-portrait');
  await page.setViewportSize({ width: 844, height: 390 });
  await record('quest-landscape');
  await page.setViewportSize({ width: 1440, height: 900 });
  await record('quest-desktop');
  await page.reload();
  await expect(page.locator('.journey-guide')).toContainText('ขั้นที่ 1 / 2');
  await context.storageState({ path: path.join(out, 'accepted-quest-state.json') });

  // Fixture checks are separate from the real start/travel/accept flow above.
  await page.evaluate(() => {
    const persisted = JSON.parse(localStorage.getItem('wusia-world-v1'));
    persisted.state.quests.qc_capital_rare_herb.stage = 1;
    localStorage.setItem('wusia-world-v1', JSON.stringify(persisted));
  });
  await page.reload();
  await expect(page.locator('.journey-guide')).toContainText('นำบัวหิมะไปส่งหมอหลิน');
  await expect(page.locator('.journey-guide')).toContainText('ขั้นที่ 2 / 2');
  await page.evaluate(() => {
    const persisted = JSON.parse(localStorage.getItem('wusia-world-v1'));
    persisted.state.quests.qc_capital_rare_herb.status = 'done';
    localStorage.setItem('wusia-world-v1', JSON.stringify(persisted));
  });
  await page.reload();
  await expect(page.locator('.journey-guide')).toHaveCount(0);
  await page.evaluate(() => {
    const persisted = JSON.parse(localStorage.getItem('wusia-world-v1'));
    persisted.state.quests = {};
    persisted.state.currentSceneId = 'home_player';
    persisted.state.lastLocationId = 'home_player';
    persisted.state.stamina = 15;
    localStorage.setItem('wusia-world-v1', JSON.stringify(persisted));
  });
  await page.reload();
  await expect(page.locator('.journey-guide')).toContainText('เติมพลังที่เมนู พักผ่อน');
  await page.setViewportSize({ width: 390, height: 844 });
  await record('low-stamina-portrait');
  expect(errors).toEqual([]);
  fs.writeFileSync(path.join(out, 'observations.json'), JSON.stringify({ observations, errors, checks: ['real home-road-capital travel: 100 → 90 → 80 stamina', 'real physician quest acceptance', 'all viewport HUD/controls non-overlap', 'collapse persisted without modifying game save', 'guide hidden during destination chooser', 'quest stage reload', 'fixture: stage two; done hidden; low stamina'] }, null, 2));
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
