const { chromium, expect } = require('@playwright/test');
const fs = require('node:fs');
const id = 'qc_capital_clinic_supplies';
(async () => {
  const out = 'review/clinic-errand'; fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  const errors = [], records = [];
  page.on('pageerror', e => errors.push(e.message));
  const state = () => page.evaluate(() => JSON.parse(localStorage.getItem('wusia-world-v1')).state);
  async function world() { await expect(page.getByTestId('world-canvas')).toHaveAttribute('data-ready', 'true', { timeout: 60000 }); }
  async function shot(name) {
    await page.screenshot({ path: `${out}/${name}.png` });
    const s = await state();
    records.push({ name, scene: s.currentSceneId, quest: s.quests[id], stamina: s.stamina, gold: s.gold, herb: s.inventory.herb ?? 0, xp: s.wExp, relationship: s.npcStates.city_capital_physician_lin?.relationship ?? 0 });
    console.log(name, JSON.stringify(records.at(-1)));
  }
  async function arrive() {
    for (let i = 0; i < 12; i++) {
      const s = await state();
      if (s.pendingEncounter) await page.getByRole('button', { name: /หนี/ }).click();
      else if (s.currentSceneId !== 'city_capital') await page.getByRole('button', { name: 'ปิด', exact: true }).click();
      else { await world(); return; }
    }
    throw new Error('Too many random arrival events');
  }
  async function npc(npcId) {
    await world();
    await page.getByRole('button', { name: /จุดหมาย/ }).click();
    await page.locator(`[data-marker-id="npc-${npcId}"]`).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 30000 });
  }
  await page.goto('http://127.0.0.1:3017');
  await page.locator('#hero-name').fill('ผู้ช่วยคลินิก');
  await page.getByRole('button', { name: 'เริ่มเกมใหม่' }).click();
  await world();
  await page.getByRole('button', { name: 'แสดงคำแนะนำการเดินทาง' }).click();
  await expect(page.locator('.journey-guide')).toContainText('ส่งคำขอเสบียงยาให้นายอำเภอหวู่');
  await shot('01-first-objective');
  await page.getByRole('button', { name: 'ย่อคำแนะนำการเดินทาง' }).click();
  await page.getByRole('button', { name: /จุดหมาย/ }).click();
  await page.locator('[data-marker-id="route_home_player__to__city_capital"]').click();
  await expect.poll(async () => (await state()).currentSceneId, { timeout: 30000 }).toBe('route_home_player__to__city_capital');
  await world();
  await page.getByRole('button', { name: /จุดหมาย/ }).click();
  await page.locator('[data-marker-id="destination-0"]').click();
  await expect.poll(async () => (await state()).lastLocationId, { timeout: 30000 }).toBe('city_capital');
  await arrive();
  await npc('city_capital_physician_lin');
  await expect(page.getByRole('dialog')).toContainText('เก็บสมุนไพรระดับ 5');
  await shot('02-lin-local-offer');
  await page.getByRole('button', { name: /เสบียงยาของคลินิก/ }).click();
  await shot('03-clinic-briefing');
  await page.getByRole('button', { name: 'ไปส่งคำขอให้นายอำเภอหวู่' }).click();
  await arrive();
  expect((await state()).quests[id]).toMatchObject({ status: 'active', stage: 0 });
  await expect(page.locator('.journey-guide')).toContainText('นายอำเภอหวู่');
  await npc('city_capital_magistrate_wu');
  await page.getByRole('button', { name: /ทักทาย/ }).click();
  await shot('04-wu-delivery-choice');
  await page.getByRole('button', { name: 'ส่งคำขอเสบียงจากหมอหลิน' }).click();
  expect((await state()).quests[id]).toMatchObject({ status: 'active', stage: 1 });
  await shot('05-wu-reply');
  await page.getByRole('button', { name: 'กลับไปรายงานหมอหลิน' }).click();
  await arrive();
  await expect(page.locator('.journey-guide')).toContainText('หมอหลิน → รับรางวัล');
  // Revisit Wu before claiming: the stage-zero delivery option is gone.
  await npc('city_capital_magistrate_wu');
  await page.getByRole('button', { name: /ทักทาย/ }).click();
  await expect(page.getByRole('button', { name: 'ส่งคำขอเสบียงจากหมอหลิน' })).toHaveCount(0);
  expect((await state()).quests[id]).toMatchObject({ status: 'active', stage: 1 });
  await page.getByRole('button', { name: 'กลับไปสำรวจนครหลวง' }).click();
  await arrive();
  await npc('city_capital_physician_lin');
  await shot('06-lin-turn-in');
  await page.getByRole('button', { name: /เสบียงยาของคลินิก/ }).click();
  const before = await state();
  await page.getByRole('button', { name: 'รับรางวัลเสบียงยาของคลินิก' }).click();
  const after = await state();
  expect(after.quests[id].status).toBe('done');
  expect(after.gold - before.gold).toBe(80);
  expect((after.inventory.herb ?? 0) - (before.inventory.herb ?? 0)).toBe(3);
  expect(after.wExp - before.wExp).toBe(20);
  expect((after.npcStates.city_capital_physician_lin?.relationship ?? 0) - (before.npcStates.city_capital_physician_lin?.relationship ?? 0)).toBe(2);
  await arrive();
  await shot('07-completed-reward');
  await npc('city_capital_physician_lin');
  await expect(page.getByRole('button', { name: /เสบียงยาของคลินิก/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'ปิด', exact: true }).click();
  await page.reload(); await world();
  expect((await state()).quests[id].status).toBe('done');
  if ((await state()).currentHp > 1) await expect(page.locator('.journey-guide')).toHaveCount(0);
  await page.getByRole('button', { name: 'ย่าม', exact: true }).click();
  await shot('08-earned-items');
  expect(errors).toEqual([]);
  fs.writeFileSync(`${out}/observations.json`, JSON.stringify({ records, errors, reward: { gold: 80, herb: 3, wExp: 20, linRelationship: 2 }, checks: ['real new-game home-capital-Lin-Wu-Lin completion', 'advanced quest requirement visible in offer', 'Wu delivery cannot repeat while active stage one', 'exact reward deltas through normal UI', 'completed quest cannot be offered or turned in again', 'completed save reload'] }, null, 2));
  await context.storageState({ path: `${out}/completed-state.json` });
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
