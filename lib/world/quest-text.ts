// What the player reads about a quest's gates and rewards — always in Thai,
// never an id (test:quests checks every quest). Pure.
import type { QuestReward, QuestStatus } from "./types";
import { TRAIT_LABEL } from "./types";
import { MYSTERY_MOVE_LABEL, getItem, getNpc, getScene } from "./data";
import { getQuest } from "./data/quests";
import { SECT_MEMBERSHIPS } from "./data/sect-memberships";
import { getSkill } from "../game";

const signed = (n: number) => `${n > 0 ? "+" : ""}${n}`;

/** A sect's Thai name. */
export function sectName(sectId: string): string {
  return SECT_MEMBERSHIPS[sectId as keyof typeof SECT_MEMBERSHIPS]?.name ?? "สำนัก";
}

/** A place's Thai name. */
export function placeName(locationId: string): string {
  const scene = getScene(locationId) as { name?: string } | null;
  return scene?.name ?? "สถานที่แห่งหนึ่ง";
}

/** Another quest named for the player: «name» (from whom), and what is wanted of it. */
export function questRefText(questId: string, status: QuestStatus | "none"): string {
  const def = getQuest(questId);
  const giver = def?.giverNpcId ? getNpc(def.giverNpcId)?.name : undefined;
  const name = `«${def?.name ?? "ภารกิจก่อนหน้า"}»${giver ? ` ของ${giver}` : ""}`;
  if (status === "done") return `ทำภารกิจ ${name} ให้สำเร็จก่อน`;
  if (status === "active") return `กำลังทำภารกิจ ${name}`;
  if (status === "failed") return `ภารกิจ ${name} ล้มเหลว`;
  return `ยังไม่เคยรับภารกิจ ${name}`;
}

/** One reward as a short Thai line. */
export function rewardText(r: QuestReward): string | null {
  switch (r.t) {
    case "gold": return `${signed(r.amount)}🟡`;
    case "item": return `${getItem(r.itemId)?.name ?? "ของรางวัล"}×${r.count ?? 1}`;
    case "wExp": return `ประสบการณ์ยุทธ ${signed(r.amount)}`;
    case "skillExp": return `ประสบการณ์ ${signed(r.amount)} · ${getSkill(r.skillId)?.n ?? "วิชา"}`;
    case "trait": return `${TRAIT_LABEL[r.trait]} ${signed(r.amount)}`;
    case "npcRelationship": return `สัมพันธ์${getNpc(r.npcId)?.name ? ` ${getNpc(r.npcId)!.name}` : ""} ${signed(r.amount)}`;
    case "learnSkill":
    case "learnArt": return MYSTERY_MOVE_LABEL;
    case "sectPoints": return `แต้มสำนัก${sectName(r.sectId)} ${signed(r.amount)}`;
    case "joinSect": return `เข้าเป็นศิษย์${sectName(r.sectId)}`;
    case "leaveSect":
    case "resignSect": return `ออกจาก${sectName(r.sectId)}`;
    case "betraySect": return `ทรยศ${sectName(r.sectId)}`;
  }
}

/** Every reward, joined for a quest card or the log. */
export function questRewardText(rewards: readonly QuestReward[]): string {
  return rewards.map(rewardText).filter((x): x is string => !!x).join(" · ");
}
