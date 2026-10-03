import { test, expect } from "@playwright/test";

test("music follows the game: title → world → battle, with a sound settings bubble", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const html = page.locator("html");
  await expect(html).toHaveAttribute("data-music", "title");
  // The first gesture starts the audio engine (browser autoplay rules).
  await page.locator("#hero-name").click();
  await page.locator("#hero-name").fill("นักดนตรี");
  await expect(html).toHaveAttribute("data-audio", "running");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await expect(html).toHaveAttribute("data-music", /^(world|night)$/);
  // The main theme is a recording (public/audio/), streamed once sound is running.
  await expect(html).toHaveAttribute("data-music-source", "recording");
  await expect.poll(() => page.evaluate(() => performance.getEntriesByType("resource").some((e) => /\/audio\/theme-[12]\.mp3/.test(e.name))),
    { timeout: 15_000 }).toBe(true);

  // Settings live in a small bubble: switching music off persists.
  const icons = page.getByRole("navigation", { name: "เมนูเกม" });
  await icons.getByRole("button", { name: "เสียง", exact: true }).click();
  const bubble = page.getByRole("group", { name: "ตั้งค่าเสียง" });
  await bubble.getByRole("checkbox", { name: /ดนตรี/ }).uncheck();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("wuxia-audio-v1")!).music)).toBe(false);
  await bubble.getByRole("checkbox", { name: /ดนตรี/ }).check();
  await page.keyboard.press("Escape");
  await expect(bubble).toHaveCount(0);

  await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem("wusia-world-v1")!);
    save.state.pendingBattle = { opponentId: "petty_thief", onWin: "home_player", onLose: "home_player", nonFatal: true };
    localStorage.setItem("wusia-world-v1", JSON.stringify(save));
  });
  await page.reload();
  await page.getByRole("button", { name: /เข้าต่อสู้/ }).click();
  await expect(page.getByTestId("battle-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await page.getByRole("button", { name: "เสียง", exact: true }).click(); // a gesture after reload
  await expect(html).toHaveAttribute("data-music", "battle");
  await expect(html).toHaveAttribute("data-music-source", "recording");
  expect(errors).toEqual([]);
});
