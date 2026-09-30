import { getArt, getSkill, type BattleState, type WeaponFamily } from "@/lib/game";

type Cast = NonNullable<BattleState["lastCast"]>;

/** How a strike travels and lands. Skills take it from their weapon family; arts are qi orbs. */
export type VfxShape = "slash" | "heavy" | "impact" | "thrust" | "flurry" | "projectile" | "wave" | "orb";
/** Secondary colour and particle style, from the skill's effects / philosophy. */
export type VfxElement = "none" | "poison" | "fire" | "frost" | "thunder" | "blood" | "qi" | "shadow" | "holy";

export interface CastVfx {
  /** 0 พื้นฐาน … 4 เฉพาะ. Rarity decides palette, layer count and particle budget. */
  tier: number;
  shape: VfxShape;
  element: VfxElement;
  kind: "skill" | "art" | "stance";
  /** Main colour of the strike (tier), its glow, and the element accent. */
  core: number;
  glow: number;
  accent: number;
}

// Rarity ladder, matching the cast-banner name colours (white → jade → sky → violet → gold).
export const TIER_PALETTE: readonly { core: number; glow: number }[] = [
  { core: 0xfff6dc, glow: 0xd9c89a },
  { core: 0xe8fff0, glow: 0x4fd08c },
  { core: 0xe8f5ff, glow: 0x45a6ff },
  { core: 0xf6e8ff, glow: 0xb06cff },
  { core: 0xfff3c4, glow: 0xffb42e },
];

export const ELEMENT_ACCENT: Record<VfxElement, number | null> = {
  none: null,
  poison: 0x86ff5c,
  fire: 0xff7a2a,
  frost: 0xa6ecff,
  thunder: 0xfff27a,
  blood: 0xff3a52,
  qi: 0xbfeaff,
  shadow: 0x9a6cff,
  holy: 0xfff0a8,
};

const FAMILY_SHAPE: Record<WeaponFamily, VfxShape> = {
  sword: "slash",
  blade: "heavy",
  fist: "impact",
  long: "thrust",
  short: "flurry",
  hidden: "projectile",
  music: "wave",
};

/** Pure: what a cast should look like. Unknown / tactical casts get a quiet stance glow. */
export function castVfx(cast: Pick<Cast, "tier" | "source">): CastVfx {
  const tier = Math.max(0, Math.min(4, cast.tier ?? 0));
  const palette = TIER_PALETTE[tier];
  let shape: VfxShape = "impact";
  let element: VfxElement = "none";
  let kind: CastVfx["kind"] = "stance";
  if (cast.source?.kind === "skill") {
    const skill = getSkill(cast.source.id);
    if (skill) {
      kind = "skill";
      shape = FAMILY_SHAPE[skill.w] ?? "impact";
      const effect = skill.ee?.t;
      element = effect === "poison_dmg" || effect === "debuff_poison" || effect === "heavy_poison" ? "poison"
        : effect === "burn_hp_mp" ? "fire"
        : effect === "stun" ? "thunder"
        : effect === "drain_mp" || (skill.dr ?? 0) > 0 ? "blood"
        : effect === "dispel" ? "holy"
        : fromTypes(skill.types, skill.at === "int");
    }
  } else if (cast.source?.kind === "art") {
    const art = getArt(cast.source.id);
    if (art) {
      kind = "art";
      shape = "orb";
      const active = art.act?.t;
      element = active?.startsWith("heal") ? "holy"
        : active?.startsWith("drain") ? "blood"
        : active === "debuff_poison" ? "poison"
        : active === "debuff_acc_dmg" ? "shadow"
        : active === "atk_int_pen" ? "qi"
        : fromTypes(art.types, false);
    }
  }
  const accent = ELEMENT_ACCENT[element] ?? palette.glow;
  return { tier, shape, element, kind, core: palette.core, glow: palette.glow, accent };
}

function fromTypes(types: readonly string[] | undefined, internal: boolean): VfxElement {
  if (types?.includes("yang")) return "fire";
  if (types?.includes("yin")) return "frost";
  if (types?.includes("internal") || internal) return "qi";
  return "none";
}
