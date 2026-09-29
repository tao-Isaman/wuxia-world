/** Run: node --experimental-strip-types scripts/render-character-atlas-audit.ts */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { resolve } from "node:path";
import { chromium, type Browser } from "@playwright/test";

const output = resolve("review/character-atlas-audit");
mkdirSync(output, { recursive: true });
const entry = resolve(output, "atlas-entry.js");
const bundle = resolve(output, "atlas-bundle.js");
// This diagnostic imports the actual engine loader; no alternate normalization.
writeFileSync(entry, `
import { loadCharacterAtlas } from "../../lib/characters/sheet";
import { CHARACTER_IDS, hasDirectionalSheet, characterSheet } from "../../lib/characters/catalog";
document.body.innerHTML = '<h1>Source artwork and engine atlases</h1><p>Original PNGs at left; actual loadCharacterAtlas output at right. Frame order: idle, walk, attack, hurt/guard/victory/defeat, then north/south for heroes.</p>';
document.head.insertAdjacentHTML('beforeend', '<style>body{margin:24px;background:#192c29;color:#eee6c9;font:16px system-ui}h1{font-size:24px}section{width:1080px;padding:18px;margin:24px 0;background:#233d32;border:1px solid #a38d5d;box-sizing:border-box}h2{margin:0 0 12px}article{display:grid;grid-template-columns:512px 512px;gap:18px;align-items:start}figure{margin:0}figcaption{margin:8px 0 12px;color:#d0c8a4}img,canvas{display:block;max-width:512px;image-rendering:pixelated;background:#132923}img{width:512px;height:auto}canvas{outline:1px solid #5b735f}.atlas{background-image:linear-gradient(#69795c33 1px,transparent 1px),linear-gradient(90deg,#69795c33 1px,transparent 1px);background-size:128px 128px}</style>');
const report = [];
for (const id of CHARACTER_IDS) {
  const base = await loadCharacterAtlas(id, false);
  const sameBase = base === await loadCharacterAtlas(id, false);
  const atlas = await loadCharacterAtlas(id, true);
  const sameFull = atlas === await loadCharacterAtlas(id, true);
  const cacheVariantsCorrect = hasDirectionalSheet(id) ? atlas !== base : atlas === base;
  const expectedRows = hasDirectionalSheet(id) ? 6 : 4;
  const frames = [];
  const context = atlas.image.getContext('2d', { willReadFrequently: true });
  for (let frame = 0; frame < expectedRows * 4; frame++) {
    const data = context.getImageData(frame % 4 * 128, Math.floor(frame / 4) * 128, 128, 128).data;
    let pixels = 0, edgePixels = 0;
    for (let index = 3; index < data.length; index += 4) {
      if (data[index] < 32) continue;
      pixels++;
      const point = (index - 3) / 4, x = point % 128, y = Math.floor(point / 128);
      if (x === 0 || y === 0 || x === 127 || y === 127) edgePixels++;
    }
    frames.push({ frame, pixels, edgePixels });
  }
  report.push({ id, sameBase, sameFull, cacheVariantsCorrect, baseRows: base.rows, rows: atlas.rows, expectedRows, directional: atlas.directional, frames });
  const section = document.createElement('section');
  section.id = 'atlas-' + id;
  section.innerHTML = '<h2>' + id.toUpperCase() + '</h2><article><figure class="sources"><figcaption>Original source PNG(s), unchanged</figcaption></figure><figure class="normalized"><figcaption>Actual normalized engine atlas · 128 px cells</figcaption></figure></article>';
  const sources = section.querySelector('.sources');
  for (const src of [characterSheet(id), ...(hasDirectionalSheet(id) ? ['/art/characters/' + id + '-directions.png'] : [])]) {
    const original = new Image(); original.src = src; await original.decode(); sources.append(original);
  }
  atlas.image.className = 'atlas';
  section.querySelector('.normalized').append(atlas.image);
  document.body.append(section);
}
window.__atlasAuditReport = report;
document.documentElement.dataset.auditReady = 'true';
`);

// Bun's ESM bundle supports top-level await in the browser's module script.
execFileSync("bun", ["build", entry, "--target=browser", "--format=esm", `--outfile=${bundle}`], { stdio: "pipe" });
let browser: Browser | undefined;
try {
  console.log("Launching local Chromium atlas audit...");
  browser = await chromium.launch({ headless: true, timeout: 30_000 });
  const page = await browser.newPage({ viewport: { width: 1140, height: 1000 }, deviceScaleFactor: 1 });
  const errors: string[] = [];
  page.on("pageerror", (error) => { errors.push(error.message); console.error(error.message); });
  const origin = process.env.ATLAS_AUDIT_URL ?? "http://127.0.0.1:3017";
  const qingResponse = await page.request.get(`${origin}/art/characters/qing.png`);
  const localArtwork = qingResponse.status() === 404;
  if (localArtwork) {
    // A running production build may not know newly added public assets yet.
    // Keep it untouched and serve workspace art only inside this diagnostic.
    await page.route(/\/art\/characters\/[a-z0-9-]+\.png$/, async (route) => {
      const filename = new URL(route.request().url()).pathname.split("/").pop()!;
      await route.fulfill({ path: resolve("public/art/characters", filename), contentType: "image/png" });
    });
  }
  // A diagnostic-only HTML route supplies the origin without starting the app.
  // Image documents do not reliably execute modules after setContent().
  await page.route(`${origin}/__atlas-audit.html`, (route) => route.fulfill({
    contentType: "text/html",
    body: "<!doctype html><html><head><title>Character atlas audit</title></head><body></body></html>",
  }));
  await page.goto(`${origin}/__atlas-audit.html`);
  await page.addScriptTag({ type: "module", content: readFileSync(bundle, "utf8") });
  await Promise.race([
    page.waitForFunction(() => document.documentElement.dataset.auditReady === "true", undefined, { timeout: 60_000 }),
    new Promise<never>((_, reject) => page.once("pageerror", reject)),
  ]);
  const report = await page.evaluate(() => (window as unknown as { __atlasAuditReport: Array<{
    id: string; sameBase: boolean; sameFull: boolean; cacheVariantsCorrect: boolean; baseRows: number; rows: number; expectedRows: number;
    frames: Array<{ frame: number; pixels: number; edgePixels: number }>;
  }> }).__atlasAuditReport);
  for (const character of report) {
    assert.equal(character.sameBase, true, `${character.id}: base atlas cache`);
    assert.equal(character.sameFull, true, `${character.id}: full atlas cache`);
    assert.equal(character.cacheVariantsCorrect, true, `${character.id}: base/full variants`);
    assert.equal(character.baseRows, 4, `${character.id}: base rows`);
    assert.equal(character.rows, character.expectedRows, `${character.id}: complete atlas rows`);
    for (const frame of character.frames) {
      assert.ok(frame.pixels > 0, `${character.id}/${frame.frame}: nonempty pose`);
      assert.equal(frame.edgePixels, 0, `${character.id}/${frame.frame}: neighboring-cell clipping`);
    }
    await page.locator(`#atlas-${character.id}`).screenshot({ path: resolve(output, `${character.id}-comparison.png`) });
  }
  assert.deepEqual(errors, []);
  writeFileSync(resolve(output, "rendered-report.json"), JSON.stringify(report, null, 2));
  writeFileSync(resolve(output, "audit-context.json"), JSON.stringify({ loader: "workspace lib/characters/sheet.ts", artwork: localArtwork ? "workspace files via diagnostic-only page.route (production Qing returned 404)" : "production static PNGs", origin }, null, 2));
  console.log(`Verified ${report.reduce((sum, entry) => sum + entry.frames.length, 0)} normalized poses; ${localArtwork ? "workspace-routed" : "production-static"} artwork; comparisons in ${output}`);
} finally {
  await browser?.close();
  if (existsSync(entry)) unlinkSync(entry);
  if (existsSync(bundle)) unlinkSync(bundle);
}
