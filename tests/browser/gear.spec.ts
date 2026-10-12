import { test, expect, type Page } from "@playwright/test";

// Gear options (ออฟชั่นเสริม): a piece bought at the forge carries random
// options coloured by how good each roll is; the bag lists them; the forge's
// ✦ สุ่มออฟชั่น tab re-rolls them for a หินศิลาวิเศษ once the hero's forging is
// at level 3.

async function save(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("wusia-world-v1")!).state);
}
async function patch(page: Page, edit: string) {
  await page.evaluate((body) => {
    const saved = JSON.parse(localStorage.getItem("wusia-world-v1")!);
    new Function("state", body)(saved.state);
    localStorage.setItem("wusia-world-v1", JSON.stringify(saved));
  }, edit);
  await page.reload();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
}
async function openForge(page: Page) {
  await page.getByRole("button", { name: "จุดหมาย", exact: true }).click();
  await page.getByRole("tab", { name: /สถานที่/ }).click();
  await page.locator("[data-marker-id]", { hasText: "ตีเหล็ก" }).first().click();
}

test("gear options: bought with coloured options, shown in the bag, re-rolled at the forge", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/");
  await page.locator("#hero-name").fill("ช่างหลอม");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await patch(page, `state.gold = 5000; state.currentSceneId = "city_capital"; state.lastLocationId = "city_capital";
    state.visitedLocationIds = [...new Set([...state.visitedLocationIds, "city_capital"])];
    state.inventory = { ...state.inventory, spirit_stone: 2, enhance_stone: 3 };`);

  // Buy a tier-1 sword: 1–2 options, each coloured by its roll.
  await openForge(page);
  await page.getByRole("button", { name: /ซื้อ-ขาย/ }).click();
  await page.locator("li", { hasText: "กระบี่เหล็ก" }).getByRole("button").click();
  await expect.poll(async () => Object.keys((await save(page)).inventoryEquipment).join(",")).toMatch(/^eq_t1_w_sword~/);
  const key = Object.keys((await save(page)).inventoryEquipment)[0]!;

  // Too green a smith: the re-roll waits for forging level 3.
  await page.getByTestId("artisan-tab-reforge").click();
  const row = page.locator(`[data-reforge-key="${key}"]`);
  await expect(row).toBeVisible();
  await expect(row.getByTestId("gear-affixes").locator("li[data-quality]")).not.toHaveCount(0);
  await expect(row.getByTestId("reforge-button")).toBeDisabled();
  await page.keyboard.press("Escape");

  await patch(page, `state.lifeSkillXp = { ...state.lifeSkillXp, forge: 300 };`);
  await openForge(page);
  await page.getByTestId("artisan-tab-reforge").click();
  const ready = page.locator(`[data-reforge-key="${key}"]`).getByTestId("reforge-button");
  await expect(ready).toBeEnabled();
  await page.waitForTimeout(300);
  await page.screenshot({ path: "test-results/screenshots/gear-reforge.png" });
  await ready.click();
  await expect.poll(async () => (await save(page)).inventory.spirit_stone ?? 0).toBe(1);
  const after = await save(page);
  const newKey = Object.keys(after.inventoryEquipment)[0]!;
  expect(newKey).toMatch(/^eq_t1_w_sword/);
  await page.keyboard.press("Escape");

  // The bag lists the piece's options, coloured.
  await page.locator(".hud-iconbar").getByRole("button", { name: "ย่าม", exact: true }).click();
  await page.locator(`[data-gear-key="${newKey}"]`).locator("button").first().click();
  const affixes = page.getByRole("dialog", { name: "รายละเอียดของ" }).getByTestId("gear-affixes");
  await expect(affixes).toBeVisible();
  await expect(affixes).toContainText("ชั้นดี");
  const items = affixes.locator("li[data-quality]");
  expect(await items.count()).toBeGreaterThanOrEqual(1);
  const colors = await items.evaluateAll((els) => els.map((el) => getComputedStyle(el).color));
  for (const c of colors) expect(c).not.toBe("rgb(230, 210, 255)"); // a quality colour, not the box's plain text
  await page.waitForTimeout(300);
  await page.screenshot({ path: "test-results/screenshots/gear-bag.png" });
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");

  // ⚒ เสริมพลัง: +1 never fails; the piece is "+1 กระบี่เหล็ก" after.
  await openForge(page);
  await page.getByTestId("artisan-tab-enhance").click();
  const enhance = page.locator(`[data-enhance-key="${newKey}"]`).getByTestId("enhance-button");
  await expect(enhance).toBeEnabled();
  await enhance.click();
  await expect.poll(async () => Object.keys((await save(page)).inventoryEquipment)[0]).toMatch(/^eq_t1_w_sword~en:1/);
  expect((await save(page)).inventory.enhance_stone).toBe(2);
  await expect(page.getByTestId("artisan-enhance")).toContainText("+1 กระบี่เหล็ก");
  await page.waitForTimeout(300);
  await page.screenshot({ path: "test-results/screenshots/gear-enhance.png" });
});
