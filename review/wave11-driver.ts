/** Wave 11 evidence: dialogue bust + battle turn timeline + v2 sprites.
 * Run against a production build on :3017: node --experimental-strip-types review/wave11-driver.ts */
import { chromium, type Page } from "@playwright/test";
const origin = "http://127.0.0.1:3017", out = "review/wave11-evidence";
const viewports = [{ name: "desktop", width: 1440, height: 900 }, { name: "phone", width: 390, height: 844 }, { name: "landscape", width: 844, height: 390 }];
const browser = await chromium.launch();
const errors: string[] = [];
async function fresh(width: number, height: number): Promise<Page> {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => { Math.random = () => 0.5; });
  await page.goto(origin);
  await page.locator("#hero-name").fill("ผู้ตรวจ");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  await page.getByTestId("world-canvas").locator("canvas").waitFor();
  await page.waitForSelector('[data-testid="world-canvas"][data-ready="true"]', { timeout: 60_000 });
  return page;
}
async function visit(page: Page, marker: string) {
  await page.waitForSelector('[data-testid="world-canvas"][data-ready="true"]', { timeout: 60_000 });
  await page.getByRole("button", { name: /จุดหมาย/ }).click();
  await page.locator(`[data-marker-id="${marker}"]`).click();
}
for (const v of viewports) {
  const page = await fresh(v.width, v.height);
  await visit(page, "route_home_player__to__city_capital");
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("wusia-world-v1")!).state.currentSceneId.startsWith("route_"));
  await visit(page, "destination-0");
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("wusia-world-v1")!).state.currentSceneId === "city_capital");
  await visit(page, "npc-city_capital_physician_lin");
  await page.getByRole("button", { name: /ทักทาย/ }).click();
  await page.getByTestId("dialog-stage").waitFor();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${out}/dialogue-lin-${v.name}.png` });
  await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem("wusia-world-v1")!);
    save.state.currentSceneId = "city_capital"; save.state.lastLocationId = "city_capital";
    save.state.pendingBattle = { opponentId: "petty_thief", onWin: "city_capital", onLose: "city_capital", nonFatal: true };
    localStorage.setItem("wusia-world-v1", JSON.stringify(save));
  });
  await page.reload();
  await page.waitForSelector('[data-testid="battle-canvas"][data-ready="true"]', { timeout: 60_000 });
  await page.getByTestId("turn-timeline").waitFor();
  await page.waitForSelector('[data-testid="combat-status"][data-phase="player"]', { timeout: 30_000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}/battle-${v.name}.png` });
  const label = await page.getByTestId("turn-timeline").getAttribute("aria-label");
  console.log(v.name, "timeline:", label);
  await page.getByRole("button", { name: "หมัดตรง", exact: true }).click();
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${out}/battle-attack-${v.name}.png` });
  await page.close();
}
await browser.close();
console.log(errors.length ? `page errors: ${errors.join(" | ")}` : "no page errors");
