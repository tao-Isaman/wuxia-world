import { test, expect, type Page } from "@playwright/test";
// Data only (the table imports nothing but types), so the spec reads real charts.
import { MERIDIAN_CHARTS } from "../../lib/game/data/meridians";

const SHOTS = "test-results/screenshots";

async function save(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("wusia-world-v1")!).state);
}
async function newGame(page: Page, patch: (state: Record<string, unknown>) => void) {
  await page.goto("/");
  await page.locator("#hero-name").fill("จอมยุทธ์");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await page.evaluate(`(() => {
    const raw = JSON.parse(localStorage.getItem("wusia-world-v1"));
    (${patch.toString()})(raw.state);
    localStorage.setItem("wusia-world-v1", JSON.stringify(raw));
  })()`);
  await page.reload();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
}
const hudButton = (page: Page) => page.getByRole("navigation", { name: "เมนูเกม" }).getByRole("button", { name: "ชีพจร", exact: true });

// A T1 chart (3–4 points) to open, and a T5 one half opened for the look.
const small = MERIDIAN_CHARTS.find((c) => c.ti === 1 && c.nodes.length >= 3)!;
const big = MERIDIAN_CHARTS.find((c) => c.ti === 5)!;
const POINTS = 40;

function seed(points: number, charts: Record<string, number[]>) {
  return new Function("s", `
    s.meridianPoints = ${points};
    s.playerBuild.meridians = ${JSON.stringify(charts)};
  `) as (s: Record<string, unknown>) => void;
}

test.skip(!small || !big, "the meridian content table is empty");

test("ชีพจร: the HUD badge, a locked point, opening a point and the chart's totals", async ({ page }) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 1280, height: 720 });
  const bigRanks = big.nodes.map((_, i) => (i < 4 ? 3 - (i % 3) : i === 4 ? 1 : 0));
  await newGame(page, seed(POINTS, { [small.id]: small.nodes.map(() => 0), [big.id]: bigRanks }));

  // Unspent points with something to open: the HUD icon shows them.
  await expect(hudButton(page).locator(".hud-icon-badge")).toHaveText(String(POINTS));
  await page.screenshot({ path: `${SHOTS}/meridians-hud-1280x720.png` });
  await hudButton(page).click();
  const screen = page.getByTestId("meridian-screen");
  await expect(screen).toBeVisible();
  await expect(screen.getByTestId("meridian-points").first()).toHaveAttribute("data-points", String(POINTS));

  // The T5 chart lists first; it draws all its points on the figure.
  await expect(page.getByTestId("meridian-chart-name")).toContainText(big.name);
  await expect(page.getByTestId("meridian-figure").locator(".meridian-node")).toHaveCount(big.nodes.length);
  await page.getByTestId("meridian-figure").locator('[data-node-index="0"]').hover();
  await expect(page.getByTestId("meridian-tip")).toContainText(big.nodes[0].name);
  await page.mouse.move(2, 2);
  await page.screenshot({ path: `${SHOTS}/meridians-1280x720.png` });

  // Pick the T1 chart: nothing opened yet.
  await screen.locator(`[data-chart-id="${small.id}"]`).click();
  await expect(page.getByTestId("meridian-chart-name")).toContainText(small.name);
  const figure = page.getByTestId("meridian-figure");
  const open = page.getByTestId("meridian-open");

  // Point 2 waits for point 1.
  await figure.locator('[data-node-index="1"]').click();
  await expect(figure.locator('[data-node-index="1"]')).toHaveAttribute("data-state", "locked");
  await expect(open).toBeDisabled();
  await expect(page.getByTestId("meridian-action")).toContainText("ต้องเปิด");

  // Open point 1: it spends (ti+1)×1 points and rises to rank 1.
  await figure.locator('[data-node-index="0"]').click();
  await expect(open).toBeEnabled();
  await open.click();
  const cost = small.ti + 1;
  await expect.poll(async () => (await save(page)).playerBuild.meridians[small.id][0]).toBe(1);
  expect((await save(page)).meridianPoints).toBe(POINTS - cost);
  await expect(figure.locator('[data-node-index="0"]')).toHaveAttribute("data-rank", "1");
  await expect(figure.locator('[data-node-index="1"]')).toHaveAttribute("data-state", "open");
  await page.screenshot({ path: `${SHOTS}/meridians-opened-1280x720.png` });

  // The right column now totals rank 1 of point 1.
  const first = small.nodes[0].ranks[0];
  const values = [...Object.values(first.stats ?? {}), ...Object.values(first.combat ?? {})].filter((v) => v);
  const summary = page.getByTestId("meridian-summary");
  for (const v of values) await expect(summary).toContainText(String(v));
  await expect(summary.getByTestId("meridian-points").or(summary.locator(".meridian-points-chip"))).toContainText(String(POINTS - cost));

  // Raise it again: rank 2 costs (ti+1)×2.
  await open.click();
  await expect.poll(async () => (await save(page)).playerBuild.meridians[small.id][0]).toBe(2);
  expect((await save(page)).meridianPoints).toBe(POINTS - cost * 3);
});

test("ชีพจร: the empty screen explains how to get a chart; the phone layout fits", async ({ page }) => {
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 844, height: 390 });
  await newGame(page, seed(3, {}));
  // Nothing to open: no badge.
  await expect(hudButton(page).locator(".hud-icon-badge")).toHaveCount(0);
  await hudButton(page).click();
  await expect(page.getByTestId("meridian-empty")).toContainText("แผนภาพชีพจร");
  await page.screenshot({ path: `${SHOTS}/meridians-empty-844x390.png` });
  await page.getByRole("button", { name: "ปิด", exact: true }).click();

  // A learned chart on a phone: no page scroll, tap a point for its tooltip.
  const ranks = big.nodes.map((_, i) => (i < 3 ? 3 - i : 0));
  await page.evaluate(`(() => {
    const raw = JSON.parse(localStorage.getItem("wusia-world-v1"));
    (${seed(20, { [big.id]: ranks }).toString()})(raw.state);
    localStorage.setItem("wusia-world-v1", JSON.stringify(raw));
  })()`);
  await page.reload();
  await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
  await hudButton(page).click();
  const figure = page.getByTestId("meridian-figure");
  await expect(figure).toBeVisible();
  await figure.locator('[data-node-index="3"]').click();
  await expect(page.getByTestId("meridian-tip")).toContainText(big.nodes[3].name);
  await expect(page.getByTestId("meridian-open")).toBeEnabled();
  const box = (await page.getByTestId("meridian-screen").boundingBox())!;
  expect(box.y + box.height).toBeLessThanOrEqual(390);
  const fig = (await figure.boundingBox())!;
  expect(fig.height).toBeGreaterThan(150);
  await page.screenshot({ path: `${SHOTS}/meridians-844x390.png` });
});

// Charts with battle effects: a shield + ward one for the battle, and one with an effect point for the tooltip.
const guard = MERIDIAN_CHARTS.find((c) => {
  const kinds = c.nodes.flatMap((n) => n.effects ?? []).map((e) => e.t);
  return kinds.includes("shield") && kinds.includes("ward");
});
const gated = MERIDIAN_CHARTS.find((c) => c.ti >= 1 && c.nodes.some((n) => n.effects?.length));

test("ชีพจร: a point's battle effect shows in its tooltip and in the chart's column", async ({ page }) => {
  test.skip(!gated, "no chart carries a battle effect");
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 1280, height: 720 });
  const index = gated!.nodes.findIndex((n) => n.effects?.length);
  // Everything up to the effect point filled; the effect wakes at rank 3.
  await newGame(page, seed(0, { [gated!.id]: gated!.nodes.map((_, i) => (i <= index ? 3 : 0)) }));
  await hudButton(page).click();
  const node = page.getByTestId("meridian-figure").locator(`[data-node-index="${index}"]`);
  await expect(node).toHaveAttribute("data-effects", /\d/);
  await node.hover();
  await expect(page.getByTestId("meridian-tip-effects")).toContainText("ตื่นแล้ว");
  await expect(page.getByTestId("meridian-effects").locator('[data-active="true"]').first()).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/meridians-effects-1280x720.png` });
});

for (const viewport of [{ width: 1280, height: 720 }, { width: 844, height: 390 }]) test(`ชีพจร in battle (${viewport.width}×${viewport.height}): a filled shield / ward chart raises both statuses on the hero`, async ({ page }) => {
  test.skip(!guard, "no chart carries both a shield and a ward");
  test.setTimeout(150_000);
  {
    await page.setViewportSize(viewport);
    // Like newGame, but the reload lands on the battle briefing, not the map.
    await page.goto("/");
    await page.locator("#hero-name").fill("จอมยุทธ์");
    await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
    await expect(page.getByTestId("world-canvas")).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
    await page.evaluate((meridians) => {
      const raw = JSON.parse(localStorage.getItem("wusia-world-v1")!);
      const s = raw.state;
      s.playerBuild.meridians = meridians;
      s.pendingBattle = { opponentId: "petty_thief", onWin: s.currentSceneId, onLose: s.currentSceneId, nonFatal: true };
      localStorage.setItem("wusia-world-v1", JSON.stringify(raw));
    }, { [guard!.id]: guard!.nodes.map(() => 3) });
    await page.reload();
    await page.getByRole("button", { name: /เข้าต่อสู้/ }).click();
    const battle = page.getByTestId("battle-canvas");
    await expect(battle).toHaveAttribute("data-ready", "true", { timeout: 60_000 });
    // The battle-start procs play, and the hero carries both statuses.
    await expect.poll(async () => (await battle.getAttribute("data-procs")) ?? "").toContain("shield");
    await expect.poll(async () => JSON.parse((await battle.getAttribute("data-statuses")) ?? "{}").A ?? []).toEqual(expect.arrayContaining(["shield", "ward"]));
    await page.getByRole("button", { name: /^ดู จอมยุทธ์/ }).first().click();
    const statuses = page.getByTestId("unit-statuses");
    await expect(statuses.locator('[data-status="shield"]')).toBeVisible();
    await expect(statuses.locator('[data-status="ward"]')).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/meridians-battle-${viewport.width}x${viewport.height}.png` });
  }
});
