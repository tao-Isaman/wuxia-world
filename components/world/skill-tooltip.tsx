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
  type StatKey,
} from "@/lib/game";

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

function SkillCard({ skill, level }: { skill: Skill; level?: number }) {
  const tier = TIERS[skill.ti];
  const lv = level ?? 1;
  const bpAtLv = Math.round(effectiveBp(skill, lv));
  const mgAtLv = Math.round(effectiveMg(skill, lv));
  const bpPct = Math.round(bpMultiplier(lv) * 100);
  const types = effectiveTypes(skill);
  const statRow = (Object.entries(skill.st) as [StatKey, number][])
    .map(([k, v]) => `${k}+${Math.floor(v * bpMultiplier(lv))}`)
    .join(" ");

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="default" className="text-[9px]">⚔ วิชาฝีมือ</Badge>
          <strong className="text-sm font-display">{skill.n}</strong>
          {typeof level === "number" && (
            <Badge variant="default" className="text-[9px]">
              Lv.{lv}
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
              {skill.at === "phy" ? "ทางกาย" : "ทางใน"}
            </Badge>
          )}
          {types.map((t) => (
            <Badge key={t} variant="outline" className="text-[9px] opacity-80">
              {SKILL_TYPE_LABEL[t]}
            </Badge>
          ))}
        </div>
      </div>

      {/* Description */}
      <p className="text-[11px] text-muted-foreground">{skill.d}</p>

      {/* Damage formula breakdown */}
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
        <span>
          BP <strong className="text-foreground">{bpAtLv}</strong>
          <span className="opacity-60"> ({bpPct}% ของ {skill.bp})</span>
        </span>
        {skill.p > 0 && <span>+{skill.p}%</span>}
        {skill.f > 0 && <span>+{skill.f} flat</span>}
        {skill.dm !== 1 && <span>×{skill.dm}</span>}
        {skill.dr ? <span>ดูด {skill.dr}%</span> : null}
        <span>
          ฝีมือ <strong className="text-foreground">+{mgAtLv}</strong>
          <span className="opacity-60"> ({skill.mg} × lv-curve)</span>
        </span>
      </div>

      {/* Stat bonus (level-scaled) */}
      {statRow && (
        <div className="text-[10px] text-emerald-700">
          โบนัสพลัง: {statRow}
        </div>
      )}

      {/* Self / enemy effects */}
      {skill.se && (
        <div className="text-[10px] text-foreground">
          ⟳ <span className="font-medium">บัฟตัวเอง:</span>{" "}
          {describeEffect(skill.se)}
        </div>
      )}
      {skill.ee && (
        <div className="text-[10px] text-foreground">
          ✗ <span className="font-medium">ดีบัฟศัตรู:</span>{" "}
          {describeEffect(skill.ee)}
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

function ArtCard({ art, level }: { art: Art; level?: number }) {
  const lv = level ?? 1;
  const types = effectiveTypes(art);
  const statRow = (Object.entries(art.stats) as [StatKey, number][])
    .map(([k, v]) => `${k}+${Math.floor((v * lv) / 10)}`)
    .join(" ");

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge variant="default" className="text-[9px]">☯ วิชาในกาย</Badge>
          <strong className="text-sm font-display">{art.n}</strong>
          {typeof level === "number" && (
            <Badge variant="default" className="text-[9px]">
              ขั้น {lv}
              {lv >= ART_LEVEL_MAX ? " (สูงสุด)" : ""}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <Badge variant="outline" className="text-[9px]">{art.sc}</Badge>
          <Badge variant="outline" className="text-[9px]">ตี-{art.ti + 1}</Badge>
          {art.tp && (
            <Badge variant="outline" className="text-[9px]">{art.tp}</Badge>
          )}
          {types.map((t) => (
            <Badge key={t} variant="outline" className="text-[9px] opacity-80">
              {SKILL_TYPE_LABEL[t]}
            </Badge>
          ))}
        </div>
      </div>

      {/* Stat scaling */}
      {(statRow || art.hL > 0 || art.mL > 0) && (
        <div className="space-y-0.5">
          <div className="text-[10px] text-emerald-700">
            โบนัสพลัง:
            {statRow ? ` ${statRow}` : ""}
            {art.hL ? ` HP+${art.hL * lv}` : ""}
            {art.mL ? ` MP+${art.mL * lv}` : ""}
          </div>
          <div className="text-[10px] text-muted-foreground">
            ต่อขั้น: HP +{art.hL} · MP +{art.mL}
            {Object.keys(art.stats).length > 0
              ? ` · พลัง ${Object.entries(art.stats)
                  .map(([k, v]) => `${k}+${v}`)
                  .join(" ")} (×ขั้น/10)`
              : ""}
          </div>
        </div>
      )}

      {/* Active */}
      {art.act && (
        <div className="text-[11px] text-foreground">
          <div className="font-medium">⚡ {art.act.n}</div>
          <div className="text-[10px] text-muted-foreground">
            MP {art.act.c} · CD {art.act.cd} · {art.act.d}
          </div>
        </div>
      )}

      {/* Passive */}
      {art.pas && (
        <div className="text-[11px] text-foreground">
          <div className="font-medium">
            ◆ {trigLabel(art.pas.tr)}{" "}
            <span className="text-muted-foreground text-[10px]">
              (โอกาส {art.pas.ch}%)
            </span>
          </div>
          <div className="text-[10px] text-muted-foreground">{art.pas.d}</div>
        </div>
      )}
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────

function trigLabel(t: string): string {
  switch (t) {
    case "hit_recv": return "เมื่อโดนโจมตี";
    case "on_crit":  return "เมื่อคริติคอล";
    case "use_int":  return "เมื่อใช้วิชาทางใน";
    case "use_act":  return "เมื่อใช้วิชาออกพลัง";
    default:         return t;
  }
}

// Render a SelfEffect / EnemyEffect as a one-line summary. Mirrors
// patterns used by the battle log (concise, Thai). Variants tracked
// against lib/game/types.ts — keep the switch in sync when new effect
// kinds land.
function describeEffect(eff: NonNullable<Skill["se"]> | NonNullable<Skill["ee"]>): string {
  switch (eff.t) {
    // Self
    case "buff_def":     return `DEF+${eff.v} (${eff.u} ตา)`;
    case "buff_eva":     return `Eva+${eff.v} (${eff.u} ตา)`;
    case "buff_reduce":  return `ลด dmg ${eff.v}% (${eff.u} ตา)`;
    case "buff_reflect": return `สะท้อน ${eff.v}% dmg (${eff.u} ตา)`;
    case "buff_spd":     return `SPD+${eff.v} (${eff.u} ตา)`;
    case "stack_atk":    return `ATK+${eff.v}% (สะสมไม่เกิน ${eff.mx} ครั้ง)`;
    case "heal_pct":     return `ฟื้น ${eff.v}% HP`;
    case "heal_buff":
      return `ฟื้น ${eff.hp}% HP + บัฟ ${eff.bt} +${eff.bv} (${eff.bu} ตา)`;
    case "buff_iatk_reduce":
      return `IAtk+${eff.iv}% · ลด dmg ${eff.rv}% (${eff.u} ตา)`;
    case "buff_reflect_eva":
      return `สะท้อน ${eff.rv}% + Eva+${eff.ev} (${eff.u} ตา)`;
    // Enemy
    case "debuff_def":   return `PDef${eff.v} (${eff.u} ตา)`;
    case "debuff_eva":   return `Eva${eff.v} (${eff.u} ตา)`;
    case "debuff_acc":   return `Acc${eff.v} (${eff.u} ตา)`;
    case "multi_debuff": return `Acc${eff.av} Eva${eff.ev} (${eff.u} ตา)`;
    case "debuff_poison":
      return `พิษ ${eff.pp}%HP/ตา + Eva${eff.ev} (${eff.u} ตา)`;
    case "heavy_poison":
      return `พิษหนัก ${eff.pp}%HP/ตา + Acc${eff.av} Eva${eff.ev} (${eff.u} ตา)`;
    case "drain_mp":     return `ดูด MP ${eff.v}`;
    case "dispel":       return `สลายบัฟ + Acc${eff.acc} (${eff.u} ตา)`;
    default: {
      // Fallback — unknown effect kind. Render the discriminator so
      // future authors notice the missing branch.
      const t = (eff as { t: string }).t;
      return t;
    }
  }
}
