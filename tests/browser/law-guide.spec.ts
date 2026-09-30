import { test, expect, type Page } from "@playwright/test";

async function start(page: Page) {
  await page.goto("/");
  await page.locator("#hero-name").fill("ผู้ถูกตามล่า");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
}
async function save(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("wusia-world-v1")!).state);
}
async function patch(page: Page, fields: Record<string, unknown>, map = true) {
  await page.evaluate((next) => {
    const saved = JSON.parse(localStorage.getItem("wusia-world-v1")!);
    Object.assign(saved.state, next);
    localStorage.setItem("wusia-world-v1", JSON.stringify(saved));
  }, fields);
  await page.reload();
  if (map) await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
}

test("wanted marks: walking draws the law, jail costs days per mark and clears them", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await start(page);
  await patch(page, { currentSceneId: "city_capital", lastLocationId: "city_capital", wanted: 3, wantedDay: 1 });
  await expect(page.locator(".hud-wanted")).toContainText("●●●");
  const world = page.getByTestId("world-canvas");

  // Standing still or arriving never rolls; walking does.
  expect((await save(page)).pendingEncounter).toBeNull();
  await page.evaluate(() => { localStorage.removeItem("wuxia-random-events"); Math.random = () => 0; });
  await world.focus();
  for (const key of ["d", "a", "d", "a"]) {
    if ((await save(page)).pendingEncounter) break;
    await page.keyboard.down(key);
    await page.waitForTimeout(900);
    await page.keyboard.up(key);
  }
  await expect.poll(async () => (await save(page)).pendingEncounter?.opponentId ?? "").toMatch(/^law_/);
  expect((await save(page)).jailCityId).toBe("city_capital");
  await page.screenshot({ path: "test-results/screenshots/law-encounter.png" });

  // A lost fight lands in jail (the battle's onLose); serve the sentence.
  await page.evaluate(() => localStorage.setItem("wuxia-random-events", "off"));
  const before = await save(page);
  await patch(page, { pendingEncounter: null, currentSceneId: "jail_cell" }, false);
  await expect(page.getByText("ผู้คุม").first()).toBeVisible();
  await page.screenshot({ path: "test-results/screenshots/jail-cell.png" });
  await page.getByRole("button", { name: /รับโทษจนพ้นกำหนด/ }).click();
  await expect.poll(async () => (await save(page)).currentSceneId).toBe("jail_released");
  const after = await save(page);
  expect(after.day).toBe(before.day + 6);
  expect(after.wanted).toBe(0);
  expect(after.lastLocationId).toBe("city_capital");
  expect(errors).toEqual([]);
});

test("quest guide: the log names who and where, the map points the way, busy work blocks input", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await start(page);
  await patch(page, { quests: { qc_capital_lost_ledger: { id: "qc_capital_lost_ledger", status: "active", stage: 0 } } });
  const world = page.getByTestId("world-canvas");
  // At home the arrow sits on the road toward the capital.
  await expect(world).toHaveAttribute("data-guide-marker", "route_home_player__to__city_capital");

  await page.getByRole("navigation", { name: "เมนูเกม" }).getByRole("button", { name: /ภารกิจ/ }).click();
  await page.getByRole("button", { name: /บัญชีคลังหลวงที่หายไป/ }).click();
  const guide = page.locator(".quest-guide");
  await expect(guide).toContainText("เสมียนนายฉิง");
  await expect(guide).toContainText("นครหลวง");
  await guide.getByRole("button", { name: /นำทาง/ }).click();
  expect((await save(page)).flags.trackedQuestId).toBe("qc_capital_lost_ledger");
  await page.screenshot({ path: "test-results/screenshots/quest-guide-log.png" });
  await page.keyboard.press("Escape");

  // In the capital the arrow moves onto the clerk himself.
  await patch(page, { currentSceneId: "city_capital", lastLocationId: "city_capital", stamina: 20 });
  await expect(world).toHaveAttribute("data-guide-marker", "npc-city_capital_clerk_qing");
  await page.screenshot({ path: "test-results/screenshots/quest-guide-map.png" });

  // Resting shows the hero at work behind a progress bar that swallows taps.
  await page.getByRole("button", { name: "พักผ่อน", exact: true }).click();
  // Probe in the browser the moment the overlay mounts: the centre of the
  // screen must hit the overlay and it must carry a progress bar.
  const blocked = page.evaluate(() => new Promise<boolean>((resolve) => {
    const check = () => {
      const overlay = document.querySelector(".work-overlay");
      if (!overlay) return requestAnimationFrame(check);
      const hit = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
      resolve(!!hit?.closest("[data-world-busy]") && !!overlay.querySelector('[role="progressbar"]'));
    };
    check();
  }));
  await page.getByRole("group", { name: "เลือกวิธีพักผ่อน" }).locator("button:enabled").first().click();
  expect(await blocked).toBe(true);
  const overlay = page.locator(".work-overlay");
  await expect(overlay).toHaveCount(0);
  expect(errors).toEqual([]);
});
