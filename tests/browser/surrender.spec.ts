import { test, expect } from "@playwright/test";

// มอบตัว: the wanted chip (past five seals it shows a number) offers to give
// oneself up; the hero goes straight to the cells and reads the sentence.
test("a wanted hero gives themselves up from the HUD and is taken straight to jail", async ({ page }) => {
  await page.goto("/");
  await page.locator("#hero-name").fill("ผู้มอบตัว");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem("wusia-world-v1")!);
    Object.assign(raw.state, { currentSceneId: "city_capital", lastLocationId: "city_capital", wanted: 7, wantedDay: raw.state.day, gold: 1000 });
    localStorage.setItem("wusia-world-v1", JSON.stringify(raw));
  });
  await page.reload();
  const chip = page.getByTestId("hud-wanted");
  await expect(chip).toContainText("×7");
  await page.screenshot({ path: "test-results/screenshots/wanted-chip.png" });
  await chip.click();
  await page.getByRole("button", { name: "มอบตัว", exact: true }).click();
  const report = page.getByTestId("arrest-report");
  await expect(report).toBeVisible();
  await expect(report).toContainText("มอบตัว");
  await expect(report).toContainText("ค่าปรับ");
  await page.screenshot({ path: "test-results/screenshots/arrest-report.png" });
  await report.getByRole("button", { name: "รับโทษ" }).click();
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem("wusia-world-v1")!).state);
  expect(state.currentSceneId).toBe("jail");
  expect(state.wanted).toBe(0);
  expect(state.gold).toBe(1000 - 175);
});
