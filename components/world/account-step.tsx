"use client";

// Step 1 of the online flow (docs/online.md): sign up or log in, then create
// a character (start-screen.tsx), then play. Shown in place of the hero form
// while a game server is set and the player has no valid login.
import { useState } from "react";
import { AUTH_ERROR_TEXT, useOnlineStore } from "@/store/online-store";

type Mode = "register" | "login";

/** The three steps, with the current one lit. */
export function FlowSteps({ step }: { step: 1 | 2 }) {
  const steps = ["บัญชี", "ตัวละคร", "ออกเดินทาง"];
  return (
    <ol className="flow-steps" aria-label="ขั้นตอน">
      {steps.map((label, index) => (
        <li key={label} data-state={index + 1 < step ? "done" : index + 1 === step ? "current" : "todo"}
          aria-current={index + 1 === step ? "step" : undefined}>
          <span aria-hidden="true">{index + 1 < step ? "✓" : index + 1}</span>{label}
        </li>
      ))}
    </ol>
  );
}

export function AccountStep() {
  const known = useOnlineStore((s) => s.username);
  const signIn = useOnlineStore((s) => s.signIn);
  // A returning player (this browser has signed in before) starts on log in.
  const [mode, setMode] = useState<Mode>(known ? "login" : "register");
  const [username, setUsername] = useState(known ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mismatch = mode === "register" && confirm.length > 0 && confirm !== password;
  const ready = username.trim().length >= 3 && password.length >= 6 && (mode === "login" || confirm === password);

  const submit = async () => {
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    const result = await signIn(mode, username.trim(), password);
    setBusy(false);
    if (!result.ok) setError(AUTH_ERROR_TEXT[result.error] ?? `ไม่สำเร็จ (${result.error})`);
  };

  return (
    <form className="hero-creation pixel-panel account-step" data-testid="account-form" data-mode={mode}
      onSubmit={(event) => { event.preventDefault(); void submit(); }}>
      <FlowSteps step={1} />
      <div className="creation-heading"><span>{mode === "register" ? "สมัครบัญชี" : "เข้าสู่ระบบ"}</span><span className="text-[#d7bd82]">門</span></div>
      <div className="account-tabs" role="tablist" aria-label="บัญชี">
        {(["register", "login"] as const).map((value) => (
          <button key={value} type="button" role="tab" aria-selected={mode === value}
            onClick={() => { setMode(value); setError(null); }}>
            {value === "register" ? "สมัครใหม่" : "มีบัญชีแล้ว"}
          </button>
        ))}
      </div>
      <label className="creation-label" htmlFor="account-username">ชื่อผู้ใช้</label>
      <input id="account-username" name="username" autoComplete="username" value={username}
        onChange={(e) => setUsername(e.target.value)} maxLength={20} placeholder="a–z 0–9 _ ยาว 3–20 ตัว" className="creation-input" required />
      <label className="creation-label mt-4" htmlFor="account-password">รหัสผ่าน</label>
      <input id="account-password" name="password" type="password" autoComplete={mode === "register" ? "new-password" : "current-password"}
        value={password} onChange={(e) => setPassword(e.target.value)} maxLength={72} placeholder="อย่างน้อย 6 ตัวอักษร" className="creation-input" required />
      {mode === "register" && <>
        <label className="creation-label mt-4" htmlFor="account-password-confirm">ยืนยันรหัสผ่าน</label>
        <input id="account-password-confirm" name="confirm" type="password" autoComplete="new-password" value={confirm}
          onChange={(e) => setConfirm(e.target.value)} maxLength={72} className="creation-input" aria-invalid={mismatch} required />
        {mismatch && <p className="account-hint">รหัสผ่านทั้งสองช่องไม่ตรงกัน</p>}
      </>}
      {error && <p className="account-error" role="alert">{error}</p>}
      <button type="submit" className="pixel-action start-adventure" disabled={!ready || busy} data-testid="account-submit">
        {busy ? "กำลังติดต่อ…" : mode === "register" ? "สมัครและสร้างตัวละคร" : "เข้าสู่ยุทธภพ"} <span aria-hidden="true">↗</span>
      </button>
      <p className="creation-save-note">บัญชีเดียวใช้เล่นออนไลน์ เห็นจอมยุทธ์คนอื่นในแผนที่เดียวกัน</p>
    </form>
  );
}
