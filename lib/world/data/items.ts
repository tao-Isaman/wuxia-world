import type { ItemDef } from "../types";

// Items table. Add new items here.
export const ITEMS: readonly ItemDef[] = [
  {
    id: "potion",
    name: "ยาเลือดเล็ก",
    description: "ยาฟื้นพลังชีวิต ใช้ในยามฉุกเฉิน",
  },
  {
    id: "old_key",
    name: "กุญแจเก่า",
    description: "กุญแจเก่าแก่ ไม่รู้ว่าใช้กับประตูไหน",
  },
];

export const ITEMS_BY_ID = new Map<string, ItemDef>(ITEMS.map((i) => [i.id, i]));

export function getItem(id: string | null | undefined): ItemDef | null {
  if (!id) return null;
  return ITEMS_BY_ID.get(id) ?? null;
}
