"use client";

import { useMemo } from "react";
import {
  SKILLS,
  TIERS,
  WEAPON_FAMILY_LABEL,
  bpMultiplier,
  getSkill,
  getMasteryMap,
  type Side,
} from "@/lib/game";
import { useCharacterStore } from "@/store/character-store";
import { Combobox, type ComboOption } from "@/components/ui/combobox";

interface Props {
  side: Side;
}

const SKILL_KIND_ICON = (sk: ReturnType<typeof getSkill>) =>
  sk?.at === "phy" ? "⚔" : sk?.at === "int" ? "💜" : sk?.se ? "⟳" : "💥";

export function SkillSlots({ side }: Props) {
  const build = useCharacterStore((s) => s.builds[side]);
  const setSlot = useCharacterStore((s) => s.setSkillSlot);

  // Build options grouped by tier, with hint = weapon + CD.
  const options = useMemo<ComboOption[]>(
    () =>
      SKILLS.map((sk) => ({
        value: sk.id,
        label: sk.n,
        group: `${TIERS[sk.ti].n} (CD${TIERS[sk.ti].cd})`,
        hint: WEAPON_FAMILY_LABEL[sk.w],
      })),
    [],
  );

  const mastery = useMemo(() => getMasteryMap(build.skillIds), [build.skillIds]);
  const equippedSet = new Set(build.skillIds.filter((x): x is string => !!x));

  // Aggregate stat bonuses from equipped skills — scaled by skill level
  // (lv1 = 50%, lv10 = 100%) to match combinedStats() in derive.ts.
  const skillStatBonus = useMemo(() => {
    const out: Record<string, number> = {};
    for (const sid of build.skillIds) {
      if (!sid) continue;
      const sk = getSkill(sid);
      if (!sk) continue;
      const lv = build.skillLevels?.[sid] ?? 1;
      const mul = bpMultiplier(lv);
      for (const [k, v] of Object.entries(sk.st)) {
        out[k] = (out[k] ?? 0) + Math.floor((v as number) * mul);
      }
    }
    return out;
  }, [build.skillIds, build.skillLevels]);

  return (
    <section className="border-t pt-3 mt-3">
      <h3 className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-2">
        วิชาที่ฝึก ({build.skillIds.length} ช่อง)
      </h3>
      <div className="space-y-1.5">
        {build.skillIds.map((cur, i) => {
          const sk = getSkill(cur);
          const disabled = new Set(equippedSet);
          if (cur) disabled.delete(cur);
          return (
            <div key={i} className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground w-4 text-center shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <Combobox
                  options={options}
                  value={cur}
                  onChange={(v) => setSlot(side, i, v)}
                  placeholder="— ว่าง —"
                  disabledValues={disabled}
                />
              </div>
              <span className="text-[9px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
                {sk ? `${SKILL_KIND_ICON(sk)} ${WEAPON_FAMILY_LABEL[sk.w]} CD${TIERS[sk.ti].cd}` : "—"}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-1 mt-2">
        {Object.entries(mastery).map(([w, v]) => (
          <span key={w} className="text-[10px] bg-muted/40 px-2 py-0.5 rounded">
            ×<strong className="text-primary">{(1 + ((v ?? 0) / 200) * 0.5).toFixed(2)}</strong>{" "}
            {WEAPON_FAMILY_LABEL[w as keyof typeof WEAPON_FAMILY_LABEL] ?? w}
          </span>
        ))}
        {Object.keys(mastery).length === 0 && (
          <span className="text-[10px] text-muted-foreground">ยังไม่มีความเชี่ยวชาญ</span>
        )}
      </div>

      <div className="text-[10px] text-muted-foreground mt-1">
        โบนัสจากวิชา:{" "}
        {Object.entries(skillStatBonus).length > 0
          ? Object.entries(skillStatBonus)
              .map(([k, v]) => `${k}+${v}`)
              .join(" ")
          : "—"}
      </div>
    </section>
  );
}
