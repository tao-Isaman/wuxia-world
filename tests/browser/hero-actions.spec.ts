import { test, expect, type Page } from "@playwright/test";

// The heroes' painted action sprites (lib/characters/hero-actions.ts): weapon
// forms in battle, work loops in the work overlay; and an older save's body
// falls back to its gender's hero.

async function start(page: Page) {
  await page.goto("/");
  await page.locator("#hero-name").fill("จอมยุทธ์");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
}

test("one body per gender; the hero fights with painted weapon frames", async ({ page }) => {
  test.setTimeout(150_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  // The creation screen has no body picker any more: the gender sets it.
  await expect(page.getByRole("group", { name: "รูปร่าง" })).toHaveCount(0);
  await page.getByRole("button", { name: "หญิง", exact: true }).click();
  await expect(page.locator(".creation-preview .character-preview")).toHaveAttribute("data-character-id", "f1");
  await page.getByRole("button", { name: "ชาย", exact: true }).click();
  await expect(page.locator(".creation-preview .character-preview")).toHaveAttribute("data-character-id", "m1");
  await start(page);

  // An old save with a retired body (m3) plays as m1.
  await page.evaluate(() => {
    const persisted = JSON.parse(localStorage.getItem("wusia-world-v1")!);
    persisted.state.playerBodyId = "m3";
    persisted.state.pendingBattle = { opponentId: "training_capital_apprentice", onWin: "home_player", onLose: "home_player", nonFatal: true };
    localStorage.setItem("wusia-world-v1", JSON.stringify(persisted));
  });
  await page.reload();
  await page.getByRole("button", { name: /เข้าต่อสู้/ }).click();
  const battle = page.getByTestId("battle-canvas");
  await expect(battle).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await page.getByRole("button", { name: /อัตโนมัติ/ }).click();
  // The starter punch is a fist move: stance, wind-up and strike of the fist row (frames 0–4).
  await expect.poll(async () => (await battle.getAttribute("data-hero-poses")) ?? "", { timeout: 60_000 }).toMatch(/(^|,)2(,|$)/);
  const poses = ((await battle.getAttribute("data-hero-poses")) ?? "").split(",").map(Number);
  expect(poses.some((frame) => frame === 1)).toBe(true);
  await page.screenshot({ path: "test-results/screenshots/hero-attack-pose.png" });
  // The repaired body is saved with the next store write (the battle's outcome).
  await page.getByRole("button", { name: "ดำเนินเรื่อง →" }).click({ timeout: 90_000 });
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("wusia-world-v1")!).state.playerBodyId);
  expect(stored).toBe("m1");
  expect(errors).toEqual([]);
});

test("resting shows the hero asleep, on the map and in the work overlay", async ({ page }) => {
  await start(page);
  // Tired, so resting is offered.
  await page.evaluate(() => {
    const persisted = JSON.parse(localStorage.getItem("wusia-world-v1")!);
    persisted.state.stamina = 10;
    localStorage.setItem("wusia-world-v1", JSON.stringify(persisted));
  });
  await page.reload();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await page.getByRole("button", { name: "พักผ่อน", exact: true }).click();
  await page.getByRole("group", { name: "เลือกวิธีพักผ่อน" }).getByRole("button", { name: /นอนพักที่บ้าน/ }).click();
  // The overlay lasts 1.4 s: read the work sprite and the map in the same frame
  // (a slow page can otherwise see it close between two checks).
  const seen = await page.waitForFunction(() => {
    const sprite = document.querySelector('.work-overlay .hero-action-sprite[data-hero-pose="work:sleep"]');
    const action = document.querySelector('[data-testid="world-canvas"]')?.getAttribute("data-player-action") ?? "";
    // On the map too: the hero plays the sleep loop (row 13) in place of standing.
    return sprite && /^13:/.test(action) ? getComputedStyle(sprite).backgroundImage : null;
  }, undefined, { polling: "raf" });
  expect(await seen.jsonValue()).toContain("/art/characters/m1-work.png");
  await page.screenshot({ path: "test-results/screenshots/hero-sleep-pose.png" });
  await expect(page.locator(".work-overlay")).toHaveCount(0, { timeout: 5_000 });
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-player-action", "");
});
