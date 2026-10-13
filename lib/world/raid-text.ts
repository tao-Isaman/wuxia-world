// What the player reads when a world boss fight (store/cloud-raid.ts) is
// refused, by the server's code (server/worker/ts/raid-doc.ts RaidError). Pure.

const RAID_ERROR_TEXT: Record<string, string> = {
  party_small: "ต้องมีคณะอย่างน้อย 2 คนจึงจะสู้กับมันได้ — ชวนสหายเข้าคณะก่อน (แท็บ สหาย)",
  party_large: "คณะหนึ่งสู้ได้ไม่เกิน 4 คน",
  not_leader: "หัวหน้าคณะเท่านั้นที่เปิดศึกได้",
  taken: "มีคณะอื่นกำลังต่อสู้กับมันอยู่",
  resting: "มันยังไม่กลับมา",
  not_here: "ต้องยืนอยู่ที่ถ้ำของมันก่อน (ตำแหน่งที่บันทึกล่าสุด)",
  busy: "ติดคุกอยู่ สู้ไม่ได้",
  no_hero: "ยังไม่มีตัวละครที่บันทึกไว้",
  no_fight: "ศึกนี้จบหรือถูกยกเลิกไปแล้ว",
  not_member: "ไม่ได้อยู่ในคณะที่เปิดศึกนี้",
  not_gathering: "ศึกเริ่มไปแล้ว",
  offline: "ติดต่อเซิร์ฟเวอร์ไม่ได้",
};

/** Why a fight with `bossName` could not be opened or joined. */
export function raidErrorText(code: string | null, bossName = "สัตว์ร้าย"): string {
  return (code && RAID_ERROR_TEXT[code]) || `เปิดศึกกับ${bossName}ไม่ได้`;
}
