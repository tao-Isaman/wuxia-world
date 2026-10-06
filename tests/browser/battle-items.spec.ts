import { test, expect } from "@playwright/test";

// ใช้ของ in a fight: the hero's potions, poisons and hidden weapons
// (ItemDef.battle). Using one costs the turn; the world takes it from the bag.
test("battle items: open ใช้ของ, drink a potion; the bag keeps what was not used", async ({ page }) => {
  await page.goto("/");
  await page.locator("#hero-name").fill("นักซัด");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem("wusia-world-v1")!);
    Object.assign(raw.state, {
      currentHp: 60,
      inventory: { potion: 2, throw_dart: 5, cooked_meat: 2 },
      pendingBattle: { opponentId: "petty_thief", onWin: "home_player", onLose: "home_player", nonFatal: true },
    });
    raw.state.playerBuild.stats.DEX = 20;
    localStorage.setItem("wusia-world-v1", JSON.stringify(raw));
  });
  await page.reload();
  await page.getByRole("button", { name: /เข้าต่อสู้/ }).click({ timeout: 60_000 });
  const battle = page.getByTestId("battle-canvas");
  await expect(battle).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await expect(page.getByTestId("combat-status")).toHaveAttribute("data-phase", "player", { timeout: 30_000 });
  await expect(battle).toHaveAttribute("data-anim", "idle");

  // The tray lists the battle items (no food) with their counts.
  await page.getByRole("button", { name: "ใช้ของ" }).click();
  const tray = page.getByTestId("battle-items");
  await expect(tray).toBeVisible();
  await expect(tray.getByRole("button", { name: "ยาเลือดเล็ก ×2" })).toBeVisible();
  await expect(tray.getByRole("button", { name: "ลูกดอกเหล็ก ×5" })).toBeVisible();
  await expect(tray.getByRole("button", { name: /เนื้อย่าง/ })).toHaveCount(0);
  await page.screenshot({ path: "test-results/screenshots/battle-items.png" });

  // Drinking a potion heals the hero and ends the turn.
  const heroHp = async () => (JSON.parse((await battle.getAttribute("data-units")) ?? "[]") as { id: string; hp: number }[]).find((u) => u.id === "A")!.hp;
  const before = await heroHp();
  await tray.getByRole("button", { name: "ยาเลือดเล็ก ×2" }).click();
  await expect(tray).toHaveCount(0);
  await expect.poll(heroHp).toBeGreaterThan(before);

  // Let the fight finish, then continue: one potion left in the bag, food untouched.
  await page.getByRole("button", { name: /อัตโนมัติ/ }).click();
  await expect(page.getByTestId("combat-result")).toBeVisible({ timeout: 90_000 });
  await page.getByRole("button", { name: /ดำเนินเรื่อง/ }).click();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  const inv = await page.evaluate(() => JSON.parse(localStorage.getItem("wusia-world-v1")!).state.inventory);
  expect(inv.potion).toBe(1);
  expect(inv.cooked_meat).toBe(2);
  expect(inv.throw_dart).toBe(5);
});
