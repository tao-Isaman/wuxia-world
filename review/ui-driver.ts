/** UI evidence capture (Hero's Adventure UI wave). Production build on :3017.
 * node --experimental-strip-types review/ui-driver.ts [label]   → review/ui-evidence/<label>/ */
import { chromium, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";
const label = process.argv[2] ?? "before";
const out = `review/ui-evidence/${label}`; mkdirSync(out, { recursive: true });
const origin = "http://127.0.0.1:3017";
const views = [{ name: "desktop", width: 1440, height: 900 }, { name: "phone", width: 390, height: 844 }, { name: "landscape", width: 844, height: 390 }];
const menus = ["โปรไฟล์", "ย่าม", "วิชา", "อาชีพ", "ภารกิจ", "สำนัก", "พักผ่อน", "บันทึก"];
const browser = await chromium.launch();
const errors: string[] = [];
const ready = (p: Page) => p.waitForSelector('[data-testid="world-canvas"][data-ready="true"]', { timeout: 60_000 });
const shot = (p: Page, v: string, n: string) => p.screenshot({ path: `${out}/${v}-${n}.png` });
for (const v of views) {
  const page = await browser.newPage({ viewport: { width: v.width, height: v.height } });
  page.on("pageerror", (e) => errors.push(`${v.name}: ${e.message}`));
  await page.addInitScript(() => { Math.random = () => 0.99; });
  await page.goto(origin);
  await page.waitForTimeout(800);
  await shot(page, v.name, "00-start");
  await page.locator("#hero-name").fill("หลี่คัง");
  await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
  await ready(page); await page.waitForTimeout(1200);
  await shot(page, v.name, "01-home");
  // Travel to the capital for a populated HUD scene.
  await page.getByRole("button", { name: /จุดหมาย/ }).click();
  await page.locator('[data-marker-id="route_home_player__to__city_capital"]').click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("wusia-world-v1")!).state.currentSceneId.startsWith("route_"));
  await page.waitForTimeout(1500);
  await shot(page, v.name, "02-route");
  await page.getByRole("button", { name: /จุดหมาย/ }).click();
  await page.locator('[data-marker-id="destination-0"]').click();
  await page.waitForFunction(() => JSON.parse(localStorage.getItem("wusia-world-v1")!).state.currentSceneId === "city_capital");
  await ready(page); await page.waitForTimeout(1500);
  await shot(page, v.name, "03-capital");
  for (const [i, m] of menus.entries()) {
    const button = page.locator('nav[aria-label="เมนูเกม"]').getByRole("button", { name: m, exact: true });
    if (!(await button.count())) { console.log(`${v.name}: no menu button ${m}`); continue; }
    await button.click(); await page.waitForTimeout(500);
    await shot(page, v.name, `1${i}-menu-${i}`);
    await page.keyboard.press("Escape"); await page.waitForTimeout(250);
  }
  // NPC interaction + shop.
  await page.getByRole("button", { name: /จุดหมาย/ }).click();
  await page.locator('[data-marker-id="npc-city_capital_physician_lin"]').click();
  await page.waitForSelector('[role="dialog"]', { timeout: 15_000 }); await page.waitForTimeout(400);
  await shot(page, v.name, "20-npc");
  await page.keyboard.press("Escape"); await page.waitForTimeout(300);
  await page.getByRole("button", { name: /จุดหมาย/ }).click();
  const shop = page.locator('[data-marker-id^="service-"]').first();
  await shop.click();
  await page.waitForSelector('[role="dialog"]', { timeout: 15_000 }).catch(() => {}); await page.waitForTimeout(400);
  await shot(page, v.name, "21-service");
  await page.keyboard.press("Escape"); await page.waitForTimeout(300);
  // Encounter screen.
  await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem("wusia-world-v1")!);
    save.state.pendingEncounter = { opponentId: "petty_thief", returnSceneId: "city_capital" };
    localStorage.setItem("wusia-world-v1", JSON.stringify(save));
  });
  await page.reload(); await page.waitForTimeout(2000);
  await shot(page, v.name, "30-encounter");
  await page.evaluate(() => {
    const save = JSON.parse(localStorage.getItem("wusia-world-v1")!);
    save.state.pendingEncounter = null;
    save.state.pendingBattle = { opponentId: "petty_thief", onWin: "city_capital", onLose: "city_capital", nonFatal: true };
    localStorage.setItem("wusia-world-v1", JSON.stringify(save));
  });
  await page.reload();
  await page.waitForSelector('[data-testid="combat-status"][data-phase="player"]', { timeout: 60_000 });
  await page.waitForTimeout(1300);
  await shot(page, v.name, "40-battle");
  await page.close();
}
await browser.close();
console.log(errors.length ? errors.join("\n") : "no page errors");
