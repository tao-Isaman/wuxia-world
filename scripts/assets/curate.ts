/**
 * Hand curation helpers for the asset library (docs/assets.md).
 *
 *   bun scripts/assets/curate.ts reject <raw dir> <sheet> <i,j,k…> <reason>
 *       Reject the cells of a review contact sheet (<raw>/review/<sheet>.png,
 *       cells mapped by <sheet>.tsv) into scripts/assets/curation/rejects.json.
 *   bun scripts/assets/curate.ts rerolls <raw dir> [--min-ratio 0.5]
 *       From <raw>/review-report.json, write <raw>/rerolls.json: one new
 *       attempt (`<job id>__rN`, new seed) for every job that kept fewer than
 *       min-ratio × keep designs (keep-1 jobs: none). Run it with generate.py.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import type { PlanJob } from "./build-asset-plan";

const REJECTS_FILE = "scripts/assets/curation/rejects.json";
const [cmd, raw, ...rest] = process.argv.slice(2);
if (!cmd || !raw) throw new Error("usage: curate.ts reject <raw> <sheet> <indices> <reason> | rerolls <raw>");

if (cmd === "reject") {
  const [sheet, list, ...why] = rest;
  const reason = why.join(" ");
  if (!sheet || !list || !reason) throw new Error("reject <raw> <sheet> <i,j,…> <reason>");
  const map = new Map(readFileSync(join(raw, "review", `${sheet}.tsv`), "utf8").split("\n").filter(Boolean).map((l) => l.split("\t") as [string, string]));
  const rejects: Record<string, string> = existsSync(REJECTS_FILE) ? JSON.parse(readFileSync(REJECTS_FILE, "utf8")) : {};
  let n = 0;
  for (const i of list.split(",").map((s) => s.trim()).filter(Boolean)) {
    const key = map.get(i);
    if (!key) throw new Error(`${sheet}: no cell ${i}`);
    rejects[key.split("|")[1]] = reason;
    n++;
  }
  const sorted = Object.fromEntries(Object.entries(rejects).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(REJECTS_FILE, JSON.stringify(sorted, null, 1) + "\n");
  console.log(`${n} rejected (${Object.keys(sorted).length} in total): ${reason}`);
} else if (cmd === "rerolls") {
  const minRatio = Number(rest[rest.indexOf("--min-ratio") + 1] ?? 0.5) || 0.5;
  const report = JSON.parse(readFileSync(join(raw, "review-report.json"), "utf8")) as { short: { job: string; category: string; picked: number; keep: number }[] };
  const plan = new Map<string, PlanJob>();
  for (const f of readdirSync("scripts/assets/plan").filter((f) => f.endsWith(".json")))
    for (const j of (JSON.parse(readFileSync(join("scripts/assets/plan", f), "utf8")) as { jobs: PlanJob[] }).jobs) plan.set(j.id, j);
  const jobs: PlanJob[] = [];
  for (const s of report.short) {
    if (s.picked >= Math.ceil(s.keep * minRatio) && s.picked > 0) continue;
    const job = plan.get(s.job);
    if (!job) continue;
    const dir = join(raw, "out", job.category);
    let n = 1;
    while (existsSync(join(dir, `${job.id}__r${n}`))) n++;
    jobs.push({ ...job, id: `${job.id}__r${n}` });
  }
  writeFileSync(join(raw, "rerolls.json"), JSON.stringify({ jobs }, null, 1));
  console.log(`${jobs.length} rerolls → ${join(raw, "rerolls.json")}`);
} else throw new Error(`unknown command ${cmd}`);
