"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWorldStore } from "@/store/world-store";
import { confirmDialog } from "@/store/confirm-store";

// Shown when `worldStore.gameOver === true`. The only available action is
// `resetGame`, which wipes the persisted slice back to the start screen.
// We deliberately don't preserve any progress — the game over state is final.
export function GameOverScreen() {
  const resetGame = useWorldStore((s) => s.resetGame);
  const day = useWorldStore((s) => s.day);
  return (
    <Card className="border-rose-300">
      <CardContent className="p-8 space-y-4 text-center">
        <h2 className="text-2xl font-bold text-rose-700">⚔ พ่ายแพ้</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          เจ้าล้มลงในสนามรบ... เรื่องราวการเดินทางในยุทธภพได้จบลงแล้ว
        </p>
        <p className="text-[11px] text-muted-foreground">
          เจ้ามีชีวิตอยู่ในยุทธภพรวม <strong className="text-foreground">{day}</strong> วัน
        </p>
        <Button
          variant="default"
          onClick={async () => {
            const ok = await confirmDialog({
              title: "เริ่มต้นใหม่",
              message: "เริ่มต้นใหม่ทั้งหมด?\nความคืบหน้าทั้งหมดจะถูกลบทิ้ง",
              confirmText: "เริ่มใหม่",
              variant: "danger",
            });
            if (ok) resetGame();
          }}
        >
          เริ่มต้นใหม่
        </Button>
      </CardContent>
    </Card>
  );
}
