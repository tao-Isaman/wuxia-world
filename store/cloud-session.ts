"use client";

// Characters on the game server (docs/online.md#characters-and-saves): the
// account's character list, and entering / leaving one. Entering binds the
// server save (lib/net/cloud-save.ts) to the world store, loads the shared
// world everyone plays in (store/cloud-world.ts), hydrates the store from the
// save (or starts a new hero for a character never played) and then lets
// saves flow. Leaving writes what is pending and empties the store. Only used
// with a game server set.
import { create } from "zustand";
import {
  ApiFailure, createCharacter, deleteCharacter, listCharacters, storeSave,
  type CharacterInfo, type SaveBlob,
} from "@/lib/net/client";
import { cloudMode, cloudSave, type CloudStatus } from "@/lib/net/cloud-save";
import { gameServerUrl } from "@/lib/net/config";
import { PLAYER_FROM_WORLD_KEYS, SHARED_WORLD_KEYS } from "@/lib/world/shared/world";
import { clearMapPositions } from "@/lib/stage/types";
import { useWorldStore } from "./world-store";
import { useBattleStore } from "./battle-store";
import { useOnlineStore } from "./online-store";
import { emptyData } from "./world/state";
import { attachSharedWorld, SHARED_WORLD_KEY } from "./world/shared-local";
import { migrateSave } from "./world/persist";
import { SAVE_VERSION } from "./world/save-version";
import { fetchServerWorld, followServerWorld, stopServerWorld } from "./cloud-world";
import { cloudBattle } from "./cloud-battle";
import { toast } from "./toast-store";

export type SessionPhase = "select" | "entering" | "playing";

/** The local save of the days before server saves, offered once for import. */
const LOCAL_SAVE_KEY = "wusia-world-v1";
const IMPORTED_KEY = "wuxia-imported-v1";
/** Gold an imported hero keeps (the server's whole allowance for a first save). */
export const IMPORT_GOLD_CAP = 100_000;

export const CLOUD_ERROR_TEXT: Record<string, string> = {
  bad_name: "ชื่อตัวละครต้องยาว 1–24 ตัวอักษร",
  name_taken: "มีตัวละครชื่อนี้ในบัญชีแล้ว",
  too_many: "บัญชีหนึ่งมีตัวละครได้ไม่เกิน 4 ตัว",
  no_character: "ไม่พบตัวละครนี้",
  stale: "ตัวละครนี้ถูกบันทึกจากที่อื่น",
  gold_too_fast: "ทองเพิ่มเร็วผิดปกติ",
  bad_save: "ข้อมูลตัวละครผิดรูปแบบ",
  name_mismatch: "ชื่อในบันทึกไม่ตรงกับตัวละคร",
  bad_version: "บันทึกเก่าเกินไป",
  too_large: "บันทึกใหญ่เกินกำหนด",
  network: "ติดต่อเซิร์ฟเวอร์ไม่ได้",
};

export const cloudErrorText = (code: string) => CLOUD_ERROR_TEXT[code.split(":")[0]] ?? `ไม่สำเร็จ (${code})`;

interface LocalHero {
  name: string;
  gender: "male" | "female";
  save: SaveBlob;
}

/** This browser's old local save, if it has a hero not imported yet. */
export function localHero(): LocalHero | null {
  try {
    if (localStorage.getItem(IMPORTED_KEY)) return null;
    const raw = localStorage.getItem(LOCAL_SAVE_KEY);
    if (!raw) return null;
    const save = JSON.parse(raw) as SaveBlob;
    const state = save?.state as { hasGame?: boolean; gender?: string; playerBuild?: { name?: string } } | undefined;
    const name = state?.playerBuild?.name?.trim();
    if (!state?.hasGame || !name) return null;
    return { name, gender: state.gender === "female" ? "female" : "male", save };
  } catch {
    return null;
  }
}

interface CloudSessionState {
  phase: SessionPhase;
  /** The account's characters (`null` until loaded). */
  characters: CharacterInfo[] | null;
  current: CharacterInfo | null;
  busy: boolean;
  error: string | null;
  saveStatus: CloudStatus;
  refresh: () => Promise<void>;
  create: (name: string, gender: "male" | "female") => Promise<boolean>;
  enter: (character: CharacterInfo) => Promise<void>;
  leave: () => Promise<void>;
  remove: (id: string) => Promise<boolean>;
  importLocal: () => Promise<boolean>;
  signOut: () => Promise<void>;
}

function credentials(): { server: string; token: string } | null {
  const server = gameServerUrl();
  const token = useOnlineStore.getState().token;
  return server && token ? { server, token } : null;
}

const codeOf = (error: unknown) => (error instanceof ApiFailure ? error.code : "network");

let detachWorld: (() => void) | null = null;
let leaving = false;

/** Empty the world store without writing a save (writes are off while no character is bound). */
function emptyStore(): void {
  useBattleStore.getState().reset();
  clearMapPositions();
  useWorldStore.setState({ ...emptyData() });
}

export const useCloudSession = create<CloudSessionState>()((set, get) => ({
  phase: "select",
  characters: null,
  current: null,
  busy: false,
  error: null,
  saveStatus: "off",

  async refresh() {
    const auth = credentials();
    if (!auth) return;
    try {
      set({ characters: await listCharacters(auth.server, auth.token), error: null });
    } catch (error) {
      set({ error: codeOf(error), characters: get().characters ?? [] });
    }
  },

  async create(name, gender) {
    const auth = credentials();
    if (!auth || get().busy) return false;
    set({ busy: true, error: null });
    try {
      const character = await createCharacter(auth.server, auth.token, name.trim(), gender);
      set({ busy: false });
      await get().enter(character);
      return true;
    } catch (error) {
      set({ busy: false, error: codeOf(error) });
      return false;
    }
  },

  async enter(character) {
    const auth = credentials();
    if (!auth) return;
    if (cloudSave.characterId) await get().leave();
    set({ phase: "entering", busy: true, error: null, current: character });
    try {
      cloudSave.select(auth.server, auth.token, character.id);
      // The one world everyone plays in, as the server runs it.
      const { rev, world } = await fetchServerWorld(auth.server, auth.token);
      cloudSave.setWorld(world);
      emptyStore();
      await useWorldStore.persist.rehydrate();
      detachWorld = attachSharedWorld(useWorldStore, cloudSave.world);
      // Never played: the hero starts now, in the world as it is.
      if (!useWorldStore.getState().hasGame) {
        useWorldStore.getState().startNewGame({ name: character.name, gender: character.gender, bodyId: character.body });
      }
      followServerWorld(auth.server, auth.token, rev);
      cloudSave.resume();
      // Write once at entry: a new hero's first save.
      useWorldStore.setState({});
      useOnlineStore.setState({ characterId: character.id });
      set({ phase: "playing", busy: false });
    } catch (error) {
      detachWorld?.();
      detachWorld = null;
      stopServerWorld();
      cloudSave.clear();
      emptyStore();
      set({ phase: "select", busy: false, current: null, error: codeOf(error) });
    }
  },

  async leave() {
    if (leaving) return;
    leaving = true;
    try {
      if (cloudSave.status !== "conflict" && cloudSave.status !== "rejected") await cloudSave.flushAll();
      detachWorld?.();
      detachWorld = null;
      stopServerWorld();
      cloudBattle.stop();
      cloudSave.clear();
      emptyStore();
      useOnlineStore.setState({ characterId: null });
      set({ phase: "select", current: null });
    } finally {
      leaving = false;
    }
    await get().refresh();
  },

  async remove(id) {
    const auth = credentials();
    if (!auth || get().busy) return false;
    set({ busy: true, error: null });
    try {
      await deleteCharacter(auth.server, auth.token, id);
      if (useOnlineStore.getState().characterId === id) useOnlineStore.setState({ characterId: null });
      set({ busy: false });
      await get().refresh();
      return true;
    } catch (error) {
      set({ busy: false, error: codeOf(error) });
      return false;
    }
  },

  async importLocal() {
    const auth = credentials();
    const hero = localHero();
    if (!auth || !hero || get().busy) return false;
    set({ busy: true, error: null });
    try {
      const character = await createCharacter(auth.server, auth.token, hero.name, hero.gender);
      // The save as the game would load it, without the shared world (the
      // server runs one world for everyone); the hero's own deeds that an
      // older browser kept in its world come along.
      const version = Math.max(hero.save.version ?? 0, SAVE_VERSION);
      const state = (hero.save.version ?? 0) < SAVE_VERSION
        ? migrateSave(hero.save.state, hero.save.version ?? 0) as unknown as Record<string, unknown>
        : { ...hero.save.state };
      let localWorld: Record<string, unknown> | null = null;
      try {
        localWorld = (JSON.parse(localStorage.getItem(SHARED_WORLD_KEY) ?? "null") as { world?: Record<string, unknown> } | null)?.world ?? null;
      } catch {
        localWorld = null;
      }
      for (const key of PLAYER_FROM_WORLD_KEYS) {
        const own = state[key];
        const empty = own === undefined || own === null || (typeof own === "object" && Object.keys(own as object).length === 0);
        if (empty && localWorld?.[key] !== undefined) state[key] = localWorld[key];
      }
      for (const key of SHARED_WORLD_KEYS) delete state[key];
      state.gold = Math.min(Number(state.gold) || 0, IMPORT_GOLD_CAP);
      await storeSave(auth.server, auth.token, character.id, 0, { version, state });
      try { localStorage.setItem(IMPORTED_KEY, hero.name); } catch { /* blocked storage: the offer stays */ }
      set({ busy: false });
      await get().refresh();
      return true;
    } catch (error) {
      set({ busy: false, error: codeOf(error) });
      await get().refresh();
      return false;
    }
  },

  async signOut() {
    await get().leave();
    set({ characters: null });
    useOnlineStore.getState().signOut();
  },
}));

let started = false;

/** Wire the session once (OnlineBridge): resume the last character, follow the save status, write on close. */
export function startCloudSession(): void {
  if (started || typeof window === "undefined" || !cloudMode()) return;
  started = true;
  cloudSave.subscribe(() => {
    const status = cloudSave.status;
    const before = useCloudSession.getState().saveStatus;
    useCloudSession.setState({ saveStatus: status });
    if (status === before) return;
    if (status === "conflict") {
      toast("warn", "ตัวละครนี้ถูกเล่นจากที่อื่น · กลับไปหน้าเลือกตัวละคร");
      void useCloudSession.getState().leave();
    } else if (status === "rejected") {
      toast("error", `เซิร์ฟเวอร์ไม่รับบันทึก: ${cloudErrorText(cloudSave.lastError ?? "")} · โหลดบันทึกล่าสุดใหม่`);
      void useCloudSession.getState().leave();
    } else if (status === "offline" && before !== "offline") {
      toast("warn", "บันทึกไม่ได้ชั่วคราว · จะลองใหม่อัตโนมัติ");
    }
  });
  // A reset hero (the old game over) starts again as the same character.
  useWorldStore.subscribe((s, prev) => {
    const session = useCloudSession.getState();
    if (session.phase !== "playing" || leaving || s.hasGame || !prev.hasGame || !session.current) return;
    const c = session.current;
    queueMicrotask(() => useWorldStore.getState().startNewGame({ name: c.name, gender: c.gender, bodyId: c.body }));
  });
  const flush = () => { void cloudSave.flushAll(true); };
  window.addEventListener("pagehide", flush);
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); });
}

/** Signed in with no character open: load the list and re-enter the last one played. */
export async function resumeLastCharacter(): Promise<void> {
  const session = useCloudSession.getState();
  if (session.phase !== "select" || session.busy) return;
  await session.refresh();
  const last = useOnlineStore.getState().characterId;
  const character = last ? useCloudSession.getState().characters?.find((c) => c.id === last) : undefined;
  if (character && useCloudSession.getState().phase === "select") await useCloudSession.getState().enter(character);
}
