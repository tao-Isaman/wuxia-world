import { test, expect } from "@playwright/test";

test("both heroes walk on their eight-way frames and face where they go", async ({ page }) => {
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
    // Heroes walk on their eight-way cells (lib/characters/walk8.ts; a PixelLab sheet's own,
    // lib/characters/pl-sheets.ts): the pose names the painted row (west walks mirror east).
    await expect(world).toHaveAttribute("data-player-motion", "idle");
    await expect(world).toHaveAttribute("data-player-pose", /^stand:/);
    await world.focus();
    const at = async (axis: "x" | "y") => Number(await world.getAttribute(`data-player-${axis}`));
    // Out and back on each axis. The way back walks until the hero has passed
    // where the step began, so however long the test takes to see a frame turn
    // (a loaded machine is slow to look), the hero ends where it started and
    // never drifts into the yard's edge, the house or the well.
    for (const axis of [
      { coord: "x" as const, out: { key: "d", dir: "E", row: "E", sign: 1 }, back: { key: "a", dir: "W", row: "E", sign: -1 } },
      { coord: "y" as const, out: { key: "w", dir: "N", row: "N", sign: -1 }, back: { key: "s", dir: "S", row: "S", sign: 1 } },
    ]) {
      const start = await at(axis.coord);
      for (const step of [axis.out, axis.back]) {
        // Hold the key the way a keyboard does: a held key repeats its keydown, so one
        // dropped while the map was not taking input (just rebuilt, or busy for a
        // moment) is sent again. The hero spawns facing E, so the heading alone
        // could not tell whether the first step's key arrived.
        await expect(async () => {
          await page.keyboard.down(step.key);
          // Motion and pose are written in the same tick: read them together.
          const state = await world.evaluate((host) => [host.dataset.playerMotion, host.dataset.playerPose, host.dataset.playerDir]);
          expect(state).toEqual(["walk", `walk:${step.row}`, step.dir]);
        }).toPass({ intervals: [50, 100, 250], timeout: 15_000 });
        const first = await world.getAttribute("data-player-frame");
        await expect.poll(() => world.getAttribute("data-player-frame")).not.toBe(first);
        // Back to (or just past) where the axis began.
        if (step === axis.back) await expect.poll(async () => (await at(axis.coord) - start) * step.sign, { intervals: [16] }).toBeGreaterThanOrEqual(0);
        await page.keyboard.up(step.key);
        await expect(world).toHaveAttribute("data-player-motion", "idle");
        await expect(world).toHaveAttribute("data-player-pose", `stand:${step.row}`);
        await expect(world).toHaveAttribute("data-player-dir", step.dir);
      }
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
  await expect(world).toHaveAttribute("data-player-pose", /^stand:/);
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
