"use client";

import { useEffect, useId, useState } from "react";
import { ChevronDown, ChevronUp, Compass } from "lucide-react";
import {
  evaluateCondition,
  getNpc,
  getQuest,
  getScene,
  isQuestOfferable,
  type WorldStateData,
} from "@/lib/world";
import { TRAVEL_STAMINA_COST, useWorldStore } from "@/store/world-store";
import { clinicPreparation } from "@/lib/world/clinic-preparation";
import "@/app/journey-guide.css";

const PREFERENCE_KEY = "wusia-journey-guide-collapsed";
const FIRST_QUEST_ID = "qc_capital_clinic_supplies";
const CAPITAL_ID = "city_capital";
const HOME_ROUTE_ID = "route_home_player__to__city_capital";

interface Guidance {
  label: string;
  title: string;
  nextStep: string;
  description: string;
  action: string;
  note: string;
  tired?: boolean;
}

// Guidance only reads existing world facts. Accepting, advancing and finishing
// quests stay with the normal NPC / quest systems; no onboarding save state.
function guidanceFor(state: WorldStateData): Guidance | null {
  if (state.currentHp !== null && state.currentHp <= 1) return {
    label: "พักฟื้น", title: "พักฟื้นก่อนออกเดินทาง", nextStep: "พักผ่อน → ฟื้นฟูพลังชีวิต",
    description: "เจ้าบาดเจ็บหนักจากการต่อสู้ พักให้หายก่อนเดินทางต่อ",
    action: "เปิดเมนู พักผ่อน เพื่อฟื้นฟู HP และ MP", note: "การประลองไม่ทำให้เสียชีวิต แต่ยังต้องพักฟื้น", tired: true,
  };
  const entries = Object.values(state.quests);
  const active = [...entries].reverse().find((quest) => quest.status === "active" && getQuest(quest.id));
  if (active) {
    const quest = getQuest(active.id)!;
    const stage = quest.stages[active.stage];
    if (active.id === FIRST_QUEST_ID) {
      const returning = active.stage > 0;
      const target = getNpc(returning ? quest.giverNpcId : "city_capital_magistrate_wu");
      const name = target?.name ?? (returning ? "หมอหลิน" : "นายอำเภอหวู่");
      return {
        label: "ภารกิจแรกในนครหลวง",
        title: quest.name,
        nextStep: `จุดหมาย → ${name}${returning ? " → รับรางวัล" : " → ทักทาย"}`,
        description: stage?.description ?? quest.description,
        action: returning
          ? `จุดหมาย → ${name} → ส่งมอบภารกิจ → รับรางวัล`
          : `จุดหมาย → ${name} → ทักทาย → ส่งคำขอเสบียงจากหมอหลิน`,
        note: `ขั้นที่ ${active.stage + 1} / ${quest.stages.length} · ทำได้ในนครหลวง`,
      };
    }
    return {
      label: "ภารกิจของเจ้า",
      title: quest.name,
      nextStep: stage?.description ?? quest.name,
      description: stage?.description ?? quest.briefSummary ?? quest.description,
      action: "ดูขั้นตอนและรางวัลในเมนู ภารกิจ",
      note: stage ? `ขั้นที่ ${active.stage + 1} / ${quest.stages.length}` : "ติดตามรายละเอียดในบันทึกภารกิจ",
    };
  }

  const preparation = clinicPreparation(state);
  if (preparation) return preparation;

  // Other quests and exploration take over after the optional opening practice.
  if (entries.length > 0) return null;

  const quest = getQuest(FIRST_QUEST_ID);
  const npc = getNpc(quest?.giverNpcId);
  const capital = getScene(CAPITAL_ID);
  const scene = getScene(state.currentSceneId);
  if (!quest || !npc || capital?.kind !== "location" || !isQuestOfferable(state, quest)) return null;
  if (npc.visibleIf && !evaluateCondition(state, npc.visibleIf)) return null;

  if (scene?.id === CAPITAL_ID) {
    return {
      label: "คนที่น่าพบ",
      title: `พบ${npc.name}`,
      nextStep: `จุดหมาย → ${npc.name}`,
      description: quest.description,
      action: `จุดหมาย → ${npc.name} → ${quest.name}`,
      note: "เลือกภารกิจที่เปิดให้รับ · สำรวจต่อได้ตามใจ",
    };
  }

  if (scene?.kind === "location" && scene.id === "home_player") {
    const route = scene.routes.find((entry) => entry.routeSceneId === HOME_ROUTE_ID &&
      (!entry.visibleIf || evaluateCondition(state, entry.visibleIf)));
    if (!route) return null;
    const cost = TRAVEL_STAMINA_COST * 2;
    const tired = state.stamina < cost;
    return {
      label: "เส้นทางแนะนำ",
      title: `ออกเดินทางสู่${capital.name}`,
      nextStep: tired ? "พักผ่อนก่อนเดินทาง" : `จุดหมาย → ${route.label}`,
      description: quest.description,
      action: tired ? "เติมพลังที่เมนู พักผ่อน ก่อนออกเดินทาง" : `จุดหมาย → ${route.label}`,
      note: `พลังรวม ${cost} · ออกถนน ${TRAVEL_STAMINA_COST} + เข้าเมือง ${TRAVEL_STAMINA_COST}`,
      tired,
    };
  }

  if (scene?.kind === "route") {
    const destination = scene.destinations.find((entry) => entry.locationId === CAPITAL_ID &&
      (!entry.visibleIf || evaluateCondition(state, entry.visibleIf)));
    if (!destination) return null;
    const tired = state.stamina < TRAVEL_STAMINA_COST;
    return {
      label: "ระหว่างทาง",
      title: `ไปพบ${npc.name}ที่${capital.name}`,
      nextStep: tired ? "พักผ่อนก่อนเดินทาง" : `จุดหมาย → ${destination.label}`,
      description: quest.description,
      action: tired ? "เติมพลังที่เมนู พักผ่อน แล้วเดินทางต่อ" : `จุดหมาย → ${destination.label}`,
      note: `เข้าเมืองใช้พลังอีก ${TRAVEL_STAMINA_COST} · มี ${state.stamina}/${state.staminaMax}`,
      tired,
    };
  }
  return null;
}

export function JourneyGuide({ inline = false }: { inline?: boolean }) {
  const state = useWorldStore();
  const [collapsedPreference, setCollapsedPreference] = useState<boolean | null>(null);
  // Start with the small footprint until the viewport is known, so hydration
  // never briefly puts a full card over the player's spawn on a phone.
  const [compactViewport, setCompactViewport] = useState(true);
  const contentId = useId();
  useEffect(() => {
    const media = window.matchMedia("(max-width: 600px), (max-height: 480px)");
    const syncViewport = () => setCompactViewport(media.matches);
    syncViewport();
    media.addEventListener("change", syncViewport);
    try {
      const saved = localStorage.getItem(PREFERENCE_KEY);
      if (saved === "true" || saved === "false") setCollapsedPreference(saved === "true");
    }
    catch { /* Guidance remains usable when browser storage is unavailable. */ }
    return () => media.removeEventListener("change", syncViewport);
  }, []);
  const collapsed = collapsedPreference ?? compactViewport;

  const guide = guidanceFor(state);
  if (!guide || !state.hasGame || state.pendingBattle || state.pendingEncounter || state.gameOver) return null;

  function toggle() {
    const next = !collapsed;
    setCollapsedPreference(next);
    try { localStorage.setItem(PREFERENCE_KEY, String(next)); }
    catch { /* Collapsing still works for the current visit. */ }
  }

  return (
    <aside className={`journey-guide${inline ? " journey-guide--inline" : ""}`}
      aria-label="คำแนะนำการเดินทาง" data-collapsed={collapsed} data-tired={guide.tired || undefined}>
      <button type="button" className="journey-guide-toggle" onClick={toggle}
        aria-expanded={!collapsed} aria-controls={contentId}
        aria-label={collapsed ? "แสดงคำแนะนำการเดินทาง" : "ย่อคำแนะนำการเดินทาง"}>
        <Compass size={17} aria-hidden="true" />
        <span className="journey-guide-kicker">{collapsed ? guide.nextStep : guide.label}</span>
        <span className="journey-guide-toggle-label">{collapsed ? "ดูเพิ่ม" : "ย่อ"}</span>
        {collapsed ? <ChevronDown size={17} aria-hidden="true" /> : <ChevronUp size={17} aria-hidden="true" />}
      </button>
      <div id={contentId} className="journey-guide-content" hidden={collapsed}>
        <h2>{guide.title}</h2>
        <p className="journey-guide-description">{guide.description}</p>
        <p className="journey-guide-action">{guide.action}</p>
        <p className="journey-guide-note">{guide.note}</p>
      </div>
    </aside>
  );
}
