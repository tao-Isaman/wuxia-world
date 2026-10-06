"use client";

import { useState } from "react";
import { itemTargetCells, sameCell, throwDamage, type GridBattleState, type GridUnit } from "@/lib/game/grid";
import { getItem } from "@/lib/world";
import { itemIconUrl } from "@/lib/world/data/item-icons";
import { itemRarity } from "@/lib/ui/rarity";
import { CATEGORY_GLYPH, ItemTile } from "@/components/ui/wuxia/item-tile";
import { useBattleStore } from "@/store/battle-store";

/**
 * ใช้ของ: the hero's battle items (GridBattleState.bag). A potion is drunk at
 * once; a poison or hidden weapon lists the foes in range to throw at. Either
 * costs the turn; the world takes the used items from the bag afterwards.
 */
export function BattleItemTray({ state, unit, onClose }: { state: GridBattleState; unit: GridUnit; onClose: () => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  const items = Object.entries(state.bag ?? {}).filter(([, n]) => n > 0)
    .map(([id, n]) => ({ id, n, def: getItem(id) }))
    .filter((it) => it.def?.battle);
  const apply = (id: string, target: GridUnit) => {
    const def = getItem(id);
    if (def?.battle && useBattleStore.getState().useItem(id, def.name, def.battle, { ...target.pos })) onClose();
  };
  const pick = (id: string) => {
    const def = getItem(id);
    if (def?.battle?.t === "heal") apply(id, unit);
    else setPicked(picked === id ? null : id);
  };
  const chosen = picked ? getItem(picked) : null;
  const effect = chosen?.battle?.t === "throw" ? chosen.battle : null;
  const cells = effect ? itemTargetCells(state, unit.id, effect) : [];
  const targets = state.units.filter((u) => u.alive && u.team !== unit.team && cells.some((c) => sameCell(c, u.pos)));

  return (
    <div className="gb-items" role="dialog" aria-label="ใช้ของ" data-testid="battle-items">
      <header><strong>ใช้ของ</strong><small>ใช้แล้วจบตา</small>
        <button type="button" className="gb-items-close" aria-label="ปิด" onClick={onClose}>✕</button></header>
      {items.length === 0 ? <p className="gb-items-empty">ไม่มีของที่ใช้ในการต่อสู้ได้ — ยา พิษ และอาวุธลับซื้อได้ที่ร้านปรุงยาและช่างตีเหล็ก</p> : (
        <div className="gb-items-row" role="list">
          {items.map(({ id, n, def }) => (
            <span key={id} role="listitem" className="gb-item">
              <ItemTile glyph={CATEGORY_GLYPH[def?.category ?? "misc"]} icon={itemIconUrl(id)} rarity={itemRarity(def?.price)}
                count={n} label={`${def?.name ?? id} ×${n}`} selected={picked === id} onClick={() => pick(id)} />
              <em>{def?.name}</em>
            </span>
          ))}
        </div>
      )}
      {effect && chosen && (
        <div className="gb-items-targets" aria-label={`เป้าของ ${chosen.name}`}>
          {targets.length === 0
            ? <p className="gb-items-empty">ไม่มีศัตรูในระยะ {effect.range} ช่อง · เดินเข้าใกล้ก่อน</p>
            : targets.map((t) => (
              <button key={t.id} type="button" onClick={() => apply(chosen.id, t)}>
                ขว้างใส่ <b>{t.name}</b> <small>HP {t.hp}/{t.derived.HP} · ≈{throwDamage(unit, t, effect)}{effect.poison ? ` + พิษ ${effect.poison.pct}%×${effect.poison.turns}` : ""}</small>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
