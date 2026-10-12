import { getSkill, SKILL_LEVEL_MAX, xpToNextLevel } from "@/lib/game";
import { getItem } from "./data/items";
import { getLocationMap } from "./data/location-maps";
import { getShopAt } from "./data/shops";
import { capitalTrainingStatus, capitalTrainingUpgrade } from "./capital-training";
import { CAPITAL_TRAINING_NAME } from "./data/capital-training";
import type { WorldStateData } from "./types";

type PreparationState = Pick<WorldStateData,
  "currentSceneId" | "quests" | "inventory" | "gold" | "wExp" | "skillLevel" | "skillExp" |
  "playerBuild" | "currentHp" | "currentMp" | "stamina" | "defeatedCounts" | "pendingBattle" | "gameOver"
>;

/** One optional supply, beginner duel and affordable upgrade after the errand. */
export function clinicPreparation(state: PreparationState) {
  if (state.currentSceneId !== "city_capital" || Object.keys(state.quests).length !== 1 ||
    state.quests.qc_capital_clinic_supplies?.status !== "done") return null;
  const training = capitalTrainingStatus(state);
  if (training?.completed) {
    const upgrade = capitalTrainingUpgrade(state);
    return upgrade ? {
      label: "วิชาจากการประลอง",
      title: `ยกระดับ${upgrade.skill.n}`,
      nextStep: `วิชา → ${upgrade.skill.n} → เลื่อนระดับด้วยประสบการณ์ยุทธ`,
      description: `ขั้น ${upgrade.level} → ${upgrade.level + 1} · ใช้ประสบการณ์ยุทธอีก ${upgrade.cost} · มี ${state.wExp}`,
      action: `เมนู วิชา → ${upgrade.skill.n} → เลื่อนระดับ (ใช้ประสบการณ์ยุทธ ${upgrade.cost})`,
      note: "ประสบการณ์จากการใช้วิชาลดค่าเลื่อนขั้นแล้ว · เลือกเก็บประสบการณ์ยุทธไว้ก่อนได้",
    } : null;
  }
  const hasHealingSupply = Object.entries(state.inventory).some(([id, count]) => {
    const use = getItem(id)?.use;
    return count > 0 && use?.t === "heal" && (use.hp ?? 0) > 0;
  });
  const potion = getItem("potion");
  const shop = getShopAt(state.currentSceneId);
  const price = potion?.price;
  if (training && (hasHealingSupply || (price != null && state.gold < price))) return {
    label: "ลองฝีมืออย่างปลอดภัย",
    title: training.needsRest ? "พักฟื้นก่อนลองฝีมือ" : `ฝึกกับ${CAPITAL_TRAINING_NAME}`,
    nextStep: training.needsRest ? "จุดหมาย → สำนักยุทธิ์ → พักริมทาง" : "จุดหมาย → สำนักยุทธิ์ → ฝึกประลองฟรี",
    description: training.needsRest
      ? `พลังชีวิต ${training.hp}/${training.maxHp} · ปราณ ${training.mp} · สำนักมีทางเลือกพักฟรีก่อนประลอง`
      : "คู่ฝึกระดับเริ่มต้น · ไม่มีค่าฝึก · แพ้ไม่เสียชีวิต · ชนะรับประสบการณ์ยุทธ 50",
    action: training.needsRest
      ? "จุดหมาย → สำนักยุทธิ์ → พักริมทาง · แล้วเลือก ฝึกประลองฟรี เมื่อพร้อม"
      : "จุดหมาย → สำนักยุทธิ์ → ฝึกประลองฟรี · ใช้ หมัดตรง ต่อสู้ · ถอยหนีได้เมื่อจำเป็น",
    note: "ใช้ 5 แรง · กลับนครหลวงหลังประลอง · เลือกสำรวจต่อได้",
  };
  if (!potion || price == null || state.gold < price ||
    potion.use?.t !== "heal" || !shop?.inventory.includes(potion.id)) return null;
  const shopName = getLocationMap(state.currentSceneId)?.spots?.find(spot => spot.kind === "shop")?.label ?? shop.label;
  const skill = (state.playerBuild?.learnedSkillIds ?? []).map(getSkill)
    .find(entry => entry && (state.skillLevel[entry.id] ?? 1) < SKILL_LEVEL_MAX);
  const upgradeCost = skill ? Math.max(0, xpToNextLevel(skill, state.skillLevel[skill.id] ?? 1) - (state.skillExp[skill.id] ?? 0)) : null;
  return {
    label: "เตรียมเดินทางครั้งต่อไป",
    title: `สำรอง${potion.name}ไว้สักขวด`,
    nextStep: `จุดหมาย → ${shopName}`,
    description: `${potion.name}ราคา ${price} ทอง · มี ${state.gold} ทอง · ฟื้นพลังชีวิต ${potion.use.hp ?? 0}${potion.use.hpPct ? ` + ${potion.use.hpPct}% ของสูงสุด` : ""} · ดื่มจากย่ามหรือกลางการต่อสู้`,
    action: `จุดหมาย → ${shopName} → ซื้อ ${potion.name} · เก็บไว้ใช้เมื่อบาดเจ็บ`,
    note: skill && upgradeCost !== null
      ? `${skill.n}: เลื่อนขั้นใช้ประสบการณ์ยุทธ ${upgradeCost} · มี ${state.wExp} · เลือกเก็บเงินไว้ก่อนได้`
      : "เลือกเตรียมเสบียงหรือออกสำรวจต่อได้ตามใจ",
  };
}
