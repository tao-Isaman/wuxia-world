"use client";

import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { TIERS, WEAPON_FAMILY_HINT, WEAPON_FAMILY_LABEL, getSkill } from "@/lib/game";
import { useWorldStore } from "@/store/world-store";

interface Props {
  open: boolean;
  onClose: () => void;
}

// Move-skills popup — the 5 skill slots on CharacterBuild.
// We surface tier (badge), weapon family, attack type, and the description
// string so the player can recall what each move actually does without
// digging into the skill library.
export function MoveSkillsPopup({ open, onClose }: Props) {
  const player = useWorldStore((s) => s.playerBuild);
  if (!player) return null;

  const slots = player.skillIds;

  return (
    <Modal open={open} onClose={onClose} title="🥋 วิชาฝีมือ (5 ช่อง)">
      <div className="space-y-2">
        {slots.map((sid, i) => {
          const sk = sid ? getSkill(sid) : null;
          if (!sk) {
            return (
              <div
                key={i}
                className="rounded border border-dashed border-muted-foreground/30 px-3 py-3 text-xs text-center text-muted-foreground italic"
              >
                ช่องที่ {i + 1} — ว่าง
              </div>
            );
          }
          const tier = TIERS[sk.ti];
          return (
            <div key={i} className="rounded bg-muted/30 px-3 py-2 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-muted-foreground">#{i + 1}</span>
                  <strong className="text-sm">{sk.n}</strong>
                  {tier && (
                    <Badge variant="outline" className="text-[9px]">
                      {tier.n}
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className="text-[9px]"
                    title={WEAPON_FAMILY_HINT[sk.w]}
                  >
                    {WEAPON_FAMILY_LABEL[sk.w]}
                  </Badge>
                  {sk.at && (
                    <Badge variant="outline" className="text-[9px]">
                      {sk.at === "phy" ? "ทางกาย" : "ทางใน"}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground">{sk.d}</div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
                {sk.bp > 0 && <span>BP {sk.bp}</span>}
                {sk.p > 0 && <span>+{sk.p}%</span>}
                {sk.f > 0 && <span>+{sk.f} flat</span>}
                {sk.dm !== 1 && <span>×{sk.dm}</span>}
                {sk.dr ? <span>ดูด {sk.dr}%</span> : null}
                {sk.mg > 0 && <span>ฝีมือ +{sk.mg}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
