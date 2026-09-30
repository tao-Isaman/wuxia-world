import { test, expect, type Page } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

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
  // No character card any more: the icon grid itself sits in the top-left corner.
  await expect(page.getByRole("region", { name: "สถานะตัวละคร" })).toHaveCount(0);
  const grid = await icons.boundingBox();
  expect(grid!.x).toBeLessThan(20);
  expect(grid!.y).toBeLessThan(20);

  // Rest is a quick bubble, not a page: pick a choice right there.
  await page.getByRole("button", { name: "พักผ่อน", exact: true }).click();
  const bubble = page.getByRole("group", { name: "เลือกวิธีพักผ่อน" });
  await expect(bubble.getByRole("button", { name: /พักริมทาง/ })).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.screenshot({ path: "test-results/screenshots/mobile-rest-bubble.png" });
  await page.keyboard.press("Escape");
  await expect(bubble).toHaveCount(0);

  // Left half: the stick appears under the thumb and drags the hero.
  const before = Number(await world.getAttribute("data-player-x"));
  await touch(page, "pointerdown", 80, 620);
  await expect(page.locator(".touch-stick:not(.touch-stick--idle)")).toBeVisible();
  await touch(page, "pointermove", 150, 620);
  await expect(world).toHaveAttribute("data-player-motion", "walk");
  await expect.poll(async () => Number(await world.getAttribute("data-player-x"))).toBeGreaterThan(before + 15);
  await touch(page, "pointerup", 150, 620);
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

  // Profile: tabs of large readable rows.
  await page.getByRole("navigation", { name: "เมนูเกม" }).getByRole("button", { name: "โปรไฟล์", exact: true }).click();
  const profileTabs = page.getByRole("tablist", { name: "ข้อมูลตัวละคร" });
  await expect(profileTabs.getByRole("tab", { name: "ค่าพลัง" })).toHaveAttribute("aria-selected", "true");
  const fontSize = await page.locator(".profile-stat-value").first().evaluate((node) => parseFloat(getComputedStyle(node).fontSize));
  expect(fontSize).toBeGreaterThanOrEqual(18);
  await page.screenshot({ path: "test-results/screenshots/mobile-profile.png" });
  await profileTabs.getByRole("tab", { name: "วิชาที่ใช้" }).click();
  await expect(page.getByText("หมัดตรง").first()).toBeVisible();
  expect(errors).toEqual([]);
});
