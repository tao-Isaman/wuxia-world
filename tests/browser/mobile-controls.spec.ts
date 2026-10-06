import { test, expect, type Page } from "@playwright/test";

// The game is landscape only: a phone on its side is the phone layout.
test.use({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });

async function start(page: Page) {
  await page.goto("/");
  await page.locator("#hero-name").fill("จอมยุทธ์");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
}

/** Synthetic touch pointer on the map canvas (Playwright has no touch-drag API). */
async function touch(page: Page, type: string, x: number, y: number) {
  await page.getByTestId("world-canvas").locator("canvas").dispatchEvent(type, {
    pointerType: "touch", pointerId: 7, isPrimary: true, button: 0, buttons: type === "pointerup" ? 0 : 1,
    clientX: x, clientY: y, bubbles: true, cancelable: true,
  });
}

test("mobile HUD: top icons, left-thumb joystick and a context action button", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await start(page);
  const world = page.getByTestId("world-canvas");

  // Every menu section is an icon along the top; no command box, minimap or guide panel.
  const icons = page.getByRole("navigation", { name: "เมนูเกม" });
  for (const label of ["โปรไฟล์", "ย่าม", "วิชา", "อาชีพ", "ภารกิจ", "สำนัก", "บันทึก"]) {
    await expect(icons.getByRole("button", { name: label, exact: true })).toBeVisible();
  }
  await expect(page.getByRole("button", { name: "เมนู", exact: true })).toHaveCount(0);
  await expect(page.locator(".minimap, .journey-guide")).toHaveCount(0);
  // No character card with a portrait: a slim HP / MP / พลัง card sits in the
  // top-left corner, the icon grid right under it.
  await expect(page.getByRole("region", { name: "สถานะตัวละคร" })).toHaveCount(0);
  const vitals = await page.getByTestId("hud-vitals").boundingBox();
  expect(vitals!.x).toBeLessThan(20);
  expect(vitals!.y).toBeLessThan(20);
  const grid = await icons.boundingBox();
  expect(grid!.x).toBeLessThan(20);
  expect(grid!.y).toBeGreaterThanOrEqual(vitals!.y + vitals!.height);
  expect(grid!.y).toBeLessThan(vitals!.y + vitals!.height + 12);

  // Rest is a quick bubble, not a page: pick a choice right there.
  await page.getByRole("button", { name: "พักผ่อน", exact: true }).click();
  const bubble = page.getByRole("group", { name: "เลือกวิธีพักผ่อน" });
  // At home the hero sleeps in their own bed (free, full, 4 ชั่วยาม).
  await expect(bubble.getByRole("button", { name: /นอนพักที่บ้าน/ })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.screenshot({ path: "test-results/screenshots/mobile-rest-bubble.png" });
  await page.keyboard.press("Escape");
  await expect(bubble).toHaveCount(0);

  // Left half: the stick appears under the thumb and drags the hero.
  const before = Number(await world.getAttribute("data-player-x"));
  await touch(page, "pointerdown", 120, 300);
  await expect(page.locator(".touch-stick:not(.touch-stick--idle)")).toBeVisible();
  await touch(page, "pointermove", 190, 300);
  await expect(world).toHaveAttribute("data-player-motion", "walk");
  await expect.poll(async () => Number(await world.getAttribute("data-player-x"))).toBeGreaterThan(before + 15);
  await touch(page, "pointerup", 190, 300);
  await expect(page.locator(".touch-stick:not(.touch-stick--idle)")).toHaveCount(0);
  await expect(world).toHaveAttribute("data-player-motion", "idle");
  await page.screenshot({ path: "test-results/screenshots/mobile-hud.png" });

  // Standing next to someone offers a one-tap action.
  await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem("wusia-world-v1")!);
    save.state.currentSceneId = "city_capital";
    save.state.lastLocationId = "city_capital";
    localStorage.setItem("wusia-world-v1", JSON.stringify(save));
  });
  await page.reload();
  await expect(world).toHaveAttribute("data-ready", "true");
  await page.getByRole("button", { name: /จุดหมาย/ }).click();
  await page.locator(`[data-places-tab="${await page.locator('[data-marker-id="npc-city_capital_physician_lin"]').getAttribute("data-category")}"]`).click();
  await page.locator('[data-marker-id="npc-city_capital_physician_lin"]').click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "ปิด", exact: true }).click();
  const action = page.locator('[data-action-marker="npc-city_capital_physician_lin"]');
  await expect(action).toBeVisible();
  await expect(action).toContainText("หมอหลิน");
  await page.screenshot({ path: "test-results/screenshots/mobile-action.png" });
  await action.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "ปิด", exact: true }).click();

  // Profile: three columns with readable numbers and nothing to scroll.
  await page.getByRole("navigation", { name: "เมนูเกม" }).getByRole("button", { name: "โปรไฟล์", exact: true }).click();
  await expect(page.getByTestId("profile-general")).toContainText("จอมยุทธ์");
  await expect(page.getByTestId("profile-epithet")).toBeVisible();
  const profileTabs = page.getByRole("tablist", { name: "ข้อมูลตัวละคร" });
  await expect(profileTabs.getByRole("tab", { name: "ค่าพลัง" })).toHaveAttribute("aria-selected", "true");
  const fontSize = await page.locator(".profile-stat-value").first().evaluate((node) => parseFloat(getComputedStyle(node).fontSize));
  expect(fontSize).toBeGreaterThanOrEqual(18);
  await page.screenshot({ path: "test-results/screenshots/mobile-profile.png" });
  await profileTabs.getByRole("tab", { name: "อุปกรณ์" }).click();
  await expect(page.getByRole("tabpanel", { name: "อุปกรณ์" })).toContainText("อาวุธ");
  // Every menu section fits: no column scrolls.
  for (const section of ["โปรไฟล์", "ย่าม", "วิชา", "อาชีพ", "จดหมาย"]) {
    await page.getByRole("dialog").getByRole("tab", { name: section, exact: true }).click();
    await expect(page.locator(".hud-menu-panel--fill")).toBeVisible();
    const overflow = await page.locator(".menu-col:not(.menu-col--scroll), .hud-menu-panel--fill .hud-menu-body").evaluateAll((nodes) =>
      nodes.filter((node) => node.scrollHeight > node.clientHeight + 2).map((node) => node.className));
    expect(overflow, `${section} overflows`).toEqual([]);
  }
  expect(errors).toEqual([]);
});

test.describe("a phone held upright", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("shows the game turned to landscape; the joystick still walks the right way", async ({ page }) => {
    await start(page);
    const world = page.getByTestId("world-canvas");
    // The body is turned 90°: the page's top-left corner is the screen's top-right.
    expect(await page.evaluate(() => getComputedStyle(document.body).transform)).not.toBe("none");
    const vitals = (await page.getByTestId("hud-vitals").boundingBox())!;
    expect(vitals.x + vitals.width).toBeGreaterThan(390 - 20);
    expect(vitals.y).toBeLessThan(20);
    expect(vitals.height).toBeGreaterThan(vitals.width);
    // Page (120, 300) is screen (390 − 300, 120); dragging right on the page is down on the screen.
    const before = Number(await world.getAttribute("data-player-x"));
    await touch(page, "pointerdown", 90, 120);
    await expect(page.locator(".touch-stick:not(.touch-stick--idle)")).toBeVisible();
    await touch(page, "pointermove", 90, 190);
    await expect(world).toHaveAttribute("data-player-motion", "walk");
    await expect.poll(async () => Number(await world.getAttribute("data-player-x"))).toBeGreaterThan(before + 15);
    await touch(page, "pointerup", 90, 190);
    await page.screenshot({ path: "test-results/screenshots/mobile-portrait-turned.png" });
  });
});
