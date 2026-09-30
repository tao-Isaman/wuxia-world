# Audio

All music and sound is **generated in the browser** with the Web Audio API — the repo contains no audio files. Songs are note data, instruments are synthesized, and skill sounds are derived from the same profile as the skill's visual effect.

## Contents

- [Files](#files)
- [Songs](#songs)
- [The engine](#the-engine)
- [When each sound plays](#when-each-sound-plays)
- [Skill sounds](#skill-sounds)
- [Settings and the ♪ button](#settings-and-the--button)
- [Tests](#tests)
- [Adding or changing music](#adding-or-changing-music)

## Files

| File | Role |
| --- | --- |
| `lib/audio/songs.ts` | pure note data: `SONGS`, `TrackId`, `Instrument`, `phrase`, `phraseBeats`, `midiOf`, helpers |
| `lib/audio/engine.ts` | the Web Audio graph, instruments, the sequencer, SFX primitives, `uiSound`, settings, `unlockAudio`, `renderTrack` |
| `lib/audio/cast-sfx.ts` | skill sounds: `castStartSfx`, `impactSfx`, `whiffSfx`, `supportSfx` |
| `components/sound-director.tsx` | picks the music and fires cues from store changes (mounted in `app/page.tsx`) |
| `components/sound-button.tsx` | the ♪ button and its settings bubble |

## Songs

Every tune is pentatonic. Tracks (`TrackId`) and their shape:

| Track | Mode and feel | bpm | Loops | Length |
| --- | --- | --- | --- | --- |
| `title` | gong, zither glissando, the world theme on flute | 66 | yes | ~33 s |
| `world` ("The Long Road") | D gong mode (D E F# A B): zither lead, flute answer, bass roots, zither arpeggios, woodblock from bar 8, taiko every 4 bars | 76 | yes | ~50 s |
| `night` | the world tune, slower, flute an octave down, half the arpeggios, no woodblock or taiko | 62 | yes | ~62 s |
| `battle` ("Crossed Blades") | E yu mode (E G A B D): bass ostinato, taiko pattern `X..x..X.X..x.X..`, rim clicks, zither stabs, erhu lead, flute echo | 138 | yes | ~28 s |
| `victory` / `defeat` / `encounter` / `quest` / `levelup` | jingles | 120 / 70 / 150 / 110 / 140 | no | 2–9 s |

A `Song` is `{ id, bpm, beats, loop, events: NoteEvent[] }`, and a `NoteEvent` is `{ at, len, instrument, midi, vel }` (times in beats).

The melody shorthand `phrase("A4:2 D5:2 E5:3 F#5:1 | …", instrument, startBeat, vel)` counts in **eighth notes**: `:2` is a quarter note, `.` is a rest, and `|` is ignored. `midiOf("F#5")` gives 78.

## The engine

`lib/audio/engine.ts`:

- **Graph.** Master → compressor (−14 dB, 4:1) → speakers.
  - Two buses: music (gain `musicVolume × 0.5`) and effects (`sfxVolume × 0.7`).
  - A convolution hall reverb with a generated 2.6 s impulse, fed by a 0.32 send.
- **Instruments.**
  - `zheng` (guzheng) and `bass`: Karplus–Strong plucked strings, cached per pitch.
  - `flute`: sine + octave partial + breath noise, 5.4 Hz vibrato.
  - `erhu`: sawtooth through a 2.6 kHz low-pass, 6.2 Hz vibrato.
  - `taiko`, `block` (woodblock), `gong` (six inharmonic partials), `bell` (three partials).
- **Sequencer.** A 40 ms timer schedules notes 0.25 s ahead.
  - `playMusic(track)` fades the music bus out (about 0.12 s) and starts the new loop 380 ms later.
  - `playJingle(track, returnTo?)` plays a jingle once, only when music is on. It then returns to `returnTo` 0.8 s after the end: by default the current track; `null` means silence.
  - `stopMusic()` stops the music.
- **SFX primitives.** `swoosh`, `tone`, `thump`, `note(instrument, midi, at, vel, beats)`, plus `now()` and `audioReady()`.
- **UI sounds** (`uiSound`):

| Sound | Made of |
| --- | --- |
| `tap` | a woodblock |
| `open` | two zither notes |
| `coin` | two bells |
| `step` | a swoosh |
| `rest` | four falling zither notes |

- **Unlocking.** Browsers start audio suspended. `unlockAudio()` creates or resumes the `AudioContext` on the first pointer-down or key-down.
  - The context sleeps when the tab is hidden and wakes when it returns.
  - `<html data-audio>` shows the context state (`running`, `suspended`…); `<html data-music>` shows the wanted track. Tests read both.
- **Offline render.** `renderTrack(track, seconds)` renders a track offline for previews or level checks. Nothing in the repo calls it yet.

## When each sound plays

`SoundDirector` decides the music:

| State | Music |
| --- | --- |
| no game (title screen) | `title` |
| game over | none |
| a battle without a winner yet | `battle` |
| exploring, `time % 12 < 8` | `world` |
| exploring, `time % 12 ≥ 8` | `night` |

It also plays cues when the store changes:

| Change | Cue |
| --- | --- |
| battle ends with the hero winning / losing | `victory` / `defeat` jingle, then back to exploration music |
| a new encounter appears | `encounter` jingle |
| a quest finishes | `quest` jingle |
| total skill + art levels rise (and no quest finished) | `levelup` jingle |
| gold goes up | `coin` |
| stamina rises by 20 or more | `rest` |
| the scene changes to a non-dialog | `step` |
| any enabled button is clicked | `open` in the icon bar, `tap` elsewhere |

## Skill sounds

`lib/audio/cast-sfx.ts` builds each skill's sound from the `CastVfx` profile that `lib/stage/cast-vfx.ts` makes for its visual effect (see [grid-combat.md](grid-combat.md#cast-vfx-and-sound)). So a skill always sounds like it looks.

- **Weapon shape** sets the strike:

| Shape | Sound |
| --- | --- |
| slash / flurry | a swoosh and a ringing blade |
| heavy | a low cleave |
| impact | a palm thump |
| thrust | a hiss and a hit |
| projectile | needle whistles timed to the hit |
| wave | a zither sweep |
| art | a qi orb |

- **Rarity** adds weight: tier 1+ gathers qi during the wind-up, tier 2+ adds layers, tier 3 a bell chime, tier 4 a gong swell.
- **Element accents** follow the skill's effects: fire crackle, thunder, poison bubbles, frost bells, and so on.

`lib/stage/grid-battle-runtime.ts` calls:

- `castStartSfx` at the start of a cast;
- `impactSfx` on each hit (heavier on a critical);
- `whiffSfx` on a miss;
- `supportSfx` for buffs and heals.

## Settings and the ♪ button

- **Storage.** Settings live in `localStorage["wuxia-audio-v1"]` as `{ music, sfx, musicVolume, sfxVolume }`, defaulting to `true`, `true`, 0.55, 0.8.
  - `getAudioSettings()` reads them;
  - `setAudioSettings(partial)` changes them;
  - `subscribeAudio(listener)` watches them.
- **The ♪ button** (`SoundButton`) shows 🔇 when both music and effects are off. It sits in the HUD icon bar, on the title screen and in the battle header.

  Its bubble (`role="group"`, not a dialog, so the map keeps running) has ดนตรี and เสียงประกอบ switches and 0–1 volume sliders. Esc or a tap outside closes it.

## Tests

- **`bun run test:audio`** (`scripts/test-audio.ts`) checks the note data:
  - `midiOf` / `phrase` timing;
  - every track is well formed (bpm 50–180, loops end on a bar line, notes in range);
  - flute and erhu leads stay in their mode;
  - the world, battle and title loops have a lead and a bass pulse;
  - the battle has at least 64 taiko hits.
- **`tests/browser/audio.spec.ts`** checks that music follows title → world → battle, that the context runs after the first gesture, and that the ♪ bubble's switches persist.

## Adding or changing music

1. Write the notes in `lib/audio/songs.ts` with `phrase(...)`. Keep to the song's pentatonic mode; the test checks the leads.
2. Add the id to `TrackId` and an entry to `SONGS`, with `loop: true` for background music.
3. Choose when it plays in `components/sound-director.tsx`.
4. Run `bun run test:audio`, then listen in the browser (audio needs a click first).

For a new instrument, add a synth voice to `engine.ts` and the name to `Instrument`.
