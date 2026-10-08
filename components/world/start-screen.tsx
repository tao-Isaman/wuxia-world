"use client";
import { useState } from "react";
import { useWorldStore } from "@/store/world-store";
import { clearMapPositions } from "@/lib/stage/types";
import type { Gender } from "@/lib/world";
import { GENDER_LABEL, PLAYER_BODY_LABEL, defaultBodyFor } from "@/lib/world";
import { CharacterPreview } from "@/components/game/character-preview";
import { InstallGameButton } from "@/components/pwa";
import { SoundButton } from "@/components/sound-button";
import { OnlinePanel, useGameServer } from "./online-panel";

export function StartScreen() {
  const startNewGame = useWorldStore((s) => s.startNewGame);
  const server = useGameServer();
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  // One hero body per gender (m1 / f1), the ones with the painted action sprites.
  const bodyId = defaultBodyFor(gender);
  const trimmed = name.trim();
  const canStart = trimmed.length > 0 && trimmed.length <= 24;
  return (
    <div className="title-screen">
      <div className="title-sound"><SoundButton /></div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/art/jade-courtyard.png" alt="" className="title-landscape" draggable={false} />
      <div className="title-shade" />
      <div className="title-content">
        <div className="title-intro">
          <span className="title-seal" aria-hidden="true">武</span>
          <p className="title-kicker">กำลังภายใน</p>
          <h1>โลกยุทธภพ</h1>
          <p className="title-description">หนึ่งชีวิต หนึ่งเส้นทางยุทธ์<br />เรื่องราวของเจ้าเริ่มต้นที่นี่</p>
          <div className="title-rule" />
          <p className="title-footnote">ออกเดินทาง · ฝึกวิชา · สร้างตำนาน</p>
          <InstallGameButton />
          {server && <OnlinePanel compact />}
        </div>
        <form className="hero-creation pixel-panel" onSubmit={(event) => {
          event.preventDefault();
          if (!canStart) return;
          clearMapPositions();
          startNewGame({ name: trimmed, gender, bodyId });
        }}>
          <div className="creation-heading"><span>สร้างตัวละคร</span><span className="text-[#d7bd82]">初</span></div>
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
          <button type="submit" className="pixel-action start-adventure" disabled={!canStart}>เริ่มเกมใหม่ <span aria-hidden="true">↗</span></button>
          <p className="creation-save-note">บันทึกความคืบหน้าอัตโนมัติในเบราว์เซอร์นี้</p>
        </form>
      </div>
    </div>
  );
}
