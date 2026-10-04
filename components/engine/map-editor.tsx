"use client";
/**
 * แผนที่ — the engine's map editor (/game/engine). Places objects from the
 * asset library on the 100 painted location maps and saves every map's
 * placements to public/assets/placements.json (`saveEngineFile`). The game
 * draws them with the same geometry (lib/assets/placement-geometry.ts) and
 * adds their footprints to the map's collision. See docs/engine.md.
 */
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type { AssetEntry, Placement, PlacementsFile } from "@/lib/assets/types";
import { effectiveMapImage, indexAssets, loadPlacements, reloadAssetData } from "@/lib/assets/catalog";
import { placementsGeometry } from "@/lib/assets/placement-geometry";
import { saveEngineFile } from "@/lib/engine/save";
import { engineStorageGet, engineStorageSet, prepareEnginePlaytest } from "@/lib/engine/goto";
import { getLocationMap } from "@/lib/world/data/location-maps";
import { getNpc } from "@/lib/world/data/npcs";
import { getScene } from "@/lib/world";
import { worldFootprints } from "@/lib/stage/world-navigation";
import { mapAnchors, placementIssues, type MapAnchor } from "@/lib/stage/map-anchors";
import {
  DRAFT_KEY, EDITOR_MAP_IDS, EMPTY_FILE, clampToMap, commit, editPlacements, initHistory, newPlacement, nextPlacementId,
  normalizeFile, redo, sameFile, setGround, setMap, snap, undo, type History,
} from "./map-editor/model";
import { MapStage, movedPoint, type LabelledAnchor } from "./map-editor/map-stage";
import { AssetPalette } from "./map-editor/asset-palette";
import { KitBrush } from "./map-editor/kit-brush";
import { kitCellOf, kitSets, paintKit, placeKitSpecial, type KitSet } from "@/lib/assets/kits";
import { Inspector, type InspectorIssue } from "./map-editor/inspector";
import styles from "./map-editor/map-editor.module.css";

const LAST_MAP_KEY = "wuxia-engine-map";
const SPOT_LABELS: Record<string, string> = {
  shop: "ร้านค้า", sectHall: "หอสำนัก", artisan: "ช่างฝีมือ", rest: "พักผ่อน", rumor: "ข่าวลือ",
  practice: "ฝึกฝน", resource: "แหล่งวัตถุดิบ", activity: "กิจกรรม", station: "สถานีพักม้า", tournament: "ชุมนุมวิจารณ์กระบี่",
};
const GRID_SIZES = [4, 8, 16, 32] as const;

function placeName(id: string): string {
  const scene = getScene(id);
  return scene && "name" in scene && typeof scene.name === "string" ? scene.name : id;
}
function anchorLabel(anchor: MapAnchor, mapId: string): string {
  switch (anchor.kind) {
    case "spawn": return "จุดเกิด";
    case "arrival": return `มาจาก${placeName(anchor.ref)}`;
    case "exit": return `ทางไป${placeName(anchor.ref)}`;
    case "service": return SPOT_LABELS[anchor.ref] ?? anchor.ref;
    case "npc": {
      const scene = getScene(mapId);
      const local = scene?.kind === "location" ? scene.npcs.find((npc) => npc.id === anchor.ref)?.name : undefined;
      return getNpc(anchor.ref)?.name ?? local ?? anchor.ref;
    }
  }
}

export function MapEditor({ assets }: { assets: AssetEntry[] }) {
  const root = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<History>(() => initHistory(EMPTY_FILE));
  const [baseline, setBaseline] = useState<PlacementsFile | null>(null);
  const [mapId, setMapId] = useState<string>(() => {
    const last = typeof window === "undefined" ? null : engineStorageGet(() => localStorage, LAST_MAP_KEY);
    return last && EDITOR_MAP_IDS.includes(last) ? last : "city_capital";
  });
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [armed, setArmed] = useState<AssetEntry | null>(null);
  const [kit, setKit] = useState<KitSet | null>(null);
  const [kitErase, setKitErase] = useState(false);
  const strokes = useRef(0);
  const [show, setShow] = useState({ collision: false, footprints: true, markers: true });
  const [snapOn, setSnapOn] = useState(false);
  const [gridSize, setGridSize] = useState<number>(16);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const lastMerge = useRef<string | null>(null);
  const grid = snapOn ? gridSize : null;

  // Load the saved file, then any unsaved draft on top of it.
  useEffect(() => {
    let live = true;
    reloadAssetData();
    void loadPlacements().then((file) => {
      if (!live) return;
      const saved: PlacementsFile = file?.maps ? normalizeFile(file) : EMPTY_FILE;
      let start = saved;
      const raw = engineStorageGet(() => localStorage, DRAFT_KEY);
      if (raw) {
        try {
          const draft = JSON.parse(raw) as PlacementsFile;
          if (draft?.maps && !sameFile(draft, saved)) { start = draft; setMessage("เปิดฉบับร่างที่ยังไม่ได้บันทึก"); }
        } catch { /* a broken draft is ignored */ }
      }
      setBaseline(saved);
      setHistory(initHistory(start));
    });
    return () => { live = false; };
  }, []);

  const present = history.present;
  const dirty = !!baseline && !sameFile(present, baseline);
  // The working file survives a reload (localStorage, guarded).
  useEffect(() => {
    if (!baseline) return;
    if (dirty) engineStorageSet(() => localStorage, DRAFT_KEY, JSON.stringify(present));
    else { try { localStorage.removeItem(DRAFT_KEY); } catch { /* blocked storage */ } }
  }, [present, baseline, dirty]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  useEffect(() => { engineStorageSet(() => localStorage, LAST_MAP_KEY, mapId); }, [mapId]);

  const index = useMemo(() => indexAssets(assets), [assets]);
  const sets = useMemo(() => kitSets(assets), [assets]);
  const map = getLocationMap(mapId)!;
  const placements = useMemo(() => present.maps[mapId] ?? [], [present, mapId]);
  const existing = useMemo(() => new Set(placements.map((p) => p.id)), [placements]);
  const selected = useMemo(() => new Set([...selectedIds].filter((id) => existing.has(id))), [selectedIds, existing]);
  const selection = useMemo(() => placements.filter((p) => selected.has(p.id)), [placements, selected]);
  const geometry = useMemo(() => placementsGeometry(placements, index), [placements, index]);
  // A map whose painting is replaced by a ground keeps none of its painted collision.
  const mapImage = effectiveMapImage(present, mapId, map.image);
  const collision = useMemo(() => worldFootprints(mapId, mapImage), [mapId, mapImage]);
  const groundTile = present.grounds?.[mapId]?.tile ?? "";
  const groundAsset = groundTile ? index.get(groundTile) : undefined;
  // Ground fills: the library's solid tiles (all four corners one terrain).
  const fills = useMemo(() => assets.filter((a) => a.status === "approved" && a.tile && new Set(Object.values(a.tile.corners)).size === 1), [assets]);
  // The reachability check can take a moment on a crowded map: let edits paint first.
  const checked = useDeferredValue(geometry);
  const checkedMap = useMemo(() => ({ ...map, image: mapImage }), [map, mapImage]);
  const found = useMemo(() => placementIssues(mapId, checkedMap, checked), [mapId, checkedMap, checked]);

  const anchors: LabelledAnchor[] = useMemo(() => {
    const byAnchor = new Map(found.map((issue) => [issue.anchor.id, issue]));
    return mapAnchors(map, mapId).map((anchor) => {
      const label = anchorLabel(anchor, mapId);
      const issue = byAnchor.get(anchor.id);
      return { ...anchor, label, issue: issue ? (issue.reason === "covered" ? `ถูกวัตถุทับ: ${label}` : `เดินไปไม่ถึง: ${label}`) : undefined };
    });
  }, [map, mapId, found]);
  const issues: InspectorIssue[] = useMemo(() => {
    const labels = new Map(anchors.map((a) => [a.id, a.label]));
    const name = (id: string) => { const p = placements.find((x) => x.id === id); return p ? index.get(p.asset)?.name ?? p.asset : id; };
    return [
      ...placements.filter((p) => !index.has(p.asset)).map((p) => ({ key: `missing:${p.id}`, placementId: p.id, text: `${p.id}: ไม่พบภาพ ${p.asset} ในคลัง` })),
      ...found.map((issue) => ({
        key: `${issue.reason}:${issue.anchor.id}`, placementId: issue.placementId,
        text: issue.reason === "covered" ? `${name(issue.placementId!)} (${issue.placementId}) ขวาง${labels.get(issue.anchor.id)}`
          : `วัตถุปิดทาง: เดินจากจุดเกิดไป${labels.get(issue.anchor.id)}ไม่ได้แล้ว`,
      })),
    ];
  }, [found, anchors, placements, index]);
  const flagged = useMemo(() => new Set(issues.flatMap((issue) => issue.placementId ? [issue.placementId] : [])), [issues]);

  /** Apply an edit to the whole file; consecutive edits with the same `merge` key are one undo step. */
  const update = useCallback((edit: (file: PlacementsFile) => PlacementsFile, merge?: string) => {
    const mergeIt = !!merge && lastMerge.current === merge;
    lastMerge.current = merge ?? null;
    setHistory((h) => {
      const next = edit(h.present);
      if (next === h.present) return h;
      return mergeIt ? { ...h, present: next, future: [] } : commit(h, next);
    });
  }, []);
  const select = useCallback((ids: string[], mode: "replace" | "add" | "toggle") => {
    setSelectedIds((current) => {
      if (mode === "replace") return new Set(ids);
      const next = new Set(current);
      for (const id of ids) { if (mode === "toggle" && next.has(id)) next.delete(id); else next.add(id); }
      return next;
    });
  }, []);
  function place(asset: AssetEntry, x: number, y: number, keepArmed = false) {
    const set = asset.kit?.special ? sets.get(asset.kit.set) : undefined;
    if (set && asset.kit) {
      // A gate: it replaces the set's pieces under it and its neighbours join it.
      const { col, row } = kitCellOf(asset.kit, x, y);
      const id = nextPlacementId(present);
      update((file) => setMap(file, mapId, placeKitSpecial(file.maps[mapId] ?? [], index, set, asset, col, row, id).placements));
      setSelectedIds(new Set([id]));
      if (!keepArmed) setArmed(null);
      return;
    }
    const placement = newPlacement(present, asset, x, y);
    update((file) => setMap(file, mapId, [...(file.maps[mapId] ?? []), placement]));
    setSelectedIds(new Set([placement.id]));
    if (!keepArmed) setArmed(null);
  }
  /** A kit brush stroke: one undo step per stroke. */
  function brushCells(cells: { col: number; row: number }[], erase: boolean, start: boolean) {
    if (!kit) return;
    if (start) strokes.current++;
    update((file) => {
      const taken = new Set<string>();
      const nextId = () => { const id = nextPlacementId(file, taken); taken.add(id); return id; };
      const result = paintKit(file.maps[mapId] ?? [], index, kit, cells, erase, nextId);
      return result.placements.length === (file.maps[mapId] ?? []).length && !result.changed.length ? file : setMap(file, mapId, result.placements);
    }, `brush:${strokes.current}`);
  }
  function moveBy(ids: ReadonlySet<string>, dx: number, dy: number) {
    update((file) => editPlacements(file, mapId, ids, (p) => ({ ...p, ...movedPoint(p, dx, dy, grid) })));
  }
  function editSelection(edit: (p: Placement) => Placement, merge?: string) {
    update((file) => editPlacements(file, mapId, selected, (p) => {
      const next = edit(p);
      return { ...next, ...clampToMap(next.x, next.y), flip: next.flip && index.get(p.asset)?.flippable !== false ? true : undefined };
    }), merge);
  }
  function remove() {
    if (!selected.size) return;
    // The ids stay selected (the selection only shows existing ones), so an undo brings them back selected.
    update((file) => setMap(file, mapId, (file.maps[mapId] ?? []).filter((p) => !selected.has(p.id))));
  }
  function duplicate() {
    if (!selection.length) return;
    const taken = new Set<string>();
    const copies = selection.map((p) => {
      const id = nextPlacementId(present, taken);
      taken.add(id);
      return { ...p, id, ...clampToMap(snap(p.x + 16, grid), snap(p.y + 16, grid)) };
    });
    update((file) => setMap(file, mapId, [...(file.maps[mapId] ?? []), ...copies]));
    setSelectedIds(new Set(copies.map((p) => p.id)));
  }
  const stepUndo = () => { lastMerge.current = null; setHistory(undo); };
  const stepRedo = () => { lastMerge.current = null; setHistory(redo); };

  // Shortcuts while the editor is on screen and no field has focus.
  const keys = useRef<(event: KeyboardEvent) => void>(() => {});
  keys.current = (event) => {
    const element = root.current;
    if (!element || element.offsetParent === null) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
    if (target && target !== document.body && !element.contains(target)) return;
    const mod = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();
    if (mod && key === "z") { event.preventDefault(); if (event.shiftKey) stepRedo(); else stepUndo(); return; }
    if (mod && key === "y") { event.preventDefault(); stepRedo(); return; }
    if (mod && key === "d") { event.preventDefault(); duplicate(); return; }
    if (mod && key === "a") { event.preventDefault(); setSelectedIds(new Set(placements.map((p) => p.id))); return; }
    if (key === "delete" || key === "backspace") { if (selected.size) { event.preventDefault(); remove(); } return; }
    if (key === "escape") { if (armed) setArmed(null); else if (kit) setKit(null); else setSelectedIds(new Set()); return; }
    const arrows: Record<string, [number, number]> = { arrowleft: [-1, 0], arrowright: [1, 0], arrowup: [0, -1], arrowdown: [0, 1] };
    if (arrows[key] && selected.size) {
      event.preventDefault();
      const step = grid ?? (event.shiftKey ? 10 : 1);
      moveBy(selected, arrows[key][0] * step, arrows[key][1] * step);
    }
  };
  useEffect(() => {
    const listener = (event: KeyboardEvent) => keys.current(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  async function save() {
    setSaving(true);
    const file = normalizeFile(present);
    const result = await saveEngineFile("placements", file);
    setSaving(false);
    if (result.ok) {
      setBaseline(file);
      reloadAssetData();
      setMessage(`บันทึกลง ${result.written} แล้ว`);
    } else {
      setMessage(`บันทึกลงไฟล์ไม่ได้ (${result.reason})${result.downloaded ? " — ดาวน์โหลด placements.json แทนแล้ว" : ""}`);
    }
  }
  function revert() {
    if (!baseline || !window.confirm("ทิ้งการแก้ไขที่ยังไม่บันทึกทั้งหมด?")) return;
    lastMerge.current = null;
    setHistory(initHistory(baseline));
    setSelectedIds(new Set());
    setMessage("กลับไปฉบับที่บันทึกไว้แล้ว");
  }
  function playtest() {
    window.open(prepareEnginePlaytest(mapId, normalizeFile(present)), "_blank");
  }

  const query = search.trim().toLowerCase();
  const maps = EDITOR_MAP_IDS.filter((id) => !query || id.includes(query) || placeName(id).toLowerCase().includes(query));
  return (
    <div ref={root} className={styles.root} data-testid="map-editor" data-map={mapId} data-dirty={dirty}
      data-loaded={!!baseline} data-placement-count={placements.length} data-selected={[...selected].join(" ")}
      data-undo={history.past.length} data-redo={history.future.length}>
      <div className={styles.toolbar} role="toolbar" aria-label="เครื่องมือแผนที่">
        <span className={styles.mapTitle}>{placeName(mapId)} <small>({mapId})</small></span>
        <span className={styles.toolbarGroup}>
          <button type="button" onClick={stepUndo} disabled={!history.past.length} title="Ctrl+Z">↶ ย้อน</button>
          <button type="button" onClick={stepRedo} disabled={!history.future.length} title="Ctrl+Shift+Z">↷ ทำซ้ำ</button>
        </span>
        <label>พื้น <select aria-label="พื้นแผนที่" value={groundTile} data-testid="map-ground"
          onChange={(e) => update((file) => setGround(file, mapId, e.target.value || null))}>
          <option value="">ภาพวาดเดิม</option>
          {fills.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.id})</option>)}
        </select></label>
        <label><input type="checkbox" checked={snapOn} onChange={(e) => setSnapOn(e.target.checked)} /> สแนปกริด</label>
        <select aria-label="ขนาดกริด" value={gridSize} onChange={(e) => setGridSize(Number(e.target.value))} disabled={!snapOn}>
          {GRID_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
        </select>
        <label><input type="checkbox" checked={show.footprints} onChange={(e) => setShow((s) => ({ ...s, footprints: e.target.checked }))} /> ฐานวัตถุ</label>
        <label><input type="checkbox" checked={show.collision} onChange={(e) => setShow((s) => ({ ...s, collision: e.target.checked }))} /> เส้นชนของแผนที่</label>
        <label><input type="checkbox" checked={show.markers} onChange={(e) => setShow((s) => ({ ...s, markers: e.target.checked }))} /> จุดสำคัญ</label>
        <span className={styles.toolbarGroup} style={{ marginLeft: "auto" }}>
          <span className={dirty ? styles.dirty : styles.clean} data-testid="map-editor-status">{!baseline ? "กำลังโหลด…" : dirty ? "● ยังไม่บันทึก" : "✓ บันทึกแล้ว"}</span>
          {message && <span className={styles.message} title={message}>{message}</span>}
          <button type="button" onClick={revert} disabled={!dirty}>ทิ้งการแก้ไข</button>
          <button type="button" onClick={playtest} title="เปิดเกมในแท็บใหม่ที่แผนที่นี้ พร้อมวัตถุที่ยังไม่บันทึก">▶ เล่นทดสอบ</button>
          <button type="button" className={styles.primary} onClick={() => void save()} disabled={!baseline || saving}>{saving ? "กำลังบันทึก…" : "บันทึก"}</button>
        </span>
      </div>

      <section className={styles.panel} aria-label="รายชื่อแผนที่">
        <div className={styles.panelTitle}><span>แผนที่ ({EDITOR_MAP_IDS.length})</span></div>
        <div className={styles.filters} style={{ gridTemplateColumns: "1fr" }}>
          <input type="search" aria-label="ค้นหาแผนที่" placeholder="ค้นหาชื่อ / id" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <ul className={styles.mapList}>
          {maps.map((id) => {
            const count = present.maps[id]?.length ?? 0;
            return <li key={id}><button type="button" aria-current={id === mapId} data-map-id={id}
              onClick={() => { setMapId(id); setSelectedIds(new Set()); }}>
              <span>{placeName(id)}<br /><small>{id}</small></span>
              {count > 0 && <span className={styles.count}>{count}</span>}
            </button></li>;
          })}
        </ul>
      </section>

      <MapStage image={map.image} ground={groundAsset ? { image: groundAsset.image, size: groundAsset.mapWidth } : null} placements={placements} assets={index} selected={selected} anchors={anchors}
        collision={collision} flagged={flagged} show={show} grid={grid} armed={armed}
        brush={kit && !armed ? { cell: kit.cell, grid: kit.grid, erase: kitErase } : null} onBrush={brushCells}
        onSelect={select} onMove={moveBy} onPlace={place}
        onDropAsset={(id, x, y) => { const asset = index.get(id); if (asset) place(asset, x, y); }} />

      <div className={styles.side}>
        <KitBrush sets={sets} active={kit} erase={kitErase} onPick={(set) => { setKit(set); setArmed(null); }} onErase={setKitErase}
          onArmSpecial={setArmed} />
        <AssetPalette assets={assets} armed={armed} onArm={(asset) => { setArmed(asset); if (asset) setKit(null); }} />
        <Inspector selection={selection} assets={index} issues={issues} onEdit={editSelection}
          onDuplicate={duplicate} onDelete={remove} onSelectIssue={(id) => setSelectedIds(new Set([id]))} />
      </div>
    </div>
  );
}
