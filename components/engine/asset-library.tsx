"use client";

import { memo, useDeferredValue, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { assetCounts } from "@/lib/assets/catalog";
import { ASSET_CATEGORIES, ASSET_REGIONS, type AssetEntry, type AssetManifest, type AssetRegion, type AssetStatus } from "@/lib/assets/types";
import { bulkEdit, distinctValues, filterAssets, mergeAssetEdit, pageOf, parseTags, type AssetEdit, type AssetEdits, type AssetFilter } from "@/lib/engine/asset-edit";
import { AssetDetail } from "./asset-detail";
import { CATEGORY_LABEL, REGION_LABEL, STATUS_LABEL } from "./labels";

const PAGE_SIZE = 60;

interface Props {
  manifest: AssetManifest | null;
  /** The manifest's assets with the unsaved edits applied. */
  assets: AssetEntry[];
  edits: AssetEdits;
  setEdits: Dispatch<SetStateAction<AssetEdits>>;
  onSave: () => Promise<void>;
  onDiscard: () => void;
}

export function AssetLibrary({ manifest, assets, edits, setEdits, onSave, onDiscard }: Props) {
  const [filter, setFilter] = useState<AssetFilter>({ status: "all" });
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(() => new Set());
  const [bulkTags, setBulkTags] = useState("");
  const [saving, setSaving] = useState(false);
  const deferredText = useDeferredValue(filter.text ?? "");

  const originals = useMemo(() => new Map((manifest?.assets ?? []).map((a) => [a.id, a])), [manifest]);
  const counts = useMemo(() => assetCounts(assets, "all"), [assets]);
  const inCategory = useMemo(() => (filter.category ? assets.filter((a) => a.category === filter.category) : assets), [assets, filter.category]);
  const subcategories = useMemo(() => distinctValues(inCategory, "subcategory"), [inCategory]);
  const sects = useMemo(() => distinctValues(assets, "sect"), [assets]);
  const filtered = useMemo(() => filterAssets(assets, { ...filter, text: deferredText }), [assets, filter, deferredText]);
  const shown = pageOf(filtered, page, PAGE_SIZE);
  const selected = selectedId ? assets.find((a) => a.id === selectedId) ?? null : null;
  const editCount = Object.keys(edits).length;

  const update = (patch: Partial<AssetFilter>) => { setFilter((f) => ({ ...f, ...patch })); setPage(0); };
  const editAsset = (id: string, change: AssetEdit) => {
    const original = originals.get(id);
    if (original) setEdits((current) => mergeAssetEdit(current, original, change));
  };
  const toggle = (id: string) => setChecked((set) => { const next = new Set(set); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const bulk = (change: Parameters<typeof bulkEdit>[3]) => setEdits((current) => bulkEdit(current, manifest?.assets ?? [], checked, change));

  if (!manifest) return <p className="eng-empty">กำลังโหลดคลังภาพ…</p>;

  return (
    <div className="eng-library">
      <aside className="eng-sidebar" aria-label="ตัวกรอง">
        <div className="eng-cats">
          <button type="button" className="eng-cat" aria-pressed={!filter.category} onClick={() => update({ category: "", subcategory: "" })}>
            <span>ทั้งหมด</span><span className="eng-count">{assets.length.toLocaleString("th-TH")}</span>
          </button>
          {ASSET_CATEGORIES.map((category) => (
            <button key={category} type="button" className="eng-cat" data-category={category} aria-pressed={filter.category === category} onClick={() => update({ category, subcategory: "" })}>
              <span>{CATEGORY_LABEL[category]}</span><span className="eng-count">{(counts[category] ?? 0).toLocaleString("th-TH")}</span>
            </button>
          ))}
        </div>
        <label className="eng-field">
          <span>ค้นหา</span>
          <input type="search" placeholder="ชื่อ, id หรือแท็ก (ไทย/อังกฤษ)" value={filter.text ?? ""} onChange={(e) => update({ text: e.target.value })} data-testid="asset-search" />
        </label>
        <label className="eng-field">
          <span>หมวดย่อย</span>
          <select value={filter.subcategory ?? ""} onChange={(e) => update({ subcategory: e.target.value })} data-testid="asset-subcategory">
            <option value="">ทั้งหมด</option>
            {subcategories.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="eng-field">
          <span>ภาค</span>
          <select value={filter.region ?? ""} onChange={(e) => update({ region: e.target.value as AssetRegion | "" })}>
            <option value="">ทั้งหมด</option>
            {ASSET_REGIONS.map((r) => <option key={r} value={r}>{REGION_LABEL[r]}</option>)}
          </select>
        </label>
        <label className="eng-field">
          <span>สำนัก</span>
          <select value={filter.sect ?? ""} onChange={(e) => update({ sect: e.target.value })}>
            <option value="">ทั้งหมด</option>
            {sects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="eng-field">
          <span>สถานะ</span>
          <select value={filter.status ?? "all"} onChange={(e) => update({ status: e.target.value as AssetStatus | "all" })} data-testid="asset-status-filter">
            <option value="all">ทั้งหมด</option>
            {(Object.keys(STATUS_LABEL) as AssetStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </label>
        <div className="eng-savebox">
          {editCount > 0
            ? <p className="eng-dirty" data-testid="asset-dirty">มีการแก้ไขที่ยังไม่บันทึก ({editCount} ภาพ)</p>
            : <p className="eng-muted">ไม่มีการแก้ไขค้าง</p>}
          <button type="button" className="eng-btn eng-btn-primary" disabled={!editCount || saving} onClick={async () => { setSaving(true); try { await onSave(); } finally { setSaving(false); } }}>
            บันทึก manifest
          </button>
          <button type="button" className="eng-btn" disabled={!editCount} onClick={() => { if (window.confirm("ทิ้งการแก้ไขคลังภาพทั้งหมดที่ยังไม่บันทึก?")) onDiscard(); }}>
            ทิ้งการแก้ไข
          </button>
        </div>
      </aside>

      <div className="eng-gridcol">
        <div className="eng-toolbar">
          <span data-testid="asset-total">{shown.total.toLocaleString("th-TH")} ภาพ</span>
          <div className="eng-pager">
            <button type="button" className="eng-btn" disabled={shown.page === 0} onClick={() => setPage(shown.page - 1)} aria-label="หน้าก่อน">‹</button>
            <span>หน้า {shown.page + 1} / {shown.pages}</span>
            <button type="button" className="eng-btn" disabled={shown.page >= shown.pages - 1} onClick={() => setPage(shown.page + 1)} aria-label="หน้าถัดไป">›</button>
          </div>
          <button type="button" className="eng-btn" onClick={() => setChecked((set) => new Set([...set, ...shown.items.map((a) => a.id)]))}>เลือกทั้งหน้า</button>
          {checked.size > 0 && <button type="button" className="eng-btn" onClick={() => setChecked(new Set())}>ล้างที่เลือก</button>}
        </div>
        {checked.size > 0 && (
          <div className="eng-bulk" data-testid="bulk-bar">
            <strong>เลือก {checked.size} ภาพ</strong>
            <button type="button" className="eng-btn eng-ok" onClick={() => bulk({ status: "approved" })}>อนุมัติ</button>
            <button type="button" className="eng-btn eng-bad" onClick={() => bulk({ status: "rejected" })}>ปฏิเสธ</button>
            <button type="button" className="eng-btn" onClick={() => bulk({ status: "draft" })}>เป็นร่าง</button>
            <input placeholder="แท็ก คั่นด้วย ," value={bulkTags} onChange={(e) => setBulkTags(e.target.value)} />
            <button type="button" className="eng-btn" disabled={!parseTags(bulkTags).length} onClick={() => bulk({ addTags: parseTags(bulkTags) })}>เพิ่มแท็ก</button>
            <button type="button" className="eng-btn" disabled={!parseTags(bulkTags).length} onClick={() => bulk({ removeTags: parseTags(bulkTags) })}>ลบแท็ก</button>
          </div>
        )}
        {shown.total === 0 ? (
          <p className="eng-empty">{assets.length ? "ไม่มีภาพตรงกับตัวกรอง" : "คลังภาพยังว่าง — public/assets/manifest.json ยังไม่มีรายการ"}</p>
        ) : (
          <ul className="eng-grid" data-testid="asset-grid">
            {shown.items.map((asset) => (
              <Thumb key={asset.id} asset={asset} active={asset.id === selectedId} checked={checked.has(asset.id)} edited={!!edits[asset.id]}
                onSelect={setSelectedId} onToggle={toggle} />
            ))}
          </ul>
        )}
      </div>

      <aside className="eng-detailcol" aria-label="รายละเอียดภาพ">
        {selected
          ? <AssetDetail key={selected.id} asset={selected} edited={!!edits[selected.id]} onChange={(change) => editAsset(selected.id, change)}
              onRevert={() => setEdits((current) => { const next = { ...current }; delete next[selected.id]; return next; })} />
          : <p className="eng-empty">เลือกภาพเพื่อดูรายละเอียด</p>}
      </aside>
    </div>
  );
}

const Thumb = memo(function Thumb({ asset, active, checked, edited, onSelect, onToggle }: {
  asset: AssetEntry; active: boolean; checked: boolean; edited: boolean;
  onSelect: (id: string) => void; onToggle: (id: string) => void;
}) {
  return (
    <li className="eng-thumb" data-asset-id={asset.id} data-status={asset.status} aria-current={active || undefined}>
      <button type="button" className="eng-thumb-btn" title={`${asset.name} (${asset.id})`}
        onClick={(e) => (e.shiftKey || e.ctrlKey || e.metaKey ? onToggle(asset.id) : onSelect(asset.id))}>
        <span className="eng-checker eng-thumb-img">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset.image} alt="" loading="lazy" decoding="async" />
        </span>
        <span className="eng-thumb-name">{asset.name}</span>
      </button>
      <input type="checkbox" className="eng-thumb-check" aria-label={`เลือก ${asset.name}`} checked={checked} onChange={() => onToggle(asset.id)} />
      <span className={`eng-status eng-status-${asset.status}`}>{STATUS_LABEL[asset.status]}</span>
      {edited && <span className="eng-edited" title="แก้ไขแล้ว ยังไม่บันทึก">●</span>}
    </li>
  );
});
