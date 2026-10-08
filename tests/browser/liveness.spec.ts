import { test, expect, type Page } from "@playwright/test";

// Liveness 2.0: a wanderer the simulation brought to the capital stands on
// its map; their card says who they are now and offers ขอประลอง and
// ⚔ สังหาร. Killing them in an open fight removes them for good and puts the
// hero at the top of the wanted list at once.
// The player's save and the shared world (people, rumors) side by side.
async function state(page: Page) {
  return page.evaluate(() => ({
    ...JSON.parse(localStorage.getItem("wusia-world-v1")!).state,
    ...JSON.parse(localStorage.getItem("wusia-shared-v1")!).world,
  }));
}
async function visit(page: Page, marker: string) {
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await page.getByRole("button", { name: /จุดหมาย/ }).click();
  await page.locator(`[data-places-tab="${await page.locator(`[data-marker-id="${marker}"]`).getAttribute("data-category")}"]`).click();
  await page.locator(`[data-marker-id="${marker}"]`).click();
}

test("a travelling wanderer stands in the capital; killing them openly makes the hero wanted at once", async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto("/");
  await page.locator("#hero-name").fill("ผู้ท้าทาย");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  const seeded = await state(page);
  expect(Object.keys(seeded.npcExt)).toHaveLength(30);
  await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem("wusia-world-v1")!);
    Object.assign(raw.state, { currentSceneId: "city_capital", lastLocationId: "city_capital", wanted: 0 });
    localStorage.setItem("wusia-world-v1", JSON.stringify(raw));
    // Her journey has brought her to the capital; a weak opponent keeps the fight short.
    const shared = JSON.parse(localStorage.getItem("wusia-shared-v1")!);
    Object.assign(shared.world.npcExt.wander_su_linger, { currentLocation: "city_capital", power: 1, plan: null });
    localStorage.setItem("wusia-shared-v1", JSON.stringify(shared));
  });
  await page.reload();

  await visit(page, "npc-wander_su_linger");
  const card = page.getByRole("dialog");
  await expect(card).toContainText("ซูหลิงเอ๋อ");
  await expect(card.getByTestId("npc-life-title")).toContainText("จอมยุทธ์อิสระ");
  await expect(card.getByRole("button", { name: /ขอประลอง/ })).toBeEnabled();
  await expect(card.getByTestId("npc-kill")).toBeVisible();
  await page.screenshot({ path: "test-results/screenshots/liveness-card.png" });

  await card.getByTestId("npc-kill").click();
  await page.getByRole("button", { name: "ลงมือ" }).click();
  await page.getByRole("button", { name: /เข้าต่อสู้/ }).click({ timeout: 60_000 });
  await expect(page.getByTestId("battle-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await page.getByRole("button", { name: /อัตโนมัติ/ }).click();
  const result = page.getByTestId("combat-result");
  await expect(result).toBeVisible({ timeout: 120_000 });
  await expect(result).toHaveAttribute("data-outcome", "ally");
  await page.getByRole("button", { name: /ดำเนินเรื่อง/ }).click();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });

  const after = await state(page);
  expect(after.wanted).toBe(5);
  expect(after.npcExt.wander_su_linger.status).toBe("dead");
  expect(after.npcExt.wander_su_linger.killedBy).toBe("player");
  expect(after.rumorPool.some((r: { source: string; about: string }) => r.source === "player_echo" && r.about === "wander_su_linger")).toBe(true);
  await expect(page.locator('[data-marker-id="npc-wander_su_linger"]')).toHaveCount(0);
});
