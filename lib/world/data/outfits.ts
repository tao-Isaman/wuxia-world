// Outfits (ชุด, docs/design/appearance.md): every one a recolour of the hero's
// own sheet (lib/characters/outfit-recolor.ts), so each animation wears it at
// no art cost. A tint is a target [hue °, saturation, lightness] for the
// robe (`primary`) and for the light cloth under it (`secondary`).
import type { SectId } from "../types";

export type Hsl = readonly [number, number, number];

export interface OutfitTint {
  primary: Hsl;
  secondary?: Hsl;
}

export type OutfitUnlock =
  | { t: "default" }
  /** Joining the sect (active or resigned; a betrayer loses it). */
  | { t: "sect"; sectId: SectId }
  /** Found, never sold: its bundled item (a quest reward, a foe's drop or a
   *  tailor's craft — data/outfit-sources.ts) puts it in the wardrobe for good. */
  | { t: "item" }
  /** Winning the sword tournament once. */
  | { t: "champion" };

export interface OutfitDef {
  id: string;
  name: string;
  description: string;
  /** Null: the hero's sheet as drawn. */
  tint: OutfitTint | null;
  unlock: OutfitUnlock;
}

export const DEFAULT_OUTFIT = "default";

const sect = (id: string, sectId: SectId, name: string, description: string, primary: Hsl, secondary: Hsl): OutfitDef =>
  ({ id, name, description, tint: { primary, secondary }, unlock: { t: "sect", sectId } });
// The ids keep their old tailor_ prefix: saves hold them in `wardrobe`.
const found = (id: string, name: string, description: string, primary: Hsl, secondary: Hsl): OutfitDef =>
  ({ id, name, description, tint: { primary, secondary }, unlock: { t: "item" } });

export const OUTFITS: readonly OutfitDef[] = [
  { id: DEFAULT_OUTFIT, name: "ชุดเดิม", description: "ชุดเดินทางที่สวมมาตั้งแต่ออกจากบ้าน", tint: null, unlock: { t: "default" } },
  sect("sect_shaolin", "shaolin", "จีวรเส้าหลิน", "จีวรสีเหลืองหม่นของศิษย์วัดเส้าหลิน", [32, 0.75, 0.45], [45, 0.55, 0.7]),
  sect("sect_wudang", "wudang", "ชุดนักพรตอู่ตัง", "ชุดเต๋าสีเทาขาวแห่งเขาอู่ตัง", [212, 0.12, 0.62], [210, 0.05, 0.86]),
  sect("sect_emei", "emei", "ชุดศิษย์ง้อไบ๊", "ชุดสีชมพูหม่นของสำนักง้อไบ๊", [320, 0.25, 0.62], [320, 0.1, 0.84]),
  sect("sect_huashan", "huashan", "ชุดศิษย์หัวซาน", "ชุดสีม่วงแห่งยอดเขาหัวซาน", [275, 0.35, 0.4], [275, 0.08, 0.8]),
  sect("sect_songshan", "songshan", "ชุดศิษย์ซงซาน", "ชุดสีเทาศิลาของสำนักซงซาน", [205, 0.1, 0.32], [205, 0.05, 0.72]),
  sect("sect_taishan", "taishan", "ชุดศิษย์ไท่ซาน", "ชุดสีดินแห่งเขาไท่ซาน", [22, 0.4, 0.32], [35, 0.25, 0.76]),
  sect("sect_hengshan_south", "hengshan_south", "ชุดศิษย์เฮิงซาน", "ชุดสีเขียวน้ำทะเลของเฮิงซานใต้", [180, 0.35, 0.38], [180, 0.1, 0.8]),
  sect("sect_hengshan_north", "hengshan_north", "ชุดศิษย์เหิงซาน", "ชุดสีเทาม่วงของสำนักนางชีเหิงซานเหนือ", [250, 0.12, 0.45], [250, 0.05, 0.82]),
  sect("sect_quanzhen", "quanzhen", "ชุดนักพรตฉวนเจิน", "ชุดเต๋าสีครามเข้มของสำนักฉวนเจิน", [225, 0.45, 0.3], [215, 0.08, 0.88]),
  sect("sect_gumu", "gumu", "ชุดหยกเหมันต์", "ชุดขาวเย็นดุจหยกของสำนักกู่มู่", [190, 0.06, 0.82], [190, 0.04, 0.93]),
  sect("sect_beggars", "beggars", "ชุดปะชุนพรรคยาจก", "เสื้อผ้าสีน้ำตาลปะชุนของพรรคยาจก", [28, 0.3, 0.32], [40, 0.2, 0.55]),
  sect("sect_jinyiwei", "jinyiwei", "ชุดปลาบินองครักษ์", "ชุดแดงขลิบทองขององครักษ์เสื้อแพร", [355, 0.7, 0.38], [45, 0.65, 0.62]),
  sect("sect_sunmoon", "sunmoon", "ชุดดำตะวันจันทรา", "ชุดดำขลิบแดงของพรรคตะวันจันทรา", [0, 0, 0.18], [0, 0.75, 0.45]),
  sect("sect_tang", "tang", "ชุดสกุลถัง", "ชุดสีเขียวเข้มของสำนักสกุลถัง", [150, 0.45, 0.28], [150, 0.1, 0.75]),
  sect("sect_xiaoyao", "xiaoyao", "ชุดสราญรมย์", "ชุดสีฟ้าเมฆของพรรคสราญรมย์", [195, 0.45, 0.65], [55, 0.35, 0.86]),
  found("tailor_indigo", "ชุดคราม", "ผ้าย้อมครามเนื้อหนา ทนทานสำหรับเดินทาง", [232, 0.55, 0.32], [230, 0.1, 0.82]),
  found("tailor_mourning", "ชุดขาวไว้ทุกข์", "ชุดผ้าขาวเรียบ ไร้ลวดลาย", [40, 0.04, 0.86], [40, 0.02, 0.94]),
  found("tailor_ink", "ชุดหมึกดำ", "ชุดดำสนิทดุจหมึก เหมาะแก่การเดินยามราตรี", [220, 0.05, 0.16], [220, 0.04, 0.6]),
  found("tailor_silk_red", "ชุดผ้าไหมแดง", "ผ้าไหมแดงสดเนื้อดี", [358, 0.62, 0.45], [10, 0.25, 0.85]),
  found("tailor_jade", "ชุดเขียวหยก", "ผ้าไหมสีหยกขลิบขาว", [160, 0.4, 0.45], [150, 0.1, 0.86]),
  found("tailor_noble_gold", "ชุดขุนนางทอง", "ผ้าไหมปักทองแบบที่ขุนนางในเมืองหลวงสวม", [44, 0.7, 0.48], [355, 0.55, 0.45]),
  { id: "champion_gold", name: "ชุดยอดฝีมือ", description: "ชุดขาวทองของผู้ชนะชุมนุมประลองกระบี่หัวซาน", tint: { primary: [48, 0.8, 0.55], secondary: [45, 0.2, 0.92] }, unlock: { t: "champion" } },
];

const BY_ID = new Map(OUTFITS.map((outfit) => [outfit.id, outfit]));

export function getOutfit(id: string | null | undefined): OutfitDef | null {
  return (id && BY_ID.get(id)) || null;
}
