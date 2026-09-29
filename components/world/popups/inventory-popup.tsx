"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { SLOT_LABELS, getEquip } from "@/lib/game";
import type { EquipSlotType, Equipment } from "@/lib/game";
import { ITEM_CATEGORIES, ITEM_CATEGORY_LABEL, LIFE_SKILL_LABEL, getItem, type ItemCategory } from "@/lib/world";
import { useWorldStore } from "@/store/world-store";
import { toast } from "@/store/toast-store";
import { ItemEffects } from "@/components/world/item-effects";
import { CATEGORY_GLYPH, ItemTile } from "@/components/ui/wuxia/item-tile";
import { equipRarity, itemRarity, rarityColor } from "@/lib/ui/rarity";

interface Props {
  open: boolean;
  onClose: () => void;
}

// Equipment slots are listed in a fixed order so the layout stays predictable.
// Multi-slot types (BR, R, C) are split out so each slot is independent.
type SlotRow = {
  label: string;
  type: EquipSlotType;
  index?: 0 | 1; // for BR/R/C
};

const SLOT_ROWS: readonly SlotRow[] = [
  { label: SLOT_LABELS.W, type: "W" },
  { label: SLOT_LABELS.A, type: "A" },
  { label: SLOT_LABELS.H, type: "H" },
  { label: SLOT_LABELS.B, type: "B" },
  { label: `${SLOT_LABELS.BR} 1`, type: "BR", index: 0 },
  { label: `${SLOT_LABELS.BR} 2`, type: "BR", index: 1 },
  { label: `${SLOT_LABELS.R} 1`, type: "R", index: 0 },
  { label: `${SLOT_LABELS.R} 2`, type: "R", index: 1 },
  { label: `${SLOT_LABELS.C} 1`, type: "C", index: 0 },
  { label: `${SLOT_LABELS.C} 2`, type: "C", index: 1 },
];

type Filter = "all" | "gear" | ItemCategory;
type Selection = { kind: "item"; id: string } | { kind: "bagEquip"; id: string } | { kind: "slot"; row: SlotRow };

function equipStats(eq: Equipment): string[] {
  const out: string[] = [];
  const add = (label: string, value: number | undefined) => { if (value) out.push(`${label} +${value}`); };
  add("ATK", eq.atkb); add("PA", eq.pab); add("IA", eq.iab); add("PD", eq.pdb); add("ID", eq.idb);
  add("HP", eq.hpb); add("MP", eq.mpb); add("SPD", eq.spdb); add("Eva", eq.evab); add("Acc", eq.accb);
  add("Cri", eq.crib); add("Res", eq.resb);
  return out;
}

// Hero's Adventure-style bag: worn equipment on the left, an item grid framed
// in rarity colours in the middle, and the selected entry's details + actions
// on the right. Equipment lookups go through getEquip(); bag items use the
// world item table.
export function InventoryPopup({ open, onClose }: Props) {
  const player = useWorldStore((s) => s.playerBuild);
  const inventory = useWorldStore((s) => s.inventory);
  const inventoryEquipment = useWorldStore((s) => s.inventoryEquipment);
  const gold = useWorldStore((s) => s.gold);
  const consumeItem = useWorldStore((s) => s.useItem);
  const equipFromBag = useWorldStore((s) => s.equipFromBag);
  const unequipFromSlot = useWorldStore((s) => s.unequipFromSlot);
  const [lastUsed, setLastUsed] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [selection, setSelection] = useState<Selection | null>(null);
  if (!player) return null;

  const items = Object.entries(inventory).filter(([, n]) => n > 0);
  const bagEquipment = Object.entries(inventoryEquipment).filter(([, n]) => n > 0);
  const equipped = (row: SlotRow) => {
    const slot = player.equipment[row.type];
    const id = Array.isArray(slot) ? slot[row.index ?? 0] : slot;
    return getEquip(id);
  };
  const categories = ITEM_CATEGORIES.filter((c) => items.some(([id]) => (getItem(id)?.category ?? "misc") === c));
  const shownItems = filter === "gear" ? [] : items.filter(([id]) => filter === "all" || (getItem(id)?.category ?? "misc") === filter);
  const shownGear = filter === "all" || filter === "gear" ? bagEquipment : [];

  const use = (id: string) => {
    const r = consumeItem(id);
    if (!r.ok) {
      if (r.reason === "full") setLastUsed("HP / MP เต็มแล้ว ไม่ต้องใช้");
      else if (r.reason === "stat-too-low") setLastUsed(`ฝีมือยังไม่ถึงขั้น · ต้องการ ${r.stat} ${r.needed} (ปัจจุบัน ${r.current})`);
      else if (r.reason === "already-learned") setLastUsed("เรียนวิชานี้แล้ว ไม่ต้องอ่านอีก");
      else setLastUsed("ใช้ไม่ได้");
      return;
    }
    if (r.kind === "trainSkill") setLastUsed(`ฝึก ${LIFE_SKILL_LABEL[r.skill]} · +${r.xpGained} xp`);
    else if (r.kind === "heal") {
      const parts: string[] = [];
      if (r.hpHealed > 0) parts.push(`HP +${r.hpHealed}`);
      if (r.mpHealed > 0) parts.push(`MP +${r.mpHealed}`);
      setLastUsed(parts.length > 0 ? `ฟื้นพลัง: ${parts.join(" · ")}` : "ไม่มีพลังให้ฟื้น");
    } else if (r.kind === "manualLearnSkill") setLastUsed("เรียนวิชาฝีมือสำเร็จ · พร้อมใช้ทันที");
    else if (r.kind === "manualLearnArt") setLastUsed(`เรียนวิชาในกายสำเร็จ · เริ่มที่ระดับ ${r.level}`);
  };
  const equip = (id: string, eq: Equipment) => {
    const r = equipFromBag(id);
    if (!r.ok) { toast("error", r.reason === "missing" ? "ไม่มีอุปกรณ์นี้ในย่าม" : "ติดตั้งไม่สำเร็จ"); return; }
    const swappedDef = r.swapped ? getEquip(r.swapped) : null;
    toast("success", r.swapped ? `ติดตั้ง ${eq.n} (เก็บ ${swappedDef?.n ?? r.swapped} กลับย่าม)` : `ติดตั้ง ${eq.n}`);
    setSelection(null);
  };
  const unequip = (row: SlotRow, eq: Equipment) => {
    const r = unequipFromSlot(row.type, (row.index ?? 0) as 0 | 1);
    if (!r.ok) { toast("error", "ถอดอุปกรณ์ไม่สำเร็จ"); return; }
    toast("info", `ถอด ${eq.n} เก็บลงย่าม`);
    setSelection(null);
  };

  const isSelected = (candidate: Selection) => !!selection && selection.kind === candidate.kind &&
    (candidate.kind === "slot"
      ? selection.kind === "slot" && selection.row.type === candidate.row.type && selection.row.index === candidate.row.index
      : selection.kind !== "slot" && selection.id === candidate.id);

  return (
    <Modal open={open} onClose={onClose} title="🎒 ของในย่ามและเครื่องประดับ">
      <div className="bag-layout">
        <section className="bag-gear" aria-label="อุปกรณ์สวมใส่">
          <h3 className="bag-heading">อุปกรณ์สวมใส่</h3>
          <div className="bag-gear-grid">
            {SLOT_ROWS.map((row) => {
              const eq = equipped(row);
              const key = `${row.type}-${row.index ?? "x"}`;
              return <div key={key} className="bag-gear-slot">
                <ItemTile glyph={CATEGORY_GLYPH[row.type]} rarity={eq ? equipRarity(eq) : 0} dim={!eq}
                  label={eq ? `${row.label}: ${eq.n}` : `${row.label}: ว่าง`}
                  selected={isSelected({ kind: "slot", row })}
                  onClick={() => setSelection({ kind: "slot", row })} />
                <span className="bag-gear-label">{eq ? eq.n : row.label}</span>
              </div>;
            })}
          </div>
        </section>

        <section className="bag-items" aria-label="ของในย่าม">
          <div className="bag-toolbar">
            <div className="bag-filters" role="tablist" aria-label="หมวดของ">
              {(["all", ...(bagEquipment.length ? ["gear" as const] : []), ...categories] as Filter[]).map((f) => (
                <button key={f} type="button" role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}>
                  {f === "all" ? "ทั้งหมด" : f === "gear" ? "อุปกรณ์" : ITEM_CATEGORY_LABEL[f]}
                </button>
              ))}
            </div>
            <span className="bag-gold"><i className="hud-coin" aria-hidden="true" /> ทอง <strong>{gold.toLocaleString()}</strong></span>
          </div>
          {lastUsed && <p className="bag-notice" role="status">{lastUsed}</p>}
          {shownItems.length + shownGear.length === 0 ? (
            <p className="bag-empty">{items.length + bagEquipment.length === 0 ? "ย่ามว่างเปล่า" : "ไม่มีของในหมวดนี้"}</p>
          ) : (
            <div className="bag-grid">
              {shownGear.map(([id, n]) => {
                const eq = getEquip(id);
                if (!eq) return null;
                return <ItemTile key={`eq-${id}`} glyph={CATEGORY_GLYPH[eq.ty]} rarity={equipRarity(eq)} count={n}
                  label={`${eq.n} ×${n}`} selected={isSelected({ kind: "bagEquip", id })}
                  onClick={() => setSelection({ kind: "bagEquip", id })} />;
              })}
              {shownItems.map(([id, n]) => {
                const def = getItem(id);
                return <ItemTile key={id} glyph={CATEGORY_GLYPH[def?.category ?? "misc"]} rarity={itemRarity(def?.price)}
                  count={n} label={`${def?.name ?? id} ×${n}`} selected={isSelected({ kind: "item", id })}
                  onClick={() => setSelection({ kind: "item", id })} />;
              })}
            </div>
          )}
        </section>

        <aside className="bag-detail" aria-live="polite">
          <BagDetail selection={selection} inventory={inventory} inventoryEquipment={inventoryEquipment}
            equipped={equipped} onUse={use} onEquip={equip} onUnequip={unequip} />
        </aside>
      </div>
    </Modal>
  );
}

function BagDetail({ selection, inventory, inventoryEquipment, equipped, onUse, onEquip, onUnequip }: {
  selection: Selection | null;
  inventory: Record<string, number>;
  inventoryEquipment: Record<string, number>;
  equipped: (row: SlotRow) => Equipment | null | undefined;
  onUse: (id: string) => void;
  onEquip: (id: string, eq: Equipment) => void;
  onUnequip: (row: SlotRow, eq: Equipment) => void;
}) {
  if (!selection) return <p className="bag-detail-hint">เลือกของเพื่อดูรายละเอียด</p>;
  if (selection.kind === "item") {
    const n = inventory[selection.id] ?? 0;
    if (n <= 0) return <p className="bag-detail-hint">ใช้หมดแล้ว</p>;
    const def = getItem(selection.id);
    const rarity = itemRarity(def?.price);
    return <>
      <h3 className="bag-detail-name" style={{ color: rarityColor(rarity) }}>{def?.name ?? selection.id}</h3>
      <p className="bag-detail-meta">{ITEM_CATEGORY_LABEL[def?.category ?? "misc"]} · มี {n} ชิ้น{def?.price ? ` · ราคา ${def.price}` : ""}</p>
      {def?.description && <p className="bag-detail-text">{def.description}</p>}
      <div className="bag-detail-effects"><ItemEffects effect={def?.use} /></div>
      {def?.use && <button type="button" className="pixel-action bag-detail-action" onClick={() => onUse(selection.id)}>ใช้</button>}
    </>;
  }
  if (selection.kind === "bagEquip") {
    const n = inventoryEquipment[selection.id] ?? 0;
    const eq = getEquip(selection.id);
    if (!eq || n <= 0) return <p className="bag-detail-hint">ไม่มีอุปกรณ์นี้ในย่ามแล้ว</p>;
    return <>
      <h3 className="bag-detail-name" style={{ color: rarityColor(equipRarity(eq)) }}>{eq.n}</h3>
      <p className="bag-detail-meta">{SLOT_LABELS[eq.ty]} · มี {n} ชิ้น</p>
      <ul className="bag-detail-stats">{equipStats(eq).map((stat) => <li key={stat}>{stat}</li>)}</ul>
      <button type="button" className="pixel-action bag-detail-action" onClick={() => onEquip(selection.id, eq)}>ติดตั้ง</button>
    </>;
  }
  const eq = equipped(selection.row);
  if (!eq) return <>
    <h3 className="bag-detail-name">{selection.row.label}</h3>
    <p className="bag-detail-hint">ช่องว่าง — เลือกอุปกรณ์ในย่ามแล้วกดติดตั้ง</p>
  </>;
  return <>
    <h3 className="bag-detail-name" style={{ color: rarityColor(equipRarity(eq)) }}>{eq.n}</h3>
    <p className="bag-detail-meta">สวมอยู่ · {selection.row.label}</p>
    <ul className="bag-detail-stats">{equipStats(eq).map((stat) => <li key={stat}>{stat}</li>)}</ul>
    <button type="button" className="bag-detail-action bag-detail-secondary" onClick={() => onUnequip(selection.row, eq)}>ถอด</button>
  </>;
}
