import { test, expect } from "@playwright/test";

// Death is not the end (lib/world/death.ts): a save that ended on the old
// game-over screen wakes at home, poorer, with the ฟื้นคืนสติ report.
test("a fallen hero wakes at home with half the gold and a report of the losses", async ({ page }) => {
  await page.goto("/");
  await page.locator("#hero-name").fill("ผู้ล้ม");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem("wusia-world-v1")!);
    Object.assign(raw.state, { gameOver: true, gold: 400, currentHp: 0, currentSceneId: "city_capital", lastLocationId: "city_capital",
      inventory: { ginseng: 6, old_key: 1 } });
    localStorage.setItem("wusia-world-v1", JSON.stringify(raw));
  });
  await page.reload();
  const report = page.getByTestId("death-report");
  await expect(report).toBeVisible({ timeout: 60_000 });
  await expect(report).toContainText("เงินหาย 200 ตำลึง");
  await expect(report).toContainText("โสม");
  await page.screenshot({ path: "test-results/screenshots/death-report.png" });
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem("wusia-world-v1")!).state);
  expect(state.gameOver).toBe(false);
  expect(state.currentSceneId).toBe("home_player");
  expect(state.gold).toBe(200);
  expect(state.inventory.ginseng).toBe(3);
  expect(state.inventory.old_key).toBe(1);
  expect(state.currentHp).toBeGreaterThan(0);
  await page.getByRole("button", { name: "ลุกขึ้นเดินทางต่อ" }).click();
  await expect(report).toHaveCount(0);
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true");
});
