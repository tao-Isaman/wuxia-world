/**
 * Author and check world-map collision footprints.
 *   bun scripts/map-collision-tool.ts <locationId> [footprints.json] [overlay.png] [--exits exits.json]
 * --exits takes {"<destination id>": {"x": worldX, "y": worldY}} (960×640) and
 * tries exit markers there instead of their current spots; --image <file> draws the
 * overlay on a candidate painting instead of the installed one.
 * Prints marker world coordinates (960×640) and, with a footprint JSON array
 * (same shape as WorldFootprint), checks every marker is reachable from spawn
 * and renders the map with footprints (red) and markers (green ok / magenta fail).
 * Without a JSON file it checks the footprints currently registered in the game.
 */
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { getLocationMap } from "../lib/world/data/location-maps";
import { worldFootprints, type WorldFootprint } from "../lib/stage/world-navigation";
import { probeWorldMap, type ProbeMarker } from "../lib/stage/world-map-probe";

const argv = process.argv.slice(2);
const imageAt = argv.indexOf("--image");
const imageOverride = imageAt >= 0 ? argv[imageAt + 1] : null;
if (imageAt >= 0) argv.splice(imageAt, 2);
const exitsAt = argv.indexOf("--exits");
const exitOverride: Record<string, { x: number; y: number }> = exitsAt >= 0 ? JSON.parse(readFileSync(argv[exitsAt + 1], "utf8")) : {};
if (exitsAt >= 0) argv.splice(exitsAt, 2);
const [id, jsonPath, overlayPath] = argv;
if (!id) throw new Error("usage: bun scripts/map-collision-tool.ts <locationId> [footprints.json] [overlay.png]");
const map = getLocationMap(id);
if (!map) throw new Error(`${id} has no painted map`);
const w = (p: { x: number; y: number }) => ({ x: p.x * 9.6, y: p.y * 6.4 });
const markers: ProbeMarker[] = [
  ...Object.entries(map.npcSpots ?? {}).map(([npc, p]) => ({ id: `npc:${npc}`, kind: "npc" as const, ...w(p) })),
  ...(map.exits ?? []).map((e) => ({ id: `exit:${e.to}`, kind: "exit" as const, ...(exitOverride[e.to] ?? w(e)) })),
  ...(map.spots ?? []).map((s, i) => ({ id: `${s.kind}:${i}`, kind: "service" as const, ...w(s) })),
];
const footprints: WorldFootprint[] = jsonPath ? JSON.parse(readFileSync(jsonPath, "utf8")) : [...worldFootprints(id, map.image)];
const spawn = w(map.spawn);
const { spawnOk, results } = probeWorldMap(spawn, markers, footprints);
console.log(`${id}  image=${map.image}  spawn=(${spawn.x.toFixed(0)},${spawn.y.toFixed(0)}) ${spawnOk ? "ok" : "BLOCKED"}  footprints=${footprints.length}`);
for (const m of markers) {
  const r = results.find((x) => x.id === m.id)!;
  console.log(`  ${r.ok ? "ok  " : "FAIL"} ${m.id.padEnd(46)} (${m.x.toFixed(0)},${m.y.toFixed(0)})${r.reason ? "  " + r.reason : ""}`);
}
if (overlayPath) {
  const shapes = footprints.map((f) => f.kind === "rect"
    ? `<rect x="${f.left}" y="${f.top}" width="${f.right - f.left}" height="${f.bottom - f.top}" fill="#ff000055" stroke="#ff2020" stroke-width="1.5"/>`
    : `<ellipse cx="${f.x}" cy="${f.y}" rx="${f.radiusX}" ry="${f.radiusY}" fill="#ff000055" stroke="#ff2020" stroke-width="1.5"/>`).join("");
  const dots = markers.map((m) => {
    const ok = results.find((x) => x.id === m.id)!.ok;
    return `<circle cx="${m.x}" cy="${m.y}" r="6" fill="${ok ? "#20e060" : "#ff20ff"}" stroke="#000"/><text x="${m.x + 8}" y="${m.y - 6}" font-size="11" fill="#fff" stroke="#000" stroke-width="3" paint-order="stroke">${m.id.replace(/^(npc|exit):/, "")}</text>`;
  }).join("");
  const grid = Array.from({ length: 19 }, (_, i) => `<line x1="${(i + 1) * 48}" y1="0" x2="${(i + 1) * 48}" y2="640" stroke="#ffffff30"/><text x="${(i + 1) * 48 + 2}" y="10" font-size="9" fill="#fff">${(i + 1) * 48}</text>`).join("")
    + Array.from({ length: 12 }, (_, i) => `<line x1="0" y1="${(i + 1) * 48}" x2="960" y2="${(i + 1) * 48}" stroke="#ffffff30"/><text x="2" y="${(i + 1) * 48 - 2}" font-size="9" fill="#fff">${(i + 1) * 48}</text>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="640">${grid}${shapes}<circle cx="${spawn.x}" cy="${spawn.y}" r="8" fill="#ffd000" stroke="#000"/>${dots}</svg>`;
  await sharp(imageOverride ?? `public${map.image}`).resize(960, 640).composite([{ input: Buffer.from(svg) }]).png().toFile(overlayPath);
  console.log(`overlay → ${overlayPath}`);
}
process.exit(spawnOk && results.every((r) => r.ok) ? 0 : 1);
