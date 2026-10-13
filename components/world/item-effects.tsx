import { Badge } from "@/components/ui/badge";
import { DERIVED_LABEL, STAT_LABEL, TIERS, getArt, getEquip, getMeridianChart, getSkill } from "@/lib/game";
import { LIFE_SKILL_LABEL, getRecipe, type ItemUseEffect } from "@/lib/world";
import type { BattleItemEffect } from "@/lib/game/grid/types";

// Shop and bag share the same effects, so purchases can be compared before paying.
export function ItemEffects({ effect, battle }: { effect?: ItemUseEffect; battle?: BattleItemEffect }) {
  if (!effect && !battle) return null;
  const labels: string[] = [];
  const amount = (flat?: number, pct?: number) => [flat ? `+${flat}` : "", pct ? `+${pct}%` : ""].filter(Boolean).join(" ");
  if (!effect) {
    // battle-only items: say what they do below
  } else if (effect.t === "heal") {
    if (effect.hp || effect.hpPct) labels.push(`${DERIVED_LABEL.HP} ${amount(effect.hp, effect.hpPct)}`);
    if (effect.mp || effect.mpPct) labels.push(`${DERIVED_LABEL.MP} ${amount(effect.mp, effect.mpPct)}`);
    if (effect.stamina) labels.push(`พลัง +${effect.stamina}`);
  } else if (effect.t === "trainSkill") {
    labels.push(`${LIFE_SKILL_LABEL[effect.skill]} +${effect.xp} ประสบการณ์`);
  } else if (effect.t === "manualLearnSkill") {
    labels.push(`เรียน ${getSkill(effect.skillId)?.n ?? "กระบวนท่า"}`);
    if (effect.reqValue > 0) labels.push(`ต้องการ${STAT_LABEL[effect.reqStat]} ${effect.reqValue}`);
  } else if (effect.t === "manualLearnArt") {
    labels.push(`เรียน ${getArt(effect.artId)?.n ?? "ลมปราณ"} ระดับ ${effect.level ?? 1}`);
    if (effect.reqValue > 0) labels.push(`ต้องการ${STAT_LABEL[effect.reqStat]} ${effect.reqValue}`);
  } else if (effect.t === "learnMeridian") {
    const chart = getMeridianChart(effect.chartId);
    labels.push(`ชีพจรขั้น${TIERS[chart?.ti ?? 0]?.n ?? ""} · ${chart?.nodes.length ?? 0} จุด`);
  } else if (effect.t === "learnRecipe") {
    const recipe = getRecipe(effect.recipeId);
    const piece = recipe?.output.equipId !== undefined ? getEquip(recipe?.output.equipId) : null;
    labels.push(`จำสูตร${piece ? `สร้าง${piece.n}` : recipe?.name ?? ""}`);
    if (recipe?.skill) labels.push(`${LIFE_SKILL_LABEL[recipe.skill]} ขั้น ${recipe.requiredMastery ?? 1}+`);
  } else if (effect.t === "learnOutfit") {
    labels.push("เพิ่มเข้าตู้ชุด (โปรไฟล์ › ชุด)");
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
