"use client";

// The online sign-in (docs/online.md): the account's session token, saved in
// this browser, and the live status of the room socket (mirrored from
// lib/net/session.ts by components/world/online-bridge.tsx). The game save
// itself stays local; only presence goes online for now.
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AuthFailure, login, register } from "@/lib/net/client";
import { gameServerUrl } from "@/lib/net/config";
import type { OnlineStatus } from "@/lib/net/session";

export interface OnlineState {
  username: string | null;
  token: string | null;
  /** Token expiry, ms since 1970. */
  expires: number | null;
  /** Not saved: the room socket's status and who is in the room (us included). */
  status: OnlineStatus;
  roomSize: number;
  signIn: (mode: "login" | "register", username: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  signOut: () => void;
}

/** Thai messages for the server's auth error codes. */
export const AUTH_ERROR_TEXT: Record<string, string> = {
  bad_username: "ชื่อผู้ใช้ต้องเป็น a–z 0–9 หรือ _ ยาว 3–20 ตัว",
  bad_password: "รหัสผ่านต้องยาว 6–72 ตัวอักษร",
  taken: "ชื่อผู้ใช้นี้มีคนใช้แล้ว",
  wrong_login: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
  no_server: "ยังไม่ได้ตั้งค่าเซิร์ฟเวอร์เกม",
  network: "ติดต่อเซิร์ฟเวอร์ไม่ได้",
};

export const useOnlineStore = create<OnlineState>()(
  persist(
    (set) => ({
      username: null,
      token: null,
      expires: null,
      status: "off",
      roomSize: 0,
      async signIn(mode, username, password) {
        const server = gameServerUrl();
        if (!server) return { ok: false, error: "no_server" };
        try {
          const session = await (mode === "register" ? register : login)(server, username, password);
          set({ username: session.username, token: session.token, expires: session.expires });
          return { ok: true };
        } catch (error) {
          return { ok: false, error: error instanceof AuthFailure ? error.code : "network" };
        }
      },
      // The username stays: this browser's log in step opens with it filled in.
      signOut() {
        set({ token: null, expires: null, status: "off", roomSize: 0 });
      },
    }),
    {
      name: "wuxia-online-v1",
      version: 1,
      partialize: (s) => ({ username: s.username, token: s.token, expires: s.expires }),
    },
  ),
);

/** A saved token still good for at least a minute. */
export const signedIn = (s: Pick<OnlineState, "token" | "expires">) => !!s.token && (s.expires ?? 0) > Date.now() + 60_000;
