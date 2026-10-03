"use client";
import { activeGuide, getQuest, trackedQuestId } from "@/lib/world";
import { useWorldStore } from "@/store/world-store";

/**
 * On-screen tracker for the quest the player follows (📌 in the quest log,
 * else the newest active quest): name, stage, what to do next with its
 * counter, and where. Tapping it opens the quest log.
 */
export function QuestTracker({ onOpen }: { onOpen: () => void }) {
  const state = useWorldStore();
  const questId = trackedQuestId(state);
  const quest = questId ? getQuest(questId) : undefined;
  if (!questId || !quest) return null;
  const guide = activeGuide(state);
  const progress = state.quests[questId];
  const stage = progress ? quest.stages[progress.stage] : undefined;
  const where = guide?.locationName
    ? guide.path.length <= 1 ? `${guide.locationName} · อยู่ที่นี่` : `${guide.locationName} · อีก ${guide.path.length - 1} ช่วงทาง`
    : null;
  return (
    <aside className="quest-tracker" aria-label="ภารกิจที่ติดตาม" data-hud-occluder data-tracked-quest={questId}>
      <button type="button" onClick={onOpen} title="เปิดบันทึกภารกิจ" aria-label="เปิดบันทึกภารกิจที่ติดตาม">
        <span className="qt-kicker">📌 ติดตาม · ขั้น {(progress?.stage ?? 0) + 1}/{quest.stages.length}</span>
        <strong className="qt-name">{quest.name}</strong>
        <span className="qt-action">
          🎯 {guide?.action ?? stage?.description}
          {guide?.progress && <b> {guide.progress.current}/{guide.progress.required}</b>}
        </span>
        {where && <span className="qt-where">📍 {where}</span>}
      </button>
    </aside>
  );
}
