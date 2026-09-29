"use client";
import { useState } from "react";
import { useWorldStore } from "@/store/world-store";
import { clearMapPositions } from "@/lib/three/types";
import type { Gender } from "@/lib/world";
import { GENDER_LABEL, PLAYER_BODIES, PLAYER_BODY_LABEL, defaultBodyFor } from "@/lib/world";
import { CharacterPreview } from "@/components/game/character-preview";

export function StartScreen() {
  const startNewGame = useWorldStore((s) => s.startNewGame);
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender>("male");
  const [bodyId, setBodyId] = useState<string>(defaultBodyFor("male"));
  const trimmed = name.trim();
  const canStart = trimmed.length > 0 && trimmed.length <= 24;
  return (
    <div className="title-screen">
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
                  onClick={() => { setGender(value); setBodyId(defaultBodyFor(value)); }}>
                  {GENDER_LABEL[value]}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="creation-preview" aria-hidden="true">
            <CharacterPreview key={bodyId} id={bodyId} animate />
            <span>{PLAYER_BODY_LABEL[bodyId] ?? ""}</span>
          </div>
          <fieldset className="mt-3">
            <legend className="creation-label">รูปร่าง</legend>
            <div className="body-options">
              {PLAYER_BODIES[gender].map((id) => (
                <button type="button" key={id} aria-label={PLAYER_BODY_LABEL[id]} aria-pressed={bodyId === id}
                  onClick={() => setBodyId(id)}>
                  <CharacterPreview id={id} animate={bodyId === id} />
                  <span aria-hidden="true">{bodyId === id ? "◆" : "◇"}</span>
                </button>
              ))}
            </div>
          </fieldset>
          <p className="creation-note">เริ่มต้นด้วยพลังพื้นฐาน 1 ทุกค่า และวิชาหมัดตรง<br />บางสำนักรับศิษย์ตามเพศที่กำหนด</p>
          <button type="submit" className="pixel-action start-adventure" disabled={!canStart}>เริ่มเกมใหม่ <span aria-hidden="true">↗</span></button>
          <p className="creation-save-note">บันทึกความคืบหน้าอัตโนมัติในเบราว์เซอร์นี้</p>
        </form>
      </div>
    </div>
  );
}
