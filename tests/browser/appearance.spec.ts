import { test, expect, type Page } from "@playwright/test";

// Outfits and the weapon on the body (docs/design/appearance.md): the hero
// carries a long weapon across the back, buys an outfit from a city tailor in
// the profile's ชุด tab and wears it at once, and hides the weapon.

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

test("wardrobe: a spear on the back, a tailor's outfit bought and worn, the weapon hidden", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/");
  await page.locator("#hero-name").fill("จอมยุทธ์");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  const canvas = page.getByTestId("world-canvas");
  await expect(canvas).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await expect(canvas).toHaveAttribute("data-player-outfit", "default");
  // In the capital, with a purse and an iron spear.
  await patch(page, `state.gold = 1000; state.currentSceneId = "city_capital"; state.lastLocationId = "city_capital";
    state.playerBuild.equipment.W = "eq_t1_w_long";`);
  await expect(canvas).toHaveAttribute("data-player-weapon", "eq_t1_w_long", { timeout: 20_000 });

  await page.locator(".hud-iconbar").getByRole("button", { name: "โปรไฟล์", exact: true }).click();
  await page.getByRole("tab", { name: "ชุด" }).click();
  const wardrobe = page.getByTestId("wardrobe");
  await expect(wardrobe).toHaveAttribute("data-worn", "default");
  await expect(wardrobe).toContainText("สะพายหลัง");
  // What the wardrobe holds comes first, then the tailor's.
  await expect(wardrobe.locator("[data-outfit]").first()).toHaveAttribute("data-outfit", "default");
  await expect(wardrobe.locator('[data-outfit="tailor_indigo"]')).toContainText("300 ตำลึง");
  await wardrobe.locator('[data-outfit="tailor_indigo"]').click();
  await page.getByRole("dialog").filter({ hasText: "ร้านตัดเสื้อ" }).getByRole("button", { name: "ซื้อ", exact: true }).click();
  await expect(wardrobe).toHaveAttribute("data-worn", "tailor_indigo");
  await page.screenshot({ path: "test-results/screenshots/wardrobe.png" });
  await expect.poll(async () => (await save(page)).wardrobe).toEqual(["tailor_indigo"]);
  expect((await save(page)).gold).toBe(700);
  await page.getByTestId("hide-weapon").check();
  await expect.poll(async () => (await save(page)).appearance).toEqual({ outfit: "tailor_indigo", hideWeapon: true });
  await page.keyboard.press("Escape");
  await expect(canvas).toHaveAttribute("data-player-outfit", "tailor_indigo", { timeout: 20_000 });
  await expect(canvas).toHaveAttribute("data-player-weapon", "");
  // Back on: the spear shows again.
  await patch(page, `state.appearance.hideWeapon = false;`);
  await expect(canvas).toHaveAttribute("data-player-outfit", "tailor_indigo", { timeout: 20_000 });
  await expect(canvas).toHaveAttribute("data-player-weapon", "eq_t1_w_long", { timeout: 20_000 });
  await page.screenshot({ path: "test-results/screenshots/outfit-on-map.png" });
});
