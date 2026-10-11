// Who is talking: the NPC behind a dialog line's `speaker` label, for the
// dialog bust / portrait and the quest receipt.
//
// Authors write the name a character goes by in conversation, which is often
// shorter than the registry name: "หวงชิงเฉวียน" for "หวงชิงเฉวียน
// (ปรมาจารย์ฤาษี)", "ฮุยหยวน" for "เจ้าอาวาสฮุยหยวน", "เถ้าแก่โจว" for
// "เถ้าแก่โจวตลาดมืด". A label matches, in order:
//   1. an NPC's exact name;
//   2. an NPC's name before its "(…)" epithet (only when one NPC has it);
//   3. a short name the sagas use for one person (SPEAKER_ALIASES: "ทูตเซี่ย"
//      is ทูตเซี่ยแห่งสำนักดาบโลหิต) — a table, as a loose prefix rule would
//      also catch titles ("ผู้อาวุโส", "หัวหน้าโจร");
//   4. part of the name of the quest giver or hand-in person of a
//      `qs_<quest>_…` / `st_<quest>_…` dialog, when exactly one of them fits.
// People standing where the dialog plays are preferred for 1 and 2.
// Narration, "{hero}" and walk-on labels ("โจรสลัด", "ยายหลี่") match nobody,
// except the few walk-ons with a stock look (WALK_ON_SPEAKERS), whose bust is
// that archetype's.
import { NPCS, getNpc, getQuest } from "./data";
import type { DialogScene, NpcDef, WorldStateData } from "./types";
import { npcIsDead, questHolder } from "./npc-life";

/** "หวงชิงเฉวียน (ปรมาจารย์ฤาษี)" → "หวงชิงเฉวียน". */
export const npcBaseName = (name: string): string => name.replace(/\s*\([^()]*\)\s*$/, "").trim();

const BY_BASE = new Map<string, NpcDef[]>();
for (const npc of NPCS) {
  const base = npcBaseName(npc.name);
  BY_BASE.set(base, [...(BY_BASE.get(base) ?? []), npc]);
}

/** The quest a quest / saga dialog belongs to (`qs_<quest>_offer`, `st_<quest>_s1`…). */
export function questIdOfScene(sceneId: string): string | undefined {
  const m = /^(?:qs|st)_(.+)$/.exec(sceneId);
  if (!m) return undefined;
  const parts = m[1]!.split("_");
  for (let n = parts.length; n > 0; n--) {
    const id = parts.slice(0, n).join("_");
    if (getQuest(id)) return id;
  }
  return undefined;
}

/** The people a dialog is expected to involve: its quest's giver and hand-in person. */
export function sceneCast(sceneId: string): NpcDef[] {
  const quest = getQuest(questIdOfScene(sceneId));
  return [quest?.giverNpcId, quest?.turnInNpcId].flatMap((id) => {
    const npc = id ? getNpc(id) : undefined;
    return npc ? [npc] : [];
  });
}

/** Anyone with a name: an NPC definition or a location's NPC link. */
export type Named = { id: string; name: string };

/** Short names saga dialogs call a registered person by, which no rule reaches. */
export const SPEAKER_ALIASES: Readonly<Record<string, string>> = {
  "ทูตเซี่ย": "evil_xueyu_envoy_xie", // ทูตเซี่ยแห่งสำนักดาบโลหิต (the outsiders' saga)
  "ขุนนางหยาน": "evil_changan_corrupt_official_yan", // ขุนนางหยานทุจริต (Wudang's saga)
  "เสี่ยวเฉ่า": "home_beichou_herder_cao", // เสี่ยวเฉ่าเด็กเลี้ยงแพะ (the mountain-army saga)
};

/**
 * Walk-ons who speak with no NPC behind them but fit a stock look: their id
 * goes to npcCharacterId (lib/characters/catalog.ts), so the bust shows that
 * archetype (a swordsman: m1) instead of nothing.
 */
export const WALK_ON_SPEAKERS: Readonly<Record<string, Named>> = {
  "อาจารย์ดาบ": { id: "walkon_swordsman", name: "อาจารย์ดาบ" }, // Tang's sword-feast challenger (blade_master)
};

/**
 * The NPC a speaker label names. `cast` are the people the dialog is about
 * (its quest's giver / hand-in person), `nearby` those standing where it plays.
 */
export function npcForSpeaker<T extends Named = NpcDef>(speaker: string, cast: readonly NpcDef[] = [], nearby: readonly T[] = []): NpcDef | T | Named | undefined {
  const label = speaker.trim();
  if (!label || label.includes("{")) return undefined;
  const near: (NpcDef | T)[] = [...cast, ...nearby];
  const exact = near.find((n) => n.name === label) ?? NPCS.find((n) => n.name === label);
  if (exact) return exact;
  const alias = SPEAKER_ALIASES[label];
  const aliased = alias ? getNpc(alias) : null;
  if (aliased) return aliased;
  if (WALK_ON_SPEAKERS[label]) return WALK_ON_SPEAKERS[label];
  const local = unique(near.filter((n) => npcBaseName(n.name) === label));
  if (local.length === 1) return local[0];
  const byBase = BY_BASE.get(label) ?? [];
  if (byBase.length === 1) return byBase[0];
  // A title before a full name: "ฤๅษีชิวเฉียน" is ชิวเฉียน (ฤๅษีเนรเทศ).
  const titled = [...BY_BASE].filter(([base, npcs]) => npcs.length === 1 && base.length >= 6 && label !== base && label.endsWith(base));
  if (titled.length === 1) return titled[0]![1][0];
  // Part of a name ("เถ้าแก่โจว" in "เถ้าแก่โจวตลาดมืด") only for the dialog's
  // own cast — among everyone present a title or a surname is too loose.
  const loose = unique(cast.filter((n) => npcBaseName(n.name).includes(label)));
  return loose.length === 1 ? loose[0] : undefined;
}

const unique = <N extends Named>(npcs: readonly N[]) => [...new Map(npcs.map((n) => [n.id, n])).values()];

/** The first line of a dialog spoken by a known NPC, and who that is. */
export function dialogSpeaker<T extends Named = NpcDef>(scene: DialogScene, nearby: readonly T[] = []): NpcDef | T | Named | undefined {
  const cast = sceneCast(scene.id);
  for (const line of scene.lines) {
    if (line.t !== "dialogue") continue;
    const npc = npcForSpeaker(line.speaker, cast, nearby);
    if (npc) return npc;
  }
  return undefined;
}

/**
 * A quest dialog's dead speaker hands their voice on: the person who holds
 * their charges now (their heir, or for a lineage teacher another teacher of
 * the school — `questHolder`) speaks their lines, so no one talks from beyond
 * the grave. Anyone alive, and narrators, are left as they are.
 */
export function livingVoice<N extends Named>(state: Partial<Pick<WorldStateData, "npcExt" | "assassinatedNpcIds">>, npc: N | undefined): N | NpcDef | undefined {
  if (!npc || !npcIsDead(state, npc.id)) return npc;
  const holder = questHolder(state, npc.id);
  return holder ? getNpc(holder) ?? undefined : undefined;
}

/** The name shown over a line: a dead person's label becomes their stand-in's (see livingVoice). */
export function voiceLabel(state: Partial<Pick<WorldStateData, "npcExt" | "assassinatedNpcIds">>, sceneId: string, label: string): string {
  const npc = npcForSpeaker(label, sceneCast(sceneId));
  if (!npc || !npcIsDead(state, npc.id)) return label;
  const voice = livingVoice(state, npc);
  return voice ? npcBaseName(voice.name) : label;
}
