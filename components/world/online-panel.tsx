"use client";

// Online sign-in (docs/online.md): username + password against the game
// server. Shown on the title screen and from the HUD's ออนไลน์ button; hidden
// while no server is set (lib/net/config.ts).
import { useState, useSyncExternalStore } from "react";
import { AUTH_ERROR_TEXT, signedIn, useOnlineStore } from "@/store/online-store";
import { gameServerUrl } from "@/lib/net/config";
import { Modal } from "@/components/ui/modal";

const noSubscribe = () => () => {};

/** The game server's address, read on the client only (it may come from localStorage). */
export function useGameServer(): string | null {
  return useSyncExternalStore(noSubscribe, gameServerUrl, () => null);
}

const STATUS_TEXT = {
  off: "ไม่ได้เชื่อมต่อ",
  connecting: "กำลังเชื่อมต่อ…",
  online: "ออนไลน์",
  offline: "รอเชื่อมต่อ",
  replaced: "เข้าสู่ระบบจากที่อื่นแล้ว",
} as const;

export function OnlinePanel({ compact = false }: { compact?: boolean }) {
  const username = useOnlineStore((s) => s.username);
  const active = useOnlineStore(signedIn);
  const status = useOnlineStore((s) => s.status);
  const roomSize = useOnlineStore((s) => s.roomSize);
  const signIn = useOnlineStore((s) => s.signIn);
  const signOut = useOnlineStore((s) => s.signOut);
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (active && username) {
    return (
      <div className="online-panel" data-testid="online-panel" data-online-status={status}>
        <p className="online-who">ยุทธภพออนไลน์ · <b data-testid="online-username">{username}</b></p>
        <p className="online-status">
          <span className={`online-dot online-dot-${status}`} aria-hidden="true" />
          {STATUS_TEXT[status]}{status === "online" && ` · ในแผนที่นี้ ${roomSize} คน`}
        </p>
        <button type="button" className="online-signout" onClick={signOut}>ออกจากระบบ</button>
      </div>
    );
  }
  const submit = async (mode: "login" | "register") => {
    setBusy(true);
    setError(null);
    const result = await signIn(mode, user, password);
    setBusy(false);
    if (!result.ok) setError(AUTH_ERROR_TEXT[result.error] ?? `เข้าสู่ระบบไม่สำเร็จ (${result.error})`);
    else setPassword("");
  };
  return (
    <form className={`online-panel${compact ? " online-panel-compact" : ""}`} data-testid="online-panel" data-online-status="off"
      onSubmit={(event) => { event.preventDefault(); void submit("login"); }}>
      <p className="online-who">ยุทธภพออนไลน์ <small>เห็นจอมยุทธ์คนอื่นเดินอยู่ในแผนที่เดียวกัน</small></p>
      <label className="online-field">
        <span>ชื่อผู้ใช้</span>
        <input id="online-username" name="username" autoComplete="username" value={user} onChange={(e) => setUser(e.target.value)}
          maxLength={20} placeholder="a–z 0–9 _" />
      </label>
      <label className="online-field">
        <span>รหัสผ่าน</span>
        <input id="online-password" name="password" type="password" autoComplete="current-password" value={password}
          onChange={(e) => setPassword(e.target.value)} maxLength={72} />
      </label>
      {error && <p className="online-error" role="alert">{error}</p>}
      <div className="online-actions">
        <button type="submit" disabled={busy || !user || !password}>เข้าสู่ระบบ</button>
        <button type="button" disabled={busy || !user || !password} onClick={() => void submit("register")}>สมัครบัญชี</button>
      </div>
    </form>
  );
}

/** The HUD's ออนไลน์ button (after ♪): a status dot, and the panel in a window. */
export function OnlineButton({ className = "hud-icon" }: { className?: string }) {
  const server = useGameServer();
  const active = useOnlineStore(signedIn);
  const status = useOnlineStore((s) => s.status);
  const roomSize = useOnlineStore((s) => s.roomSize);
  const [open, setOpen] = useState(false);
  if (!server) return null;
  const others = Math.max(0, roomSize - 1);
  return (
    <>
      <button type="button" className={className} aria-label="ออนไลน์" title="ยุทธภพออนไลน์" data-testid="online-button"
        data-online-status={active ? status : "off"} onClick={() => setOpen(true)}>
        <span className="hud-icon-glyph" aria-hidden="true">🌐</span>
        <span className="hud-icon-label" aria-hidden="true">ออนไลน์</span>
        {active && status === "online" && others > 0 && <b className="hud-icon-badge" aria-hidden="true">{others}</b>}
        <span className={`online-dot online-dot-${active ? status : "off"} online-dot-corner`} aria-hidden="true" />
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="ยุทธภพออนไลน์" maxWidth="max-w-md">
        <OnlinePanel />
      </Modal>
    </>
  );
}
