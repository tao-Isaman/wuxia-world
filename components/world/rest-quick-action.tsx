"use client";

import { useEffect, useRef, useState } from "react";
import type { RestKind } from "@/store/world-store";
import { useWorldStore } from "@/store/world-store";
import { flashLoading } from "@/store/loading-store";
import { HERO_SLEEP_POSE } from "@/lib/characters/hero-actions";
import { toast } from "@/store/toast-store";
import { deriveAll } from "@/lib/game";
import { REST_COOLDOWN_HOURS } from "@/store/world-store";
import { absoluteHours, describeSentence } from "@/lib/world/law";
import { ownSectAt } from "@/lib/world/data/sect-memberships";

// Which rest tiers a scene offers. The roadside tier is ALWAYS available
// as a no-cost fallback (so a broke player can't get soft-locked); richer
// locations layer the better tier on top:
//   home            → one's own bed (free full restore) only
//   own sect        → a disciple's bed on the grounds (same as home) only
//   city / inn      → inn (paid full restore) + roadside
//   temple / palace → temple (free half restore) + roadside
//   everywhere else → roadside only
export function restKindsForScene(sceneId: string, sectMembership: Parameters<typeof ownSectAt>[0] = {}): RestKind[] {
  if (sceneId === "home_player") return ["home"];
  if (ownSectAt(sectMembership, sceneId)) return ["sect"];
  if (sceneId.startsWith("inn_") || sceneId.startsWith("city_")) return ["inn", "route"];
  if (sceneId.startsWith("temple_") || sceneId.startsWith("palace_")) return ["temple", "route"];
  return ["route"];
}

const INN_PRICE = 300;
const OPEN_EVENT = "wuxia:rest";

/** Open the rest bubble from anywhere (e.g. a rest spot on a location map). */
export function openRestBubble() {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/**
 * 🛏 Quick rest: a round button on the right edge. Tapping it pops a small
 * speech-bubble of rest choices beside the thumb instead of a full menu;
 * picking one rests immediately. Costs and restore amounts stay in sync with
 * world-store's `rest` action.
 */
export function RestQuickAction() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const currentSceneId = useWorldStore((s) => s.currentSceneId);
  const rest = useWorldStore((s) => s.rest);
  const stamina = useWorldStore((s) => s.stamina);
  const staminaMax = useWorldStore((s) => s.staminaMax);
  const gold = useWorldStore((s) => s.gold);
  const player = useWorldStore((s) => s.playerBuild);
  const hp = useWorldStore((s) => s.currentHp);
  const sectMembership = useWorldStore((s) => s.sectMembership);
  const mp = useWorldStore((s) => s.currentMp);
  const restAt = useWorldStore((s) => s.flags._restAt);
  const day = useWorldStore((s) => s.day);
  const time = useWorldStore((s) => s.time);

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, show);
    return () => window.removeEventListener(OPEN_EVENT, show);
  }, []);
  useEffect(() => {
    if (!open) return;
    root.current?.querySelector<HTMLButtonElement>(".rest-bubble button:not(:disabled)")?.focus({ preventScroll: true });
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("pointerdown", outside);
    window.addEventListener("keydown", escape);
    return () => { window.removeEventListener("pointerdown", outside); window.removeEventListener("keydown", escape); };
  }, [open]);

  const maximum = player ? deriveAll(player) : null;
  const atFull = stamina >= staminaMax && (!maximum || (hp >= maximum.HP && mp >= maximum.MP));
  const kinds = restKindsForScene(currentSceneId, sectMembership);
  // Free rests share one cooldown on the world clock; an inn room is always open.
  const waitHours = Math.max(0, Number(restAt ?? -Infinity) + REST_COOLDOWN_HOURS - absoluteHours({ day, time }));
  const wait = waitHours > 0 ? describeSentence(waitHours) : "";
  const choices = kinds.map((kind) => ({
    kind,
    icon: kind === "home" ? "🛏" : kind === "sect" ? "🏯" : kind === "inn" ? "🍵" : kind === "temple" ? "🏛" : "🌿",
    title: kind === "home" ? "นอนพักที่บ้าน" : kind === "sect" ? "นอนพักที่สำนัก" : kind === "inn" ? "พักโรงเตี๊ยม" : kind === "temple" ? (currentSceneId.startsWith("palace_") ? "พักในลานวัง" : "พักที่วัด") : "พักริมทาง",
    detail: kind === "home" || kind === "sect" ? "ฟรี · ฟื้นเต็ม" : kind === "inn" ? `${INN_PRICE} ทอง · ฟื้นเต็ม · พักได้ทันที` : kind === "temple" ? "ฟรี · ฟื้น ½" : "ฟรี · ฟื้น ¼",
    short: kind === "inn" && gold < INN_PRICE,
    waiting: kind !== "inn" && wait !== "",
  }));

  const choose = (kind: RestKind) => {
    flashLoading("กำลังพักผ่อน...", 1400, "rest", HERO_SLEEP_POSE);
    const result = rest(kind);
    if (!result.ok) {
      toast("error", result.reason === "gold" ? "ทองไม่พอจะพักโรงเตี๊ยม" : result.reason === "cooldown" ? `เพิ่งพักไป · พักได้อีกใน ${describeSentence(result.readyIn)}` : "พักแบบนี้ที่นี่ไม่ได้");
      return;
    }
    toast("success", `พักผ่อนแล้ว · ฟื้น ${result.restored} แรง`);
    setOpen(false);
  };

  return (
    <div ref={root} className="rest-quick" data-hud-occluder>
      {open && (
        <div className="rest-bubble" role="group" aria-label="เลือกวิธีพักผ่อน">
          <p className="rest-bubble-title">พักผ่อน <small>· ฟื้นทันที</small></p>
          {atFull && <p className="rest-bubble-note">HP, MP และพลังเต็มแล้ว</p>}
          {choices.map((choice) => (
            <button key={choice.kind} type="button" disabled={atFull || choice.short || choice.waiting} onClick={() => choose(choice.kind)}
              aria-label={`${choice.title} ${choice.detail}`}>
              <span aria-hidden="true">{choice.icon}</span>
              <span><b>{choice.title}</b><small>{choice.short ? `ต้องใช้ ${INN_PRICE} ทอง` : choice.waiting ? `พักได้อีกใน ${wait}` : choice.detail}</small></span>
            </button>
          ))}
        </div>
      )}
      <button type="button" className="rest-quick-button" aria-label="พักผ่อน" aria-expanded={open} title="พักผ่อน"
        onClick={() => setOpen((value) => !value)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/ui/rest.png" alt="" className="pixel" draggable={false} />
        <span aria-hidden="true">พัก</span>
      </button>
    </div>
  );
}
