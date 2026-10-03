import { Badge } from "@/components/ui/badge";
import { getArt, getSkill } from "@/lib/game";
import { LIFE_SKILL_LABEL, type ItemUseEffect } from "@/lib/world";

// Shop and bag share the same effects, so purchases can be compared before paying.
export function ItemEffects({ effect }: { effect?: ItemUseEffect }) {
  if (!effect) return null;
  const labels: string[] = [];
  if (effect.t === "heal") {
    if (effect.hp) labels.push(`HP +${effect.hp}`);
    if (effect.mp) labels.push(`MP +${effect.mp}`);
  } else if (effect.t === "trainSkill") {
    labels.push(`${LIFE_SKILL_LABEL[effect.skill]} +${effect.xp} XP`);
  } else if (effect.t === "manualLearnSkill") {
    labels.push(`เรียน ${getSkill(effect.skillId)?.n ?? "วิชาฝีมือ"}`);
    if (effect.reqValue > 0) labels.push(`ต้องการ ${effect.reqStat} ${effect.reqValue}`);
  } else if (effect.t === "manualLearnArt") {
    labels.push(`เรียน ${getArt(effect.artId)?.n ?? "วิชาในกาย"} ระดับ ${effect.level ?? 1}`);
    if (effect.reqValue > 0) labels.push(`ต้องการ ${effect.reqStat} ${effect.reqValue}`);
  }
  return <>{labels.map((label) => <Badge key={label} variant="outline"
    className="text-[10px] border-emerald-700/30 text-emerald-900 bg-emerald-100/40">{label}</Badge>)}</>;
}
