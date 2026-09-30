// STUB — replaced by subagent B with the real per-skill profiles.
import type { Art, Skill } from "../types";
import { parseSlotId } from "../slots";
import type { GridSkillProfile } from "./types";

export function skillGrid(skill: Skill): GridSkillProfile {
  if (!skill.at && !skill.ee) return { range: { min: 0, max: 0 }, area: { kind: "single" }, target: "self" };
  return { range: { min: 1, max: skill.w === "hidden" || skill.w === "music" ? 3 : 1 }, area: { kind: "single" }, target: "enemy" };
}

export function artGrid(art: Art): GridSkillProfile | null {
  if (!art.act) return null;
  const attack = /atk|drain|debuff/.test(art.act.t);
  return attack ? { range: { min: 1, max: 2 }, area: { kind: "single" }, target: "enemy" }
    : { range: { min: 0, max: 0 }, area: { kind: "single" }, target: "self" };
}

export function slotGrid(raw: string | null | undefined): GridSkillProfile | null {
  const info = raw ? parseSlotId(raw) : null;
  if (!info) return null;
  return info.kind === "skill" ? skillGrid(info.skill) : artGrid(info.art);
}

export const SKILL_GRID_OVERRIDES: Record<string, Partial<GridSkillProfile>> = {};
