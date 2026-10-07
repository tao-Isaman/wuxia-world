"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { InfoPopover } from "@/components/ui/wuxia/info-popover";
import {
  ART_LEVEL_MAX,
  SKILL_LEVEL_MAX,
  SKILL_TYPE_LABEL,
  TIERS,
  WEAPON_FAMILY_HINT,
  WEAPON_FAMILY_LABEL,
  bpMultiplier,
  effectiveBp,
  effectiveMg,
  effectiveTypes,
  type Art,
  type Skill,
} from "@/lib/game";
import { ATTACK_KIND_LABEL, movePower, passiveLine, plainThai, skillFlavour, skillSummaryLines, statLine } from "@/lib/game/skill-text";

// SkillTooltip / ArtTooltip — wrap any inline trigger node and reveal
// the full data card on hover (desktop) or tap (mobile). Use these
// anywhere a skill / art is named so the player can read its details
// without leaving the current screen.
//
// Examples:
//   <SkillTooltip skill={sk}><strong>{sk.n}</strong></SkillTooltip>
//   <ArtTooltip art={art} level={lv}>{art.n}</ArtTooltip>
//
// The `level` prop on each is optional — when given, the tooltip shows
// the player's actual current values (lv-scaled bp / mg / stat / etc.)
// alongside the catalog spec. Otherwise it shows the level-1 baseline.

// ─── Skill ────────────────────────────────────────────────────────────

interface SkillTooltipProps {
  skill: Skill;
  /** Player's current level for this skill, 1..SKILL_LEVEL_MAX. */
  level?: number;
  children: React.ReactNode;
}

export function SkillTooltip({ skill, level, children }: SkillTooltipProps) {
  return (
    <InfoPopover trigger={children}>
      <SkillCard skill={skill} level={level} />
    </InfoPopover>
  );
}

/** The full skill card (also the engine's preview). */
export function SkillCard({ skill, level }: { skill: Skill; level?: number }) {
  const tier = TIERS[skill.ti];
  const lv = level ?? 1;
  const mgAtLv = Math.round(effectiveMg(skill, lv));
  const flavour = skillFlavour(skill);
  const types = effectiveTypes(skill);
  const statRow = statLine(skill.st, bpMultiplier(lv));

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="default" className="text-[9px]">⚔ กระบวนท่า</Badge>
          <strong className="text-sm font-display">{skill.n}</strong>
          {typeof level === "number" && (
            <Badge variant="default" className="text-[9px]">
              ระดับ {lv}
              {lv >= SKILL_LEVEL_MAX ? " (สูงสุด)" : ""}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <Badge variant="outline" className="text-[9px]">{skill.sc}</Badge>
          {tier && (
            <Badge variant="outline" className="text-[9px]">{tier.n}</Badge>
          )}
          <Badge
            variant="outline"
            className="text-[9px]"
            title={WEAPON_FAMILY_HINT[skill.w]}
          >
            {WEAPON_FAMILY_LABEL[skill.w]}
          </Badge>
          {skill.at && (
            <Badge variant="outline" className="text-[9px]">
              {ATTACK_KIND_LABEL[skill.at] || "ท่าเสริม"}
            </Badge>
          )}
          {types.length > 0 && (
            <Badge variant="outline" className="text-[9px] opacity-80">
              สาย{types.map((t) => SKILL_TYPE_LABEL[t]).join("·")}
            </Badge>
          )}
        </div>
      </div>

      {/* What it does, in words */}
      {flavour && <p className="text-[11px] italic text-muted-foreground">{flavour}</p>}
      <ul className="text-[10px] text-foreground space-y-0.5">
        {skillSummaryLines(skill).map((line) => <li key={line}>• {line}</li>)}
      </ul>

      {/* Numbers, named */}
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
        <span>
          พลังของท่า <strong className="text-foreground">{movePower(effectiveBp(skill, lv), skill)}</strong>
          {lv < SKILL_LEVEL_MAX && <span className="opacity-60"> (ระดับ 10: {movePower(effectiveBp(skill, SKILL_LEVEL_MAX), skill)})</span>}
        </span>
        <span>
          ความชำนาญ{WEAPON_FAMILY_LABEL[skill.w]} <strong className="text-foreground">+{mgAtLv}</strong>
        </span>
      </div>

      {/* Stat bonus (level-scaled) */}
      {statRow && (
        <div className="text-[10px] text-emerald-700">
          เพิ่มค่าสถานะ: {statRow}
        </div>
      )}
    </div>
  );
}

// ─── Art ──────────────────────────────────────────────────────────────

interface ArtTooltipProps {
  art: Art;
  /** Player's current level for this art, 1..ART_LEVEL_MAX. */
  level?: number;
  children: React.ReactNode;
}

export function ArtTooltip({ art, level, children }: ArtTooltipProps) {
  return (
    <InfoPopover trigger={children}>
      <ArtCard art={art} level={level} />
    </InfoPopover>
  );
}

/** The full art card (also the engine's preview). */
export function ArtCard({ art, level }: { art: Art; level?: number }) {
  const lv = level ?? 1;
  const types = effectiveTypes(art);
  const statRow = statLine(art.stats, lv / 10);

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="default" className="text-[9px]">☯ ลมปราณ</Badge>
          <strong className="text-sm font-display">{art.n}</strong>
          {typeof level === "number" && (
            <Badge variant="default" className="text-[9px]">
              ระดับ {lv}
              {lv >= ART_LEVEL_MAX ? " (สูงสุด)" : ""}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <Badge variant="outline" className="text-[9px]">{art.sc}</Badge>
          {TIERS[art.ti] && <Badge variant="outline" className="text-[9px]">{TIERS[art.ti].n}</Badge>}
          {types.length > 0 && (
            <Badge variant="outline" className="text-[9px] opacity-80">
              สาย{types.map((t) => SKILL_TYPE_LABEL[t]).join("·")}
            </Badge>
          )}
        </div>
      </div>

      {art.d && <p className="text-[11px] text-muted-foreground">{plainThai(art.d)}</p>}

      {/* Stat scaling */}
      {(statRow || art.hL > 0 || art.mL > 0) && (
        <div className="space-y-0.5">
          <div className="text-[10px] text-emerald-700">
            เพิ่มค่าสถานะ:{" "}
            {[statRow, art.hL ? `พลังชีวิต +${art.hL * lv}` : "", art.mL ? `ปราณ +${art.mL * lv}` : ""].filter(Boolean).join(" · ")}
          </div>
          <div className="text-[10px] text-muted-foreground">
            ทุกระดับเพิ่ม พลังชีวิต +{art.hL} · ปราณ +{art.mL}
            {Object.keys(art.stats).length > 0 ? ` · ระดับ 10 ได้ ${statLine(art.stats, 1)}` : ""}
          </div>
        </div>
      )}

      {/* Active */}
      {art.act && (
        <div className="text-[11px] text-foreground">
          <div className="font-medium">⚡ ท่าออกพลัง: {art.act.n}</div>
          <div className="text-[10px] text-muted-foreground">
            ใช้ปราณ {art.act.c} · ใช้แล้วพัก {art.act.cd} ตา · {plainThai(art.act.d)}
          </div>
        </div>
      )}

      {/* Passive */}
      {art.pas && (
        <div className="text-[11px] text-foreground">◆ ติดตัว: {passiveLine(art.pas)}</div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────

