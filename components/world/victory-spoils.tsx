"use client";

import { useMemo, useState } from "react";
import { getArt, getSkill } from "@/lib/game";
import { ITEM_CATEGORY_LABEL, getItem } from "@/lib/world";
import { GOLD_ICON_URL, equipmentIconUrl, itemIconUrl } from "@/lib/world/data/item-icons";
import { EQUIPMENT_BY_ID } from "@/lib/game/data/equipment";
import { itemRarity, rarityColor } from "@/lib/ui/rarity";
import { CATEGORY_GLYPH, ItemTile } from "@/components/ui/wuxia/item-tile";
import { ArtIcon, SkillIcon } from "@/components/game/skill-icon";
import { ItemEffects } from "@/components/world/item-effects";
import { useWorldStore } from "@/store/world-store";

type Picked =
  | { kind: "gold"; amount: number }
  | { kind: "wexp"; amount: number }
  | { kind: "item"; itemId: string; count: number }
  | { kind: "gear"; id: string }
  | { kind: "move"; id: string; move: "skill" | "art"; xp: number };

/**
 * The spoils of a won world fight (worldStore.victorySpoils), on the result
 * panel: gold, w-exp, the items that dropped and the xp each move earned, as
 * icons. Tap one to read it. acknowledgeBattleResult hands over exactly these.
 */
export function VictorySpoils() {
  const spoilsOf = useWorldStore((s) => s.victorySpoils);
  const pendingBattle = useWorldStore((s) => s.pendingBattle);
  // Rolled once per battle (the store caches it), read again only when the battle changes.
  const spoils = useMemo(() => spoilsOf(), [spoilsOf, pendingBattle]);
  const [picked, setPicked] = useState<Picked | null>(null);
  if (!spoils) return null;
  const items = [...spoils.items, ...(spoils.hunt?.items ?? [])];

  return (
    <div className="gb-spoils" data-testid="victory-spoils" aria-label="ของที่ได้รับ">
      <div className="gb-spoils-row" role="list">
        {spoils.gold > 0 && <span role="listitem" className="gb-spoil">
          <ItemTile glyph="金" icon={GOLD_ICON_URL} rarity={2} label={`${spoils.gold} ตำลึง`} selected={picked?.kind === "gold"}
            onClick={() => setPicked({ kind: "gold", amount: spoils.gold })} />
          <em>+{spoils.gold}</em>
        </span>}
        <span role="listitem" className="gb-spoil">
          <ItemTile glyph="悟" rarity={3} label={`w-exp ${spoils.wExp}`} selected={picked?.kind === "wexp"}
            onClick={() => setPicked({ kind: "wexp", amount: spoils.wExp })} />
          <em>+{spoils.wExp}</em>
        </span>
        {items.map((it) => {
          const def = getItem(it.itemId);
          return <span role="listitem" className="gb-spoil" key={it.itemId}>
            <ItemTile glyph={CATEGORY_GLYPH[def?.category ?? "misc"]} icon={itemIconUrl(it.itemId)} rarity={itemRarity(def?.price)}
              count={it.count} label={`${def?.name ?? it.itemId} ×${it.count}`}
              selected={picked?.kind === "item" && picked.itemId === it.itemId}
              onClick={() => setPicked({ kind: "item", itemId: it.itemId, count: it.count })} />
            <em>×{it.count}</em>
          </span>;
        })}
        {(spoils.gear ?? []).map((id) => {
          const gear = EQUIPMENT_BY_ID.get(id);
          return <span role="listitem" className="gb-spoil" key={`gear:${id}`}>
            <ItemTile glyph="甲" icon={equipmentIconUrl(id)} rarity={5} label={gear?.n ?? id}
              selected={picked?.kind === "gear" && picked.id === id} onClick={() => setPicked({ kind: "gear", id })} />
            <em>×1</em>
          </span>;
        })}
        {spoils.moves.map((m) => {
          const skill = m.kind === "skill" ? getSkill(m.id) : undefined;
          const art = m.kind === "art" ? getArt(m.id) : undefined;
          const name = skill?.n ?? art?.n ?? m.id;
          return <span role="listitem" className="gb-spoil" key={`${m.kind}:${m.id}`}>
            <button type="button" className="gb-spoil-move" aria-label={`${name} +${m.xp} xp`} title={`${name} +${m.xp} xp`}
              aria-pressed={picked?.kind === "move" && picked.id === m.id}
              onClick={() => setPicked({ kind: "move", id: m.id, move: m.kind, xp: m.xp })}>
              {skill ? <SkillIcon skill={skill} size={34} /> : art ? <ArtIcon art={art} size={34} /> : null}
            </button>
            <em>+{m.xp}</em>
          </span>;
        })}
      </div>
      {picked && <SpoilDetail picked={picked} onClose={() => setPicked(null)} />}
    </div>
  );
}

function SpoilDetail({ picked, onClose }: { picked: Picked; onClose: () => void }) {
  let title: string, meta: string, body: React.ReactNode = null, color: string | undefined;
  if (picked.kind === "gold") {
    title = `${picked.amount} ตำลึง`; meta = "เงิน"; body = <p>เงินที่ติดตัวศัตรูมา เก็บเข้ากระเป๋าแล้ว</p>;
  } else if (picked.kind === "wexp") {
    title = `w-exp +${picked.amount}`; meta = "ประสบการณ์ยุทธ์";
    body = <p>ใช้เร่งเลเวลวิชาและกำลังภายในได้ในหน้า วิชา</p>;
  } else if (picked.kind === "item") {
    const def = getItem(picked.itemId);
    color = rarityColor(itemRarity(def?.price));
    title = `${def?.name ?? picked.itemId} ×${picked.count}`;
    meta = `${ITEM_CATEGORY_LABEL[def?.category ?? "misc"]}${def?.price ? ` · ราคา ${def.price}` : ""}`;
    body = <>{def?.description && <p>{def.description}</p>}<div className="gb-spoil-effects"><ItemEffects effect={def?.use} battle={def?.battle} /></div></>;
  } else if (picked.kind === "gear") {
    title = EQUIPMENT_BY_ID.get(picked.id)?.n ?? picked.id; meta = "อุปกรณ์"; color = rarityColor(5);
    body = <p>อุปกรณ์ชั้นยอดจากสัตว์ในตำนาน เก็บเข้าถุงอุปกรณ์แล้ว</p>;
  } else {
    const skill = picked.move === "skill" ? getSkill(picked.id) : undefined;
    const art = picked.move === "art" ? getArt(picked.id) : undefined;
    title = `${skill?.n ?? art?.n ?? picked.id} +${picked.xp} xp`;
    meta = picked.move === "skill" ? "กระบวนท่า" : "กำลังภายใน";
    body = <p>{skill?.d ?? art?.d ?? ""}</p>;
  }
  return (
    <div className="gb-spoil-detail" role="dialog" aria-label="รายละเอียดรางวัล" data-testid="victory-spoil-detail">
      <button type="button" className="gb-spoil-close" aria-label="ปิด" onClick={onClose}>✕</button>
      <strong style={color ? { color } : undefined}>{title}</strong>
      <small>{meta}</small>
      {body}
    </div>
  );
}
