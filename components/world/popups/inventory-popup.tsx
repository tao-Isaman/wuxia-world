"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { SLOT_LABELS, getEquip } from "@/lib/game";
import type { EquipSlotType, Equipment } from "@/lib/game";
import { ITEM_CATEGORIES, ITEM_CATEGORY_LABEL, LIFE_SKILL_LABEL, getItem, type ItemCategory } from "@/lib/world";
import { useWorldStore } from "@/store/world-store";
import { toast } from "@/store/toast-store";
import { ItemEffects } from "@/components/world/item-effects";
import { CATEGORY_GLYPH, ItemTile } from "@/components/ui/wuxia/item-tile";
import { equipmentIconUrl, itemIconUrl } from "@/lib/world/data/item-icons";
import { equipRarity, itemRarity, rarityColor } from "@/lib/ui/rarity";
import { PagedGrid } from "@/components/ui/paged-grid";
import { useShortScreen } from "@/components/ui/use-short-screen";
import { CharacterPreview } from "@/components/game/character-preview";

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

// The bag, in two landscape columns: worn equipment laid out around the hero
// (a paper doll) on the left, and the bag's items on the right — category
// tabs over a paged grid framed in rarity colours. Picking anything opens a
// small window with its details and actions; tapping outside it goes back to
// the bag. Equipment lookups go through getEquip(); bag items use the world
// item table.
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
  const bodyId = useWorldStore((s) => s.playerBodyId);
  const short = useShortScreen();
  useEffect(() => { if (!open) setSelection(null); }, [open]);
  useEffect(() => { setLastUsed(null); }, [selection]);
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
      else if (r.reason === "meridian-locked") setLastUsed(r.message);
      else setLastUsed("ใช้ไม่ได้");
      return;
    }
    let message = "";
    if (r.kind === "trainSkill") message = `ฝึก ${LIFE_SKILL_LABEL[r.skill]} · +${r.xpGained} xp`;
    else if (r.kind === "heal") {
      const parts: string[] = [];
      if (r.hpHealed > 0) parts.push(`HP +${r.hpHealed}`);
      if (r.mpHealed > 0) parts.push(`MP +${r.mpHealed}`);
      message = parts.length > 0 ? `ฟื้นพลัง: ${parts.join(" · ")}` : "ไม่มีพลังให้ฟื้น";
    } else if (r.kind === "manualLearnSkill") message = "เรียนวิชาฝีมือสำเร็จ · พร้อมใช้ทันที";
    else if (r.kind === "manualLearnArt") message = `เรียนวิชาในกายสำเร็จ · เริ่มที่ระดับ ${r.level}`;
    else if (r.kind === "learnMeridian") message = "เรียนรู้แผนภาพชีพจรสำเร็จ · เปิดจุดชีพจรได้ที่เมนูชีพจร";
    // The last one used: back to the bag, the result as a toast.
    if ((useWorldStore.getState().inventory[id] ?? 0) <= 0) {
      if (message) toast("success", message);
      setSelection(null);
    } else setLastUsed(message);
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
  const filters = ["all", ...(bagEquipment.length ? ["gear" as const] : []), ...categories] as Filter[];
  const cells: BagCell[] = [
    ...shownGear.filter(([id]) => getEquip(id)).map(([id, n]): BagCell => ({ kind: "bagEquip", id, n })),
    ...shownItems.map(([id, n]): BagCell => ({ kind: "item", id, n })),
  ];

  return (
    <Modal open={open} onClose={onClose} title="🎒 ของในย่ามและเครื่องประดับ" fill>
      <div className="menu-cols bag-cols">
        {/* ─── Worn gear, laid out around the hero ─────────────────── */}
        <section className="menu-col bag-doll" aria-label="อุปกรณ์สวมใส่">
          <div className="menu-col-head"><span className="menu-col-title">อุปกรณ์สวมใส่</span></div>
          <div className="bag-doll-grid">
            <div className="bag-doll-figure" aria-hidden="true"><CharacterPreview id={bodyId} animate /></div>
            {SLOT_ROWS.map((row) => {
              const eq = equipped(row);
              const key = `${row.type}-${row.index ?? "x"}`;
              return <div key={key} className="bag-doll-slot" style={{ gridArea: DOLL_AREA[key] }} data-slot={key}>
                <ItemTile glyph={CATEGORY_GLYPH[row.type]} icon={equipmentIconUrl(eq?.id)} rarity={eq ? equipRarity(eq) : 0} dim={!eq}
                  label={eq ? `${row.label}: ${eq.n}` : `${row.label}: ว่าง`}
                  selected={isSelected({ kind: "slot", row })}
                  onClick={() => setSelection({ kind: "slot", row })} />
                <span className="bag-gear-label">{eq ? eq.n : row.label}</span>
              </div>;
            })}
          </div>
        </section>

        {/* ─── The bag: category tabs, a paged grid of items ─────────── */}
        <section className="menu-col bag-items" aria-label="ของในย่าม">
          <div className="bag-toolbar">
            <div className="menu-tabs menu-tabs--wrap" role="tablist" aria-label="หมวดของ">
              {filters.map((f) => (
                <button key={f} type="button" role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}>
                  {f === "all" ? "ทั้งหมด" : f === "gear" ? "อุปกรณ์" : ITEM_CATEGORY_LABEL[f]}
                </button>
              ))}
            </div>
            <span className="bag-gold"><i className="hud-coin" aria-hidden="true" /> ทอง <strong>{gold.toLocaleString()}</strong></span>
          </div>
          <PagedGrid items={cells} itemKey={(c) => `${c.kind}:${c.id}`} cellWidth={short ? 58 : 68} cellHeight={short ? 64 : 80} gap={short ? 4 : 6} resetKey={filter}
            label="ช่องของในย่าม"
            empty={<p className="bag-empty">{items.length + bagEquipment.length === 0 ? "ย่ามว่างเปล่า" : "ไม่มีของในหมวดนี้"}</p>}
            render={(c) => {
              if (c.kind === "bagEquip") {
                const eq = getEquip(c.id)!;
                const rarity = equipRarity(eq);
                return <div className="bag-cell">
                  <ItemTile glyph={CATEGORY_GLYPH[eq.ty]} icon={equipmentIconUrl(eq.id)} rarity={rarity} count={c.n}
                    label={`${eq.n} ×${c.n}`} selected={isSelected({ kind: "bagEquip", id: c.id })}
                    onClick={() => setSelection({ kind: "bagEquip", id: c.id })} />
                  <span style={{ color: rarityColor(rarity) }} aria-hidden="true">{eq.n}</span>
                </div>;
              }
              const def = getItem(c.id);
              const rarity = itemRarity(def?.price);
              return <div className="bag-cell">
                <ItemTile glyph={CATEGORY_GLYPH[def?.category ?? "misc"]} icon={itemIconUrl(c.id)} rarity={rarity}
                  count={c.n} label={`${def?.name ?? c.id} ×${c.n}`} selected={isSelected({ kind: "item", id: c.id })}
                  onClick={() => setSelection({ kind: "item", id: c.id })} />
                <span style={{ color: rarityColor(rarity) }} aria-hidden="true">{def?.name ?? c.id}</span>
              </div>;
            }} />
        </section>
      </div>

      {/* ─── The picked thing: a small window over the bag ──────────── */}
      {selection && (
        <div className="bag-popup-backdrop" onClick={() => setSelection(null)} data-testid="bag-popup-backdrop">
          <div className="bag-popup" role="dialog" aria-label="รายละเอียดของ" onClick={(e) => e.stopPropagation()} aria-live="polite">
            <button type="button" className="bag-popup-close" aria-label="กลับไปที่ย่าม" onClick={() => setSelection(null)}>✕</button>
            <BagDetail selection={selection} inventory={inventory} inventoryEquipment={inventoryEquipment}
              equipped={equipped} onUse={use} onEquip={equip} onUnequip={unequip} notice={lastUsed} />
          </div>
        </div>
      )}
    </Modal>
  );
}

type BagCell = { kind: "item" | "bagEquip"; id: string; n: number };

// Paper doll: rings and charms at the corners, the hat on top, arm guards and
// weapon / robe at the sides, boots below the figure.
const DOLL_AREA: Record<string, string> = {
  "R-0": "r1", "H-x": "h", "R-1": "r2",
  "BR-0": "br1", "BR-1": "br2",
  "W-x": "w", "A-x": "a",
  "C-0": "c1", "B-x": "b", "C-1": "c2",
};

function BagDetail({ selection, inventory, inventoryEquipment, equipped, onUse, onEquip, onUnequip, notice }: {
  selection: Selection | null;
  notice: string | null;
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
      {notice && <p className="bag-notice" role="status">{notice}</p>}
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
