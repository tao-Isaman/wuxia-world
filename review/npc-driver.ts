/** Capture unique NPC sprites in the world and a sparring battle. node --experimental-strip-types review/npc-driver.ts */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
const out = "review/ui-evidence/npcs"; mkdirSync(out, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.addInitScript(() => { Math.random = () => 0.99; });
await p.goto("http://127.0.0.1:3017");
await p.locator("#hero-name").fill("หลี่คัง"); await p.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
await p.waitForSelector('[data-testid="world-canvas"][data-ready="true"]', { timeout: 60000 });
for (const [scene, file] of [["city_capital", "capital"], ["sect_shaolin", "shaolin"], ["sect_beggars", "beggars"]]) {
  await p.evaluate((id) => { const s = JSON.parse(localStorage.getItem("wusia-world-v1")!); s.state.currentSceneId = id; s.state.lastLocationId = id; localStorage.setItem("wusia-world-v1", JSON.stringify(s)); }, scene);
  await p.reload(); await p.waitForSelector('[data-testid="world-canvas"][data-ready="true"]', { timeout: 60000 }); await p.waitForTimeout(1500);
  await p.screenshot({ path: `${out}/${file}.png` });
}
await p.evaluate(() => { const s = JSON.parse(localStorage.getItem("wusia-world-v1")!); s.state.pendingBattle = { opponentId: "spar_beggars_chief_hongtian", onWin: "sect_beggars", onLose: "sect_beggars", nonFatal: true }; localStorage.setItem("wusia-world-v1", JSON.stringify(s)); });
await p.reload(); await p.waitForSelector('[data-testid="battle-canvas"][data-ready="true"]', { timeout: 60000 }); await p.waitForTimeout(1500);
await p.screenshot({ path: `${out}/spar-battle.png` });
await b.close();
