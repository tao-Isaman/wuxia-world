"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWorldStore } from "@/store/world-store";
import type { Gender } from "@/lib/world";
import { GENDER_LABEL } from "@/lib/world";

// Shown only when `hasGame === false`. Player picks a name + gender, then
// "เริ่มเกมใหม่" creates a fresh world bound to those choices. Gender is
// load-bearing — sect membership conditions read it (Shaolin admits men
// only, etc.).
export function StartScreen() {
  const startNewGame = useWorldStore((s) => s.startNewGame);
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender>("male");

  const trimmed = name.trim();
  const canStart = trimmed.length > 0 && trimmed.length <= 24;

  return (
    <Card>
      <CardContent className="p-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold">โลกยุทธภพ</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            ผจญภัยในโลกของผู้กล้า เริ่มต้นจากหมู่บ้านเล็ก ๆ บนเชิงเขา
            เจ้าจะเริ่มด้วยพละกำลังพื้นฐาน 1 ทุกค่า และวิชา <strong>หมัดตรง</strong>
          </p>
        </div>

        <div className="space-y-3 max-w-sm mx-auto">
          <label className="block text-sm">
            <span className="block mb-1 text-foreground/80">ชื่อตัวละคร</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={24}
              placeholder="ชื่อ (1–24 ตัวอักษร)"
              className="w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </label>

          <fieldset className="space-y-1">
            <legend className="text-sm text-foreground/80 mb-1">เพศ</legend>
            <div className="flex gap-2">
              {(["male", "female"] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGender(g)}
                  className={`flex-1 border px-3 py-2 text-sm transition-colors ${
                    gender === g
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background hover:border-foreground/40"
                  }`}
                >
                  {GENDER_LABEL[g]}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              บางสำนักรับเฉพาะเพศที่กำหนด เช่น เส้าหลินรับเฉพาะชาย ง้อไบ๊รับเฉพาะหญิง
            </p>
          </fieldset>
        </div>

        <div className="text-center">
          <Button
            size="lg"
            disabled={!canStart}
            onClick={() => startNewGame({ name: trimmed, gender })}
          >
            เริ่มเกมใหม่
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
