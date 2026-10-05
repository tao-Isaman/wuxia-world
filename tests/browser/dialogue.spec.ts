import { test, expect, type Page } from "@playwright/test";

async function currentScene(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("wusia-world-v1")!).state.currentSceneId);
}
async function visit(page: Page, marker: string) {
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await page.getByRole("button", { name: /จุดหมาย/ }).click();
  await page.locator(`[data-places-tab="${await page.locator(`[data-marker-id="${marker}"]`).getAttribute("data-category")}"]`).click();
  await page.locator(`[data-marker-id="${marker}"]`).click();
}

test("local replies preserve the scene and unrelated meetings clear the previous speaker", async ({ page }) => {
  test.setTimeout(240_000);
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

test("quest offers away from a staged map are full-screen and fit without scrolling", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await page.locator("#hero-name").fill("ผู้ฟัง");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem("wusia-world-v1")!);
    save.state.currentSceneId = "qs_qw_hong_treasure_map_offer";
    localStorage.setItem("wusia-world-v1", JSON.stringify(save));
  });
  for (const viewport of [{ width: 1000, height: 450 }, { width: 844, height: 390 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.reload();
    const stage = page.getByTestId("dialog-stage");
    await expect(stage.getByRole("heading", { name: "หลัวเฟย์หาว" })).toBeVisible();
    await expect(stage.getByRole("button", { name: /รับภารกิจ/ })).toBeInViewport();
    await expect.poll(() => page.evaluate(() => {
      const panel = document.querySelector('[data-testid="dialog-stage"] [role="dialog"]')!.getBoundingClientRect();
      const content = document.querySelector<HTMLElement>('[data-testid="dialog-stage"] [role="region"]')!;
      return panel.height > innerHeight * 0.85 && content.scrollHeight - content.clientHeight <= 2;
    })).toBe(true);
    await page.screenshot({ path: `test-results/screenshots/quest-offer-${viewport.width}x${viewport.height}.png` });
  }
  expect(errors).toEqual([]);
});

test("conversations play one line at a time like a film, with key words marked; ข้าม jumps to the choices", async ({ page }) => {
  test.setTimeout(120_000);
  // The suite runs with fast text; this test uses the real conversation standard.
  await page.addInitScript(() => { localStorage.removeItem("wuxia-dialog-instant"); });
  await page.goto("/");
  await page.locator("#hero-name").fill("ผู้ฟัง");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  await visit(page, "npc-home_player_gatekeeper_zhou");
  await page.getByRole("button", { name: /ทักทาย/ }).click();
  const stage = page.getByTestId("dialog-stage");
  const lines = page.getByTestId("dialog-lines");
  await expect(stage).toHaveAttribute("data-page", "0");
  const beats = Number(await stage.getAttribute("data-pages"));
  expect(beats).toBeGreaterThanOrEqual(4);
  // One line on screen; no choices until the last one.
  await expect(lines.locator("[data-line-kind]")).toHaveCount(1);
  await expect(stage.getByRole("button", { name: /ลาจาก|ปิด|กลับ/ })).toHaveCount(0);
  // A tap on the words finishes the typing, the next tap moves on; ต่อ moves on at once.
  await lines.click();
  await expect(stage).not.toHaveAttribute("data-typing", /.*/);
  await lines.click();
  await expect(stage).toHaveAttribute("data-page", "1");
  await page.getByTestId("dialog-next-page").click();
  await expect(stage).toHaveAttribute("data-page", "2");
  // ข้าม: the last line, then the choices.
  await page.getByTestId("dialog-skip").click();
  await expect(stage).toHaveAttribute("data-page", String(beats - 1));
  await expect(page.getByTestId("dialog-next-page")).toHaveCount(0);
  await expect(stage.locator("button").filter({ hasNotText: /จบบทสนทนา/ }).first()).toBeVisible();
  await expect(lines.locator("[data-line-kind]")).toHaveCount(1);
  await page.screenshot({ path: "test-results/screenshots/dialogue-beats.png" });
});
