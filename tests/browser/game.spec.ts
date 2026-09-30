import { test, expect, type Page } from "@playwright/test";

async function start(page: Page) {
  await page.goto("/");
  await page.locator("#hero-name").fill("จอมยุทธ์");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
}

async function save(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("wusia-world-v1")!).state);
}

test("exploration: movement, menu pause, travel, NPC and save reload", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.screenshot({ path: "test-results/screenshots/title-desktop.png" });
  await start(page);
  const world = page.getByTestId("world-canvas");
  await expect(page.locator('[data-renderer="phaser"] canvas')).toHaveCount(1);
  await page.screenshot({ path: "test-results/screenshots/world-desktop.png" });
  const before = Number(await world.getAttribute("data-player-x"));
  await world.focus();
  await page.keyboard.down("d");
  await expect.poll(async () => Number(await world.getAttribute("data-player-x"))).toBeGreaterThan(before + 20);
  await page.keyboard.up("d");

  await page.getByRole("navigation", { name: "เมนูเกม" }).getByRole("button", { name: "ย่าม", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const pausedX = await world.getAttribute("data-player-x");
  await page.keyboard.down("d");
  await page.waitForTimeout(300);
  await page.keyboard.up("d");
  expect(await world.getAttribute("data-player-x")).toBe(pausedX);
  await page.getByRole("button", { name: "ปิด", exact: true }).click();

  await page.getByRole("button", { name: /จุดหมาย/ }).click();
  await page.locator('[data-marker-id="route_home_player__to__city_capital"]').click();
  await expect.poll(async () => (await save(page)).currentSceneId).toBe("route_home_player__to__city_capital");
  await expect(world).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: /จุดหมาย/ }).click();
  await page.locator('[data-marker-id="destination-0"]').click();
  await expect.poll(async () => {
    const state = await save(page);
    return state.currentSceneId === "city_capital" || state.lastLocationId === "city_capital";
  }).toBe(true);
  if ((await save(page)).pendingEncounter) await page.getByRole("button", { name: /หนี/ }).click();
  else if ((await save(page)).currentSceneId !== "city_capital") await page.getByRole("button", { name: "ปิด", exact: true }).click();
  expect((await save(page)).stamina).toBe(80);
  await expect(world).toHaveAttribute("data-ready", "true");
  await page.screenshot({ path: "test-results/screenshots/capital-desktop.png" });
  await page.getByRole("button", { name: /จุดหมาย/ }).click();
  await page.locator('[data-marker-id="npc-city_capital_physician_lin"]').click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "ปิด", exact: true }).click();
  await page.reload();
  await expect(world).toHaveAttribute("data-ready", "true");
  expect((await save(page)).currentSceneId).toBe("city_capital");
  expect((await save(page)).playerBuild.name).toBe("จอมยุทธ์");
  await expect(page.locator('[data-renderer="phaser"] canvas')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("Phaser battle clock, skill input, result and return to world", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await start(page);
  await page.evaluate(() => {
    const persisted = JSON.parse(localStorage.getItem("wusia-world-v1")!);
    persisted.state.pendingBattle = { opponentId: "petty_thief", onWin: "home_player", onLose: "home_player", nonFatal: true };
    persisted.state.playerBuild.stats.STR = 25;
    persisted.state.playerBuild.stats.AGI = 10;
    localStorage.setItem("wusia-world-v1", JSON.stringify(persisted));
  });
  await page.reload();
  await expect(page.getByTestId("battle-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await page.screenshot({ path: "test-results/screenshots/battle-desktop.png" });
  const skill = page.getByRole("button", { name: /หมัดตรง/ }).first();
  await expect(skill).toBeVisible();
  for (let attempt = 0; attempt < 8; attempt++) {
    if (await page.getByRole("button", { name: /ดำเนินเรื่อง/ }).isVisible()) break;
    await expect(skill).toBeVisible();
    await skill.click();
    await page.waitForTimeout(1800);
  }
  await expect(page.getByRole("button", { name: /ดำเนินเรื่อง/ })).toBeVisible({ timeout: 30_000 });
  await page.setViewportSize({ width: 844, height: 390 });
  await page.getByRole("button", { name: /บันทึกการต่อสู้/ }).click();
  await expect(page.getByRole("region", { name: "บันทึกการต่อสู้" })).toBeVisible();
  await page.getByRole("button", { name: /ดำเนินเรื่อง/ }).click();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true");
  expect((await save(page)).pendingBattle).toBeNull();
  await expect(page.locator('[data-renderer="phaser"] canvas')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test.describe("touch devices", () => {
test.use({ hasTouch: true });
test("battle stats stay open by touch and choices remain readable after rotation", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page);
  await page.evaluate(() => {
    const persisted = JSON.parse(localStorage.getItem("wusia-world-v1")!);
    persisted.state.pendingBattle = { opponentId: "petty_thief", onWin: "home_player", onLose: "home_player", nonFatal: true };
    localStorage.setItem("wusia-world-v1", JSON.stringify(persisted));
  });
  await page.reload();
  const battle = page.getByTestId("battle-canvas");
  await expect(battle).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: "ดูค่าสถานะของ จอมยุทธ์", exact: true }).tap();
  const detail = page.getByRole("dialog", { name: "ค่าสถานะ จอมยุทธ์", exact: true });
  await expect(detail.getByText("ATK", { exact: true })).toBeVisible();
  await page.waitForTimeout(450);
  await expect(detail).toBeVisible();
  await expect(battle).toHaveAttribute("data-paused", "true");
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(detail).toBeVisible();
  await page.getByRole("button", { name: "ปิดค่าสถานะ", exact: true }).tap();
  await expect(detail).not.toBeVisible();
  await expect(battle).toHaveAttribute("data-paused", "false");
  const actions = page.locator(".combat-action");
  await expect(actions).toHaveCount(3);
  for (const action of await actions.all()) {
    const bounds = await action.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(844);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(390);
    expect(await action.locator("strong").evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
    expect(await action.locator("small").evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(12);
  }
  expect(await page.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }))).toEqual({ width: 844, height: 390 });
});

test("portrait touch and landscape resize keep one usable canvas", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.screenshot({ path: "test-results/screenshots/title-mobile.png", fullPage: true });
  await start(page);
  const world = page.getByTestId("world-canvas");
  const before = Number(await world.getAttribute("data-player-y"));
  await page.touchscreen.tap(260, 480);
  await expect.poll(async () => Number(await world.getAttribute("data-player-y"))).not.toBe(before);
  await page.screenshot({ path: "test-results/screenshots/world-mobile.png" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole("navigation", { name: "เมนูเกม" }).getByRole("button", { name: "ย่าม", exact: true })).toBeVisible();
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('[data-renderer="phaser"] canvas')).toHaveCount(1);
  await expect.poll(async () => (await page.locator('[data-renderer="phaser"] canvas').boundingBox())?.width).toBe(844);
  await page.screenshot({ path: "test-results/screenshots/world-landscape.png" });
});
});

test("version 18 saves migrate and beast battles load the creature atlas", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await start(page);
  await page.evaluate(() => {
    const persisted = JSON.parse(localStorage.getItem("wusia-world-v1")!);
    persisted.version = 18;
    persisted.state.gender = "female";
    delete persisted.state.playerBodyId;
    persisted.state.gold = 321;
    persisted.state.pendingBattle = { opponentId: "wild_boar", onWin: "home_player", onLose: "home_player", nonFatal: true };
    localStorage.setItem("wusia-world-v1", JSON.stringify(persisted));
  });
  await page.reload();
  await expect(page.getByTestId("battle-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await page.screenshot({ path: "test-results/screenshots/beast-battle-desktop.png" });
  const state = await save(page);
  expect(state.playerBodyId).toBe("f1");
  expect(state.gold).toBe(321);
  expect(state.playerBuild.name).toBe("จอมยุทธ์");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("wusia-world-v1")!).version)).toBe(20);
  await expect(page.locator('[data-renderer="phaser"] canvas')).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(async () => (await page.locator('[data-renderer="phaser"] canvas').boundingBox())!.width).toBeLessThan(390);
  await page.screenshot({ path: "test-results/screenshots/battle-mobile.png" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
