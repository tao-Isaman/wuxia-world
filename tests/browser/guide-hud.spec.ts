import { test, expect } from "@playwright/test";

// The quest guide's edge pointer never hides under the HUD (vitals + menu,
// purse and sundial, quest tracker, rest / action / places column).
for (const [width, height, name] of [[844, 390, "phone"], [390, 844, "phone held upright"], [1280, 800, "desktop"]] as const) {
  test(`guide pointer stays clear of the HUD (${name})`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width, height });
    await page.goto("/");
    await page.locator("#hero-name").fill("จอมยุทธ์");
    await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
    const world = page.getByTestId("world-canvas");
    await expect(world).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
    // Track a capital quest: at home the guide points at the road to the capital.
    await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem("wusia-world-v1")!);
      raw.state.quests.qc_capital_lost_ledger = { id: "qc_capital_lost_ledger", status: "active", stage: 0 };
      raw.state.flags.trackedQuestId = "qc_capital_lost_ledger";
      localStorage.setItem("wusia-world-v1", JSON.stringify(raw));
    });
    await page.reload();
    await expect(world).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
    await expect(page.locator('[data-guide-marker="route_home_player__to__city_capital"]')).toHaveCount(1);

    let samples = 0, covered = 0;
    for (const key of ["d", "s", "a", "a", "w", "w", "d"]) {
      await page.keyboard.down(key);
      for (let i = 0; i < 8; i++) {
        await page.waitForTimeout(120);
        const hit = await page.evaluate(() => {
          const host = document.querySelector("[data-guide-marker]") as HTMLElement | null;
          if (!host?.dataset.guideEdge) return null;
          const [x, y] = host.dataset.guideEdge.split(",").map(Number);
          // Page coordinates (a portrait screen shows the page turned 90°, lib/ui/landscape.ts).
          const turned = matchMedia("(orientation: portrait)").matches;
          const page = (el: Element) => {
            const r = el.getBoundingClientRect();
            if (!turned) return r;
            const h = document.body.offsetHeight;
            return { left: r.top, top: h - r.right, right: r.bottom, bottom: h - r.left, width: r.height };
          };
          const b = page(host);
          const over = [...document.querySelectorAll("[data-hud-occluder]")].filter((el) => {
            const r = page(el);
            return r.width > 0 && b.left + x > r.left && b.left + x < r.right && b.top + y > r.top && b.top + y < r.bottom;
          });
          return over.length > 0;
        });
        if (hit === null) continue;
        samples++;
        if (hit) covered++;
      }
      await page.keyboard.up(key);
    }
    expect(samples).toBeGreaterThan(10);
    expect(covered).toBe(0);
  });
}
