"use client";

import { useMemo } from "react";
import {
  ARTS,
  SKILLS,
  TIERS,
  WEAPON_FAMILY_LABEL,
  bpMultiplier,
  encodeArtSlot,
  getMasteryMap,
  getSkill,
  parseSlotId,
  type Side,
} from "@/lib/game";
import { useCharacterStore } from "@/store/character-store";
import { Combobox, type ComboOption } from "@/components/ui/combobox";
import { Slider } from "@/components/ui/slider";

interface Props {
  side: Side;
}

const SKILL_KIND_ICON = (sk: ReturnType<typeof getSkill>) =>
  sk?.at === "phy" ? "⚔" : sk?.at === "int" ? "💜" : sk?.se ? "⟳" : "💥";

export function SkillSlots({ side }: Props) {
  const build = useCharacterStore((s) => s.builds[side]);
  const setSlot = useCharacterStore((s) => s.setSkillSlot);
  const setSkillLevel = useCharacterStore((s) => s.setSkillLevel);
  const setArtLevelById = useCharacterStore((s) => s.setArtLevelById);

  // Build options grouped by tier, with hint = weapon + CD. Skills come
  // first (bare id), then arts with the `art:` prefix — kept on a
  // separate group prefix ("วิชาภายใน T<n>") so authors can scan the
  // dropdown by category.
  const options = useMemo<ComboOption[]>(() => {
    const skillOpts = SKILLS.map<ComboOption>((sk) => ({
      value: sk.id,
      label: sk.n,
      group: `วิชาฝีมือ T${sk.ti} (CD${TIERS[sk.ti].cd})`,
      hint: WEAPON_FAMILY_LABEL[sk.w],
    }));
    const artOpts = ARTS.filter((a) => a.id !== "none").map<ComboOption>((a) => ({
      value: encodeArtSlot(a.id),
      label: `⚛ ${a.n}`,
      group: `กำลังภายใน T${a.ti}`,
      hint: a.act ? `IA CD${a.act.cd}` : "passive",
    }));
    return [...skillOpts, ...artOpts];
  }, []);

  // Mastery map only counts skills (arts have no weapon family).
  const mastery = useMemo(() => getMasteryMap(build.skillIds), [build.skillIds]);
  const equippedSet = new Set(build.skillIds.filter((x): x is string => !!x));

  // Aggregate stat bonuses from equipped skills — scaled by skill level
  // (lv1 = 50%, lv10 = 100%) to match combinedStats() in derive.ts.
  const skillStatBonus = useMemo(() => {
    const out: Record<string, number> = {};
    for (const sid of build.skillIds) {
      if (!sid) continue;
      const info = parseSlotId(sid);
      if (info?.kind !== "skill") continue;
      const lv = build.skillLevels?.[info.skill.id] ?? 1;
      const mul = bpMultiplier(lv);
      for (const [k, v] of Object.entries(info.skill.st)) {
        out[k] = (out[k] ?? 0) + Math.floor((v as number) * mul);
      }
    }
    return out;
  }, [build.skillIds, build.skillLevels]);

  return (
    <section className="border-t pt-3 mt-3">
      <h3 className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-2">
        วิชา / กำลังภายใน ({build.skillIds.length} ช่อง)
      </h3>
      <div className="space-y-1.5">
        {build.skillIds.map((cur, i) => {
          const info = parseSlotId(cur);
          const sk = info?.kind === "skill" ? info.skill : null;
          const ar = info?.kind === "art" ? info.art : null;
          const disabled = new Set(equippedSet);
          if (cur) disabled.delete(cur);
          // Resolve current level for slider — skills via skillLevels,
          // arts via artLevels (fallback to legacy artLevel for the
          // primary art id).
          const lv = sk
            ? build.skillLevels?.[sk.id] ?? 1
            : ar
              ? build.artLevels?.[ar.id] ??
                (build.artId === ar.id ? build.artLevel : 1)
              : 1;
          const tag = sk
            ? `${SKILL_KIND_ICON(sk)} ${WEAPON_FAMILY_LABEL[sk.w]} CD${TIERS[sk.ti].cd}`
            : ar
              ? `⚛ T${ar.ti} ${ar.act ? `CD${ar.act.cd}` : "ผ่าน"}`
              : "—";
          return (
            <div key={i} className="space-y-1">
              <div className="flex items-center gap-1.5">
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
                  {tag}
                </span>
              </div>
              {(sk || ar) && (
                <div className="flex items-center gap-1.5 pl-6">
                  <span className="text-[10px] text-muted-foreground shrink-0">ขั้น</span>
                  <Slider
                    min={1}
                    max={10}
                    step={1}
                    value={[lv]}
                    onValueChange={(v) => {
                      const next = v[0];
                      if (sk) setSkillLevel(side, sk.id, next);
                      else if (ar) setArtLevelById(side, ar.id, next);
                    }}
                    className="flex-1"
                  />
                  <span className="text-xs font-semibold w-5 text-right">{lv}</span>
                </div>
              )}
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

