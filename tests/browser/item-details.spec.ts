import { test, expect } from "@playwright/test";

// Item details on a phone held sideways: the bag's item window closes from
// its ✕ (the name's filter once painted over it), and a shop row opens the
// same kind of window, with buy / sell, on both tabs.
test.use({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
test("the bag's item window closes from its ✕", async ({ page }) => {
  await page.goto("/");
  await page.locator("#hero-name").fill("จอมยุทธ์");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await expect.poll(() => page.evaluate(() => !!localStorage.getItem("wusia-world-v1"))).toBe(true);
  await page.evaluate(() => { const raw = JSON.parse(localStorage.getItem("wusia-world-v1")!); raw.state.inventory.scroll_skill_tj = 1; raw.state.inventory.herb_common = 2; localStorage.setItem("wusia-world-v1", JSON.stringify(raw)); });
  await page.reload();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await page.getByRole("navigation", { name: "เมนูเกม" }).getByRole("button", { name: "ย่าม", exact: true }).click();
  await page.locator(".bag-items .bag-cell button, .bag-items .item-tile").first().click();
  const close = page.getByRole("button", { name: "กลับไปที่ย่าม" });
  const box = await close.boundingBox();
  const hit = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.getAttribute("aria-label"), [box!.x + box!.width / 2, box!.y + box!.height / 2]);
  expect(hit).toBe("กลับไปที่ย่าม");
  await close.tap({ timeout: 5000 });
  await expect(page.locator(".bag-popup")).toHaveCount(0);
});

test("a shop row opens the item's details, to buy or sell from", async ({ page }) => {
  await page.goto("/");
  await page.locator("#hero-name").fill("จอมยุทธ์");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await expect.poll(() => page.evaluate(() => !!localStorage.getItem("wusia-world-v1"))).toBe(true);
  await page.evaluate(() => { const raw = JSON.parse(localStorage.getItem("wusia-world-v1")!); Object.assign(raw.state, { currentSceneId: "city_capital", lastLocationId: "city_capital", gold: 500 }); raw.state.inventory.herb_common = 2; localStorage.setItem("wusia-world-v1", JSON.stringify(raw)); });
  await page.reload();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  const m = page.locator('[data-marker-id^="service-"]').filter({ hasText: "ตลาด" }).first();
  await page.getByRole("button", { name: /จุดหมาย/ }).click();
  await page.locator(`[data-places-tab="${await m.getAttribute("data-category")}"]`).click();
  await m.click();
  await expect(page.locator(".shop-row").first()).toBeVisible({ timeout: 30_000 });
  await page.locator(".shop-row").first().tap();
  const detail = page.getByTestId("shop-item-detail");
  await expect(detail).toBeVisible();
  await detail.getByRole("button", { name: /ซื้อ 1 ชิ้น/ }).tap();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("wusia-world-v1")!).state.gold)).toBeLessThan(500);
  await detail.getByRole("button", { name: "กลับไปที่ร้าน" }).tap();
  await expect(detail).toHaveCount(0);
  await page.getByRole("button", { name: /^ขาย/ }).first().tap();
  await page.locator(".shop-row .item-tile").first().tap();
  await expect(detail).toBeVisible();
  await expect(detail.getByRole("button", { name: /ขาย 1 ชิ้น/ })).toBeEnabled();
  await page.screenshot({ path: "test-results/screenshots/shop-item-detail.png" });
});
