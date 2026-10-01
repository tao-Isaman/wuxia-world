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
  await page.locator(`[data-places-tab="${await page.locator('[data-marker-id="route_home_player__to__city_capital"]').getAttribute("data-category")}"]`).click();
  await page.locator('[data-marker-id="route_home_player__to__city_capital"]').click();
  await expect.poll(async () => (await save(page)).currentSceneId).toBe("route_home_player__to__city_capital");
  await expect(world).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: /จุดหมาย/ }).click();
  await page.locator(`[data-places-tab="${await page.locator('[data-marker-id="destination-0"]').getAttribute("data-category")}"]`).click();
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
  await page.locator(`[data-places-tab="${await page.locator('[data-marker-id="npc-city_capital_physician_lin"]').getAttribute("data-category")}"]`).click();
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

async function units(page: Page) {
  return JSON.parse((await page.getByTestId("battle-canvas").getAttribute("data-units")) ?? "[]") as
    { id: string; team: string; x: number; y: number; hp: number; alive: boolean }[];
}
async function tapCell(page: Page, x: number, y: number) {
  const point = await page.getByTestId("battle-canvas").evaluate((host, cell) =>
    (host as HTMLElement & { gridCellPoint?: (x: number, y: number) => { x: number; y: number } | null }).gridCellPoint?.(cell.x, cell.y) ?? null, { x, y });
  expect(point).not.toBeNull();
  await page.mouse.click(point!.x, point!.y);
}

test("grid battle: tap a tile to move, auto plays to the result, back to the world", async ({ page }) => {
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
  const battle = page.getByTestId("battle-canvas");
  await expect(battle).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  // Hero and thief stand on the tactics board; the turn order is shown.
  await expect(page.getByTestId("turn-timeline")).toBeVisible();
  expect((await units(page)).map((u) => u.team).sort()).toEqual(["ally", "enemy"]);
  await expect(page.getByRole("button", { name: "ถอยหนี" })).toBeVisible();
  await expect(page.getByRole("button", { name: "ตั้งรับ" })).toHaveCount(0);
  await page.screenshot({ path: "test-results/screenshots/grid-battle-desktop.png" });

  // On the hero's turn, tapping a blue tile walks there.
  await expect(page.getByTestId("combat-status")).toHaveAttribute("data-phase", "player", { timeout: 30_000 });
  await expect(battle).toHaveAttribute("data-anim", "idle");
  const hero = (await units(page)).find((u) => u.id === "A")!;
  await tapCell(page, hero.x + 1, hero.y);
  await expect.poll(async () => (await units(page)).find((u) => u.id === "A")!.x).toBe(hero.x + 1);

  // อัตโนมัติ lets the AI finish the fight.
  await page.getByRole("button", { name: /อัตโนมัติ/ }).click();
  await expect(page.getByTestId("combat-result")).toBeVisible({ timeout: 90_000 });
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
test("grid battle: unit info by touch, skill bar readable after rotation, no page scroll", async ({ page }) => {
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
  await page.getByTestId("turn-timeline").getByRole("button", { name: "ดู จอมยุทธ์" }).first().tap();
  const card = page.getByTestId("unit-card");
  await expect(card).toBeVisible();
  await expect(card).toContainText("จอมยุทธ์");
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(card).toBeVisible();
  await page.getByRole("button", { name: "ปิดข้อมูล" }).tap();
  await expect(card).toHaveCount(0);
  const cards = page.locator(".gb-skill");
  expect(await cards.count()).toBeGreaterThan(0);
  for (const control of [...await cards.all(), page.getByRole("button", { name: "ถอยหนี" })]) {
    const bounds = await control.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(844);
    expect(bounds!.height).toBeGreaterThanOrEqual(40);
  }
  expect(await cards.first().locator("strong").evaluate((el) => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(13);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(844);
  await page.screenshot({ path: "test-results/screenshots/grid-battle-landscape.png" });
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
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("wusia-world-v1")!).version)).toBe(21);
  await expect(page.locator('[data-renderer="phaser"] canvas')).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect.poll(async () => (await page.locator('[data-renderer="phaser"] canvas').boundingBox())!.width).toBeLessThan(390);
  await page.screenshot({ path: "test-results/screenshots/battle-mobile.png" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("rigged NPCs stroll around their spot and stand still when the hero comes to talk", async ({ page }) => {
  await start(page);
  await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem("wusia-world-v1")!);
    Object.assign(raw.state, { currentSceneId: "city_capital", lastLocationId: "city_capital" });
    localStorage.setItem("wusia-world-v1", JSON.stringify(raw));
  });
  await page.reload();
  const world = page.getByTestId("world-canvas");
  await expect(world).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  const positions = async () => JSON.parse((await world.getAttribute("data-wandering-npcs")) || "{}") as Record<string, [number, number]>;
  const first = await positions();
  expect(Object.keys(first)).toContain("npc-city_capital_physician_lin");
  // Someone sets off within a few seconds.
  await expect.poll(async () => {
    const now = await positions();
    return Object.keys(first).some((id) => now[id] && Math.hypot(now[id][0] - first[id][0], now[id][1] - first[id][1]) > 3);
  }, { timeout: 12_000 }).toBe(true);
  // Walking up to Lin: she waits, and her card opens.
  await page.getByRole("button", { name: /จุดหมาย/ }).click();
  await page.locator(`[data-places-tab="${await page.locator('[data-marker-id="npc-city_capital_physician_lin"]').getAttribute("data-category")}"]`).click();
  await page.locator('[data-marker-id="npc-city_capital_physician_lin"]').click();
  await expect(page.getByRole("dialog")).toBeVisible({ timeout: 15_000 });
});
