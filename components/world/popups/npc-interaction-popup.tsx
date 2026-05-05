"use client";

import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { NpcDef, NpcStateEntry } from "@/lib/world";
import { useWorldStore } from "@/store/world-store";

interface Props {
  open: boolean;
  npc: NpcDef | null;
  onClose: () => void;
}

// Generic NPC interaction popup — reads which actions are available off the
// NpcDef's optional capability fields (dialogSceneId, sparOpponentId, …)
// and renders one button per supported action. Adding a new action kind is
// a matter of adding a NpcDef field, a button here, and the corresponding
// store action — existing NPCs that don't opt in just don't show that
// button. Kept dumb on purpose: no quest logic, no relationship math.
export function NpcInteractionPopup({ open, npc, onClose }: Props) {
  const gotoScene = useWorldStore((s) => s.gotoScene);
  const startSparWith = useWorldStore((s) => s.startSparWith);
  const meetNpc = useWorldStore((s) => s.meetNpc);
  const npcStates = useWorldStore((s) => s.npcStates);

  if (!npc) return null;
  const state: NpcStateEntry = npcStates[npc.id] ?? {};

  const onTalk = () => {
    if (!npc.dialogSceneId) return;
    meetNpc(npc.id);
    onClose();
    gotoScene(npc.dialogSceneId);
  };

  const onSpar = () => {
    if (!npc.sparOpponentId) return;
    const r = startSparWith(npc.id);
    if (!r.ok) return;
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={`💬 ${npc.name}`} maxWidth="max-w-md">
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {state.met && (
            <Badge variant="outline" className="text-[9px]">เคยพบ</Badge>
          )}
          {typeof state.relationship === "number" && state.relationship !== 0 && (
            <Badge variant="outline" className="text-[9px]">
              ความสัมพันธ์ {state.relationship > 0 ? `+${state.relationship}` : state.relationship}
            </Badge>
          )}
          {npc.tags?.map((t) => (
            <Badge key={t} variant="outline" className="text-[9px] opacity-70">
              {t}
            </Badge>
          ))}
        </div>

        {npc.description && (
          <p className="text-xs text-muted-foreground italic leading-relaxed">
            {npc.description}
          </p>
        )}

        <div className="space-y-1.5 pt-1">
          {npc.dialogSceneId && (
            <Button
              variant="outline"
              onClick={onTalk}
              className="w-full justify-start text-left h-auto py-2 whitespace-normal"
            >
              <span className="flex flex-col items-start gap-0.5">
                <span className="font-semibold text-sm">💬 ทักทาย</span>
                <span className="text-[10px] text-muted-foreground">
                  พูดคุยกับ{npc.name}
                </span>
              </span>
            </Button>
          )}
          {npc.sparOpponentId && (
            <Button
              variant="outline"
              onClick={onSpar}
              className="w-full justify-start text-left h-auto py-2 whitespace-normal"
            >
              <span className="flex flex-col items-start gap-0.5">
                <span className="font-semibold text-sm">⚔ ขอประลอง</span>
                <span className="text-[10px] text-muted-foreground">
                  ฝีมือต่อฝีมือ — ชนะได้ชื่อเสียง +{npc.sparFameReward ?? 0}
                </span>
              </span>
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
