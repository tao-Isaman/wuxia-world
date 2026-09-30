import { test, expect } from "@playwright/test";

test("all eight characters have distinct idle and walking frames in Phaser", async ({ page }) => {
  // Eight reloads with walk cycles in four directions: ~11 s per character.
  test.setTimeout(150_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.locator("#hero-name").fill("นักเดินทาง");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  const world = page.getByTestId("world-canvas");
  await expect(world).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  for (const id of ["m1", "m2", "m3", "m4", "f1", "f2", "f3", "f4"]) {
    await page.evaluate((bodyId) => {
      const save = JSON.parse(localStorage.getItem("wusia-world-v1")!);
      save.state.playerBodyId = bodyId;
      localStorage.setItem("wusia-world-v1", JSON.stringify(save));
    }, id);
    await page.reload();
    await expect(world).toHaveAttribute("data-ready", "true");
    await expect(world).toHaveAttribute("data-renderer", "phaser");
    await expect(world).toHaveAttribute("data-player-motion", "idle");
    const idleFrame = await world.getAttribute("data-player-frame");
    await expect.poll(() => world.getAttribute("data-player-frame")).not.toBe(idleFrame);
    await world.focus();
    await page.keyboard.down("d");
    await expect(world).toHaveAttribute("data-player-motion", "walk");
    const walkFrame = await world.getAttribute("data-player-frame");
    expect(Number(walkFrame)).toBeGreaterThanOrEqual(4);
    await expect.poll(() => world.getAttribute("data-player-frame")).not.toBe(walkFrame);
    await page.keyboard.up("d");
    await expect(world).toHaveAttribute("data-player-motion", "idle");
    for (const direction of [{ key: "w", facing: "north", start: 16 }, { key: "s", facing: "south", start: 20 }]) {
      await page.keyboard.down(direction.key);
      await expect(world).toHaveAttribute("data-player-facing", direction.facing);
      await expect.poll(async () => Number(await world.getAttribute("data-player-frame"))).toBeGreaterThanOrEqual(direction.start);
      await expect.poll(async () => Number(await world.getAttribute("data-player-frame"))).toBeLessThan(direction.start + 4);
      await page.keyboard.up(direction.key);
      await expect(world).toHaveAttribute("data-player-motion", "idle");
      await expect(world).toHaveAttribute("data-player-frame", String(direction.start));
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
  await expect(world).toHaveAttribute("data-player-frame", "0");
  await page.waitForTimeout(600);
  await expect(world).toHaveAttribute("data-player-frame", "0");
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
