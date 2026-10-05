import type { RegionTrackId, TrackId } from "./songs";

/**
 * Recorded music (public/audio/, MP3 ~110 kb/s, loudness-normalised to
 * −16 LUFS). A track listed here streams its recordings through the music
 * bus; a list plays in random order (never the same song twice in a row),
 * a single file loops. Every other track — and any recording that fails to
 * load — plays the synthesized song.
 */
const THEMES = ["/audio/theme-1.mp3", "/audio/theme-2.mp3", "/audio/theme-3.mp3", "/audio/theme-4.mp3"] as const;

/** Each region's own song; it opens the region's playlist, then the themes take turns with it. */
export const REGION_SONGS: Readonly<Record<RegionTrackId, string>> = {
  heartland: "/audio/region-heartland.mp3",
  north: "/audio/region-north.mp3",
  south: "/audio/region-south.mp3",
  east: "/audio/region-east.mp3",
  wilds: "/audio/region-wilds.mp3",
};

export const RECORDINGS: Partial<Record<TrackId, readonly string[]>> = {
  title: THEMES,
  // Day and night share the themes.
  world: THEMES,
  night: THEMES,
  desert: ["/audio/desert.mp3"],
  battle: ["/audio/battle.mp3"],
  ...Object.fromEntries(Object.entries(REGION_SONGS).map(([track, song]) => [track, [song, ...THEMES]])),
};

/** Tracks whose playlist starts on its first file (the region song) instead of a random one. */
export const STARTS_ON_FIRST: ReadonlySet<TrackId> = new Set(Object.keys(REGION_SONGS) as RegionTrackId[]);

/** Places whose exploring music is the desert / trade song: the western sands and the Silk Road. */
const DESERT_PLACES = new Set(["city_xixia", "mt_baituo", "sect_xingxiu"]);
export function isDesertPlace(locationId: string | null | undefined): boolean {
  return !!locationId && (/^(desert|tribe)_/.test(locationId) || DESERT_PLACES.has(locationId));
}

/** Wild places (caves, cliffs, mountains, valleys) play the wilds song, like the roads. */
const WILD_PLACE = /^(cave|cliff|mt|valley|peak|forest|swamp|lake|river)_/;

/**
 * The exploring track for where the hero is: the desert song, the wilds song
 * on roads and in wild places, else the region's song (the west's non-desert
 * places play the themes). `region` is the place's region (regionOf).
 */
export function exploringTrack(locationId: string | null | undefined, onRoad: boolean, region: string): TrackId {
  if (isDesertPlace(locationId)) return "desert";
  if (onRoad || (locationId && WILD_PLACE.test(locationId))) return "wilds";
  if (region in REGION_SONGS) return region as RegionTrackId;
  return "world";
}
