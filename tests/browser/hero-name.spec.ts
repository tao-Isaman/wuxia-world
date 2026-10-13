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
