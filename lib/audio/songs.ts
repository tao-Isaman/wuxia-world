/**
 * Game music, written as note data (pure — no Web Audio here, so it can be
 * tested). Everything is pentatonic, the backbone of Chinese folk and wuxia
 * scores:
 *   world  — D gong mode (D E F# A B), guzheng arpeggios under a dizi flute
 *   night  — the same tune, slower and softer, flute alone over low strings
 *   battle — E yu mode (E G A B D), taiko + bass-string ostinato + erhu lead
 *   title  — gong, glissando and the world theme's second half on flute
 * plus short jingles (victory, defeat, encounter, quest done, level up).
 */

export type Instrument = "zheng" | "bass" | "flute" | "erhu" | "taiko" | "block" | "gong" | "bell";

export interface NoteEvent {
  /** Start, in beats from the loop start. */
  at: number;
  /** Length in beats. */
  len: number;
  instrument: Instrument;
  /** MIDI note number (percussion ignores it except for pitch colour). */
  midi: number;
  /** 0–1 loudness. */
  vel: number;
}

export interface Song {
  id: TrackId;
  bpm: number;
  /** Loop length in beats. Jingles play once. */
  beats: number;
  loop: boolean;
  events: NoteEvent[];
}

/** Exploring music of a region (recorded; lib/audio/recordings.ts). */
export type RegionTrackId = "heartland" | "north" | "south" | "east" | "wilds";

export type TrackId = "title" | "world" | "night" | "desert" | RegionTrackId | "battle" | "victory" | "defeat" | "encounter" | "quest" | "levelup";

const NOTE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** "F#5" → 78. */
export function midiOf(name: string): number {
  const match = /^([A-G])(#|b)?(-?\d)$/.exec(name);
  if (!match) throw new Error(`Bad note name: ${name}`);
  const [, letter, accidental, octave] = match;
  return 12 * (Number(octave) + 1) + NOTE[letter] + (accidental === "#" ? 1 : accidental === "b" ? -1 : 0);
}

/**
 * Melody shorthand in eighth notes: "A4:2 D5:2 E5:3 F#5:1 | …". ". :2" is a
 * rest; bars are only for reading. Returns note events in beats.
 */
export function phrase(text: string, instrument: Instrument, startBeat = 0, vel = 0.8): NoteEvent[] {
  const events: NoteEvent[] = [];
  let at = startBeat;
  for (const token of text.split(/\s+/).filter((t) => t && t !== "|")) {
    const [name, eighths = "1"] = token.split(":");
    const len = Number(eighths) / 2;
    if (name !== ".") events.push({ at, len, instrument, midi: midiOf(name), vel });
    at += len;
  }
  return events;
}

/** Beats covered by a phrase string. */
export function phraseBeats(text: string): number {
  return text.split(/\s+/).filter((t) => t && t !== "|").reduce((sum, token) => sum + Number(token.split(":")[1] ?? "1") / 2, 0);
}

// Guzheng accompaniment: rising then falling pentatonic chord tones per bar.
const ARPEGGIO = [0, 7, 12, 14, 19, 14, 12, 7];
function zhengBar(root: number, bar: number, vel = 0.42, pattern = ARPEGGIO): NoteEvent[] {
  return pattern.map((step, i) => ({ at: bar * 4 + i * 0.5, len: 1.5, instrument: "zheng" as const, midi: root + step, vel: vel * (i === 0 ? 1.15 : 1) }));
}
/** The zither's signature sweep across the strings, leading into a phrase. */
function glissando(scale: number[], from: number, bar: number, beatsBefore = 1, vel = 0.34): NoteEvent[] {
  const steps = scale.filter((midi) => midi >= from).slice(0, 8);
  const start = bar * 4 - beatsBefore;
  return steps.map((midi, i) => ({ at: Math.max(0, start + (i * beatsBefore) / steps.length), len: 1, instrument: "zheng" as const, midi, vel }));
}
function pentatonic(tonic: number, degrees: number[], octaves = 3): number[] {
  const notes: number[] = [];
  for (let octave = 0; octave < octaves; octave++) for (const step of degrees) notes.push(tonic + octave * 12 + step);
  return notes;
}

// ── World theme: "The Long Road" (D gong, 76 bpm, 16 bars) ─────────────
const WORLD_A = "A4:2 D5:2 E5:3 F#5:1 | E5:2 D5:2 B4:4 | D5:2 E5:2 A5:3 F#5:1 | E5:6 .:2";
const WORLD_A2 = "A4:2 D5:2 E5:3 F#5:1 | A5:2 B5:2 A5:2 F#5:2 | E5:2 F#5:1 E5:1 D5:2 B4:2 | D5:6 .:2";
const WORLD_B = "F#5:2 A5:2 B5:3 D6:1 | B5:2 A5:2 F#5:4 | E5:2 F#5:2 A5:2 E5:2 | D5:2 E5:2 B4:4 | "
  + "A4:2 B4:2 D5:3 E5:1 | F#5:2 E5:2 D5:2 B4:2 | A4:3 B4:1 D5:2 E5:2 | D5:8";
// Bar roots (D, G, A, B-minor colour), two octaves down.
const WORLD_ROOTS = ["D3", "D3", "G2", "D3", "D3", "G2", "A2", "D3", "G2", "D3", "A2", "B2", "G2", "A2", "A2", "D3"].map(midiOf);
const D_SCALE = pentatonic(midiOf("D4"), [0, 2, 4, 7, 9]);

function worldSong(night: boolean): Song {
  const events: NoteEvent[] = [];
  const lead = night ? 0.55 : 0.78;
  // A on zither, A' and B on flute — the texture changes as the tune repeats.
  if (night) {
    events.push(...phrase(WORLD_A, "flute", 0, lead).map((e) => ({ ...e, midi: e.midi - 12 })));
    events.push(...phrase(WORLD_A2, "flute", 16, lead).map((e) => ({ ...e, midi: e.midi - 12 })));
    events.push(...phrase(WORLD_B, "flute", 32, lead).map((e) => ({ ...e, midi: e.midi - 12 })));
  } else {
    events.push(...phrase(WORLD_A, "zheng", 0, 0.7));
    events.push(...phrase(WORLD_A2, "flute", 16, lead));
    events.push(...phrase(WORLD_B, "flute", 32, lead));
    events.push(...glissando(D_SCALE, midiOf("D4"), 8), ...glissando(D_SCALE, midiOf("A4"), 16, 1.5));
  }
  WORLD_ROOTS.forEach((root, bar) => {
    events.push({ at: bar * 4, len: 3.5, instrument: "bass", midi: root - 12, vel: night ? 0.35 : 0.5 });
    if (!night) events.push({ at: bar * 4 + 2, len: 1.5, instrument: "bass", midi: root - 5, vel: 0.3 });
    // Night keeps only the first half of each arpeggio: sparse, like distant strings.
    events.push(...zhengBar(root + 12, bar, night ? 0.24 : 0.36, night ? ARPEGGIO.slice(0, 4) : ARPEGGIO));
    if (!night && bar >= 8) {
      events.push({ at: bar * 4 + 1, len: 0.25, instrument: "block", midi: 84, vel: 0.28 }, { at: bar * 4 + 3, len: 0.25, instrument: "block", midi: 79, vel: 0.22 });
    }
    if (!night && bar % 4 === 0) events.push({ at: bar * 4, len: 1, instrument: "taiko", midi: 40, vel: 0.35 });
  });
  events.push({ at: 0, len: 8, instrument: "gong", midi: 45, vel: night ? 0.18 : 0.25 });
  return { id: night ? "night" : "world", bpm: night ? 62 : 76, beats: 64, loop: true, events };
}

// ── Battle theme: "Crossed Blades" (E yu, 138 bpm, 16 bars) ────────────
const BATTLE_LEAD = "E5:3 G5:1 A5:2 B5:2 | D6:2 B5:2 A5:4 | G5:2 A5:2 B5:3 D6:1 | E6:6 .:2 | "
  + "D6:2 B5:2 A5:2 G5:2 | E5:2 G5:2 A5:4 | B5:2 A5:2 G5:2 D5:2 | E5:6 .:2";
const BATTLE_ROOTS = ["E2", "E2", "C2", "D2", "E2", "E2", "C2", "B1"].map(midiOf);
// Taiko pattern in sixteenths: big hits, ghost hits and rim clicks.
const TAIKO = "X..x..X.X..x.X..";
const RIM = "....x.......x..x";

function battleSong(): Song {
  const events: NoteEvent[] = [];
  for (let bar = 0; bar < 16; bar++) {
    const root = BATTLE_ROOTS[bar % 8];
    // Driving bass-string ostinato: root, fifth, octave figures.
    [0, 0, 7, 0, 10, 0, 7, 5].forEach((step, i) => events.push({ at: bar * 4 + i * 0.5, len: 0.45, instrument: "bass", midi: root + step, vel: i % 2 ? 0.42 : 0.6 }));
    [...TAIKO].forEach((hit, i) => { if (hit !== ".") events.push({ at: bar * 4 + i * 0.25, len: 0.5, instrument: "taiko", midi: hit === "X" ? 38 : 45, vel: hit === "X" ? 0.85 : 0.45 }); });
    [...RIM].forEach((hit, i) => { if (hit !== ".") events.push({ at: bar * 4 + i * 0.25, len: 0.2, instrument: "block", midi: 88, vel: 0.3 }); });
    // Second half: zither chord stabs instead of the lead, for breathing room.
    if (bar >= 8) events.push(...[0, 7, 12, 15].map((step, i) => ({ at: bar * 4 + (bar % 2 ? 2 : 0) + i * 0.08, len: 1, instrument: "zheng" as const, midi: root + 24 + step, vel: 0.4 })));
  }
  events.push(...phrase(BATTLE_LEAD, "erhu", 0, 0.75));
  events.push(...phrase(BATTLE_LEAD, "flute", 32, 0.4).map((e) => ({ ...e, midi: e.midi - 12 })));
  events.push({ at: 0, len: 6, instrument: "gong", midi: 40, vel: 0.45 }, { at: 32, len: 6, instrument: "gong", midi: 40, vel: 0.3 });
  return { id: "battle", bpm: 138, beats: 64, loop: true, events };
}

function titleSong(): Song {
  const events: NoteEvent[] = [
    { at: 0, len: 12, instrument: "gong", midi: 43, vel: 0.5 },
    ...glissando(D_SCALE, midiOf("D4"), 1, 2, 0.4),
    ...phrase(WORLD_B, "flute", 4, 0.75),
  ];
  WORLD_ROOTS.slice(8).forEach((root, i) => {
    events.push({ at: 4 + i * 4, len: 3.8, instrument: "bass", midi: root - 12, vel: 0.4 });
    events.push(...zhengBar(root + 12, 1 + i, 0.28, [0, 7, 12, 14]));
  });
  return { id: "title", bpm: 66, beats: 36, loop: true, events };
}

function jingle(id: TrackId, bpm: number, parts: NoteEvent[]): Song {
  const beats = Math.max(...parts.map((e) => e.at + e.len));
  return { id, bpm, beats, loop: false, events: parts };
}

const E_SCALE = pentatonic(midiOf("E4"), [0, 3, 5, 7, 10]);

export const SONGS: Record<TrackId, Song> = {
  title: titleSong(),
  world: worldSong(false),
  night: worldSong(true),
  // The synth stand-in for the recorded desert song (lib/audio/recordings.ts).
  desert: { ...worldSong(false), id: "desert" },
  // …and for the recorded region songs.
  heartland: { ...worldSong(false), id: "heartland" },
  north: { ...worldSong(false), id: "north" },
  south: { ...worldSong(false), id: "south" },
  east: { ...worldSong(false), id: "east" },
  wilds: { ...worldSong(true), id: "wilds" },
  battle: battleSong(),
  victory: jingle("victory", 120, [
    ...glissando(D_SCALE, midiOf("D4"), 1, 1, 0.45),
    ...phrase("A5:1 B5:1 D6:2 E6:1 D6:1 A5:2 D6:8", "flute", 1, 0.85),
    { at: 1, len: 6, instrument: "gong", midi: 45, vel: 0.5 },
    { at: 1, len: 4, instrument: "bass", midi: midiOf("D2"), vel: 0.5 },
    { at: 5, len: 4, instrument: "bass", midi: midiOf("A1"), vel: 0.4 },
  ]),
  defeat: jingle("defeat", 70, [
    ...phrase("E5:2 D5:2 B4:3 A4:1 E4:8", "flute", 0, 0.6),
    { at: 0, len: 8, instrument: "bass", midi: midiOf("E2"), vel: 0.45 },
    { at: 4, len: 6, instrument: "gong", midi: 38, vel: 0.3 },
  ]),
  encounter: jingle("encounter", 150, [
    ...[0, 0.25, 0.5, 0.75, 1, 1.25, 1.5].map((at, i) => ({ at, len: 0.4, instrument: "taiko" as const, midi: 40, vel: 0.35 + i * 0.08 })),
    { at: 2, len: 5, instrument: "gong", midi: 40, vel: 0.55 },
    ...glissando(E_SCALE, midiOf("E4"), 0.5, 0.5, 0.35).map((e) => ({ ...e, at: e.at + 1.5 })),
  ]),
  quest: jingle("quest", 110, [
    ...phrase("D5:1 F#5:1 A5:1 D6:5", "zheng", 0, 0.6),
    ...phrase("A5:2 D6:6", "flute", 1, 0.5),
    { at: 0, len: 4, instrument: "bell", midi: midiOf("D6"), vel: 0.35 },
  ]),
  levelup: jingle("levelup", 140, [
    ...glissando(D_SCALE, midiOf("A4"), 1, 1, 0.45),
    { at: 1, len: 3, instrument: "bell", midi: midiOf("A5"), vel: 0.45 },
    { at: 1.25, len: 3, instrument: "bell", midi: midiOf("D6"), vel: 0.45 },
  ]),
};

/** Seconds per beat. */
export const beatSeconds = (song: Song) => 60 / song.bpm;
