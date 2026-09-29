import { test, expect } from "@playwright/test";

test("capital encounter keeps its street setting through reload and phone rotation", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await page.locator("#hero-name").fill("ผู้ตรวจฉาก");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true");
  // A controlled renderer fixture, not an ordinary-playthrough claim.
  await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem("wusia-world-v1")!);
    save.state.currentSceneId = "city_capital";
    save.state.lastLocationId = "city_capital";
    save.state.pendingBattle = { opponentId: "petty_thief", onWin: "city_capital", onLose: "city_capital", nonFatal: true };
    localStorage.setItem("wusia-world-v1", JSON.stringify(save));
  });
  await page.reload();
  const battle = page.getByTestId("battle-canvas");
  await expect(battle).toHaveAttribute("data-ready", "true");
  await expect(battle).toHaveAttribute("data-battle-background", "capital-street");
  await expect(battle).toHaveAttribute("data-background-image", "/art/battle-capital-street.png");
  await page.screenshot({ path: "test-results/screenshots/capital-battle-desktop.png" });
  const canvas = await battle.locator("canvas").elementHandle();
  for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
    await page.setViewportSize(viewport);
    await expect(page.getByRole("button", { name: "ตั้งรับ", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "หมัดตรง", exact: true })).toBeVisible();
    expect(await canvas!.evaluate(node => node === document.querySelector('[data-testid="battle-canvas"] canvas'))).toBe(true);
    await page.screenshot({ path: `test-results/screenshots/capital-battle-${viewport.width}.png` });
  }
  expect(errors).toEqual([]);
});
