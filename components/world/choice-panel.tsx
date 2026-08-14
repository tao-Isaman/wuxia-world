"use client";

import { Button } from "@/components/ui/button";
import type { DialogScene } from "@/lib/world";
import { evaluateCondition } from "@/lib/world";
import { useWorldStore } from "@/store/world-store";

interface Props {
  scene: DialogScene;
}

export function ChoicePanel({ scene }: Props) {
  const state = useWorldStore();
  const makeChoice = useWorldStore((s) => s.makeChoice);
  const gotoScene = useWorldStore((s) => s.gotoScene);
  const exitToLocation = useWorldStore((s) => s.exitToLocation);

  // Shared HUD-box chrome for the choice area (matches DialogDisplay).
  const boxCls = "bg-ink/85 text-paper shadow-pixel p-3 space-y-2";
  const choiceBtnCls =
    "w-full justify-start text-left h-auto py-2 whitespace-normal " +
    "bg-paper/10 text-paper border-paper/40 hover:bg-paper/25 hover:text-paper";

  // No choices → either a "ต่อไป" auto-advance button (has next) or a
  // "ปิด" terminal-dialog button (returns to lastLocationId).
  if (!scene.choices || scene.choices.length === 0) {
    if (scene.next) {
      return (
        <div className={boxCls}>
          <Button onClick={() => gotoScene(scene.next!)} className="w-full">
            ต่อไป →
          </Button>
        </div>
      );
    }
    // Terminal dialog. Show close button only if we have a location to
    // return to; otherwise the dialog is a true dead-end (rare; would only
    // happen at the very start before the player visits any location).
    if (state.lastLocationId) {
      return (
        <div className={boxCls}>
          <Button
            onClick={exitToLocation}
            variant="outline"
            className={choiceBtnCls}
          >
            ปิด
          </Button>
        </div>
      );
    }
    return null;
  }

  // Filter visible choices but keep their original index (so makeChoice idx matches).
  const visibleChoices = scene.choices
    .map((c, i) => ({ choice: c, idx: i }))
    .filter(({ choice }) => !choice.visibleIf || evaluateCondition(state, choice.visibleIf));

  return (
    <div className={boxCls}>
      {visibleChoices.length === 0 && (
        <>
          <p className="text-xs text-paper/60 italic text-center py-2">
            (ไม่มีตัวเลือก — สถานการณ์อาจเปลี่ยนไป)
          </p>
          {/* All choices were filtered out by visibleIf — give the player
              an escape hatch back to the last location. Without this,
              conditional-only choice blocks soft-lock the dialog. */}
          {scene.next ? (
            <Button onClick={() => gotoScene(scene.next!)} className="w-full">
              ต่อไป →
            </Button>
          ) : state.lastLocationId ? (
            <Button
              onClick={exitToLocation}
              variant="outline"
              className={choiceBtnCls}
            >
              ปิด
            </Button>
          ) : null}
        </>
      )}
      {visibleChoices.map(({ choice, idx }) => (
        <Button
          key={idx}
          variant="outline"
          className={choiceBtnCls}
          onClick={() => makeChoice(idx)}
        >
          <span className="text-paper/50 mr-2">{idx + 1}.</span>
          {choice.text}
        </Button>
      ))}
    </div>
  );
}
