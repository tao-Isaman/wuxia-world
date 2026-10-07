import { getArt, getSkill, isBossMove, type BattleState, type WeaponFamily } from "@/lib/game";

type Cast = NonNullable<BattleState["lastCast"]>;

/** How a strike travels and lands. Skills take it from their weapon family; arts are qi orbs. */
export type VfxShape = "slash" | "heavy" | "impact" | "thrust" | "flurry" | "projectile" | "wave" | "orb";
/** Secondary colour and particle style, from the skill's effects / philosophy. */
export type VfxElement =
  | "none" | "poison" | "fire" | "frost" | "thunder" | "blood" | "qi" | "shadow" | "holy"
  // The legendary beasts' (บอส) own elements.
  | "gold" | "sun" | "wind" | "water" | "earth";

/**
 * A legendary beast's move (`bss_<beast>_<sig>`): each draws and sounds its
 * own way on top of the family shape (battle-vfx / cast-sfx read `signature`).
 */
export type BossSignature =
  | "fang" | "coil" | "molt"          // งูยักษ์เกล็ดทองคำ
  | "claw" | "roar" | "frenzy"        // พยัคฆ์โลหิตลายคราม
  | "feathers" | "dive" | "gale"      // อินทรียักษ์จ้าวแห่งกระบี่
  | "shell" | "sun" | "quake"         // เต่ายักษ์แบกตะวัน
  | "pincers" | "mirror" | "tide"     // ปูวิเศษจ้าวแห่งดาบ
  | "charge" | "stomp" | "rage";      // กระทิงยักษ์เขาเพลิง

export interface CastVfx {
  /** 0 พื้นฐาน … 5 ปรมัตถ์. Rarity decides palette, layer count and particle budget. */
  tier: number;
  shape: VfxShape;
  element: VfxElement;
  kind: "skill" | "art" | "stance";
  /** Main colour of the strike (tier), its glow, and the element accent. */
  core: number;
  glow: number;
  accent: number;
  /** A boss move's own look and sound (absent for every other cast). */
  signature?: BossSignature;
}

// Rarity ladder, matching the cast-banner name colours (white → jade → sky → violet → gold → crimson).
export const TIER_PALETTE: readonly { core: number; glow: number }[] = [
  { core: 0xfff6dc, glow: 0xd9c89a },
  { core: 0xe8fff0, glow: 0x4fd08c },
  { core: 0xe8f5ff, glow: 0x45a6ff },
  { core: 0xf6e8ff, glow: 0xb06cff },
  { core: 0xfff3c4, glow: 0xffb42e },
  { core: 0xffe6dc, glow: 0xff3b2f },
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
  gold: 0xffd23a,
  sun: 0xffb000,
  wind: 0xd8fff2,
  water: 0x4fc3ff,
  earth: 0xc49a5a,
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

/** Each boss move's signature and element (its shape stays its weapon family's). */
export const BOSS_VFX: Readonly<Record<string, { signature: BossSignature; element: VfxElement }>> = {
  bss_serpent_fang: { signature: "fang", element: "poison" },
  bss_serpent_coil: { signature: "coil", element: "gold" },
  bss_serpent_molt: { signature: "molt", element: "gold" },
  bss_tiger_claw: { signature: "claw", element: "blood" },
  bss_tiger_roar: { signature: "roar", element: "frost" },
  bss_tiger_frenzy: { signature: "frenzy", element: "blood" },
  bss_eagle_feathers: { signature: "feathers", element: "wind" },
  bss_eagle_dive: { signature: "dive", element: "thunder" },
  bss_eagle_gale: { signature: "gale", element: "wind" },
  bss_turtle_shell: { signature: "shell", element: "sun" },
  bss_turtle_sun: { signature: "sun", element: "sun" },
  bss_turtle_quake: { signature: "quake", element: "earth" },
  bss_crab_pincers: { signature: "pincers", element: "water" },
  bss_crab_mirror: { signature: "mirror", element: "water" },
  bss_crab_tide: { signature: "tide", element: "water" },
  bss_bull_charge: { signature: "charge", element: "fire" },
  bss_bull_stomp: { signature: "stomp", element: "earth" },
  bss_bull_rage: { signature: "rage", element: "fire" },
};

/** A cast as the renderer sees it: battle items (grid `item` actions) come as source kind "item". */
type CastLike = { tier: Cast["tier"]; source?: { kind: "skill" | "art" | "item"; id: string; poison?: boolean } };

/** Pure: what a cast should look like. Unknown / tactical casts get a quiet stance glow. */
export function castVfx(cast: CastLike): CastVfx {
  const tier = Math.max(0, Math.min(TIER_PALETTE.length - 1, cast.tier ?? 0));
  const palette = TIER_PALETTE[tier];
  let shape: VfxShape = "impact";
  let element: VfxElement = "none";
  let kind: CastVfx["kind"] = "stance";
  let signature: BossSignature | undefined;
  if (cast.source?.kind === "skill") {
    const skill = getSkill(cast.source.id);
    if (skill) {
      kind = "skill";
      shape = FAMILY_SHAPE[skill.w] ?? "impact";
      const effect = skill.ee?.t;
      const boss = isBossMove(skill.id) ? BOSS_VFX[skill.id] : undefined;
      if (boss) {
        signature = boss.signature;
        element = boss.element;
      } else {
        element = effect === "poison_dmg" || effect === "debuff_poison" || effect === "heavy_poison" ? "poison"
          : effect === "burn_hp_mp" || effect === "scorch" ? "fire"
          : effect === "stun" || effect === "bind" ? "thunder"
          : effect === "bleed" || effect === "drain_mp" || (skill.dr ?? 0) > 0 ? "blood"
          : effect === "dispel" || effect === "sunder" ? "holy"
          : effect === "blind" ? "shadow"
          : fromTypes(skill.types, skill.at === "int");
      }
    }
  } else if (cast.source?.kind === "item") {
    // A thrown hidden weapon (poisoned or not); a potion is a support glow.
    kind = "stance";
    shape = cast.source.id.startsWith("potion") ? "orb" : "projectile";
    element = cast.source.poison ? "poison" : cast.source.id.startsWith("potion") ? "holy" : "none";
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
  const out: CastVfx = { tier, shape, element, kind, core: palette.core, glow: palette.glow, accent };
  if (signature) out.signature = signature;
  return out;
}

function fromTypes(types: readonly string[] | undefined, internal: boolean): VfxElement {
  if (types?.includes("yang")) return "fire";
  if (types?.includes("yin")) return "frost";
  if (types?.includes("internal") || internal) return "qi";
  return "none";
}
