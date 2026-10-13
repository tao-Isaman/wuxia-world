import { test, expect, type Page } from "@playwright/test";

// The HUD menu on a phone (docs/rendering.md): the section icons fold behind
// one เมนู button so the map stays clear; its badge sums the icons' badges;
// opening a section folds the menu again. Larger screens show every icon.
// The suite seeds "open" (playwright.config.ts); this spec drops it.

async function start(page: Page) {
  await page.addInitScript(() => localStorage.removeItem("wuxia-hud-menu"));
  await page.goto("/");
  await page.locator("#hero-name").fill("จอมยุทธ์");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
}

test.describe("phone", () => {
  test.use({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  test("the icons fold behind เมนู, open with a tap, and fold again after a section", async ({ page }) => {
    await start(page);
    const bar = page.locator(".hud-iconbar");
    const toggle = page.getByTestId("hud-menu-toggle");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(bar.getByRole("button", { name: "ย่าม", exact: true })).toHaveCount(0);
    // The folded button's badge is the sum of the icons' badges (none: no badge).
    const folded = await toggle.locator(".hud-icon-badge").count() ? Number(await toggle.locator(".hud-icon-badge").textContent()) : 0;
    // Every touch target in the HUD is at least 44 px.
    const box = (await toggle.boundingBox())!;
    expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(44);
    await page.screenshot({ path: "test-results/screenshots/hud-menu-folded.png" });

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    const bag = bar.getByRole("button", { name: "ย่าม", exact: true });
    await expect(bag).toBeVisible();
    for (const icon of await bar.locator(".hud-icon").all()) {
      const b = (await icon.boundingBox())!;
      expect(Math.min(b.width, b.height)).toBeGreaterThanOrEqual(44);
    }
    const sum = (await bar.locator(".hud-icon:not(.hud-menu-toggle) .hud-icon-badge").allTextContents()).reduce((a, t) => a + Number(t), 0);
    expect(folded).toBe(sum);
    await page.screenshot({ path: "test-results/screenshots/hud-menu-open.png" });
    await bag.click();
    await expect(page.locator(".hud-menu-close")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    // Hotkeys still open a section with the menu folded.
    await page.keyboard.press("5");
    await expect(page.locator(".hud-menu-close")).toBeVisible();
  });
});

test("a desktop shows every icon at once", async ({ page }) => {
  await start(page);
  await expect(page.getByTestId("hud-menu-toggle")).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".hud-iconbar").getByRole("button", { name: "ย่าม", exact: true })).toBeVisible();
});
