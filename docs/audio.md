# Audio

The background music is **recorded** (four MP3s in `public/audio/`); everything else — jingles, UI sounds and skill sounds — is **generated in the browser** with the Web Audio API. Each recorded track also has a synthesized stand-in, so the game still has music when a recording can't load (offline, say). Synth songs are note data, instruments are synthesized, and skill sounds are derived from the same profile as the skill's visual effect.

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
| `public/audio/*.mp3` | the recordings: `theme-1` … `theme-4` (the themes), `region-heartland`, `region-north`, `region-south`, `region-east`, `region-wilds`, `battle`, `desert` |
| `lib/audio/recordings.ts` | `RECORDINGS` (track → files) and `isDesertPlace` |
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

## Recordings

The main tracks stream recorded songs (made with Suno from the prompts in the 2026-10-03 changelog entry):

| Track | Files | Length |
| --- | --- | --- |
| `title`, `world`, `night` | the four themes: `theme-1.mp3`, `theme-2.mp3` (ถือกระบี่ท่องยุทธภพ, two versions), `theme-3.mp3` (Dawn Journey), `theme-4.mp3` (Moonlit Remembrance) | 3:40, 3:23, 3:15, 3:12 |
| `heartland` | `region-heartland.mp3` (Prosperous Capital), then the themes | 2:53 |
| `north` | `region-north.mp3` (Snow Peaks at Dawn), then the themes | 3:28 |
| `south` | `region-south.mp3` (Dali Tea Hills), then the themes | 3:18 |
| `east` | `region-east.mp3` (Peach Blossoms on the Canal), then the themes | 3:00 |
| `wilds` | `region-wilds.mp3` (The Road Goes On), then the themes | 3:25 |
| `battle` | `battle.mp3` | 2:55 |
| `desert` | `desert.mp3` — the desert / trade song | 3:04 |

- **Size.** The 150 MB of WAV masters were encoded to MP3 (libmp3lame VBR `-q:a 6`, ~110 kb/s, 44.1 kHz stereo), loudness-normalised to −16 LUFS (`loudnorm=I=-16:TP=-1.5`) with leading and trailing silence trimmed: 10.8 MB for all four. MP3 because every browser (Chromium builds without AAC included) decodes it. `test:audio` fails if a file grows past 4.5 MB.

  ```bash
  ffmpeg -i in.wav -af "silenceremove=start_periods=1:start_threshold=-55dB,areverse,silenceremove=start_periods=1:start_threshold=-55dB,areverse,loudnorm=I=-16:TP=-1.5:LRA=11" -ar 44100 -ac 2 -c:a libmp3lame -q:a 6 out.mp3
  ```

- **Playback.** A recording streams through an `<audio>` element routed into the music bus (`createMediaElementSource`), so the ♪ volume and mute apply. One file loops; a playlist moves on to a random other song when one ends. The theme playlists start on a random theme; a region's playlist starts on its own song (`STARTS_ON_FIRST`), then the themes take turns with it. Day and night share the themes. A jingle pauses the recording and the music resumes where it left off.
- **Fallback.** If a file fails to load, that track plays its synthesized song instead. The service worker does not cache media (the browser fetches it in ranges), so offline play uses the synth music. `<html data-music-source>` is `recording` or `synth`.
- **Desert places.** `isDesertPlace`: `desert_*`, `tribe_*`, `city_xixia`, `mt_baituo` and `sect_xingxiu` (the place the hero is in, or last stood in on a road or in a dialog).

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
| exploring a desert place | `desert` |
| on a road, or in a wild place (`cave_`, `cliff_`, `mt_`, `valley_`, `peak_`…) | `wilds` |
| exploring elsewhere | the place's region (`regionOf`): `heartland`, `north`, `south`, `east`; the west's non-desert places play `world` (the themes) |

`exploringTrack(place, onRoad, region)` in `lib/audio/recordings.ts` makes the choice. The 7 new files were Suno MP3s, re-encoded with the command above (−16 LUFS, ~110 kb/s); 2.5–3 MB each.

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
| a dialog or cutscene line types out | `keyTick` — keyboard keystrokes (a high-passed switch click over a band-passed keycap thock, now and then a lower space bar), self-throttled to 10–16 keys a second; silent with instant text or reduced motion |
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

- **Every landed hit** goes through `punch(at, vel, crunch)` (`lib/audio/engine.ts`): a sub-bass drop (110 → 38 Hz), a driven low-pass noise smack, a 15 ms high crack, and on a critical a bone crunch of four tight clicks. Fists and palms (impact) hit hardest and add a second smack on the follow-through.
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

**A recording:** encode it with the command in [Recordings](#recordings), put it in `public/audio/`, and list it under its track in `RECORDINGS` (a new track also needs a `TrackId`, a synth stand-in in `SONGS` and a rule in `SoundDirector`).

**A synth song:**

1. Write the notes in `lib/audio/songs.ts` with `phrase(...)`. Keep to the song's pentatonic mode; the test checks the leads.
2. Add the id to `TrackId` and an entry to `SONGS`, with `loop: true` for background music.
3. Choose when it plays in `components/sound-director.tsx`.
4. Run `bun run test:audio`, then listen in the browser (audio needs a click first).

For a new instrument, add a synth voice to `engine.ts` and the name to `Instrument`.
