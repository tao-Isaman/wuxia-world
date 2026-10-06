// Browser frame-cost probe: starts a game on the production server (:3017),
// puts the hero in the capital, walks for a few seconds and reports what the
// main thread spent per frame (Chrome DevTools Performance metrics), at full
// speed and with the CPU throttled 4× (a mid-range phone).
//
//   bun run build && bun run start -p 3017 &
//   bun scripts/bench-browser.ts [--place city_capital] [--seconds 6]
import { chromium, type Page } from "@playwright/test";

const BASE = "http://127.0.0.1:3017";
const arg = (name: string, fallback: string) => {
  const at = process.argv.indexOf(name);
  return at > 0 ? process.argv[at + 1] : fallback;
};
const PLACE = arg("--place", "city_capital");
const SECONDS = Number(arg("--seconds", "6"));

async function ready(page: Page) {
  await page.getByTestId("world-canvas").and(page.locator("[data-ready=true]")).waitFor({ timeout: 90_000 });
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
await context.addInitScript(() => {
  localStorage.setItem("wuxia-random-events", "off");
  localStorage.setItem("wuxia-dialog-instant", "on");
});
const page = await context.newPage();
await page.goto(BASE + "/");
await page.locator("#hero-name").fill("Bench");
await page.getByRole("button", { name: "เริ่มเกมใหม่" }).click();
await ready(page);
await page.evaluate((place) => {
  const saved = JSON.parse(localStorage.getItem("wusia-world-v1")!);
  Object.assign(saved.state, { currentSceneId: place, lastLocationId: place });
  localStorage.setItem("wusia-world-v1", JSON.stringify(saved));
}, PLACE);
await page.reload();
await ready(page);
await page.waitForTimeout(1500);

const cdp = await context.newCDPSession(page);
await cdp.send("Performance.enable");
type Metrics = Record<string, number>;
async function metrics(): Promise<Metrics> {
  const { metrics: list } = await cdp.send("Performance.getMetrics");
  return Object.fromEntries(list.map((m: { name: string; value: number }) => [m.name, m.value]));
}

async function run(label: string, throttle: number) {
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: throttle });
  await page.getByTestId("world-canvas").focus();
  await page.evaluate(() => {
    const w = window as unknown as { __frames: number[]; __raf: boolean };
    w.__frames = [];
    w.__raf = true;
    let last = performance.now();
    const loop = (t: number) => { w.__frames.push(t - last); last = t; if (w.__raf) requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  });
  const before = await metrics();
  const keys = ["d", "s", "a", "w"];
  const end = Date.now() + SECONDS * 1000;
  for (let i = 0; Date.now() < end; i++) {
    await page.keyboard.down(keys[i % 4]);
    await page.waitForTimeout(700);
    await page.keyboard.up(keys[i % 4]);
  }
  const after = await metrics();
  const frames = await page.evaluate(() => {
    const w = window as unknown as { __frames: number[]; __raf: boolean };
    w.__raf = false;
    return w.__frames.slice(2);
  });
  const n = frames.length || 1;
  const d = (k: string) => (after[k] ?? 0) - (before[k] ?? 0);
  const sorted = [...frames].sort((a, b) => a - b);
  const p = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] ?? 0;
  console.log(`\n== ${label} (CPU ×${throttle}, ${n} frames in ${SECONDS}s)`);
  console.log(`  frame ms   mean ${(frames.reduce((a, b) => a + b, 0) / n).toFixed(2)}  p50 ${p(0.5).toFixed(2)}  p95 ${p(0.95).toFixed(2)}  max ${p(1).toFixed(2)}`);
  console.log(`  per frame  script ${(d("ScriptDuration") * 1000 / n).toFixed(3)} ms  task ${(d("TaskDuration") * 1000 / n).toFixed(3)} ms  style ${(d("RecalcStyleDuration") * 1000 / n).toFixed(3)} ms (${(d("RecalcStyleCount") / n).toFixed(2)}×)  layout ${(d("LayoutDuration") * 1000 / n).toFixed(3)} ms (${(d("LayoutCount") / n).toFixed(2)}×)`);
  console.log(`  heap used  ${((after.JSHeapUsedSize ?? 0) / 1048576).toFixed(1)} MiB`);
}

await run("walking", 1);
await run("walking", 4);

// --profile: the main thread's top self-time functions while walking.
if (process.argv.includes("--profile")) {
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  await cdp.send("Profiler.enable");
  await cdp.send("Profiler.setSamplingInterval", { interval: 200 });
  await cdp.send("Profiler.start");
  const keys = ["d", "s", "a", "w"];
  for (let i = 0; i < 8; i++) {
    await page.keyboard.down(keys[i % 4]);
    await page.waitForTimeout(700);
    await page.keyboard.up(keys[i % 4]);
  }
  const { profile } = await cdp.send("Profiler.stop") as { profile: { nodes: { id: number; callFrame: { functionName: string; url: string; lineNumber: number } }[]; samples: number[]; timeDeltas: number[] } };
  const self = new Map<number, number>();
  profile.samples.forEach((id, i) => self.set(id, (self.get(id) ?? 0) + (profile.timeDeltas[i] ?? 0)));
  const byFn = new Map<string, number>();
  for (const node of profile.nodes) {
    const t = self.get(node.id) ?? 0;
    if (!t) continue;
    const f = node.callFrame;
    const key = `${f.functionName || "(anonymous)"} ${f.url.split("/").pop()}:${f.lineNumber}`;
    byFn.set(key, (byFn.get(key) ?? 0) + t);
  }
  const total = [...byFn.values()].reduce((a, b) => a + b, 0);
  console.log("\n== top self time while walking (5.6 s)");
  for (const [key, t] of [...byFn].sort((a, b) => b[1] - a[1]).slice(0, 25)) {
    console.log(`  ${(t / 1000).toFixed(1).padStart(7)} ms ${(100 * t / total).toFixed(1).padStart(5)}%  ${key}`);
  }
}
await browser.close();
