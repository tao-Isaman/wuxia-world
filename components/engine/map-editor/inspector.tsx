"use client";
import { ASSET_DIRECTIONS, type AssetDirection, type AssetEntry, type Placement } from "@/lib/assets/types";
import styles from "./map-editor.module.css";

const LAYER_LABELS = { ground: "พื้น (ใต้ตัวละคร)", object: "วัตถุ (เรียงตามฐาน)", overhead: "เหนือหัว (บนตัวละคร)" } as const;

export interface InspectorIssue { key: string; text: string; placementId: string | null }

/** The selected placements' fields, the map's warnings and the shortcuts. */
export function Inspector({ selection, assets, issues, onEdit, onDuplicate, onDelete, onSelectIssue }: {
  selection: readonly Placement[];
  assets: ReadonlyMap<string, AssetEntry>;
  issues: readonly InspectorIssue[];
  /** `merge`: consecutive edits with the same key make one undo step (a slider drag). */
  onEdit: (edit: (placement: Placement) => Placement, merge?: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSelectIssue: (placementId: string) => void;
}) {
  const single = selection.length === 1 ? selection[0] : null;
  const asset = single ? assets.get(single.asset) : undefined;
  const flippable = selection.every((p) => assets.get(p.asset)?.flippable !== false);
  const common = <K extends keyof Placement>(key: K) => {
    const values = new Set(selection.map((p) => p[key]));
    return values.size === 1 ? selection[0][key] : undefined;
  };
  const scale = common("scale") ?? (selection.every((p) => p.scale === undefined) ? 1 : undefined);
  const number = (value: string, fallback: number) => Number.isFinite(Number(value)) && value.trim() !== "" ? Number(value) : fallback;
  return (
    <section className={styles.panel} aria-label="คุณสมบัติ" data-testid="map-editor-inspector">
      <div className={styles.panelTitle}>
        <span>{single ? asset?.name ?? single.asset : selection.length ? `เลือก ${selection.length} ชิ้น` : "คุณสมบัติ"}</span>
        {single && <small>{single.id}</small>}
      </div>
      <div className={styles.panelBody}>
        {!selection.length && <p className={styles.empty}>เลือกวัตถุบนแผนที่ หรือเลือกภาพจากคลังแล้วคลิกบนแผนที่เพื่อวาง</p>}
        {!!selection.length && <div className={styles.fields}>
          {single && <>
            <label htmlFor="placement-x">ตำแหน่ง</label>
            <div className={styles.row}>
              <input id="placement-x" key={`x${single.id}${single.x}`} type="number" aria-label="x" defaultValue={single.x} step={1}
                onBlur={(e) => onEdit((p) => ({ ...p, x: number(e.target.value, p.x) }))}
                onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} />
              <input key={`y${single.id}${single.y}`} type="number" aria-label="y" defaultValue={single.y} step={1}
                onBlur={(e) => onEdit((p) => ({ ...p, y: number(e.target.value, p.y) }))}
                onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} />
            </div>
            <label>ภาพ</label>
            <small>{single.asset}{asset ? ` · ${asset.mapWidth}×${asset.mapHeight}` : " · ไม่พบในคลัง"}</small>
          </>}
          <label htmlFor="placement-scale">ขนาด</label>
          <div className={styles.row}>
            <input id="placement-scale" type="range" min={0.25} max={3} step={0.05} value={scale ?? 1}
              onChange={(e) => onEdit((p) => ({ ...p, scale: Number(e.target.value) }), "scale-slider")} />
            <input key={`s${scale}`} type="number" aria-label="ขนาด (เท่า)" min={0.1} max={5} step={0.05} defaultValue={scale ?? ""}
              onBlur={(e) => { const value = number(e.target.value, NaN); if (value > 0) onEdit((p) => ({ ...p, scale: value })); }}
              onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} />
          </div>
          <label htmlFor="placement-flip">กลับซ้ายขวา</label>
          <input id="placement-flip" type="checkbox" checked={common("flip") === true} disabled={!flippable}
            title={flippable ? "" : "ภาพนี้กลับด้านไม่ได้ (มีตัวอักษร)"} onChange={(e) => onEdit((p) => ({ ...p, flip: e.target.checked }))} />
          <label htmlFor="placement-layer">ชั้น</label>
          <select id="placement-layer" value={common("layer") ?? (selection.every((p) => !p.layer) ? "" : "mixed")}
            onChange={(e) => onEdit((p) => ({ ...p, layer: (e.target.value || undefined) as Placement["layer"] }))}>
            <option value="">ตามภาพ{asset ? ` (${LAYER_LABELS[asset.layer]})` : ""}</option>
            {(Object.keys(LAYER_LABELS) as (keyof typeof LAYER_LABELS)[]).map((layer) => <option key={layer} value={layer}>{LAYER_LABELS[layer]}</option>)}
            {common("layer") === undefined && !selection.every((p) => !p.layer) && <option value="mixed" disabled>หลายแบบ</option>}
          </select>
          <label htmlFor="placement-collide">ชนได้</label>
          <select id="placement-collide" value={selection.every((p) => p.collide === undefined) ? "" : String(common("collide") ?? "mixed")}
            onChange={(e) => onEdit((p) => ({ ...p, collide: e.target.value === "" ? undefined : e.target.value === "true" }))}>
            <option value="">ตามภาพ{asset ? (asset.footprint ? " (ชน)" : " (ไม่มีฐาน)") : ""}</option>
            <option value="true">ชน — เดินผ่านไม่ได้</option>
            <option value="false">ไม่ชน — เดินผ่านได้</option>
            <option value="mixed" disabled>หลายแบบ</option>
          </select>
          {single && asset?.views && <>
            <label htmlFor="placement-dir">ทิศ</label>
            <select id="placement-dir" value={single.dir ?? ""} onChange={(e) => onEdit((p) => ({ ...p, dir: (e.target.value || undefined) as AssetDirection | undefined }))}>
              <option value="">ภาพหลัก</option>
              {ASSET_DIRECTIONS.filter((d) => asset.views?.[d]).map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </>}
        </div>}
        {!!selection.length && <div className={styles.actions}>
          <button type="button" onClick={onDuplicate}>ทำซ้ำ (Ctrl+D)</button>
          <button type="button" className={styles.danger} onClick={onDelete}>ลบ (Delete)</button>
        </div>}
        {issues.length ? <ul className={styles.issues} aria-label="คำเตือน" data-testid="map-editor-issues">
          {issues.map((issue) => <li key={issue.key}><button type="button" disabled={!issue.placementId}
            onClick={() => issue.placementId && onSelectIssue(issue.placementId)}>⚠ {issue.text}</button></li>)}
        </ul> : <p className={styles.ok}>✓ ไม่มีวัตถุขวางจุดสำคัญ</p>}
        <p className={styles.kbd}>ลูกศร เลื่อน 1 (Shift 10, หรือทีละช่องกริด) · Ctrl+Z ย้อน · Ctrl+Shift+Z ทำซ้ำ · Ctrl+A เลือกทั้งหมด · Esc ยกเลิก</p>
      </div>
    </section>
  );
}
