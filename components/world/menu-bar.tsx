"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProfilePopup } from "./popups/profile-popup";
import { InventoryPopup } from "./popups/inventory-popup";
import { MoveSkillsPopup } from "./popups/move-skills-popup";
import { InnerSkillsPopup } from "./popups/inner-skills-popup";

type PopupId = "profile" | "inventory" | "moves" | "inner" | null;

// Main-screen menu bar — four buttons, one popup at a time. The bar lives
// directly under the StatusBar in WorldScreen so it's reachable from every
// scene kind (location / route / dialog).
export function MenuBar() {
  const [open, setOpen] = useState<PopupId>(null);
  const close = () => setOpen(null);

  return (
    <>
      <Card>
        <CardContent className="p-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <Button variant="outline" size="sm" onClick={() => setOpen("profile")}>
              👤 โปรไฟล์
            </Button>
            <Button variant="outline" size="sm" onClick={() => setOpen("inventory")}>
              🎒 ของในย่าม
            </Button>
            <Button variant="outline" size="sm" onClick={() => setOpen("moves")}>
              🥋 วิชาฝีมือ
            </Button>
            <Button variant="outline" size="sm" onClick={() => setOpen("inner")}>
              ☯ วิชาในกาย
            </Button>
          </div>
        </CardContent>
      </Card>

      <ProfilePopup     open={open === "profile"}   onClose={close} />
      <InventoryPopup   open={open === "inventory"} onClose={close} />
      <MoveSkillsPopup  open={open === "moves"}     onClose={close} />
      <InnerSkillsPopup open={open === "inner"}     onClose={close} />
    </>
  );
}
