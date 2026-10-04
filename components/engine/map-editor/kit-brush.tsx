"use client";
/* eslint-disable @next/next/no-img-element -- thumbnails of arbitrary public asset URLs */
import { useMemo, useState } from "react";
import type { AssetEntry, KitInfo } from "@/lib/assets/types";
import type { KitSet } from "@/lib/assets/kits";
import { REGION_LABELS } from "./asset-palette";
import styles from "./map-editor.module.css";

const KIND_LABELS: Record<KitInfo["kind"] | "city" | "house", string> = {
  road: "ถนน", wall: "กำแพง", fence: "รั้ว", city: "กำแพงเมือง", house: "กำแพงบ้าน",
};
/** Which tab a set belongs to: roads, city walls, house walls (fences go with them). */
const tabOf = (set: KitSet) => set.kind === "road" ? "road" : set.set.includes("_wall_city_") ? "city" : "house";
const TABS = ["road", "city", "house"] as const;

/**
 * The kit brush (ชิ้นต่อกัน): pick a road / wall set, then paint cells on the
 * map — every piece joins its neighbours by itself (lib/assets/kits.ts). Erase
 * takes pieces out and the rest re-join. A set's gates are placed by hand and
 * snap to its grid.
 */
export function KitBrush({ sets, active, erase, onPick, onErase, onArmSpecial }: {
  sets: ReadonlyMap<string, KitSet>;
  active: KitSet | null;
  erase: boolean;
  onPick: (set: KitSet | null) => void;
  onErase: (erase: boolean) => void;
  onArmSpecial: (asset: AssetEntry) => void;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("road");
  const list = useMemo(() => [...sets.values()].filter((s) => tabOf(s) === tab)
    .sort((a, b) => a.cover.region.localeCompare(b.cover.region) || a.set.localeCompare(b.set)), [sets, tab]);
  return (
    <section className={`${styles.panel} ${styles.kitPanel}`} aria-label="ชิ้นต่อกัน" data-testid="kit-brush">
      <div className={styles.panelTitle}>
        <span>ชิ้นต่อกัน (ถนน · กำแพง)</span>
        <small>{sets.size} ชุด</small>
      </div>
      <div className={styles.kitTabs} role="tablist">
        {TABS.map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setTab(t)}>{KIND_LABELS[t]}</button>
        ))}
      </div>
      <div className={styles.kitSets}>
        {!list.length && <p className={styles.empty}>ยังไม่มีชุดในคลัง</p>}
        {list.map((set) => {
          const name = set.cover.name.split(" · ")[0];
          return (
            <button key={set.set} type="button" className={styles.kitSet} aria-pressed={active?.set === set.set} data-kit-set={set.set}
              title={`${name} · ${REGION_LABELS[set.cover.region]} · ช่อง ${set.cell}`} onClick={() => onPick(active?.set === set.set ? null : set)}>
              <img src={set.cover.image} alt="" draggable={false} />
              <span>{name}<small>{REGION_LABELS[set.cover.region]}</small></span>
            </button>
          );
        })}
      </div>
      {active && (
        <div className={styles.kitTools}>
          <span className={styles.toolbarGroup}>
            <button type="button" aria-pressed={!erase} onClick={() => onErase(false)}>✎ วาด</button>
            <button type="button" aria-pressed={erase} onClick={() => onErase(true)}>⌫ ลบ</button>
          </span>
          {active.specials.map((special) => (
            <button key={special.id} type="button" data-asset-id={special.id} onClick={() => onArmSpecial(special)}
              title="คลิกแล้วคลิกบนแผนที่ — สแนปเข้ากริดของชุด">
              ＋ {special.name.split(" · ")[1] ?? special.name}
            </button>
          ))}
          <small className={styles.kitHint}>ลากเพื่อวาดเป็นแนว · Shift+ลาก ลบ · ชิ้นจะต่อกันเอง</small>
        </div>
      )}
    </section>
  );
}
