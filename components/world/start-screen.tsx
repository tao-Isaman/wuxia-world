"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWorldStore } from "@/store/world-store";

// Shown only when `hasGame === false`. After clicking "เริ่มเกมใหม่", the
// world-store flips hasGame to true with a fresh STARTER_BUILD and
// WorldScreen renders the in-game UI directly.
export function StartScreen() {
  const startNewGame = useWorldStore((s) => s.startNewGame);

  return (
    <Card>
      <CardContent className="p-8 text-center space-y-4">
        <h2 className="text-xl font-bold">โลกยุทธภพ</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          ผจญภัยในโลกของผู้กล้า เริ่มต้นจากหมู่บ้านเล็ก ๆ บนเชิงเขา
          เจ้าจะเริ่มด้วยพละกำลังพื้นฐาน 1 ทุกค่า และวิชา <strong>หมัดตรง</strong>
        </p>
        <Button size="lg" onClick={startNewGame}>
          เริ่มเกมใหม่
        </Button>
      </CardContent>
    </Card>
  );
}
