import { test, expect, type Page } from "@playwright/test";

// Outfits and the weapon on the body (docs/design/appearance.md): the hero
// carries a long weapon across the back; an outfit is never sold — its item
// (a quest reward, a drop or a tailor's craft) read from the bag puts it in
// the profile's ชุด tab, where it is worn; the weapon hides; and on a road the
// hero still wears it.

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

test("wardrobe: a spear on the back, a found outfit added from the bag and worn, the weapon hidden, still worn on the road", async ({ page }) => {
  test.setTimeout(150_000);
  await page.goto("/");
  await page.locator("#hero-name").fill("จอมยุทธ์");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  const canvas = page.getByTestId("world-canvas");
  await expect(canvas).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await expect(canvas).toHaveAttribute("data-player-outfit", "default");
  // In the capital, with an iron spear and a bundled ชุดคราม in the bag.
  await patch(page, `state.currentSceneId = "city_capital"; state.lastLocationId = "city_capital";
    state.playerBuild.equipment.W = "eq_t1_w_long"; state.inventory = { ...state.inventory, outfit_tailor_indigo: 1 };`);
  await expect(canvas).toHaveAttribute("data-player-weapon", "eq_t1_w_long", { timeout: 20_000 });

  // Not yet had: not in the wardrobe at all, and no price — it is found, never bought.
  const openWardrobe = async () => {
    await page.locator(".hud-iconbar").getByRole("button", { name: "โปรไฟล์", exact: true }).click();
    await page.getByRole("tab", { name: "ชุด" }).click();
    return page.getByTestId("wardrobe");
  };
  let wardrobe = await openWardrobe();
  await expect(wardrobe).toHaveAttribute("data-worn", "default");
  await expect(wardrobe).toContainText("สะพายหลัง");
  await expect(wardrobe.locator("[data-outfit]").first()).toHaveAttribute("data-outfit", "default");
  await expect(wardrobe.locator('[data-outfit="tailor_indigo"]')).toHaveCount(0);
  await expect(wardrobe).not.toContainText("ตำลึง");
  await page.keyboard.press("Escape");

  // Read it from the bag: it joins the wardrobe.
  await page.locator(".hud-iconbar").getByRole("button", { name: "ย่าม", exact: true }).click();
  await page.getByRole("button", { name: "ชุดคราม ×1" }).click();
  await page.getByRole("button", { name: "ใช้", exact: true }).click();
  await expect.poll(async () => (await save(page)).wardrobe).toEqual(["tailor_indigo"]);
  expect((await save(page)).inventory.outfit_tailor_indigo ?? 0).toBe(0);
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");

  wardrobe = await openWardrobe();
  await wardrobe.locator('[data-outfit="tailor_indigo"]').click();
  await expect(wardrobe).toHaveAttribute("data-worn", "tailor_indigo");
  await page.screenshot({ path: "test-results/screenshots/wardrobe.png" });
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

  // On the road the hero keeps the outfit and the spear (it used to fall back to ชุดเดิม).
  await patch(page, `state.currentSceneId = "route_city_capital__to__city_changan";`);
  await expect(page.locator("[data-route-direction]")).toBeVisible();
  await expect(canvas).toHaveAttribute("data-player-outfit", "tailor_indigo", { timeout: 20_000 });
  await expect(canvas).toHaveAttribute("data-player-weapon", "eq_t1_w_long", { timeout: 20_000 });
  await page.screenshot({ path: "test-results/screenshots/outfit-on-road.png" });
});
