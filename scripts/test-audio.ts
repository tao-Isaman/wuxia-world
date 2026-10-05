import { existsSync, statSync } from "node:fs";
import { RECORDINGS, REGION_SONGS, STARTS_ON_FIRST, exploringTrack, isDesertPlace } from "../lib/audio/recordings";
import { regionOf } from "../lib/world/data/regions";
import assert from "node:assert/strict";
import { SONGS, midiOf, phrase, phraseBeats, type TrackId } from "../lib/audio/songs";

let checks = 0;
function check(name: string, run: () => void) { run(); checks++; console.log(`PASS ${name}`); }

check("note names and phrase timing", () => {
  assert.equal(midiOf("A4"), 69);
  assert.equal(midiOf("F#5"), 78);
  assert.equal(phraseBeats("A4:2 D5:2 E5:3 F#5:1 | E5:6 .:2"), 8);
  const events = phrase("A4:2 .:2 D5:4", "flute");
  assert.deepEqual(events.map((e) => [e.at, e.len, e.midi]), [[0, 1, 69], [2, 2, 74]]);
});

check("every track is well-formed", () => {
  for (const [id, song] of Object.entries(SONGS)) {
    assert.equal(song.id, id);
    assert.ok(song.events.length > 0, `${id} has notes`);
    assert.ok(song.bpm >= 50 && song.bpm <= 180, `${id} tempo`);
    if (song.loop) assert.equal(song.beats % 4, 0, `${id} loops on a bar line`);
    for (const event of song.events) {
      assert.ok(event.at >= 0 && event.at < song.beats + 0.001, `${id} note inside the loop`);
      assert.ok(event.len > 0, `${id} note length`);
      assert.ok(event.midi >= 24 && event.midi <= 108, `${id} note ${event.midi} in range`);
      assert.ok(event.vel > 0 && event.vel <= 1, `${id} velocity`);
    }
  }
});

check("lead melodies stay in their pentatonic mode", () => {
  const modes: Record<TrackId, number[]> = {
    title: [2, 4, 6, 9, 11], world: [2, 4, 6, 9, 11], night: [2, 4, 6, 9, 11], desert: [2, 4, 6, 9, 11],
    heartland: [2, 4, 6, 9, 11], north: [2, 4, 6, 9, 11], south: [2, 4, 6, 9, 11], east: [2, 4, 6, 9, 11], wilds: [2, 4, 6, 9, 11], victory: [2, 4, 6, 9, 11], quest: [2, 4, 6, 9, 11], levelup: [2, 4, 6, 9, 11],
    battle: [4, 7, 9, 11, 2], defeat: [4, 7, 9, 11, 2], encounter: [4, 7, 9, 11, 2],
  };
  for (const [id, song] of Object.entries(SONGS) as [TrackId, typeof SONGS[TrackId]][]) {
    for (const event of song.events.filter((e) => e.instrument === "flute" || e.instrument === "erhu")) {
      assert.ok(modes[id].includes(event.midi % 12), `${id}: lead note ${event.midi} outside the mode`);
    }
  }
});

check("loops have a lead line and a pulse", () => {
  for (const id of ["world", "battle", "title"] as const) {
    const instruments = new Set(SONGS[id].events.map((e) => e.instrument));
    assert.ok(instruments.has("flute") || instruments.has("erhu"), `${id} lead`);
    assert.ok(instruments.has("bass"), `${id} bass`);
  }
  assert.ok(SONGS.battle.events.filter((e) => e.instrument === "taiko").length >= 64, "battle drums drive every bar");
});

check("recordings: the main theme, battle and desert songs exist, are MP3 and stay small", () => {
  const files = new Set(Object.values(RECORDINGS).flat());
  assert.ok(files.size >= 4);
  for (const url of files) {
    const path = `public${url}`;
    assert.ok(existsSync(path), `${path} exists`);
    assert.ok(url.endsWith(".mp3"), `${url} is MP3 (every browser decodes it)`);
    const size = statSync(path).size;
    assert.ok(size < 4_500_000, `${url} is ${(size / 1e6).toFixed(1)} MB — compress it (~110 kb/s)`);
  }
  for (const track of Object.keys(RECORDINGS) as TrackId[]) assert.ok(SONGS[track].loop, `${track} is background music with a synth stand-in`);
});

check("desert places pick the desert song; the rest the main theme", () => {
  for (const id of ["desert_ruins", "tribe_huizu", "city_xixia", "mt_baituo", "sect_xingxiu"]) assert.ok(isDesertPlace(id), id);
  for (const id of ["city_capital", "village_noname", "sect_shaolin", null]) assert.ok(!isDesertPlace(id), String(id));
});

check("themes play for day and night alike; each region opens on its song, then the themes", () => {
  assert.equal(RECORDINGS.title!.length, 4);
  assert.deepEqual(RECORDINGS.world, RECORDINGS.night);
  for (const [track, song] of Object.entries(REGION_SONGS) as [keyof typeof REGION_SONGS, string][]) {
    assert.equal(RECORDINGS[track]![0], song, `${track} starts on its song`);
    assert.deepEqual(RECORDINGS[track]!.slice(1), RECORDINGS.world, `${track} then plays the themes`);
    assert.ok(STARTS_ON_FIRST.has(track));
  }
});

check("exploring music by place: desert, wilds on roads and wild places, else the region", () => {
  assert.equal(exploringTrack("desert_ruins", false, regionOf("desert_ruins")), "desert");
  assert.equal(exploringTrack("city_capital", true, regionOf("city_capital")), "wilds");
  assert.equal(exploringTrack("cave_jinshe", false, regionOf("cave_jinshe")), "wilds");
  assert.equal(exploringTrack("city_capital", false, regionOf("city_capital")), "heartland");
  assert.equal(exploringTrack("home_player", false, regionOf("home_player")), "heartland");
  const seen = new Set<string>();
  for (const id of ["city_suzhou", "city_dali", "sect_wudang", "sect_quanzhen", "sect_huashan", "village_huashan", "sect_emei"]) seen.add(exploringTrack(id, false, regionOf(id)));
  for (const track of ["east", "south", "north"]) assert.ok(seen.has(track), `some place plays ${track}`);
});

console.log(`${checks} audio checks passed`);
