"use client";

import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TIERS,
  WEAPON_FAMILY_LABEL,
  getArt,
  getSkill,
} from "@/lib/game";
import type { SectHallDef } from "@/lib/world";
import { useWorldStore } from "@/store/world-store";
import { toast } from "@/store/toast-store";

interface Props {
  open: boolean;
  hall: SectHallDef | null;
  onClose: () => void;
}

// City sect-hall popup. The player can spend gold to learn one of the
// hall's offerings — tier 0 / 1 move skills and inner skills, configured
// per-city in lib/world/data/sect-halls.ts. Anything they already know is
// marked "เรียนแล้ว".
export function SectHallPopup({ open, hall, onClose }: Props) {
  const player = useWorldStore((s) => s.playerBuild);
  const gold = useWorldStore((s) => s.gold);
  const buyMoveSkill = useWorldStore((s) => s.buyMoveSkill);
  const buyInnerSkill = useWorldStore((s) => s.buyInnerSkill);

  if (!hall || !player) return null;

  const learnedSkills = new Set(player.learnedSkillIds ?? []);
  const learnedArts = new Set(player.learnedArtIds ?? []);

  return (
    <Modal open={open} onClose={onClose} title={hall.label}>
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground italic leading-relaxed">
          {hall.description}
        </p>

        <div className="text-xs">
          <span className="text-muted-foreground">ทอง </span>
          <strong className="text-amber-600">{gold}</strong>
        </div>

        <ul className="space-y-1.5">
          {hall.offers.map((offer, i) => {
            const isSkill = offer.kind === "skill";
            const sk = isSkill ? getSkill(offer.id) : null;
            const art = !isSkill ? getArt(offer.id) : null;
            if (!sk && !art) return null;
            const known = isSkill ? learnedSkills.has(offer.id) : learnedArts.has(offer.id);
            const canAfford = gold >= offer.price;
            const tierIdx = sk ? sk.ti : art ? art.ti : 0;
            const tierName = TIERS[tierIdx]?.n ?? "";

            return (
              <li
                key={`${offer.kind}-${offer.id}-${i}`}
                className="rounded bg-muted/30 px-2 py-1.5 text-xs flex items-center justify-between gap-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="default" className="text-[10px]">
                      {isSkill ? "⚔ วิชาฝีมือ" : "☯ วิชาในกาย"}
                    </Badge>
                    <strong>{sk?.n ?? art?.n}</strong>
                    <Badge variant="outline" className="text-[9px]">{tierName}</Badge>
                    {sk && (
                      <Badge variant="outline" className="text-[9px]">
                        {WEAPON_FAMILY_LABEL[sk.w]}
                      </Badge>
                    )}
                  </div>
                  {(sk?.d ?? art?.tp) && (
                    <div className="text-[10px] text-muted-foreground">
                      {sk?.d ?? art?.tp}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] text-amber-700 font-mono">{offer.price}🟡</span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-[10px]"
                    disabled={known || !canAfford}
                    onClick={() => {
                      const r = isSkill
                        ? buyMoveSkill(offer.id, offer.price)
                        : buyInnerSkill(offer.id, offer.price);
                      if (!r.ok) {
                        if (r.reason === "no-gold") toast("error", "ทองไม่พอ");
                        else if (r.reason === "already-learned") toast("info", "เรียนแล้ว");
                        else toast("error", "ซื้อไม่ได้");
                        return;
                      }
                      toast("success", `เรียนสำเร็จ · -${r.spent}🟡 (เพิ่มเข้าช่องว่าง)`);
                    }}
                  >
                    {known ? "เรียนแล้ว" : "เรียน"}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </Modal>
  );
}
