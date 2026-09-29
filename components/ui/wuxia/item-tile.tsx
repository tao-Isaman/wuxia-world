"use client";

import type { ReactNode } from "react";
import { RARITY_COLORS } from "@/lib/ui/rarity";

/**
 * Hero's Adventure-style item slot: a square framed in its rarity colour
 * with an ink glyph for the category and a count in the corner. The whole
 * tile is a button when `onClick` is given.
 */
export const CATEGORY_GLYPH: Record<string, string> = {
  material: "材", herb: "草", venom: "毒", potion: "藥", food: "食", book: "書", manual: "譜",
  craft: "工", valuable: "寶", quest: "令", misc: "雜",
  W: "兵", A: "衣", H: "冠", B: "靴", BR: "腕", R: "戒", C: "飾",
};

export function ItemTile({ glyph, rarity, count, label, selected, dim, onClick, children }: {
  glyph: string; rarity: number; count?: number; label: string;
  selected?: boolean; dim?: boolean; onClick?: () => void; children?: ReactNode;
}) {
  const color = RARITY_COLORS[Math.max(0, Math.min(RARITY_COLORS.length - 1, rarity))];
  const body = <>
    <span className="item-tile-glyph" style={{ color }} aria-hidden="true">{glyph}</span>
    {typeof count === "number" && count > 1 && <span className="item-tile-count">{count}</span>}
    {children}
  </>;
  const className = `item-tile${selected ? " item-tile--selected" : ""}${dim ? " item-tile--dim" : ""}`;
  const style = { "--rarity": color } as React.CSSProperties;
  return onClick
    ? <button type="button" className={className} style={style} onClick={onClick} aria-pressed={selected} aria-label={label} title={label}>{body}</button>
    : <span className={className} style={style} role="img" aria-label={label} title={label}>{body}</span>;
}
