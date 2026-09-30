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
    title: [2, 4, 6, 9, 11], world: [2, 4, 6, 9, 11], night: [2, 4, 6, 9, 11], victory: [2, 4, 6, 9, 11], quest: [2, 4, 6, 9, 11], levelup: [2, 4, 6, 9, 11],
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

console.log(`${checks} audio checks passed`);
