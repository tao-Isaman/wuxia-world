import { test, expect, type Page } from "@playwright/test";

type Host = HTMLElement & { worldScreenPoint?: (x: number, y: number) => { x: number; y: number } };

async function save(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("wusia-world-v1")!).state);
}

test("walking brings foes onto the map; walking into one opens its encounter with power tiers", async ({ page }) => {
  // Walk ticks need the random-events switch on; a seeded RNG keeps the run repeatable.
  await page.addInitScript(() => {
    localStorage.removeItem("wuxia-random-events");
    let seed = 7;
    Math.random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  });
  await page.goto("/");
  await page.locator("#hero-name").fill("จอมยุทธ์");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  const world = page.getByTestId("world-canvas");
  await expect(world).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem("wusia-world-v1")!);
    Object.assign(raw.state, { currentSceneId: "city_capital", lastLocationId: "city_capital" });
    localStorage.setItem("wusia-world-v1", JSON.stringify(raw));
  });
  await page.reload();
  await expect(world).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await world.focus();

  // Pace back and forth until a foe stands on the map (a tick every 220 units walked).
  for (let i = 0; i < 24 && Number(await world.getAttribute("data-foes") ?? 0) === 0; i++) {
    const key = i % 2 ? "a" : "d";
    await page.keyboard.down(key);
    await page.waitForTimeout(900);
    await page.keyboard.up(key);
  }
  await expect.poll(async () => Number(await world.getAttribute("data-foes") ?? 0), { timeout: 5_000 }).toBeGreaterThan(0);
  expect((await save(page)).pendingEncounter).toBeNull();
  await page.screenshot({ path: "test-results/screenshots/roaming-foe.png" });

  // Tap the foe: the hero walks over and, on contact, the encounter opens.
  const [[fx, fy]] = JSON.parse((await world.getAttribute("data-foes-at"))!) as [number, number][];
  const point = await world.evaluate((host: Host, at) => host.worldScreenPoint!(at[0], at[1]), [fx, fy] as [number, number]);
  await page.mouse.click(point.x, point.y);
  const encounter = page.getByTestId("encounter-screen");
  await expect(encounter).toBeVisible({ timeout: 20_000 });
  await expect(encounter.getByTestId("power-readout")).toBeVisible();
  expect((await save(page)).pendingEncounter?.returnSceneId).toBe("city_capital");
  // Fleeing returns to the map, the foe gone.
  await encounter.getByRole("button", { name: /หนี/ }).click();
  await expect(world).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  expect((await save(page)).pendingEncounter).toBeNull();
});
