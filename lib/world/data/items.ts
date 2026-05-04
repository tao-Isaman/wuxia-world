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
  {
    id: "jade",
    name: "หยกล้ำค่า",
    description: "หยกเขียวขัดเงาวาว มูลค่าสูงในตลาดบู๊ลิ้ม",
  },
  {
    id: "herb",
    name: "สมุนไพรหายาก",
    description: "ใบไม้สมุนไพรกลิ่นหอม ใช้ทำยาฟื้นพลัง",
  },
  {
    id: "ancient_coin",
    name: "เหรียญโบราณ",
    description: "เหรียญทองคำโบราณ มีอักษรจีนแกะสลัก",
  },
];

export const ITEMS_BY_ID = new Map<string, ItemDef>(ITEMS.map((i) => [i.id, i]));

export function getItem(id: string | null | undefined): ItemDef | null {
  if (!id) return null;
  return ITEMS_BY_ID.get(id) ?? null;
}
