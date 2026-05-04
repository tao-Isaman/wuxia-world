"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Scene } from "@/lib/world";
import { evaluateCondition } from "@/lib/world";
import { useWorldStore } from "@/store/world-store";

interface Props {
  scene: Scene;
}

export function ChoicePanel({ scene }: Props) {
  const state = useWorldStore();
  const makeChoice = useWorldStore((s) => s.makeChoice);
  const gotoScene = useWorldStore((s) => s.gotoScene);

  // Auto-advance scenes (no choices, has next) — render a single "ต่อไป" button.
  if (!scene.choices || scene.choices.length === 0) {
    if (scene.next) {
      return (
        <Card>
          <CardContent className="p-3">
            <Button onClick={() => gotoScene(scene.next!)} className="w-full">
              ต่อไป →
            </Button>
          </CardContent>
        </Card>
      );
    }
    return null;
  }

  // Filter visible choices but keep their original index (so makeChoice idx matches).
  const visibleChoices = scene.choices
    .map((c, i) => ({ choice: c, idx: i }))
    .filter(({ choice }) => !choice.visibleIf || evaluateCondition(state, choice.visibleIf));

  return (
    <Card>
      <CardContent className="p-3 space-y-2">
        {visibleChoices.length === 0 && (
          <p className="text-xs text-muted-foreground italic text-center py-2">
            (ไม่มีตัวเลือก — สถานการณ์อาจเปลี่ยนไป)
          </p>
        )}
        {visibleChoices.map(({ choice, idx }) => (
          <Button
            key={idx}
            variant="outline"
            className="w-full justify-start text-left h-auto py-2 whitespace-normal"
            onClick={() => makeChoice(idx)}
          >
            <span className="text-muted-foreground mr-2">{idx + 1}.</span>
            {choice.text}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
