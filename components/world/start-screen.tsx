"use client";
import { useState } from "react";
import { useWorldStore } from "@/store/world-store";
import { clearMapPositions } from "@/lib/stage/types";
import type { Gender } from "@/lib/world";
import { GENDER_LABEL, PLAYER_BODY_LABEL, defaultBodyFor } from "@/lib/world";
import { CharacterPreview } from "@/components/game/character-preview";
import { InstallGameButton } from "@/components/pwa";
import { SoundButton } from "@/components/sound-button";
import { useGameServer } from "./online-panel";
import { AccountStep, FlowSteps } from "./account-step";
import { CharacterSelect } from "./character-select";
import { signedIn, useOnlineStore } from "@/store/online-store";
import { cloudErrorText, useCloudSession } from "@/store/cloud-session";

/**
 * The title screen. With a game server (always, in the released game) it is
 * the flow account (AccountStep) → character (CharacterSelect, or this form
 * for a new one) → the game; the save lives on the server. Without one (dev,
 * tests) only the hero form, saved in this browser.
 */
export function StartScreen() {
  const server = useGameServer();
  const account = useOnlineStore((s) => (signedIn(s) ? s.username : null));
  const [creating, setCreating] = useState(false);
  const needsAccount = !!server && !account;
  let panel: React.ReactNode;
  if (needsAccount) panel = <AccountStep />;
  else if (server && !creating) panel = <CharacterSelect onNew={() => setCreating(true)} />;
  else panel = <HeroForm online={!!server} onCancel={server ? () => setCreating(false) : undefined} />;
  return (
    <div className="title-screen">
      <div className="title-sound"><SoundButton /></div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/art/jade-courtyard.png" alt="" className="title-landscape" draggable={false} />
      <div className="title-shade" />
      <div className="title-content">
        <div className="title-intro">
          <span className="title-seal" aria-hidden="true">ยุทธ</span>
          <p className="title-kicker">กำลังภายใน</p>
          <h1>โลกยุทธภพ</h1>
          <p className="title-description">หนึ่งชีวิต หนึ่งเส้นทางยุทธ์<br />เรื่องราวของเจ้าเริ่มต้นที่นี่</p>
          <div className="title-rule" />
          <p className="title-footnote">ออกเดินทาง · ฝึกวิชา · สร้างตำนาน</p>
          <InstallGameButton />
        </div>
        {panel}
      </div>
    </div>
  );
}

/** A new hero: a name and a gender. Online it becomes a character on the server. */
function HeroForm({ online, onCancel }: { online: boolean; onCancel?: () => void }) {
  const startNewGame = useWorldStore((s) => s.startNewGame);
  const create = useCloudSession((s) => s.create);
  const busy = useCloudSession((s) => s.busy);
  const error = useCloudSession((s) => s.error);
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [tried, setTried] = useState(false);
  // One hero body per gender (m1 / f1), the ones with the painted action sprites.
  const bodyId = defaultBodyFor(gender);
  const trimmed = name.trim();
  const canStart = trimmed.length > 0 && trimmed.length <= 24 && !busy;
  return (
    <form className="hero-creation pixel-panel" data-testid="hero-form" onSubmit={(event) => {
      event.preventDefault();
      if (!canStart) return;
      clearMapPositions();
      if (online) {
        setTried(true);
        void create(trimmed, gender === "female" ? "female" : "male");
      } else {
        startNewGame({ name: trimmed, gender, bodyId });
      }
    }}>
      {online && <FlowSteps step={2} />}
      <div className="creation-heading"><span>สร้างตัวละคร</span><span className="text-[#d7bd82]">❖</span></div>
      <label className="creation-label" htmlFor="hero-name">ชื่อตัวละคร</label>
      <input id="hero-name" name="heroName" autoComplete="off" value={name} onChange={(e) => setName(e.target.value)}
        maxLength={24} placeholder="ชื่อของเจ้า" className="creation-input" required />
      <fieldset className="mt-5">
        <legend className="creation-label">เพศ</legend>
        <div className="gender-options">
          {(["male", "female"] as const).map((value) => (
            <button type="button" key={value} aria-pressed={gender === value}
              onClick={() => setGender(value)}>
              {GENDER_LABEL[value]}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="creation-preview" aria-hidden="true">
        <CharacterPreview key={bodyId} id={bodyId} animate />
        <span>{PLAYER_BODY_LABEL[bodyId] ?? ""}</span>
      </div>
      <p className="creation-note">เริ่มต้นด้วยพลังพื้นฐาน 1 ทุกค่า และวิชาหมัดตรง<br />บางสำนักรับศิษย์ตามเพศที่กำหนด</p>
      {online && tried && error && <p className="account-error" role="alert">{cloudErrorText(error)}</p>}
      <button type="submit" className="pixel-action start-adventure" disabled={!canStart}>
        {busy ? "กำลังสร้าง…" : "เริ่มเกมใหม่"} <span aria-hidden="true">↗</span>
      </button>
      {onCancel && <button type="button" className="character-back" onClick={onCancel}>← กลับไปเลือกตัวละคร</button>}
      <p className="creation-save-note">{online ? "บันทึกความคืบหน้าบนเซิร์ฟเวอร์อัตโนมัติ" : "บันทึกความคืบหน้าอัตโนมัติในเบราว์เซอร์นี้"}</p>
    </form>
  );
}
