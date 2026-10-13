import { test, expect, type Page } from "@playwright/test";

// Repeatable quests come back to their giver; the owner's console tool sets a trait.

async function save(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("wusia-world-v1")!).state);
}
async function patch(page: Page, fields: Record<string, unknown>) {
  await page.evaluate((next) => {
    const saved = JSON.parse(localStorage.getItem("wusia-world-v1")!);
    Object.assign(saved.state, next);
    localStorage.setItem("wusia-world-v1", JSON.stringify(saved));
  }, fields);
  await page.reload();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
}

test("a repeatable quest is offered by its giver; wuxiaDev.setTrait sets a trait when the dev flag is on", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/");
  await page.locator("#hero-name").fill("ผู้ไถ่บาป");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });

  // Off by default.
  expect(await page.evaluate(() => typeof (window as unknown as { wuxiaDev?: unknown }).wuxiaDev)).toBe("undefined");
  await page.evaluate(() => localStorage.setItem("wuxia-dev", "on"));
  const s = await save(page);
  await patch(page, { currentSceneId: "city_capital", lastLocationId: "city_capital", traits: { ...s.traits, evil: 25 } });
  await page.evaluate(() => (window as unknown as { wuxiaDev: { setTrait: (t: string, v: number) => unknown } }).wuxiaDev.setTrait("evil", 0));
  await expect.poll(async () => (await save(page)).traits.evil).toBe(0);

  // หมอหลิน offers ยาสำหรับคนยากไร้.
  const marker = "npc-city_capital_physician_lin";
  await page.getByRole("button", { name: /จุดหมาย/ }).click();
  await page.locator(`[data-places-tab="${await page.locator(`[data-marker-id="${marker}"]`).getAttribute("data-category")}"]`).click();
  await page.locator(`[data-marker-id="${marker}"]`).click();
  await expect(page.getByRole("dialog")).toContainText("ยาสำหรับคนยากไร้");
});
