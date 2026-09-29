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
import { ArtTooltip, SkillTooltip } from "../skill-tooltip";
import { capitalTrainingStatus } from "@/lib/world/capital-training";
import { CAPITAL_TRAINING_NAME, CAPITAL_TRAINING_SCENE_ID } from "@/lib/world/data/capital-training";

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
  const state = useWorldStore();
  const { playerBuild: player, gold } = state;
  const buyMoveSkill = useWorldStore((s) => s.buyMoveSkill);
  const buyInnerSkill = useWorldStore((s) => s.buyInnerSkill);

  if (!hall || !player) return null;

  const learnedSkills = new Set(player.learnedSkillIds ?? []);
  const learnedArts = new Set(player.learnedArtIds ?? []);
  const training = hall.locationId === "city_capital" ? capitalTrainingStatus(state) : null;

  return (
    <Modal open={open} onClose={onClose} title={hall.label}>
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground italic leading-relaxed">
          {hall.description}
        </p>

        {training && (
          <section className="space-y-2 rounded border border-amber-700/40 bg-amber-950/10 p-3 text-xs" aria-label="บทฝึกตั้งรับและสวนกลับ">
            <strong className="block text-sm">{training.completed ? "ผ่านบทฝึกตั้งรับแล้ว" : "บทฝึกตั้งรับและสวนกลับ"}</strong>
            <p>{CAPITAL_TRAINING_NAME} · คู่ฝึกระดับเริ่มต้น</p>
            {!training.completed && <>
              <p className="leading-relaxed">ลอง ตั้งรับ แล้วใช้ หมัดตรง ในตาถัดไปเพื่อสวนกลับแรงขึ้น · ตั้งรับใช้ 2 MP</p>
              <p className="text-muted-foreground leading-relaxed">ไม่มีค่าฝึก · แพ้ไม่เสียชีวิต · ชนะรับ 50 W-EXP และประสบการณ์วิชาที่ใช้ · จบแล้วกลับนครหลวง</p>
              <p className="text-muted-foreground">ใช้ 5 แรง และ 0.5 ชั่วยามทั้งแพ้และชนะ · ผ่านได้หนึ่งครั้ง</p>
            </>}
            {training.needsRest && <p className="leading-relaxed">HP {training.hp}/{training.maxHp} · MP {training.mp} · พักฟื้นก่อนฝึกได้ฟรี</p>}
            <div className="flex flex-wrap gap-2">
              {!training.completed && <Button size="sm" disabled={!training.canStart} onClick={() => {
                if (!capitalTrainingStatus(useWorldStore.getState())?.canStart) return;
                onClose();
                state.gotoScene(CAPITAL_TRAINING_SCENE_ID);
              }}>ฝึกประลองฟรี</Button>}
              {training.needsRest && <Button size="sm" variant="outline" onClick={() => {
                const result = state.rest("route");
                if (result.ok) toast("success", "พักริมทางแล้ว · ฟื้น HP, MP และแรง ¼ · ผ่านไป 12 ชั่วยาม");
              }}>พักริมทาง · ฟรี</Button>}
            </div>
            {training.needsRest && <p className="text-[10px] text-muted-foreground">พักครั้งละ 12 ชั่วยาม · ฟื้น HP, MP และแรง ¼</p>}
          </section>
        )}

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
                    {sk ? (
                      <SkillTooltip skill={sk}>
                        <strong className="cursor-help underline decoration-dotted underline-offset-2">
                          {sk.n}
                        </strong>
                      </SkillTooltip>
                    ) : art ? (
                      <ArtTooltip art={art}>
                        <strong className="cursor-help underline decoration-dotted underline-offset-2">
                          {art.n}
                        </strong>
                      </ArtTooltip>
                    ) : null}
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
