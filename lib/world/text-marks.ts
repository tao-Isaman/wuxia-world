// Key words in dialogue and film subtitles (the conversation standard: one
// line per beat, key words marked). Pure: text → segments the UI colours.
//
//   • Authors mark a word with **double stars**: "ไปเอา**คัมภีร์**มา" → key.
//   • Names the game knows are marked by themselves: people (NPCs), places
//     (locations), items, sects, moves and arts, foes and the age's key
//     terms (คัมภีร์, องครักษ์เสื้อแพร…); numbers too ("ปราบ 3 ตัว").
//   • A long line plays as several beats (splitBeats), cut between words.
// Marks never change the words: the visible text is the line minus the stars.
import { NPCS } from "./data/npcs";
import { SCENES } from "./data/scenes";
import { ITEMS, SCROLL_PREFIX } from "./data/items";
import { isBeastMove } from "@/lib/game";
import { SECT_MEMBERSHIPS } from "./data/sect-memberships";
import { OPPONENTS } from "./data/opponents";
import { ARTS, SKILLS } from "@/lib/game";
import type { SceneLine } from "./types";

export type MarkKind = "key" | "person" | "place" | "item" | "sect" | "move" | "foe" | "number";

/** The age's key words (docs/story-writing.md#timeline-and-novel-characters), marked wherever they appear. */
const LORE_TERMS = [
  "หอคัมภีร์หลวง", "คัมภีร์", "องครักษ์เสื้อแพร", "ฮ่องเต้หงอู่", "ฮ่องเต้เจี้ยนเหวิน", "อ๋องเยียน", "ศึกจิ้งหนาน",
  "เตียซำฮง", "เตียบ่อกี้", "ยอดกวงเม้ง", "เม้งก่า", "ดาบฆ่ามังกร", "กระบี่อิงฟ้า", "วิชาลึกลับ",
];
export interface TextSegment { text: string; mark?: MarkKind }

/** Names shorter than this are too likely to sit inside ordinary words. */
const MIN_NAME = 3;

let dictionary: { pattern: RegExp; kinds: Map<string, MarkKind> } | null = null;

function escape(text: string): string { return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

/** Every name the game knows, longest first (so "หมอหลิน" wins over "หลิน"). */
function build() {
  const kinds = new Map<string, MarkKind>();
  const add = (name: string | undefined, kind: MarkKind) => {
    const clean = name?.replace(/\s*\(.*\)\s*$/, "").trim();
    if (clean && clean.length >= MIN_NAME && !kinds.has(clean)) kinds.set(clean, kind);
  };
  for (const term of LORE_TERMS) add(term, "key");
  for (const sect of Object.values(SECT_MEMBERSHIPS)) add(sect?.name, "sect");
  for (const npc of NPCS) add(npc.name, "person");
  for (const scene of SCENES) if (scene.kind === "location") add(scene.name, "place");
  for (const item of ITEMS) if (!item.id.startsWith(SCROLL_PREFIX)) add(item.name, "item");
  // People, places and items first: a sparring foe named after an NPC stays a person.
  for (const move of SKILLS) if (!isBeastMove(move.id)) add(move.n, "move");
  for (const art of ARTS) if (art.id !== "none") add(art.n, "move");
  for (const foe of OPPONENTS) add(foe.name, "foe");
  const names = [...kinds.keys()].sort((a, b) => b.length - a.length).map(escape);
  // Numbers: Arabic or Thai digits, with a decimal / thousands part.
  const pattern = new RegExp(`(${names.join("|")})|([0-9๐-๙]+(?:[.,][0-9๐-๙]+)*)`, "g");
  return { pattern, kinds };
}

/** Split a line into plain and marked segments. */
export function markText(text: string): TextSegment[] {
  dictionary ??= build();
  const out: TextSegment[] = [];
  const push = (segment: TextSegment) => { if (segment.text) out.push(segment); };
  // Authored marks first: **…** (an unclosed ** stays as written).
  const parts = text.split(/\*\*(.+?)\*\*/);
  parts.forEach((part, index) => {
    if (index % 2 === 1) { push({ text: part, mark: "key" }); return; }
    const { pattern, kinds } = dictionary!;
    pattern.lastIndex = 0;
    let last = 0;
    for (let match = pattern.exec(part); match; match = pattern.exec(part)) {
      push({ text: part.slice(last, match.index) });
      push({ text: match[0], mark: match[1] ? kinds.get(match[1]) ?? "key" : "number" });
      last = match.index + match[0].length;
    }
    push({ text: part.slice(last) });
  });
  return out;
}

/** The words as the player reads them (the stars dropped). */
export function plainText(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "$1");
}

/** The first `count` visible characters of a marked line (for the typewriter). */
export function sliceSegments(segments: readonly TextSegment[], count: number): TextSegment[] {
  const out: TextSegment[] = [];
  let left = count;
  for (const segment of segments) {
    if (left <= 0) break;
    out.push(segment.text.length <= left ? segment : { ...segment, text: segment.text.slice(0, left) });
    left -= segment.text.length;
  }
  return out;
}

/** A line longer than this plays as more than one beat. */
export const BEAT_CHARS = 140;

/**
 * Lines → beats: a line longer than BEAT_CHARS is cut between words (Thai
 * spaces end phrases) into pieces of about BEAT_CHARS, never inside a
 * **mark**; each piece keeps its speaker.
 */
export function splitBeats(lines: readonly SceneLine[], max = BEAT_CHARS): SceneLine[] {
  const out: SceneLine[] = [];
  for (const line of lines) {
    if (plainText(line.text).length <= max) { out.push(line); continue; }
    const words = line.text.split(/(?<=\s)/);
    let piece = "";
    const flush = () => { if (piece.trim()) out.push({ ...line, text: piece.trim() }); piece = ""; };
    for (const word of words) {
      const open = (piece.match(/\*\*/g)?.length ?? 0) % 2 === 1;
      if (piece && !open && plainText(piece + word).length > max) flush();
      piece += word;
    }
    flush();
  }
  return out;
}
