import { test, expect } from "@playwright/test";

test("both heroes walk on their painted eight-way frames and face where they go", async ({ page }) => {
  // Two reloads with walks in four of the eight painted directions: ~11 s per character.
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.locator("#hero-name").fill("นักเดินทาง");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  const world = page.getByTestId("world-canvas");
  await expect(world).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  for (const id of ["m1", "f1"]) {
    await page.evaluate((bodyId) => {
      const save = JSON.parse(localStorage.getItem("wusia-world-v1")!);
      save.state.playerBodyId = bodyId;
      localStorage.setItem("wusia-world-v1", JSON.stringify(save));
    }, id);
    await page.reload();
    await expect(world).toHaveAttribute("data-ready", "true");
    await expect(world).toHaveAttribute("data-renderer", "phaser");
    // Heroes walk on their painted eight-way cells (lib/characters/walk8.ts):
    // walks S 24–27, SE 28–31, E 32–35, NE 36–39, N 40–43; standing S 44 … N 48.
    await expect(world).toHaveAttribute("data-player-motion", "idle");
    expect(Number(await world.getAttribute("data-player-frame"))).toBeGreaterThanOrEqual(44);
    await world.focus();
    for (const step of [
      { key: "d", dir: "E", walk: 32, stand: 46 },
      { key: "w", dir: "N", walk: 40, stand: 48 },
      { key: "s", dir: "S", walk: 24, stand: 44 },
      { key: "a", dir: "W", walk: 32, stand: 46 },
    ]) {
      await page.keyboard.down(step.key);
      await expect(world).toHaveAttribute("data-player-dir", step.dir);
      await expect(world).toHaveAttribute("data-player-motion", "walk");
      const first = Number(await world.getAttribute("data-player-frame"));
      expect(first).toBeGreaterThanOrEqual(step.walk);
      expect(first).toBeLessThan(step.walk + 4);
      await expect.poll(() => world.getAttribute("data-player-frame")).not.toBe(String(first));
      await page.keyboard.up(step.key);
      await expect(world).toHaveAttribute("data-player-motion", "idle");
      await expect(world).toHaveAttribute("data-player-frame", String(step.stand));
      await expect(world).toHaveAttribute("data-player-dir", step.dir);
    }
    await expect(world.locator("canvas")).toHaveCount(1);
  }
  expect(errors).toEqual([]);
});

test("reduced motion and WebGL recovery preserve one playable world", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator("#hero-name").fill("นักเดินทาง");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  const world = page.getByTestId("world-canvas");
  await expect(world).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  // Reduced motion: the hero holds one standing pose.
  const standing = await world.getAttribute("data-player-frame");
  expect(Number(standing)).toBeGreaterThanOrEqual(44);
  await page.waitForTimeout(600);
  await expect(world).toHaveAttribute("data-player-frame", standing!);
  await world.locator("canvas").evaluate((node: HTMLCanvasElement) => {
    const gl = node.getContext("webgl");
    if (!gl) throw new Error("Expected a Phaser WebGL context");
    const extension = gl.getExtension("WEBGL_lose_context");
    if (!extension) throw new Error("WebGL context-loss simulation unavailable");
    extension.loseContext();
  });
  await expect(world).toHaveAttribute("data-ready", "false");
  await page.getByRole("button", { name: "ลองใหม่", exact: true }).click();
  await expect(world).toHaveAttribute("data-ready", "true");
  await expect(world.locator("canvas")).toHaveCount(1);
  await world.focus();
  const before = Number(await world.getAttribute("data-player-x"));
  await page.keyboard.down("d");
  await expect.poll(async () => Number(await world.getAttribute("data-player-x"))).toBeGreaterThan(before + 10);
  await page.keyboard.up("d");
});
