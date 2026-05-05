import type { BattleState, Side } from "./types";
import type { BattleContext } from "./battle";
import { resolveArtActive, resolveSkill } from "./battle";
import { getArt } from "./data";
import { parseSlotId } from "./slots";

// Simple AI: 20% prefer the IA active when available + affordable, otherwise
// pick a random off-cooldown skill slot. Mirrors `doAI` in demo.html.
// Returns true if it actually took an action — caller uses this to detect
// stalemates (AI locked out by cooldowns + no MP for IA).
export function runAITurn(
  state: BattleState,
  side: Side,
  ctx: BattleContext,
  slotSkillIds: (string | null)[],
): boolean {
  const art = getArt(ctx.artIds[side]);
  const mp = side === "A" ? state.mpA : state.mpB;
  const slots = side === "A" ? state.cd.A : state.cd.B;

  const available: number[] = [];
  for (let i = 0; i < slots.length; i++) {
    if (slots[i] === 0 && slotSkillIds[i]) available.push(i);
  }

  const canIA = !!art.act && mp >= art.act.c && state.iaCD[side] === 0;
  if (canIA && Math.random() < 0.2) {
    resolveArtActive(state, side, ctx);
    return true;
  }
  if (available.length === 0) {
    // AI locked out — try IA as fallback even if it didn't roll.
    if (canIA) {
      resolveArtActive(state, side, ctx);
      return true;
    }
    return false;
  }
  const slotIdx = available[Math.floor(Math.random() * available.length)];
  const raw = slotSkillIds[slotIdx];
  if (!raw) return false;
  const info = parseSlotId(raw);
  if (!info) return false;
  if (info.kind === "skill") {
    resolveSkill(state, side, slotIdx, info.skill.id, ctx);
  } else {
    // Art-slot: respect MP cost; bail if the AI can't afford it.
    if (!info.art.act) return false;
    const sideMp = side === "A" ? state.mpA : state.mpB;
    if (sideMp < info.art.act.c) return false;
    resolveArtActive(state, side, ctx, { slotIdx, artId: info.art.id });
  }
  return true;
}
