import { test, expect, type Page } from "@playwright/test";

// "{hero}" in story text is the player's name — in the lines, the choices and
// the speaker heading over the conversation box (180 dialogs open on the hero).

async function patch(page: Page, fields: Record<string, unknown>) {
  await page.evaluate((next) => {
    const saved = JSON.parse(localStorage.getItem("wusia-world-v1")!);
    Object.assign(saved.state, next);
    localStorage.setItem("wusia-world-v1", JSON.stringify(saved));
  }, fields);
  await page.reload();
}

test("a dialog that opens on the hero names them; no {hero} anywhere on screen", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/");
  await page.locator("#hero-name").fill("ลั่วหยาง");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await patch(page, { currentSceneId: "st_st_gumu_sixteen_years_03_s2", lastLocationId: "valley_jueqing" });
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("ลั่วหยาง", { timeout: 60_000 });
  await expect(dialog).toContainText("จิบชาเงียบ");
  await expect(page.locator("body")).not.toContainText("{hero}");
});

test("the face and name tag follow each line's speaker: the hero, then a walk-on with no face", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/");
  await page.locator("#hero-name").fill("ลั่วหยาง");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  // One line per beat (the suite seeds the all-at-once flag).
  await page.evaluate(() => localStorage.removeItem("wuxia-dialog-instant"));
  await patch(page, { currentSceneId: "st_st_gumu_sixteen_years_03_s2", lastLocationId: "valley_jueqing" });
  const stage = page.getByTestId("dialog-stage");
  const next = page.getByTestId("dialog-next-page");
  await expect(stage).toBeVisible({ timeout: 60_000 });
  await next.click(); // beat 2: the hero speaks
  await expect(stage.locator("[data-voice]")).toHaveAttribute("data-voice", "hero");
  await expect(stage.locator("h2")).toHaveText("ลั่วหยาง");
  await next.click(); // beat 3: ผู้เฒ่าหลิน, a walk-on: their name, no face
  await expect(stage.locator("h2")).toHaveText("ผู้เฒ่าหลิน");
  await expect(stage.locator("[data-voice]")).toHaveCount(0);
});

