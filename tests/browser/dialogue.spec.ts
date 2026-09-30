import { test, expect, type Page } from "@playwright/test";

async function currentScene(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("wusia-world-v1")!).state.currentSceneId);
}
async function visit(page: Page, marker: string) {
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await page.getByRole("button", { name: /จุดหมาย/ }).click();
  await page.locator(`[data-marker-id="${marker}"]`).click();
}

test("local replies preserve the scene and unrelated meetings clear the previous speaker", async ({ page }) => {
  test.setTimeout(120_000);
  // A deterministic regression fixture. Independent critics use ordinary RNG.
  await page.addInitScript(() => { Math.random = () => 0.5; });
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await page.locator("#hero-name").fill("ผู้ฟัง");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  await visit(page, "route_home_player__to__city_capital");
  await expect.poll(() => currentScene(page)).toBe("route_home_player__to__city_capital");
  await visit(page, "destination-0");
  await expect.poll(() => currentScene(page)).toBe("city_capital");

  await visit(page, "npc-city_capital_physician_lin");
  await page.getByRole("button", { name: /ทักทาย/ }).click();
  const stage = page.getByTestId("dialog-stage");
  await expect(stage.getByRole("heading", { name: "หมอหลิน" })).toBeVisible();
  const canvas = await page.getByTestId("world-canvas").locator("canvas").elementHandle();
  await stage.getByRole("button", { name: /ถามเรื่องยาสมุนไพร/ }).click();
  await expect.poll(() => currentScene(page)).toBe("npc_city_capital_physician_lin_herbs");
  await expect(stage).toContainText("ราคา 50 ทอง");
  await expect(stage).toContainText("ระดับ 5");
  expect(await canvas!.evaluate(node => node === document.querySelector('[data-testid="world-canvas"] canvas'))).toBe(true);
  await stage.getByRole("button", { name: /กลับไปคุยเรื่องอื่น/ }).click();
  await expect.poll(() => currentScene(page)).toBe("npc_city_capital_physician_lin_talk");
  await stage.getByRole("button", { name: /ลาจาก/ }).click();
  await expect.poll(() => currentScene(page)).toBe("city_capital");

  await visit(page, "npc-city_capital_magistrate_wu");
  await page.getByRole("button", { name: /ทักทาย/ }).click();
  await stage.getByRole("button", { name: /รับฟังงานที่นายอำเภอมอบหมาย/ }).click();
  await expect.poll(() => currentScene(page)).toBe("npc_city_capital_magistrate_wu_jobs");
  await expect(stage).toContainText("จินหลิง");
  await stage.getByRole("button", { name: /กลับไปคุยเรื่องอื่น/ }).click();
  await stage.getByRole("button", { name: /กลับไปสำรวจนครหลวง/ }).click();
  await expect.poll(() => currentScene(page)).toBe("city_capital");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("wusia-world-v1")!).state.quests)).toEqual({});

  await visit(page, "npc-merchant_wang");
  await page.getByRole("button", { name: /ทักทาย/ }).click();
  await expect(stage.getByRole("heading", { name: "เถ้าแก่หวาง" })).toBeVisible();
  // Leaving a conversation is not a walk: no random meeting rolls, even on RNG 0.
  await page.evaluate(() => { Math.random = () => 0; });
  await stage.getByRole("button", { name: "ปิด", exact: true }).click();
  await expect.poll(() => currentScene(page)).toBe("city_capital");
  await expect(stage).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("wusia-world-v1")!).state.pendingEncounter)).toBeNull();
  expect(errors).toEqual([]);
});
