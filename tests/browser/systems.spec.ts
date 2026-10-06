import { test, expect, type Page } from "@playwright/test";

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
async function visit(page: Page, marker: string) {
  await page.getByRole("button", { name: /จุดหมาย/ }).click();
  await page.locator(`[data-places-tab="${await page.locator(`[data-marker-id="${marker}"]`).getAttribute("data-category")}"]`).click();
  await page.locator(`[data-marker-id="${marker}"]`).click();
}
async function newGame(page: Page) {
  await page.goto("/");
  await page.locator("#hero-name").fill("จอมยุทธ์");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
}

test("letters: a friend's letter waits in the inbox with a badge; opening it takes the gift", async ({ page }) => {
  test.setTimeout(120_000);
  await newGame(page);
  await patch(page, { letters: [{ id: "letter_e2e", day: 1, npcId: "sect_shaolin_abbot_huiyuan", text: "ทดสอบจดหมาย\n\n— เจ้าอาวาส",
    rarity: 3, itemId: "potion", count: 2, read: false, claimed: false }] });
  const tab = page.getByRole("button", { name: "จดหมาย" });
  await expect(tab.locator(".hud-icon-badge")).toHaveText("1");
  await tab.click();
  await page.getByTestId("letters-list").getByRole("button").first().click();
  await expect(page.getByTestId("letter-open")).toContainText("ทดสอบจดหมาย");
  await expect(page.getByTestId("letter-open")).toContainText("หายาก");
  const after = await save(page);
  expect(after.inventory.potion).toBeGreaterThanOrEqual(2);
  expect(after.letters[0].read).toBe(true);
  // The gift shows as an icon; the letter can be thrown away.
  await expect(page.getByTestId("letter-open").locator(".letter-gift .item-tile")).toBeVisible();
  await page.getByTestId("letter-delete").click();
  await page.getByRole("dialog").filter({ hasText: "ลบจดหมายฉบับนี้" }).getByRole("button", { name: "ลบ", exact: true }).click();
  await expect.poll(async () => (await save(page)).letters.length).toBe(0);
  await expect(page.getByTestId("letters-empty")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(tab.locator(".hud-icon-badge")).toHaveCount(0);
});

test("horse station: ride from the capital to a visited city for gold and time", async ({ page }) => {
  test.setTimeout(120_000);
  await newGame(page);
  await patch(page, { currentSceneId: "city_capital", lastLocationId: "city_capital", gold: 1000,
    visitedLocationIds: ["city_capital", "city_changan"] });
  await visit(page, "station");
  const trips = page.getByTestId("station-trips");
  await expect(trips).toContainText("ฉางอัน");
  await page.getByTestId("station-ride-city_changan").click();
  await expect.poll(async () => (await save(page)).currentSceneId).toBe("city_changan");
  expect((await save(page)).gold).toBeLessThan(1000);
});

test("sword tournament: register in the window, then the tournament day queues a bout", async ({ page }) => {
  test.setTimeout(120_000);
  await newGame(page);
  await patch(page, { currentSceneId: "sect_huashan", lastLocationId: "sect_huashan", gold: 1000, day: 70 });
  await visit(page, "tournament");
  const popup = page.getByTestId("tournament-popup");
  await expect(popup.getByTestId("tournament-calendar")).toContainText("เปิดรับสมัคร");
  await popup.getByTestId("tournament-register").click();
  await expect.poll(async () => (await save(page)).tournament?.status).toBe("registered");
  expect((await save(page)).gold).toBe(900);
  await page.keyboard.press("Escape");

  await patch(page, { day: 90 });
  await visit(page, "tournament");
  await page.getByTestId("tournament-popup").getByTestId("tournament-start").click();
  await expect.poll(async () => (await save(page)).pendingBattle?.tournament).toBe(true);
  const state = await save(page);
  expect(state.tournament.rounds[0]).toHaveLength(32);
  expect(state.tournament.rounds[0]).toContain("player");
  await expect(page.getByTestId("battle-briefing")).toBeVisible({ timeout: 20_000 });
});
