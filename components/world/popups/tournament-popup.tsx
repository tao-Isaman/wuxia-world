"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { powerTierOf } from "@/lib/game";
import {
  BOUT_GOLD, PLACE_LABEL, PLAYER, ROUND_LABEL, TOURNAMENT, currentTournament, dayOfYear, daysUntilRegistration,
  entrantName, entrantPower, playerOpponent, prizeName, registerBlock, roundPairs, startBlock, tournamentPhase, yearOf,
} from "@/lib/world/tournament";
import { useWorldStore } from "@/store/world-store";
import { toast } from "@/store/toast-store";
import { PowerTierBadge } from "../power-tier-badge";

interface Props {
  open: boolean;
  onClose: () => void;
}

const REGISTER_BLOCK: Record<string, string> = {
  closed: "ยังไม่เปิดรับสมัคร",
  elsewhere: "ต้องลงชื่อที่สำนักหัวซาน (ยอดเขาหัวซาน)",
  registered: "ลงชื่อแล้ว",
  gold: `ต้องมีค่าสมัคร ${TOURNAMENT.fee} ตำลึง`,
  done: "ปีนี้จัดการแข่งขันไปแล้ว",
};

// ชุมนุมวิจารณ์กระบี่เขาหัวซาน — the yearly 32-entrant tournament on Mount Hua:
// register, fight each round, watch the bracket, and (as champion) pick a
// move or art from the entrants.
export function TournamentPopup({ open, onClose }: Props) {
  const state = useWorldStore();
  const [showBracket, setShowBracket] = useState(false);
  const t = currentTournament(state);
  const year = yearOf(state.day);
  const phase = tournamentPhase(state.day);
  const heroName = state.playerBuild?.name;
  const name = (id: string) => entrantName(id, heroName);
  const foe = playerOpponent(t);
  const block = registerBlock(state);
  const canStart = t?.status === "registered" && !startBlock(state);
  const history = [...(state.tournamentHistory ?? [])].reverse().slice(0, 5);

  const register = () => {
    if (state.registerTournament()) toast("success", "ลงชื่อเข้าร่วมชุมนุมวิจารณ์กระบี่เขาหัวซานแล้ว");
  };
  const fight = () => {
    if (state.fightTournamentBout()) onClose();
    else toast("warn", "ยังขึ้นเวทีไม่ได้");
  };
  const pick = (slotId: string) => {
    if (state.pickTournamentPrize(slotId)) toast("success", `ได้เรียน ${prizeName(slotId)}`);
  };

  let calendar: string;
  if (phase === "day") calendar = "วันนี้คือวันชุมนุมวิจารณ์กระบี่เขาหัวซาน!";
  else if (phase === "registration") calendar = `เปิดรับสมัคร · อีก ${TOURNAMENT.startDay - dayOfYear(state.day)} วันถึงวันแข่งขัน`;
  else calendar = `จะเปิดรับสมัครในอีก ${daysUntilRegistration(state.day)} วัน`;

  return (
    <Modal open={open} onClose={onClose} title="⚔ ชุมนุมวิจารณ์กระบี่เขาหัวซาน">
      <div className="space-y-3 text-sm" data-testid="tournament-popup">
        <p className="text-xs text-muted-foreground">
          จัดขึ้นปีละครั้งบนยอดเขาหัวซาน (สำนักหัวซานเป็นเจ้าภาพ ส่งจดหมายเชิญเมื่อเปิดรับลงชื่อ) · ยอดฝีมือ 32 คนประลองแบบแพ้คัดออก · ชนะแต่ละรอบได้เงินและ w-exp
          ผู้ชนะเลิศเลือกเรียนวิชาหนึ่งอย่างจากผู้เข้าแข่งขันทั้งหมด
        </p>
        <div className="rounded bg-muted/30 px-2 py-1.5">
          <div className="font-semibold">ปีที่ {year} · วันที่ {dayOfYear(state.day)} ของปี</div>
          <div className="text-xs" data-testid="tournament-calendar">{calendar}</div>
        </div>

        {!t && phase !== "closed" && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs">{block ? REGISTER_BLOCK[block] : `ค่าสมัคร ${TOURNAMENT.fee} ตำลึง`}</span>
            <Button size="sm" disabled={!!block} onClick={register} data-testid="tournament-register">ลงชื่อประลอง</Button>
          </div>
        )}

        {t?.status === "registered" && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs">{canStart ? "พร้อมแล้ว — จับสลากและขึ้นเวที" : `ลงชื่อแล้ว · รอวันที่ ${TOURNAMENT.startDay} ของปี`}</span>
            <Button size="sm" disabled={!canStart} onClick={fight} data-testid="tournament-start">เข้าสู่ลานประลอง</Button>
          </div>
        )}

        {t?.status === "running" && foe && (
          <div className="rounded border border-red-700/40 px-2 py-1.5 space-y-1" data-testid="tournament-bout">
            <div className="font-semibold">{ROUND_LABEL[t.round]} · คู่ต่อสู้: {name(foe)}</div>
            <div className="flex items-center gap-2 text-xs">
              <span>ระดับพลัง</span><PowerTierBadge tier={powerTierOf(entrantPower(state, foe))} />
              <span>· ชนะได้ {BOUT_GOLD[t.round]} ตำลึง</span>
            </div>
            <Button size="sm" onClick={fight} data-testid="tournament-fight">ขึ้นเวทีประลอง</Button>
          </div>
        )}

        {t && (t.gold > 0 || t.wExp > 0 || t.playerPlace) && (
          <div className="text-xs" data-testid="tournament-result">
            {t.playerPlace ? <>ผลของท่าน: <strong>{PLACE_LABEL[t.playerPlace]}</strong> · </> : null}
            ได้รับ {t.gold} ตำลึง · {t.wExp} w-exp
          </div>
        )}

        {t?.status === "finished" && (
          <div className="rounded bg-amber-100/50 px-2 py-1.5 space-y-1" data-testid="tournament-champion">
            <div>ผู้ชนะเลิศ: <strong>{name(t.champion!)}</strong>{t.champion !== PLAYER && t.championPick ? ` · เลือกเรียน ${prizeName(t.championPick)}` : ""}</div>
            {t.champion === PLAYER && !t.championPick && (
              <>
                <div className="text-xs">เลือกวิชาหนึ่งอย่างจากผู้เข้าแข่งขัน:</div>
                <ul className="max-h-48 overflow-y-auto space-y-1" data-testid="tournament-prizes">
                  {(t.pickOptions ?? []).map((slotId) => (
                    <li key={slotId} className="flex items-center justify-between gap-2">
                      <span className="text-xs">{prizeName(slotId)}</span>
                      <Button size="sm" variant="outline" className="h-7" onClick={() => pick(slotId)}>เลือก</Button>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {t.champion === PLAYER && t.championPick && <div className="text-xs">ท่านเลือกเรียน {prizeName(t.championPick)}</div>}
          </div>
        )}

        {t && t.rounds.length > 0 && (
          <div>
            <Button size="sm" variant="ghost" className="h-7 px-1 text-xs" onClick={() => setShowBracket((v) => !v)}>
              {showBracket ? "ซ่อนสายการแข่งขัน" : "ดูสายการแข่งขัน"}
            </Button>
            {showBracket && (
              <div className="space-y-2 max-h-72 overflow-y-auto" data-testid="tournament-bracket">
                {t.rounds.slice(0, 5).map((_, round) => {
                  const next = new Set(t.rounds[round + 1] ?? []);
                  return (
                    <div key={round}>
                      <div className="text-xs font-semibold">{ROUND_LABEL[round]}</div>
                      <ul className="text-[11px] grid grid-cols-1 sm:grid-cols-2 gap-x-3">
                        {roundPairs(t, round).map(([a, b]) => (
                          <li key={`${a}-${b}`}>
                            <span className={next.has(a) ? "font-bold" : a === PLAYER ? "" : "text-muted-foreground"}>{name(a)}</span>
                            {" vs "}
                            <span className={b && next.has(b) ? "font-bold" : "text-muted-foreground"}>{b ? name(b) : "—"}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {history.length > 0 && (
          <div>
            <div className="text-xs font-semibold">ทำเนียบผู้ชนะเลิศ</div>
            <ul className="text-[11px]" data-testid="tournament-history">
              {history.map((r) => (
                <li key={r.year}>ปีที่ {r.year}: {name(r.champion)}{r.playerPlace ? ` · ท่าน${PLACE_LABEL[r.playerPlace]}` : ""}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}
