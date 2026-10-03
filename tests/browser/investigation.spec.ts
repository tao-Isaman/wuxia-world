import { test, expect, type Page } from "@playwright/test";

async function state(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("wusia-world-v1")!).state);
}
async function visit(page: Page, marker: string) {
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await page.getByRole("button", { name: /จุดหมาย/ }).click();
  await page.locator(`[data-places-tab="${await page.locator(`[data-marker-id="${marker}"]`).getAttribute("data-category")}"]`).click();
  await page.locator(`[data-marker-id="${marker}"]`).click();
}

test("capital rumors and the ledger investigation survive a mid-dialogue reload and pay once", async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => { Math.random = () => 0.5; });
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/");
  await page.locator("#hero-name").fill("ผู้สืบข่าว");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  await visit(page, "route_home_player__to__city_capital");
  await expect.poll(async () => (await state(page)).currentSceneId).toBe("route_home_player__to__city_capital");
  await visit(page, "destination-0");
  await expect.poll(async () => (await state(page)).currentSceneId).toBe("city_capital");

  await visit(page, "service-3");
  await expect(page.getByRole("dialog")).not.toContainText("วันนี้เงียบเป็นพิเศษ");
  await expect(page.getByRole("button", { name: "ฟังต่อ" })).toHaveCount(5);
  await page.getByRole("button", { name: "ฟังต่อ" }).first().click();
  const heard = (await state(page)).rumorSeenLog;
  expect(Object.keys(heard)).toHaveLength(1);

  await visit(page, "npc-city_capital_magistrate_wu");
  await page.getByRole("button", { name: /บัญชีคลังหลวงที่หายไป/ }).click();
  await page.getByRole("button", { name: "ข้าจะไปพบเสมียนนายฉิง" }).click();
  await page.getByRole("button", { name: "รับทราบ" }).click();
  await visit(page, "npc-city_capital_clerk_qing");
  await page.getByRole("button", { name: /ทักทาย/ }).click();
  const stage = page.getByTestId("dialog-stage");
  await expect(stage.getByRole("heading", { name: "เสมียนนายฉิง" })).toBeVisible();
  await page.getByRole("button", { name: "ถามถึงบัญชีคลังหลวงที่หายไป" }).click();
  await page.getByRole("button", { name: "ตรวจหีบเอกสารข้างเสมียนนายฉิง" }).click();
  await page.getByRole("button", { name: "ขอยืมกุญแจเก่าจากนายฉิง" }).click();
  expect((await state(page)).quests.qc_capital_lost_ledger.stage).toBe(1);
  expect((await state(page)).inventory.old_key).toBe(1);
  await page.screenshot({ path: "test-results/screenshots/qing-ledger-desktop.png" });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true");
  await expect(stage.getByRole("heading", { name: "เสมียนนายฉิง" })).toBeVisible();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-visible-props", /archive-chest/);
  const world = page.getByTestId("world-canvas");
  await expect(world).toHaveAttribute("data-read-only", "true");
  await expect.poll(async () => Number(await world.getAttribute("data-player-x"))).toBeCloseTo(431.6, 0);
  await expect.poll(async () => Number(await world.getAttribute("data-player-y"))).toBeCloseTo(202.4, 0);
  await expect(world).toHaveAttribute("data-player-facing", "west");
  // Full-screen conversation: the lines and every choice fit without scrolling.
  await expect.poll(() => page.evaluate(() => {
    const panel = document.querySelector('[data-testid="dialog-stage"] [role="dialog"]')!.getBoundingClientRect();
    const content = document.querySelector<HTMLElement>('[data-testid="dialog-stage"] [role="region"]')!;
    return panel.height > innerHeight * 0.85 && content.scrollHeight - content.clientHeight <= 2;
  })).toBe(true);
  const restoredPosition = await world.getAttribute("data-player-x");
  await page.keyboard.down("d");
  await page.waitForTimeout(250);
  await page.keyboard.up("d");
  await expect(world).toHaveAttribute("data-player-x", restoredPosition!);
  expect((await state(page)).rumorSeenLog).toEqual(heard);
  await page.screenshot({ path: "test-results/screenshots/qing-ledger-phone.png" });
  await page.getByRole("button", { name: "กลับไปตรวจหีบเอกสาร" }).click();
  const restoredCanvas = await world.locator("canvas").elementHandle();
  await page.getByRole("button", { name: "ใช้กุญแจเก่าเปิดหีบและหยิบบัญชี" }).click();
  await expect(world).toHaveAttribute("data-visible-props", "archive-chest-open");
  expect(await restoredCanvas!.evaluate(node => node === document.querySelector('[data-testid="world-canvas"] canvas'))).toBe(true);
  await page.screenshot({ path: "test-results/screenshots/qing-open-chest-phone.png" });
  expect((await state(page)).quests.qc_capital_lost_ledger.stage).toBe(2);
  await page.getByRole("button", { name: "นำบัญชีไปรายงานนายอำเภอหวู่" }).click();
  await visit(page, "npc-city_capital_magistrate_wu");
  await page.getByRole("button", { name: /บัญชีคลังหลวงที่หายไป/ }).click();
  await page.getByRole("button", { name: "ส่งมอบบัญชีและรับรางวัล" }).click();
  const receipt = page.getByTestId("quest-completion-receipt");
  await expect(receipt).toContainText("+150");
  await expect(receipt).toContainText("+30");
  await receipt.getByRole("button", { name: "เดินทางต่อ" }).click();
  const rewarded = await state(page);
  expect(rewarded.quests.qc_capital_lost_ledger.status).toBe("done");
  expect(rewarded.gold).toBe(150);
  expect(rewarded.wExp).toBe(30);
  expect(rewarded.npcStates.city_capital_magistrate_wu.relationship).toBe(8);
  expect(rewarded.inventory.old_key).toBe(1);
  await page.reload();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true");
  await expect(receipt).toHaveCount(0);
  await expect(world).toHaveAttribute("data-visible-props", "archive-chest-open");
  expect((await state(page)).gold).toBe(150);
  expect((await state(page)).wExp).toBe(30);
  expect((await state(page)).rumorSeenLog).toEqual(heard);
  expect(errors).toEqual([]);
});
