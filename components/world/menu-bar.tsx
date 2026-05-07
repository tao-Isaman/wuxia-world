"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProfilePopup } from "./popups/profile-popup";
import { InventoryPopup } from "./popups/inventory-popup";
import { MoveSkillsPopup } from "./popups/move-skills-popup";
import { LifeSkillsPopup } from "./popups/life-skills-popup";
import { ActionLogPopup } from "./popups/action-log-popup";

type PopupId = "profile" | "inventory" | "moves" | "lifeskills" | "log" | null;

// Main-screen menu bar — popup buttons, one popup at a time. The bar lives
// directly under the StatusBar in WorldScreen so it's reachable from every
// scene kind (location / route / dialog).
//
// The 🥋 วิชาฝีมือ tab manages BOTH move skills and inner arts: each of the
// 10 slots can hold either kind, so a separate ☯ inner-skills popup would
// just duplicate state.
export function MenuBar() {
  const [open, setOpen] = useState<PopupId>(null);
  const close = () => setOpen(null);

  return (
    <>
      <Card>
        <CardContent className="p-2">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            <Button variant="outline" size="sm" onClick={() => setOpen("profile")}>
              👤 โปรไฟล์
            </Button>
            <Button variant="outline" size="sm" onClick={() => setOpen("inventory")}>
              🎒 ของในย่าม
            </Button>
            <Button variant="outline" size="sm" onClick={() => setOpen("moves")}>
              🥋 วิชาฝีมือ
            </Button>
            <Button variant="outline" size="sm" onClick={() => setOpen("lifeskills")}>
              🌾 วิชาชีพ
            </Button>
            <Button variant="outline" size="sm" onClick={() => setOpen("log")}>
              📜 บันทึก
            </Button>
          </div>
        </CardContent>
      </Card>

      <ProfilePopup     open={open === "profile"}    onClose={close} />
      <InventoryPopup   open={open === "inventory"}  onClose={close} />
      <MoveSkillsPopup  open={open === "moves"}      onClose={close} />
      <LifeSkillsPopup  open={open === "lifeskills"} onClose={close} />
      <ActionLogPopup   open={open === "log"}        onClose={close} />
    </>
  );
}
