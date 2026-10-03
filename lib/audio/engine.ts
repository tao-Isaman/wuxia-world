import { SONGS, beatSeconds, type Instrument, type NoteEvent, type Song, type TrackId } from "./songs";
import { RECORDINGS } from "./recordings";

/**
 * Procedural audio: every instrument and sound effect is synthesized with
 * the Web Audio API. The main background tracks also have recordings
 * (lib/audio/recordings.ts) streamed through the same music bus; the
 * synthesized songs stand in when a recording can't load (offline, say).
 * The context starts on the first tap / key press (browser autoplay rules)
 * and sleeps while the tab is hidden.
 */

export interface AudioSettings { music: boolean; sfx: boolean; musicVolume: number; sfxVolume: number }
const SETTINGS_KEY = "wuxia-audio-v1";
const DEFAULT_SETTINGS: AudioSettings = { music: true, sfx: true, musicVolume: 0.55, sfxVolume: 0.8 };

type Ctx = BaseAudioContext;
interface Graph { ctx: Ctx; master: GainNode; music: GainNode; sfx: GainNode; reverb: ConvolverNode; reverbSend: GainNode }

let graph: Graph | null = null;
let settings: AudioSettings = loadSettings();
const listeners = new Set<() => void>();
const pluckCache = new Map<string, AudioBuffer>();
let noiseBuffer: AudioBuffer | null = null;

function loadSettings(): AudioSettings {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(SETTINGS_KEY) : null;
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
  } catch { return { ...DEFAULT_SETTINGS }; }
}
export function getAudioSettings(): AudioSettings { return settings; }
export function subscribeAudio(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }
export function setAudioSettings(next: Partial<AudioSettings>) {
  settings = { ...settings, ...next };
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* private mode */ }
  applyVolumes();
  listeners.forEach((listener) => listener());
}
function applyVolumes() {
  if (!graph) return;
  recorded.sync();
  const now = graph.ctx.currentTime;
  graph.music.gain.setTargetAtTime(settings.music ? settings.musicVolume * 0.5 : 0, now, 0.15);
  graph.sfx.gain.setTargetAtTime(settings.sfx ? settings.sfxVolume * 0.7 : 0, now, 0.05);
}

/** Create (or resume) the audio graph. Call from a user gesture. */
export function unlockAudio(): boolean {
  if (typeof window === "undefined") return false;
  const AudioCtor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return false;
  if (!graph) {
    try {
      graph = buildGraph(new AudioCtor({ latencyHint: "interactive" }));
      applyVolumes();
      document.addEventListener("visibilitychange", () => {
        if (!graph) return;
        const live = graph.ctx as AudioContext;
        if (document.hidden) void live.suspend(); else void live.resume();
        recorded.sync();
      });
    } catch { return false; }
  }
  const live = graph.ctx as AudioContext;
  if (live.state === "suspended") void live.resume();
  document.documentElement.dataset.audio = live.state;
  live.onstatechange = () => { document.documentElement.dataset.audio = live.state; };
  sequencer.kick();
  return true;
}

function buildGraph(ctx: Ctx): Graph {
  const master = ctx.createGain();
  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -14; compressor.ratio.value = 4;
  master.connect(compressor).connect(ctx.destination);
  const music = ctx.createGain(), sfx = ctx.createGain();
  music.connect(master); sfx.connect(master);
  const reverb = ctx.createConvolver();
  reverb.buffer = hallImpulse(ctx);
  const reverbSend = ctx.createGain();
  reverbSend.gain.value = 0.32;
  reverbSend.connect(reverb).connect(master);
  return { ctx, master, music, sfx, reverb, reverbSend };
}

/**
 * Render a track to an AudioBuffer offline (previews and level checks).
 * Uses the same instruments and mix as live play at default volume.
 */
export async function renderTrack(track: TrackId, seconds: number, sampleRate = 44100): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(2, Math.ceil(sampleRate * seconds), sampleRate);
  const offline = buildGraph(ctx);
  offline.music.gain.value = DEFAULT_SETTINGS.musicVolume * 0.5;
  const song = SONGS[track], spb = beatSeconds(song);
  const saved = graph;
  graph = offline;
  try {
    for (let loop = 0; loop * song.beats * spb < seconds; loop++) {
      for (const event of song.events) {
        const at = (loop * song.beats + event.at) * spb;
        if (at < seconds) playInstrument(event.instrument, event.midi, at, event.len, event.vel, offline.music, spb);
      }
      if (!song.loop) break;
    }
  } finally { graph = saved; }
  return ctx.startRendering();
}

// ── Building blocks ────────────────────────────────────────────────────
const freq = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

function hallImpulse(ctx: Ctx): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * 2.6);
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3.2 * (i < 400 ? i / 400 : 1);
  }
  return buffer;
}
function noise(ctx: Ctx): AudioBuffer {
  if (noiseBuffer && noiseBuffer.sampleRate === ctx.sampleRate) return noiseBuffer;
  noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return noiseBuffer;
}
/** Karplus–Strong plucked string, rendered once per pitch and cached. */
function pluck(ctx: Ctx, midi: number, brightness: number, seconds: number): AudioBuffer {
  const key = `${midi}:${brightness}:${seconds}`;
  const cached = pluckCache.get(key);
  if (cached) return cached;
  const rate = ctx.sampleRate, period = rate / freq(midi);
  const length = Math.floor(rate * seconds);
  const buffer = ctx.createBuffer(1, length, rate);
  const out = buffer.getChannelData(0);
  const size = Math.max(2, Math.round(period));
  const ring = new Float32Array(size);
  let last = 0;
  for (let i = 0; i < size; i++) { const n = Math.random() * 2 - 1; last = last + brightness * (n - last); ring[i] = last; }
  const decay = 0.996 + Math.min(0.0035, midi / 30000);
  let index = 0;
  for (let i = 0; i < length; i++) {
    const current = ring[index], next = ring[(index + 1) % size];
    out[i] = current;
    ring[index] = (current + next) * 0.5 * decay;
    index = (index + 1) % size;
  }
  pluckCache.set(key, buffer);
  return buffer;
}
function envelope(ctx: Ctx, at: number, attack: number, peak: number, hold: number, release: number): GainNode {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), at + attack);
  gain.gain.setValueAtTime(Math.max(0.0002, peak), at + attack + hold);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + attack + hold + release);
  return gain;
}
function out(node: AudioNode, bus: GainNode, wet = 0.3) {
  if (!graph) return;
  node.connect(bus);
  if (wet > 0) { const send = graph.ctx.createGain(); send.gain.value = wet; node.connect(send).connect(graph.reverbSend); }
}

// ── Instruments ────────────────────────────────────────────────────────
function playInstrument(instrument: Instrument, midi: number, at: number, len: number, vel: number, bus: GainNode, spb: number) {
  if (!graph) return;
  const ctx = graph.ctx;
  const seconds = len * spb;
  switch (instrument) {
    case "zheng":
    case "bass": {
      const bass = instrument === "bass";
      const source = ctx.createBufferSource();
      source.buffer = pluck(ctx, midi, bass ? 0.35 : 0.72, bass ? 2.4 : 2.8);
      const body = ctx.createBiquadFilter();
      body.type = "peaking"; body.frequency.value = bass ? 180 : 1400; body.gain.value = 4; body.Q.value = 1.2;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(vel * (bass ? 0.9 : 0.7), at);
      gain.gain.setTargetAtTime(0.0001, at + Math.max(seconds, bass ? 0.4 : 0.8), bass ? 0.35 : 0.6);
      source.connect(body).connect(gain);
      out(gain, bus, bass ? 0.12 : 0.35);
      source.start(at); source.stop(at + (bass ? 2.4 : 2.8));
      break;
    }
    case "flute":
    case "erhu": {
      const erhu = instrument === "erhu";
      const osc = ctx.createOscillator();
      osc.type = erhu ? "sawtooth" : "sine";
      osc.frequency.setValueAtTime(freq(midi), at);
      // Singing vibrato that blooms after the attack.
      const lfo = ctx.createOscillator(), depth = ctx.createGain();
      lfo.frequency.value = erhu ? 6.2 : 5.4;
      depth.gain.setValueAtTime(0, at);
      depth.gain.linearRampToValueAtTime(freq(midi) * (erhu ? 0.012 : 0.007), at + Math.min(0.35, seconds * 0.6));
      lfo.connect(depth).connect(osc.frequency);
      const tone = ctx.createBiquadFilter();
      tone.type = "lowpass"; tone.frequency.value = erhu ? 2600 : 5200; tone.Q.value = erhu ? 2 : 0.5;
      const env = envelope(ctx, at, erhu ? 0.05 : 0.07, vel * (erhu ? 0.2 : 0.32), Math.max(0.01, seconds - 0.12), erhu ? 0.12 : 0.22);
      osc.connect(tone).connect(env);
      if (!erhu) {
        // A second, quieter octave partial and a breath of air.
        const overtone = ctx.createOscillator(), oGain = ctx.createGain();
        overtone.frequency.value = freq(midi) * 2; oGain.gain.value = 0.12;
        overtone.connect(oGain).connect(env);
        overtone.start(at); overtone.stop(at + seconds + 0.3);
        const air = ctx.createBufferSource(), band = ctx.createBiquadFilter(), airGain = ctx.createGain();
        air.buffer = noise(ctx); band.type = "bandpass"; band.frequency.value = freq(midi) * 2; band.Q.value = 3; airGain.gain.value = 0.18;
        air.connect(band).connect(airGain).connect(env);
        air.start(at, Math.random()); air.stop(at + seconds + 0.3);
      }
      out(env, bus, 0.4);
      osc.start(at); lfo.start(at);
      osc.stop(at + seconds + 0.3); lfo.stop(at + seconds + 0.3);
      break;
    }
    case "taiko": {
      const osc = ctx.createOscillator();
      const low = midi <= 40;
      osc.frequency.setValueAtTime(low ? 120 : 190, at);
      osc.frequency.exponentialRampToValueAtTime(low ? 42 : 80, at + 0.22);
      const env = envelope(ctx, at, 0.004, vel * 0.9, 0.02, low ? 0.45 : 0.22);
      osc.connect(env);
      const skin = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), sGain = envelope(ctx, at, 0.002, vel * 0.35, 0, 0.06);
      skin.buffer = noise(ctx); lp.type = "lowpass"; lp.frequency.value = 900;
      skin.connect(lp).connect(sGain);
      out(env, bus, 0.18); out(sGain, bus, 0.1);
      osc.start(at); osc.stop(at + 0.6); skin.start(at, Math.random()); skin.stop(at + 0.1);
      break;
    }
    case "block": {
      const osc = ctx.createOscillator();
      osc.frequency.value = freq(midi);
      const env = envelope(ctx, at, 0.002, vel * 0.5, 0, 0.07);
      osc.connect(env); out(env, bus, 0.15);
      osc.start(at); osc.stop(at + 0.12);
      break;
    }
    case "gong":
    case "bell": {
      const gong = instrument === "gong";
      const base = freq(midi);
      const partials = gong ? [1, 1.48, 2.09, 2.56, 3.17, 4.22] : [1, 2.76, 5.4];
      partials.forEach((ratio, i) => {
        const osc = ctx.createOscillator();
        osc.frequency.setValueAtTime(base * ratio * (1 + (i % 2 ? 0.003 : -0.002)), at);
        if (gong) osc.frequency.exponentialRampToValueAtTime(base * ratio * 0.985, at + 3);
        const env = envelope(ctx, at, gong ? 0.02 : 0.003, vel * (gong ? 0.22 : 0.3) / (1 + i * 0.7), 0, (gong ? 5 : 1.8) / (1 + i * 0.35));
        osc.connect(env); out(env, bus, gong ? 0.55 : 0.4);
        osc.start(at); osc.stop(at + (gong ? 6 : 2));
      });
      break;
    }
  }
}

// ── Recorded music: streamed <audio> elements routed into the music bus ──
const recorded = (() => {
  const elements = new Map<string, HTMLAudioElement>();
  const broken = new Set<string>();
  let urls: readonly string[] = [];
  let index = 0;
  let active: HTMLAudioElement | null = null;
  let onFail: (() => void) | null = null;

  function element(url: string): HTMLAudioElement | null {
    if (!graph || typeof Audio === "undefined") return null;
    let el = elements.get(url);
    if (!el) {
      el = new Audio(url);
      el.preload = "auto";
      try { (graph.ctx as AudioContext).createMediaElementSource(el).connect(graph.music); } catch { return null; }
      el.addEventListener("error", () => {
        broken.add(url);
        if (active === el) { active = null; const fail = onFail; onFail = null; fail?.(); }
      });
      // Versions follow one another; a single recording loops.
      el.addEventListener("ended", () => { if (active === el && urls.length > 1) playIndex((index + 1) % urls.length); });
      elements.set(url, el);
    }
    return el;
  }
  function playIndex(i: number) {
    const el = element(urls[i]);
    if (!el) { const fail = onFail; onFail = null; active = null; fail?.(); return; }
    index = i;
    active = el;
    el.loop = urls.length === 1;
    el.currentTime = 0;
    sync();
  }
  /** Play or pause the active recording to match the settings and the tab. */
  function sync() {
    if (!active) return;
    const audible = settings.music && !(typeof document !== "undefined" && document.hidden);
    if (audible && active.paused) void active.play().catch(() => { /* waits for the next gesture */ });
    else if (!audible && !active.paused) active.pause();
  }
  return {
    /** Whether `track` has a recording that hasn't failed. */
    has(track: TrackId) { return (RECORDINGS[track] ?? []).some((url) => !broken.has(url)); },
    /** Start (or resume) the track's recording; `fail` falls back if it can't load. */
    play(track: TrackId, fail: () => void) {
      const next = (RECORDINGS[track] ?? []).filter((url) => !broken.has(url));
      onFail = fail;
      if (active && next.join("|") === urls.join("|")) { sync(); return; }
      active?.pause();
      urls = next;
      // Several versions: start on a random one so each session sounds a little different.
      playIndex(Math.floor(Math.random() * urls.length));
    },
    /** Hold the recording (a jingle is playing); `play` with the same track resumes it. */
    pause() { active?.pause(); },
    stop() { active?.pause(); active = null; urls = []; onFail = null; },
    sync,
  };
})();

// ── Sequencer: look-ahead scheduling so timing survives busy frames ────
const sequencer = (() => {
  let song: Song | null = null;
  let wanted: TrackId | null = null;
  let loopStart = 0;
  let cursor = 0;
  let timer: ReturnType<typeof setInterval> | null = null;
  let events: NoteEvent[] = [];
  let after: TrackId | null = null;

  let playing: TrackId | null = null;
  function start(track: TrackId) {
    if (!graph) return;
    playing = track;
    document.documentElement.dataset.music = track;
    graph.music.gain.cancelScheduledValues(graph.ctx.currentTime);
    if (SONGS[track].loop && recorded.has(track)) {
      // A recording plays instead of the synth song; the synth takes over if it fails.
      song = null; events = [];
      document.documentElement.dataset.musicSource = "recording";
      recorded.play(track, () => { if (playing === track) startSynth(track); });
      applyVolumes();
      return;
    }
    // A jingle holds the recording where it is; another synth track ends it.
    if (SONGS[track].loop) recorded.stop(); else recorded.pause();
    startSynth(track);
  }
  function startSynth(track: TrackId) {
    if (!graph) return;
    song = SONGS[track];
    events = [...song.events].sort((a, b) => a.at - b.at);
    loopStart = graph.ctx.currentTime + 0.12;
    cursor = 0;
    if (song.loop) document.documentElement.dataset.musicSource = "synth";
    applyVolumes();
  }
  function tick() {
    if (!graph || !song || (graph.ctx as AudioContext).state !== "running") return;
    const spb = beatSeconds(song);
    const horizon = graph.ctx.currentTime + 0.25;
    while (true) {
      if (cursor >= events.length) {
        if (!song.loop) {
          // A jingle hands back to the scene's track once it has rung out.
          if (graph.ctx.currentTime > loopStart + song.beats * spb + 0.8 && after) { const next = after; after = null; start(next); }
          return;
        }
        loopStart += song.beats * spb;
        cursor = 0;
      }
      const event = events[cursor];
      const at = loopStart + event.at * spb;
      if (at > horizon) return;
      if (at >= graph.ctx.currentTime - 0.05) playInstrument(event.instrument, event.midi, Math.max(at, graph.ctx.currentTime), event.len, event.vel, graph.music, spb);
      cursor++;
    }
  }
  return {
    /** Switch the looping track (crossfading), or play a one-shot jingle then return. */
    play(track: TrackId, returnTo?: TrackId | null) {
      const jingle = !SONGS[track].loop;
      if (jingle) {
        // Jingles only make sense once sound is running; they then hand back
        // to `returnTo` (default: the current track; null: silence).
        if (!graph || (graph.ctx as AudioContext).state !== "running" || !settings.music) return;
        after = returnTo === undefined ? wanted : returnTo;
        if (returnTo !== undefined) wanted = returnTo;
      } else {
        if (wanted === track && (playing === track || !graph)) return;
        wanted = track; after = null;
      }
      if (!graph) { document.documentElement.dataset.music = track; return; }
      const now = graph.ctx.currentTime;
      graph.music.gain.cancelScheduledValues(now);
      graph.music.gain.setTargetAtTime(0.0001, now, 0.12);
      const next = track;
      setTimeout(() => start(next), 380);
    },
    current: () => wanted,
    stop() {
      wanted = null; after = null; song = null; events = []; playing = null;
      recorded.stop();
      delete document.documentElement.dataset.music;
      if (graph) graph.music.gain.setTargetAtTime(0.0001, graph.ctx.currentTime, 0.3);
    },
    kick() {
      if (!timer) timer = setInterval(tick, 40);
      if (wanted && playing !== wanted && !after) start(wanted);
    },
  };
})();

export function playMusic(track: TrackId) { sequencer.play(track); }
/** A one-shot cue; afterwards the music returns to `returnTo` (null = silence, omitted = current track). */
export function playJingle(track: TrackId, returnTo?: TrackId | null) { sequencer.play(track, returnTo); }
export function stopMusic() { sequencer.stop(); }

// ── Sound effects ──────────────────────────────────────────────────────
function sfxBus(): GainNode | null {
  if (!graph || (graph.ctx as AudioContext).state !== "running" || !settings.sfx) return null;
  return graph.sfx;
}
/** Filtered-noise swoosh: blades, whooshes, wind. */
export function swoosh(at: number, seconds: number, from: number, to: number, vel: number, q = 1.4) {
  const bus = sfxBus(); if (!bus || !graph) return;
  const ctx = graph.ctx;
  const source = ctx.createBufferSource(); source.buffer = noise(ctx);
  const band = ctx.createBiquadFilter(); band.type = "bandpass"; band.Q.value = q;
  band.frequency.setValueAtTime(from, at); band.frequency.exponentialRampToValueAtTime(to, at + seconds);
  const env = envelope(ctx, at, seconds * 0.25, vel, 0, seconds * 0.75);
  source.connect(band).connect(env); out(env, bus, 0.25);
  source.start(at, Math.random()); source.stop(at + seconds + 0.05);
}
/** Pitched tone with a glide: chimes, whistles, charge-ups. */
export function tone(at: number, seconds: number, from: number, to: number, vel: number, type: OscillatorType = "sine", wet = 0.35) {
  const bus = sfxBus(); if (!bus || !graph) return;
  const ctx = graph.ctx;
  const osc = ctx.createOscillator(); osc.type = type;
  osc.frequency.setValueAtTime(from, at); osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), at + seconds);
  const env = envelope(ctx, at, Math.min(0.02, seconds * 0.2), vel, 0, seconds * 0.8);
  osc.connect(env); out(env, bus, wet);
  osc.start(at); osc.stop(at + seconds + 0.05);
}
/** Body thump: punches, impacts, footfalls. */
export function thump(at: number, vel: number, pitch = 150) {
  const bus = sfxBus(); if (!bus || !graph) return;
  const ctx = graph.ctx;
  const osc = ctx.createOscillator();
  osc.frequency.setValueAtTime(pitch, at); osc.frequency.exponentialRampToValueAtTime(pitch * 0.35, at + 0.16);
  const env = envelope(ctx, at, 0.003, vel, 0.01, 0.2);
  osc.connect(env); out(env, bus, 0.12);
  osc.start(at); osc.stop(at + 0.3);
  swoosh(at, 0.05, 1200, 400, vel * 0.5, 0.8);
}
/** One instrument note through the effects bus (bells, plucks, gongs as SFX). */
export function note(instrument: Instrument, midi: number, at: number, vel: number, beats = 1) {
  const bus = sfxBus(); if (!bus) return;
  playInstrument(instrument, midi, at, beats, vel, bus, 0.5);
}
export function now(): number { return graph ? graph.ctx.currentTime : 0; }
export function audioReady(): boolean { return !!sfxBus(); }

// ── UI sounds ──────────────────────────────────────────────────────────
export const uiSound = {
  tap() { const t = now(); note("block", 86, t, 0.25); },
  open() { const t = now(); note("zheng", 74, t, 0.35); note("zheng", 81, t + 0.06, 0.3); },
  coin() { const t = now(); note("bell", 93, t, 0.35); note("bell", 98, t + 0.08, 0.35); },
  step() { const t = now(); swoosh(t, 0.25, 400, 900, 0.18); },
  rest() { const t = now(); [74, 71, 69, 66].forEach((midi, i) => note("zheng", midi, t + i * 0.18, 0.3)); },
};
