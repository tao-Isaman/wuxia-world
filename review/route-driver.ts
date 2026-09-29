/** Capture several route screens to confirm regional grades + mirroring. */
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
const out = "review/ui-evidence/routes"; mkdirSync(out, { recursive: true });
const routes = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 960, height: 640 } });
await p.addInitScript(() => { Math.random = () => 0.99; });
await p.goto("http://127.0.0.1:3017"); await p.locator("#hero-name").fill("x"); await p.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
await p.waitForSelector('[data-testid="world-canvas"][data-ready="true"]', { timeout: 60000 });
for (const id of routes) {
  await p.evaluate((sid) => { const s = JSON.parse(localStorage.getItem("wusia-world-v1")!); s.state.currentSceneId = sid; localStorage.setItem("wusia-world-v1", JSON.stringify(s)); sessionStorage.clear(); }, id);
  await p.reload(); await p.waitForSelector('[data-testid="world-canvas"][data-ready="true"]', { timeout: 60000 }); await p.waitForTimeout(3600);
  await p.screenshot({ path: `${out}/${id}.png` });
}
await b.close();
