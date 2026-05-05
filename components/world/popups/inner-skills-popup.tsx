"use client";

import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { STAT_LABEL, getArt } from "@/lib/game";
import type { StatKey } from "@/lib/game";
import { useWorldStore } from "@/store/world-store";

interface Props {
  open: boolean;
  onClose: () => void;
}

// Inner-skills popup — currently the player can only have one art equipped at
// a time (CharacterBuild.artId). We render the full art card: stats per
// level, HP/MP per level, the active move, and the trigger-based passive.
//
// If artId is "none" the popup just states it; future content can let the
// player learn arts (the rendering already handles whatever id is selected).
export function InnerSkillsPopup({ open, onClose }: Props) {
  const player = useWorldStore((s) => s.playerBuild);
  if (!player) return null;

  const art = getArt(player.artId);
  const lv = player.artLevel;

  const Empty = (
    <div className="rounded border border-dashed border-muted-foreground/30 px-3 py-4 text-xs text-center text-muted-foreground italic">
      ยังไม่ได้เรียนวิชาในกาย
    </div>
  );

  return (
    <Modal open={open} onClose={onClose} title="☯ วิชาในกาย">
      {!art || art.id === "none" ? (
        Empty
      ) : (
        <div className="space-y-3">
          <div className="rounded bg-muted/30 px-3 py-2 space-y-1">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <strong className="text-sm">{art.n}</strong>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="text-[9px]">{art.sc}</Badge>
                <Badge variant="outline" className="text-[9px]">{art.tp}</Badge>
                <Badge variant="outline" className="text-[9px]">ระดับ {lv}</Badge>
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground">
              ต่อระดับ: HP +{art.hL} · MP +{art.mL}
              {" · "}
              ปัจจุบันให้: HP +{art.hL * lv} · MP +{art.mL * lv}
            </div>
          </div>

          {Object.keys(art.stats).length > 0 && (
            <div>
              <div className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-1">
                ปรับพลังพื้นฐาน (×ระดับ ÷ 10)
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {(Object.entries(art.stats) as [StatKey, number][]).map(([k, v]) => (
                  <div key={k} className="rounded bg-muted/30 px-2 py-1.5">
                    <div className="text-[9px] text-muted-foreground">
                      {k} <span className="opacity-70">{STAT_LABEL[k]}</span>
                    </div>
                    <div className="text-xs font-semibold">+{v}</div>
                    <div className="text-[9px] text-emerald-600">
                      ปัจจุบัน +{Math.floor((v * lv) / 10)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {art.act && (
            <div>
              <div className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-1">
                วิชาออกพลัง (Active)
              </div>
              <div className="rounded bg-muted/30 px-3 py-2 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-sm">{art.act.n}</strong>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-[9px]">MP {art.act.c}</Badge>
                    <Badge variant="outline" className="text-[9px]">CD {art.act.cd}</Badge>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">{art.act.d}</p>
              </div>
            </div>
          )}

          {art.pas && (
            <div>
              <div className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-1">
                วิชารักษากาย (Passive)
              </div>
              <div className="rounded bg-muted/30 px-3 py-2 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-sm">{trigLabel(art.pas.tr)}</strong>
                  <Badge variant="outline" className="text-[9px]">โอกาส {art.pas.ch}%</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">{art.pas.d}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function trigLabel(t: string): string {
  switch (t) {
    case "hit_recv": return "เมื่อโดนโจมตี";
    case "on_crit":  return "เมื่อคริติคอล";
    case "use_int":  return "เมื่อใช้วิชาทางใน";
    case "use_act":  return "เมื่อใช้วิชาออกพลัง";
    default:         return t;
  }
}
