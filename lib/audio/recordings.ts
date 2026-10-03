import type { TrackId } from "./songs";

/**
 * Recorded music (public/audio/, MP3 ~110 kb/s, loudness-normalised to
 * −16 LUFS). A track listed here streams its recording through the music
 * bus; several files are versions played one after another. Every other
 * track — and any recording that fails to load — plays the synthesized song.
 */
export const RECORDINGS: Partial<Record<TrackId, readonly string[]>> = {
  title: ["/audio/theme-1.mp3", "/audio/theme-2.mp3"],
  world: ["/audio/theme-1.mp3", "/audio/theme-2.mp3"],
  night: ["/audio/theme-1.mp3", "/audio/theme-2.mp3"],
  desert: ["/audio/desert.mp3"],
  battle: ["/audio/battle.mp3"],
};

/** Places whose exploring music is the desert / trade song: the western sands and the Silk Road. */
const DESERT_PLACES = new Set(["city_xixia", "mt_baituo", "sect_xingxiu"]);
export function isDesertPlace(locationId: string | null | undefined): boolean {
  return !!locationId && (/^(desert|tribe)_/.test(locationId) || DESERT_PLACES.has(locationId));
}
