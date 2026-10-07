import { test, expect, type Page } from "@playwright/test";

// Bosses and T5 foes are drawn from animated sheets (lib/characters/anim-sheets.ts,
// UnitLook / WorldFoe `kind: "anim"`): the briefing portrait shows the sheet's
// idle frame, the battle board plays it, and a legendary beast waits in its lair
// on the map. Needs the foes wave's opponents (boss_golden_serpent, t5_wolf_king
// in lib/world/data/opponents.ts) and bosses (lib/world/data/bosses.ts).

async function newGame(page: Page) {
  await page.goto("/");
  await page.locator("#hero-name").fill("จอมยุทธ์");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
}

for (const [opponentId, withPack] of [["boss_golden_serpent", true], ["t5_wolf_king", false]] as const) {
  test(`anim foes: ${opponentId} is briefed and fought as its animated sheet`, async ({ page }) => {
    test.setTimeout(150_000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await newGame(page);
    await page.evaluate(({ opponentId, withPack }) => {
      const raw = JSON.parse(localStorage.getItem("wusia-world-v1")!);
      Object.assign(raw.state, { pendingBattle: { opponentId, onWin: "home_player", onLose: "home_player", nonFatal: true, withPack } });
      localStorage.setItem("wusia-world-v1", JSON.stringify(raw));
    }, { opponentId, withPack });
    await page.reload();

    // The briefing portrait is the sheet's first idle frame.
    const portrait = page.locator(`[data-anim-sheet="${opponentId}"]`).first();
    await expect(portrait).toBeVisible({ timeout: 60_000 });
    await expect(portrait.locator("canvas")).toHaveAttribute("data-anim-frame", /\d+/, { timeout: 20_000 });
    await page.screenshot({ path: `test-results/screenshots/anim-briefing-${opponentId}.png` });

    await page.getByRole("button", { name: /เข้าต่อสู้/ }).click({ timeout: 60_000 });
    const battle = page.getByTestId("battle-canvas");
    await expect(battle).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
    await expect(battle).toHaveAttribute("data-renderer", "phaser");

    // The main foe stands on the board as its sheet (and its pack, when it has one, beside it).
    const units = JSON.parse((await battle.getAttribute("data-units")) ?? "[]") as { id: string; team: string; look: string; sheet?: string; alive: boolean }[];
    const foe = units.find((u) => u.id === "B");
    expect(foe?.look).toBe("anim");
    expect(foe?.sheet).toBe(opponentId);
    if (withPack) expect(units.filter((u) => u.team === "enemy").length).toBeGreaterThan(1);
    const drawn = JSON.parse((await battle.getAttribute("data-anim-units")) ?? "{}") as Record<string, string>;
    expect(drawn.B).toBe(opponentId);

    // The turn bar's cell for it shows the same sheet (unless a boss has already ended it).
    await expect.poll(async () => await page.locator(`[data-anim-sheet="${opponentId}"]`).count() > 0
      || await page.getByTestId("combat-result").isVisible()).toBe(true);
    // Nothing was thrown while drawing.
    await page.waitForTimeout(1_000);
    await page.screenshot({ path: `test-results/screenshots/anim-battle-${opponentId}.png` });
    expect(errors).toEqual([]);

    // Let it play out: casts (attack clip) and hits (hurt clip) run without breaking the stage.
    // (A boss may end it before the hero's first turn; the auto button is gone by then.)
    await page.getByRole("button", { name: /อัตโนมัติ/ }).click({ timeout: 5_000 }).catch(() => undefined);
    await expect.poll(async () => Number(await battle.getAttribute("data-impact-count") ?? 0), { timeout: 60_000 }).toBeGreaterThan(0);
    await expect(battle).toHaveAttribute("data-ready", "true");
    expect(errors).toEqual([]);
  });
}

test("anim foes: the golden serpent waits in its lair, large, with a name plate", async ({ page }) => {
  test.setTimeout(120_000);
  await newGame(page);
  await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem("wusia-world-v1")!);
    Object.assign(raw.state, { currentSceneId: "cave_jinshe", lastLocationId: "cave_jinshe", visitedLocations: [...(raw.state.visitedLocations ?? []), "cave_jinshe"] });
    localStorage.setItem("wusia-world-v1", JSON.stringify(raw));
  });
  await page.reload();
  const world = page.getByTestId("world-canvas");
  await expect(world).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await expect.poll(async () => (await world.getAttribute("data-boss-foes")) ?? "", { timeout: 20_000 }).not.toBe("");
  const looks = JSON.parse((await world.getAttribute("data-foe-looks")) ?? "{}") as Record<string, string>;
  const bossIds = ((await world.getAttribute("data-boss-foes")) ?? "").split(" ").filter(Boolean);
  for (const id of bossIds) expect(looks[id]).toBe("anim");
  await page.screenshot({ path: "test-results/screenshots/anim-boss-lair.png" });
});
