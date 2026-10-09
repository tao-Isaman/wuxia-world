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
    // Out and back on each axis, so the hero stays in the open yard (and never ends up against the well).
    for (const step of [
      { key: "d", dir: "E", row: "E" },
      { key: "a", dir: "W", row: "E" },
      { key: "w", dir: "N", row: "N" },
      { key: "s", dir: "S", row: "S" },
    ]) {
      await page.keyboard.down(step.key);
      await expect(world).toHaveAttribute("data-player-dir", step.dir);
      // Motion and pose are written in the same tick: read them together (a short walk
      // can end against a wall between two separate reads).
      await page.waitForFunction((row) => {
        const host = document.querySelector('[data-testid="world-canvas"]');
        return host?.getAttribute("data-player-motion") === "walk" && host.getAttribute("data-player-pose") === `walk:${row}`;
      }, step.row, { polling: "raf", timeout: 15_000 });
      const first = await world.getAttribute("data-player-frame");
      await expect.poll(() => world.getAttribute("data-player-frame")).not.toBe(first);
      await page.keyboard.up(step.key);
      await expect(world).toHaveAttribute("data-player-motion", "idle");
      await expect(world).toHaveAttribute("data-player-pose", `stand:${step.row}`);
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
