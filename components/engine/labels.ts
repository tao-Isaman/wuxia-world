import type { AssetCategory, AssetRegion, AssetStatus } from "@/lib/assets/types";

// Thai labels for the asset library.
export const CATEGORY_LABEL: Record<AssetCategory, string> = {
  building: "สิ่งปลูกสร้าง", prop: "ของประกอบฉาก", sect: "ของสำนัก", nature: "ธรรมชาติ", tile: "พื้น",
  icon: "ไอคอน", character: "ตัวละคร", monster: "สัตว์และปีศาจ", fx: "เอฟเฟกต์", ui: "หน้าจอ", kit: "ถนน/กำแพง",
};
export const REGION_LABEL: Record<AssetRegion, string> = {
  heartland: "ภาคกลาง", east: "ภาคตะวันออก", south: "ภาคใต้", north: "ภาคเหนือ", west: "ภาคตะวันตก", any: "ทุกภาค",
};
export const STATUS_LABEL: Record<AssetStatus, string> = { draft: "ร่าง", approved: "อนุมัติ", rejected: "ปฏิเสธ" };
