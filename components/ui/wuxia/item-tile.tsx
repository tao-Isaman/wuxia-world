"use client";
/* eslint-disable @next/next/no-img-element -- 40 px pixel-art icons, no optimisation wanted */

import type { ReactNode } from "react";
import { RARITY_COLORS } from "@/lib/ui/rarity";

/**
 * Hero's Adventure-style item slot: a square framed in its rarity colour
 * with the item's painted icon (lib/world/data/item-icons.ts) — or, without
 * one, an emoji for the category — and a count in the corner. The whole
 * tile is a button when `onClick` is given.
 */
export const CATEGORY_GLYPH: Record<string, string> = {
  material: "🪨", herb: "🌿", venom: "☠", potion: "🧪", food: "🍚", book: "📖", manual: "📜",
  craft: "🔨", valuable: "💎", quest: "📯", misc: "📦",
  W: "🗡", A: "👘", H: "🪖", B: "👟", BR: "💪", R: "💍", C: "🎖",
};

export function ItemTile({ glyph, icon, rarity, count, label, selected, dim, onClick, children }: {
  glyph: string; icon?: string; rarity: number; count?: number; label: string;
  selected?: boolean; dim?: boolean; onClick?: () => void; children?: ReactNode;
}) {
  const color = RARITY_COLORS[Math.max(0, Math.min(RARITY_COLORS.length - 1, rarity))];
  const body = <>
    {icon
      ? <img className="item-tile-icon" src={icon} alt="" draggable={false} aria-hidden="true" />
      : <span className="item-tile-glyph" style={{ color }} aria-hidden="true">{glyph}</span>}
    {typeof count === "number" && count > 1 && <span className="item-tile-count">{count}</span>}
    {children}
  </>;
  const className = `item-tile${selected ? " item-tile--selected" : ""}${dim ? " item-tile--dim" : ""}`;
  const style = { "--rarity": color } as React.CSSProperties;
  return onClick
    ? <button type="button" className={className} style={style} onClick={onClick} aria-pressed={selected} aria-label={label} title={label}>{body}</button>
    : <span className={className} style={style} role="img" aria-label={label} title={label}>{body}</span>;
}
