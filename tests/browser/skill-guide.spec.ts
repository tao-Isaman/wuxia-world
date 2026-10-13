import { test, expect, type Page } from "@playwright/test";

// คู่มือวิชา: the skills window's guide button opens an infographic of skill
// conflict, the weapon in hand and mastery, drawn with the hero's own numbers.

async function patch(page: Page, edit: string) {
  await page.evaluate((body) => {
    const saved = JSON.parse(localStorage.getItem("wusia-world-v1")!);
    new Function("state", body)(saved.state);
    localStorage.setItem("wusia-world-v1", JSON.stringify(saved));
  }, edit);
  await page.reload();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
}

for (const size of [{ name: "desktop", width: 1280, height: 720 }, { name: "phone", width: 844, height: 390 }]) {
  test(`skill guide (${size.name}): the button opens the infographic with the hero's tallies`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: size.width, height: size.height });
    await page.goto("/");
    await page.locator("#hero-name").fill("ผู้ศึกษา");
    await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
    await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
    // Six external moves and one internal art learned: external wins its axis, internal is zeroed.
    await patch(page, `const b = state.playerBuild;
      b.learnedSkillIds = ["sf", "sl_long_dharma", "nd5", "ne1", "ne2", "sl_zen_sword"];
      b.skillIds = ["sf", "nd5", null, null, null, null, null, null, null, null];
      b.learnedArtIds = ["t2_dharma"];
      b.equipment.W = "eq_t0_w_fist";`);
    await page.locator(".hud-iconbar").getByRole("button", { name: "วิชา", exact: true }).click();
    await page.screenshot({ path: `test-results/skills-window-${size.name}.png` });
    await expect(page.getByTestId("skill-guide-open")).toBeInViewport();
    await page.getByTestId("skill-guide-open").click();
    const guide = page.getByTestId("skill-guide");
    await expect(guide).toBeVisible();
    await expect(page.getByTestId("sg-gate")).toHaveClass(/sg-gate--on/);
    await expect(guide.locator('[data-axis="external-internal"]')).toHaveAttribute("data-loser", "internal");
    await page.screenshot({ path: `test-results/skill-guide-${size.name}.png` });
    await page.getByRole("tab", { name: /อาวุธ/ }).click();
    await expect(page.getByTestId("sg-held")).toContainText("หมัด");
    await page.screenshot({ path: `test-results/skill-guide-${size.name}-weapon.png` });
    await page.keyboard.press("Escape");
  });
}
