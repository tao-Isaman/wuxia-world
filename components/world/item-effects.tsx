import { Badge } from "@/components/ui/badge";
import { getArt, getMeridianChart, getSkill } from "@/lib/game";
import { LIFE_SKILL_LABEL, type ItemUseEffect } from "@/lib/world";
import type { BattleItemEffect } from "@/lib/game/grid/types";

// Shop and bag share the same effects, so purchases can be compared before paying.
export function ItemEffects({ effect, battle }: { effect?: ItemUseEffect; battle?: BattleItemEffect }) {
  if (!effect && !battle) return null;
  const labels: string[] = [];
  const amount = (flat?: number, pct?: number) => [flat ? `+${flat}` : "", pct ? `+${pct}%` : ""].filter(Boolean).join(" ");
  if (!effect) {
    // battle-only items: say what they do below
  } else if (effect.t === "heal") {
    if (effect.hp || effect.hpPct) labels.push(`HP ${amount(effect.hp, effect.hpPct)}`);
    if (effect.mp || effect.mpPct) labels.push(`MP ${amount(effect.mp, effect.mpPct)}`);
    if (effect.stamina) labels.push(`พลัง +${effect.stamina}`);
  } else if (effect.t === "trainSkill") {
    labels.push(`${LIFE_SKILL_LABEL[effect.skill]} +${effect.xp} XP`);
  } else if (effect.t === "manualLearnSkill") {
    labels.push(`เรียน ${getSkill(effect.skillId)?.n ?? "กระบวนท่า"}`);
    if (effect.reqValue > 0) labels.push(`ต้องการ ${effect.reqStat} ${effect.reqValue}`);
  } else if (effect.t === "manualLearnArt") {
    labels.push(`เรียน ${getArt(effect.artId)?.n ?? "ลมปราณ"} ระดับ ${effect.level ?? 1}`);
    if (effect.reqValue > 0) labels.push(`ต้องการ ${effect.reqStat} ${effect.reqValue}`);
  } else if (effect.t === "learnMeridian") {
    const chart = getMeridianChart(effect.chartId);
    labels.push(`ชีพจร T${chart?.ti ?? 0} · ${chart?.nodes.length ?? 0} จุด`);
  }
  if (battle) {
    if (battle.t === "heal") labels.push("⚔ ใช้กลางการต่อสู้ได้");
    else {
      labels.push(`⚔ ขว้าง ${battle.range} ช่อง · แรง ${battle.power}`);
      if (battle.poison) labels.push(`☠ พิษ ${battle.poison.pct}%/ตา × ${battle.poison.turns} ตา`);
    }
  }
  return <>{labels.map((label) => <Badge key={label} variant="outline"
    className="text-[10px] border-emerald-700/30 text-emerald-900 bg-emerald-100/40">{label}</Badge>)}</>;
}
