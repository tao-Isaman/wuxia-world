import { test, expect } from "@playwright/test";

// A finished chapter tells where the next one is: หัวใจอยู่ตรงไหน ch1 sent the
// hero toward ต้าหลี่, but ch2 is taken from ถังซือปี้ at the สกุลถัง grounds.
test("a finished saga chapter shows who offers the next one and where", async ({ page }) => {
  await page.goto("/");
  await page.locator("#hero-name").fill("จอมยุทธ์");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await expect.poll(() => page.evaluate(() => !!localStorage.getItem("wusia-world-v1"))).toBe(true);
  await page.evaluate(() => { const raw = JSON.parse(localStorage.getItem("wusia-world-v1")!); raw.state.quests.st_tang_heart_pierce_01 = { id: "st_tang_heart_pierce_01", status: "done", stage: 2 }; raw.state.currentSceneId = "city_dali"; raw.state.lastLocationId = "city_dali"; localStorage.setItem("wusia-world-v1", JSON.stringify(raw)); });
  await page.reload();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await page.getByRole("navigation", { name: "เมนูเกม" }).getByRole("button", { name: "ภารกิจ", exact: true }).click();
  await page.locator("button", { hasText: "สำเร็จ" }).first().click({ timeout: 5000 });
  await page.getByText(/หัวใจอยู่ตรงไหน · บทที่ 1/).first().click();
  await expect(page.getByTestId("quest-chain-next")).toBeVisible();
  await expect(page.getByTestId("quest-chain-next")).toContainText("ถังซือปี้");
  await expect(page.getByTestId("quest-chain-next")).toContainText("สำนักสกุลถัง");
});
