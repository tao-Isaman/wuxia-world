"use client";
import { FERRYMAN } from "@/lib/world/ferries";
import { WAYPOINT_FLAG, activeGuide, getQuest, guideFerryLeg, trackedQuestId, waypointGuide } from "@/lib/world";
import { useWorldStore } from "@/store/world-store";

/**
 * On-screen tracker for the quest the player follows (📌 in the quest log,
 * else the newest active quest): name, stage, what to do next with its
 * counter, and where. Tapping it opens the quest log.
 */
export function QuestTracker({ onOpen }: { onOpen: () => void }) {
  const state = useWorldStore();
  const waypoint = waypointGuide(state);
  const quest = trackedQuestId(state) ? getQuest(trackedQuestId(state)!) : undefined;
  return <>
    {waypoint && (
      <aside className="quest-tracker quest-tracker--waypoint" aria-label="จุดหมายบนแผนที่" data-hud-occluder data-waypoint={waypoint.locationId ?? ""}>
        <div className="qt-waypoint">
          <span className="qt-kicker">🧭 จุดหมายบนแผนที่</span>
          <strong className="qt-name">{waypoint.locationName}</strong>
          <span className="qt-where">{waypoint.path.length <= 1 ? "อยู่ที่นี่" : `อีก ${waypoint.path.length - 1} ช่วงทาง · ตามลูกศรไป`}</span>
          <FerryLeg guide={waypoint} />
          <button type="button" className="qt-cancel" aria-label="ยกเลิกการนำทาง" title="ยกเลิกการนำทาง"
            onClick={() => useWorldStore.getState()._setFlag(WAYPOINT_FLAG, "")}>✕</button>
        </div>
      </aside>
    )}
    {quest && <TrackedQuest onOpen={onOpen} />}
  </>;
}

function TrackedQuest({ onOpen }: { onOpen: () => void }) {
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
        <FerryLeg guide={guide} />
      </button>
    </aside>
  );
}

/** A boat leg next: which pier to ask the boatman for (shown on every screen size). */
function FerryLeg({ guide }: { guide: Parameters<typeof guideFerryLeg>[1] }) {
  const sceneId = useWorldStore((s) => s.currentSceneId);
  const leg = guideFerryLeg({ currentSceneId: sceneId }, guide);
  if (!leg) return null;
  return <span className="qt-ferry" data-ferry-to={leg.to}>⛵ ลงเรือ{FERRYMAN.name.split(" ")[0]}ไป <b>{leg.name}</b></span>;
}
