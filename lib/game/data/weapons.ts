import type { WeaponFamily } from "../types";

// UI display names for the seven weapon-mastery families.
// Keep these in sync with WEAPON_FAMILY_KEYS in types.ts.
export const WEAPON_FAMILY_LABEL: Record<WeaponFamily, string> = {
  fist:   "หมัด/ฝ่ามือ",
  long:   "อาวุธยาว",
  sword:  "กระบี่",
  blade:  "ดาบ",
  short:  "อาวุธสั้น",
  hidden: "อาวุธลับ",
  music:  "เครื่องดนตรี",
};

// Long-form description listing what's included in each family — useful for
// tooltips, the skill library, and the profile popup so the player knows
// which physical weapons feed each mastery bucket.
export const WEAPON_FAMILY_HINT: Record<WeaponFamily, string> = {
  fist:   "กำปั้น · นิ้วมือ · ฝ่ามือ · ตัวเบา",
  long:   "ทวน · หอก · ไม้พลอง · กระบอง",
  sword:  "กระบี่",
  blade:  "ดาบ · ดาบโค้ง · ดาบยาว",
  short:  "มีด · พัด",
  hidden: "เข็ม · มีดบิน · โซ่ · ตะขอ · แส้ · อาวุธลับอื่น ๆ",
  music:  "ขลุ่ย · พิณ",
};
