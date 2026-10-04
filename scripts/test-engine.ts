// The engine (/game/engine): text overrides over the skill / art tables, the
// text editor's draft and validation, the asset library's filters and edits,
// and the save route's whitelist.
//
//   bun run test:engine
import assert from "node:assert/strict";
import { SKILLS, getSkill } from "../lib/game/data/skills";
import { ARTS, getArt } from "../lib/game/data/arts";
import { BASE_TEXT, TEXT_OVERRIDES, applyTextOverrides, normalizeTextOverrides } from "../lib/game/data/text-overrides";
import {
  DESC_MAX, emptyOverrides, filterTextRows, hasErrors, overridesToSave, questsMentioning, rowKey, rowText, setRowText, resetRow, textRows, validateTextRows,
  type QuestText,
} from "../lib/engine/text-edit";
import {
  applyAssetEdits, bulkEdit, defaultFootprint, distinctValues, editedManifest, filterAssets, footprintFromImage, footprintToImage, mergeAssetEdit,
  pageOf, parseTags, pruneAssetEdits,
} from "../lib/engine/asset-edit";
import { checkSaveRequest, engineWritable, isEngineFileKey } from "../lib/engine/save-policy";
import { questTexts } from "../lib/engine/quest-text";
import type { AssetEntry, AssetManifest } from "../lib/assets/types";

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed++;
  console.log(`PASS ${name}`);
}

check("overrides change a skill's and an art's name and description; others untouched", () => {
  const [skill, other] = SKILLS;
  const art = ARTS[1];
  const skills = applyTextOverrides(SKILLS, { [skill.id]: { n: "  ชื่อใหม่ ", d: "คำใหม่" } });
  assert.equal(skills[0].n, "ชื่อใหม่");
  assert.equal(skills[0].d, "คำใหม่");
  assert.equal(skills[0].bp, skill.bp, "numbers kept");
  assert.equal(skills[1], other, "an untouched row is the same object");
  assert.equal(SKILLS[0].n, skill.n, "the table itself is not mutated");
  const arts = applyTextOverrides(ARTS, { [art.id]: { d: "คำบรรยายวิชาใน" } });
  assert.equal(arts[1].d, "คำบรรยายวิชาใน");
  assert.equal(arts[1].n, art.n, "only the given field changes");
});

check("unknown ids, blank names and junk in the overrides are ignored", () => {
  const skills = applyTextOverrides(SKILLS, { no_such_skill: { n: "x" }, [SKILLS[0].id]: { n: "   " } });
  assert.equal(skills.length, SKILLS.length);
  assert.equal(skills[0].n, SKILLS[0].n, "a blank name keeps the table's");
  assert.ok(!skills.some((s) => s.id === "no_such_skill"));
  const normalized = normalizeTextOverrides({ version: 1, skills: { a: { n: "", d: 3 }, b: "x", c: { n: "ok" } }, arts: null, extra: 1 });
  assert.deepEqual(normalized, { version: 1, skills: { c: { n: "ok" } }, arts: {} });
  assert.deepEqual(normalizeTextOverrides(null), { version: 1, skills: {}, arts: {} });
});

check("the committed text-overrides.json is applied to SKILLS / ARTS at load (getSkill / getArt included)", () => {
  for (const [id, o] of Object.entries(TEXT_OVERRIDES.skills)) {
    const skill = getSkill(id);
    if (!skill) continue;
    if (o.n) assert.equal(skill.n, o.n.trim(), `${id} name`);
    if (o.d !== undefined) assert.equal(skill.d, o.d, `${id} description`);
  }
  for (const [id, o] of Object.entries(TEXT_OVERRIDES.arts)) {
    const art = getArt(id);
    if (art.id !== id) continue;
    if (o.n) assert.equal(art.n, o.n.trim(), `${id} name`);
  }
  assert.equal(BASE_TEXT.skills.size, SKILLS.length, "base text kept for every skill");
  assert.equal(BASE_TEXT.arts.size, ARTS.length, "base text kept for every art");
});

check("text rows: 178 skills + 122 arts, base text from the table, `none` left out", () => {
  const rows = textRows();
  assert.equal(rows.filter((r) => r.kind === "skill").length, 178);
  assert.equal(rows.filter((r) => r.kind === "art").length, 122);
  assert.ok(!rows.some((r) => r.id === "none"));
});

check("the draft stores only changed fields and drops a value set back to the table's", () => {
  const rows = textRows();
  const row = rows[0];
  let draft = setRowText(emptyOverrides(), row, "d", "ใหม่");
  assert.deepEqual(draft.skills[row.id], { d: "ใหม่" });
  draft = setRowText(draft, row, "n", row.baseN);
  assert.deepEqual(draft.skills[row.id], { d: "ใหม่" }, "same name: no n stored");
  draft = setRowText(draft, row, "d", row.baseD);
  assert.ok(!(row.id in draft.skills), "back to the table: entry gone");
  draft = setRowText(draft, row, "n", " ชื่อ ");
  assert.equal(rowText(row, draft).n, " ชื่อ ");
  assert.deepEqual(overridesToSave(draft, rows).skills[row.id], { n: "ชื่อ" }, "saved trimmed");
  assert.deepEqual(resetRow(draft, row).skills, {});
  const junk = { version: 1 as const, skills: { gone: { n: "x" } }, arts: {} };
  assert.deepEqual(overridesToSave(junk, rows), emptyOverrides(), "unknown ids not saved");
});

check("validation: empty, too long and duplicate names; long descriptions; a quest naming its reward", () => {
  const rows = textRows();
  const [a, b] = rows;
  assert.ok(!hasErrors(validateTextRows(rows, emptyOverrides())), "the tables as shipped have no errors");
  let draft = setRowText(emptyOverrides(), a, "n", "");
  assert.ok(validateTextRows(rows, draft).get(rowKey(a))?.some((i) => i.level === "error" && i.field === "n"));
  draft = setRowText(emptyOverrides(), a, "n", b.baseN);
  const dup = validateTextRows(rows, draft);
  assert.ok(dup.get(rowKey(a))?.some((i) => i.level === "error" && i.message.includes(b.id)));
  assert.ok(hasErrors(dup));
  draft = setRowText(emptyOverrides(), a, "d", "ก".repeat(DESC_MAX + 1));
  assert.ok(validateTextRows(rows, draft).get(rowKey(a))?.some((i) => i.field === "d" && i.level === "error"));
  const quests: QuestText[] = [{ id: "q1", name: "ตามหาวิชา", texts: ["ตามหาวิชา", "ไปเรียนกระบวนท่าลับ", ""], skills: [a.id], arts: [] }];
  draft = setRowText(emptyOverrides(), a, "n", "กระบวนท่าลับ");
  const named = validateTextRows(rows, draft, quests).get(rowKey(a)) ?? [];
  assert.ok(named.some((i) => i.level === "warning" && i.message.includes("q1")));
  assert.equal(questsMentioning("กระบวนท่าลับ", quests).length, 1);
});

check("no shipped quest names the move it teaches (the editor's warning is quiet on the tables)", () => {
  const rows = textRows();
  const issues = validateTextRows(rows, emptyOverrides(), questTexts());
  const naming = [...issues.values()].flat().filter((i) => i.message.startsWith("เควสที่ให้วิชานี้"));
  assert.deepEqual(naming, []);
});

check("text filters: kind, sect, tier, weapon, search, edited only", () => {
  const rows = textRows();
  assert.equal(filterTextRows(rows, { kind: "art" }, emptyOverrides()).length, 122);
  const sword = filterTextRows(rows, { weapon: "sword" }, emptyOverrides());
  assert.ok(sword.length > 0 && sword.every((r) => r.kind === "skill" && r.w === "sword"));
  const t0 = filterTextRows(rows, { tier: 0, sect: "เส้าหลิน" }, emptyOverrides());
  assert.ok(t0.length > 0 && t0.every((r) => r.ti === 0 && r.sc === "เส้าหลิน"));
  assert.deepEqual(filterTextRows(rows, { text: "sl_bodhi_palm" }, emptyOverrides()).map((r) => r.id), ["sl_bodhi_palm"]);
  const draft = setRowText(emptyOverrides(), rows[5], "d", "x");
  assert.deepEqual(filterTextRows(rows, { editedOnly: true }, draft).map((r) => r.id), [rows[5].id]);
});

const asset = (id: string, extra: Partial<AssetEntry> = {}): AssetEntry => ({
  id, name: id, category: "prop", subcategory: "stall", region: "east", tags: ["wood"], image: `/x/${id}.png`, width: 64, height: 64,
  mapWidth: 32, mapHeight: 32, anchorX: 32, anchorY: 60, footprint: { x: -8, y: -4, w: 16, h: 4 }, layer: "object", flippable: true,
  source: { tool: "test", prompt: "", size: 64 }, status: "draft", ...extra,
});
const assets = [
  asset("prp_east_stall_01", { name: "แผงผลไม้", tags: ["fruit", "ผลไม้"] }),
  asset("bld_south_house_01", { category: "building", subcategory: "house", region: "south", status: "approved" }),
  asset("sct_wudang_banner", { category: "sect", subcategory: "banner", region: "any", sect: "wudang", status: "rejected" }),
];

check("asset filters: category, region (with any), sect, status, Thai / English text; distinct values; paging", () => {
  assert.equal(filterAssets(assets, {}).length, 3, "every status by default");
  assert.deepEqual(filterAssets(assets, { category: "building" }).map((a) => a.id), ["bld_south_house_01"]);
  assert.deepEqual(filterAssets(assets, { region: "east" }).map((a) => a.id), ["prp_east_stall_01", "sct_wudang_banner"]);
  assert.deepEqual(filterAssets(assets, { sect: "wudang" }).map((a) => a.id), ["sct_wudang_banner"]);
  assert.deepEqual(filterAssets(assets, { status: "approved" }).map((a) => a.id), ["bld_south_house_01"]);
  assert.deepEqual(filterAssets(assets, { text: "ผลไม้" }).map((a) => a.id), ["prp_east_stall_01"]);
  assert.deepEqual(filterAssets(assets, { text: "FRUIT" }).map((a) => a.id), ["prp_east_stall_01"]);
  assert.deepEqual(distinctValues(assets, "subcategory"), ["banner", "house", "stall"]);
  const p = pageOf(Array.from({ length: 125 }, (_, i) => i), 9, 60);
  assert.deepEqual([p.page, p.pages, p.items.length, p.items[0]], [2, 3, 5, 120]);
  assert.equal(pageOf([], 0, 60).pages, 1);
});

check("asset edits: merged, dropped when back to original, pruned, bulk status / tags, saved manifest", () => {
  let edits = mergeAssetEdit({}, assets[0], { name: "แผงผัก", status: "approved" });
  assert.deepEqual(edits, { prp_east_stall_01: { name: "แผงผัก", status: "approved" } });
  edits = mergeAssetEdit(edits, assets[0], { name: assets[0].name });
  assert.deepEqual(edits, { prp_east_stall_01: { status: "approved" } });
  edits = mergeAssetEdit(edits, assets[0], { status: "draft" });
  assert.deepEqual(edits, {});
  assert.deepEqual(pruneAssetEdits({ gone: { name: "x" }, prp_east_stall_01: { name: "แผงผลไม้" } }, assets), {});
  edits = bulkEdit({}, assets, ["prp_east_stall_01", "bld_south_house_01", "nope"], { status: "rejected" });
  assert.deepEqual(Object.keys(edits).sort(), ["bld_south_house_01", "prp_east_stall_01"]);
  edits = bulkEdit(edits, assets, ["bld_south_house_01"], { addTags: ["roof", "wood"] });
  assert.deepEqual(edits.bld_south_house_01.tags, ["wood", "roof"]);
  edits = bulkEdit(edits, assets, ["bld_south_house_01"], { removeTags: ["roof"] });
  assert.equal(edits.bld_south_house_01.tags, undefined, "tags back to the original");
  const manifest: AssetManifest = { version: 1, generatedAt: "", assets };
  const saved = editedManifest(manifest, edits, new Date("2026-10-04T00:00:00Z"));
  assert.equal(saved.generatedAt, "2026-10-04T00:00:00.000Z");
  assert.equal(saved.assets[0].status, "rejected");
  assert.equal(manifest.assets[0].status, "draft", "the loaded manifest is not mutated");
  assert.equal(applyAssetEdits(assets, {})[2], assets[2]);
  assert.deepEqual(parseTags(" a, b ,, a\nc "), ["a", "b", "c"]);
});

check("footprint geometry: map units ↔ image px round-trips; a default sits on the anchor", () => {
  const a = assets[0];
  const box = footprintToImage(a, a.footprint!);
  assert.deepEqual(box, { x: 16, y: 52, w: 32, h: 8 });
  assert.deepEqual(footprintFromImage(a, box), a.footprint);
  const fp = defaultFootprint(a);
  assert.ok(fp.w > 0 && fp.h > 0 && fp.x + fp.w / 2 === 0 && fp.y + fp.h === 0);
});

check("save route: writes only in dev or with ENGINE_WRITE=1; whitelist of three files; JSON checked", () => {
  assert.equal(engineWritable({ NODE_ENV: "development" }), true);
  assert.equal(engineWritable({ NODE_ENV: "production" }), false);
  assert.equal(engineWritable({ NODE_ENV: "production", ENGINE_WRITE: "1" }), true);
  for (const key of ["manifest", "placements", "textOverrides"]) assert.ok(isEngineFileKey(key), key);
  for (const key of ["toString", "__proto__", "constructor", "../package", "", 3, null]) assert.ok(!isEngineFileKey(key), String(key));
  assert.deepEqual(checkSaveRequest({ key: "textOverrides", json: "{}" }), { ok: true, key: "textOverrides", json: "{}", path: "lib/game/data/text-overrides.json" });
  assert.equal(checkSaveRequest({ key: "toString", json: "{}" }).ok, false);
  assert.equal(checkSaveRequest({ key: "manifest", json: "{" }).ok, false);
  assert.equal(checkSaveRequest({ key: "manifest", json: {} }).ok, false);
  assert.equal(checkSaveRequest(null).ok, false);
});

console.log(`\n${passed} checks passed`);
