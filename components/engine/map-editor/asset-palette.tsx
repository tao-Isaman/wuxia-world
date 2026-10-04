"use client";
/* eslint-disable @next/next/no-img-element -- thumbnails of arbitrary public asset URLs */
import { useMemo, useState } from "react";
import { ASSET_CATEGORIES, ASSET_REGIONS, type AssetCategory, type AssetEntry, type AssetRegion } from "@/lib/assets/types";
import { queryAssets } from "@/lib/assets/catalog";
import styles from "./map-editor.module.css";

export const CATEGORY_LABELS: Record<AssetCategory, string> = {
  building: "อาคาร", prop: "ของประกอบฉาก", sect: "ของสำนัก", nature: "ธรรมชาติ", tile: "พื้น",
  icon: "ไอคอน", character: "ตัวละคร", monster: "สัตว์/ปีศาจ", fx: "เอฟเฟกต์", ui: "UI", kit: "ถนน/กำแพง",
};
export const REGION_LABELS: Record<AssetRegion, string> = {
  heartland: "ภาคกลาง", east: "ตะวันออก", south: "ใต้", north: "เหนือ", west: "ตะวันตก", any: "ทุกภาค",
};
const PAGE = 120;

/** Approved assets to place: filter by category / region / sect / text; click to arm, or drag onto the map. */
export function AssetPalette({ assets, armed, onArm }: {
  assets: readonly AssetEntry[];
  armed: AssetEntry | null;
  onArm: (asset: AssetEntry | null) => void;
}) {
  const [category, setCategory] = useState<AssetCategory | "">("");
  const [region, setRegion] = useState<AssetRegion | "">("");
  const [sect, setSect] = useState("");
  const [text, setText] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const sects = useMemo(() => [...new Set(assets.flatMap((a) => a.status === "approved" && a.sect ? [a.sect] : []))].sort(), [assets]);
  const found = useMemo(() => queryAssets(assets, {
    category: category || undefined, region: region || undefined, sect: sect || undefined, text,
  }), [assets, category, region, sect, text]);
  const reset = () => setLimit(PAGE);
  return (
    <section className={styles.panel} aria-label="คลังวัตถุ">
      <div className={styles.panelTitle}>
        <span>คลังวัตถุ</span>
        <small>{found.length.toLocaleString()} ชิ้น</small>
      </div>
      <div className={styles.filters}>
        <select aria-label="หมวด" value={category} onChange={(e) => { setCategory(e.target.value as AssetCategory | ""); reset(); }}>
          <option value="">ทุกหมวด</option>
          {ASSET_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
        </select>
        <select aria-label="ภูมิภาค" value={region} onChange={(e) => { setRegion(e.target.value as AssetRegion | ""); reset(); }}>
          <option value="">ทุกภูมิภาค</option>
          {ASSET_REGIONS.filter((r) => r !== "any").map((r) => <option key={r} value={r}>{REGION_LABELS[r]}</option>)}
        </select>
        <select aria-label="สำนัก" value={sect} onChange={(e) => { setSect(e.target.value); reset(); }} disabled={!sects.length}>
          <option value="">ทุกสำนัก</option>
          {sects.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button type="button" onClick={() => onArm(null)} disabled={!armed}>เลิกเลือก</button>
        <input type="search" aria-label="ค้นหาวัตถุ" placeholder="ค้นหา ชื่อ / id / แท็ก" value={text}
          onChange={(e) => { setText(e.target.value); reset(); }} />
      </div>
      <div className={styles.palette} data-testid="asset-palette">
        {!assets.length && <p className={styles.empty}>คลังภาพยังว่าง (public/assets/manifest.json)</p>}
        {!!assets.length && !found.length && <p className={styles.empty}>ไม่พบวัตถุที่อนุมัติแล้วตามตัวกรอง</p>}
        {found.slice(0, limit).map((asset) => (
          <button key={asset.id} type="button" className={styles.tile} aria-pressed={armed?.id === asset.id}
            data-asset-id={asset.id} title={`${asset.name} · ${asset.id}`} draggable
            onDragStart={(event) => { event.dataTransfer.setData("application/x-asset-id", asset.id); event.dataTransfer.effectAllowed = "copy"; }}
            onClick={() => onArm(armed?.id === asset.id ? null : asset)}>
            <img src={asset.image} alt="" loading="lazy" draggable={false} />
            <span>{asset.name}</span>
          </button>
        ))}
        {found.length > limit && <button type="button" onClick={() => setLimit((n) => n + PAGE)}>แสดงเพิ่ม ({found.length - limit})</button>}
      </div>
    </section>
  );
}
