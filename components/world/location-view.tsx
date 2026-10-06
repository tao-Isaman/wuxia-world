"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import type { ArtisanDef, LocationScene, NpcDef } from "@/lib/world";
import { npcPresent,
  LIFE_SKILL_ICON,
  LIFE_SKILL_LABEL,
  canPracticeAt,
  evaluateCondition,
  gatherSuccessChance,
  getArtisansAt,
  getItem,
  getLocationMap,
  getQuest,
  objectiveSpotsFor,
  getResource,
  getScene,
  getShopAt,
  getSectHallAt,
  masteryLevel,
} from "@/lib/world";
import { npcsAt, predecessorsOf } from "@/lib/world/npc-life";
import { LocationMap } from "./location-map";
import { MapHud } from "./map-hud";
import { MenuBar } from "./menu-bar";
import { NpcInteractionPopup } from "./popups/npc-interaction-popup";
import { openRestBubble } from "./rest-quick-action";
import { RumorPopup } from "./popups/rumor-popup";
import { resolveRumorChannel } from "./rumor-listen-button";
import { ShopPopup } from "./popups/shop-popup";
import { SectHallPopup } from "./popups/sect-hall-popup";
import { ArtisanPopup } from "./popups/artisan-popup";
import { PracticePopup } from "./popups/practice-popup";
import { StationPopup } from "./popups/station-popup";
import { TournamentPopup } from "./popups/tournament-popup";
import { RumorBanner } from "./rumor-banner";
import { RumorListenButton } from "./rumor-listen-button";
import { NpcStatusBadge } from "./npc-status-badge";
import {
  useWorldStore,
  TRAVEL_STAMINA_COST,
  PRACTICE_STAMINA_COST,
  type GatherResult,
} from "@/store/world-store";
import { flashLoading } from "@/store/loading-store";
import { toast } from "@/store/toast-store";
import { confirmDialog } from "@/store/confirm-store";
import { getActivity } from "@/lib/world/data/activities";
import { badgePose, lifeSkillPose } from "@/lib/characters/hero-actions";

interface Props {
  scene: LocationScene;
  /** Keep the same location runtime visible beneath a scripted conversation. */
  readOnly?: boolean;
  dialogueSpeakerId?: string;
}

// Location view: place description, talk-to-NPC list, outbound routes.
// Routes navigate to a route scene (kind "route") which is its own selection
// screen — even single-destination routes get that intermediate screen so
// authors can give travel narration and the back-button stays consistent.
export function LocationView({ scene, readOnly = false, dialogueSpeakerId }: Props) {
  const state = useWorldStore();
  const gotoScene = useWorldStore((s) => s.gotoScene);
  const gatherResource = useWorldStore((s) => s.gatherResource);
  const stamina = useWorldStore((s) => s.stamina);
  const lifeSkillXp = useWorldStore((s) => s.lifeSkillXp);

  // The popup-active NPC. null = no popup. Set by clicking a registry NPC.
  const [activeNpc, setActiveNpc] = useState<NpcDef | null>(null);
  // Toggle state for the shop / sect-hall / practice panels.
  const [shopOpen, setShopOpen] = useState(false);
  const [hallOpen, setHallOpen] = useState(false);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [stationOpen, setStationOpen] = useState(false);
  const [tournamentOpen, setTournamentOpen] = useState(false);
  const [activeArtisan, setActiveArtisan] = useState<ArtisanDef | null>(null);
  // Map-spot popups: rest + rumor objects on the painted map.
  const [rumorOpen, setRumorOpen] = useState(false);
  // Fullscreen safety drawer for content a map hasn't placed yet.
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!readOnly) return;
    // The location now survives dialogue. Clear its old overlays as the previous
    // unmount did, so returning from a conversation restores unobstructed play.
    setActiveNpc(null);
    setShopOpen(false);
    setHallOpen(false);
    setPracticeOpen(false);
    setActiveArtisan(null);
    setRumorOpen(false);
    setDrawerOpen(false);
  }, [readOnly]);

  const shop = getShopAt(scene.id);
  const hall = getSectHallAt(scene.id);
  const artisans = getArtisansAt(scene.id);
  const canPractice = canPracticeAt(scene);

  const visibleNpcs = scene.npcs.filter(
    (n) => !n.visibleIf || evaluateCondition(state, n.visibleIf),
  );
  // Registry NPCs at this location, also filtered by their visibleIf.
  // Residents who are home and travellers who are here (lib/world/npc-life.ts).
  const registryNpcs: NpcDef[] = npcsAt(state, scene.id).filter(
    (n) => npcPresent(state, n.id) && (!n.visibleIf || evaluateCondition(state, n.visibleIf)),
  );
  const visibleRoutes = scene.routes.filter(
    (r) => !r.visibleIf || evaluateCondition(state, r.visibleIf),
  );
  const resources = (scene.resources ?? []).filter(
    (r) => !r.visibleIf || evaluateCondition(state, r.visibleIf),
  );

  // AI-painted map view (see lib/world/data/location-maps.ts). Entries
  // placed on the map drop out of the button cards below; anything the
  // map doesn't place (or locations with no map at all) keeps the
  // classic card UI.
  const map = getLocationMap(scene.id);
  // On a painted map: their own spot, the seat they inherited, or — for a
  // simulated traveller — a free spot near the way in (location-map.tsx).
  const onMap = (npcId: string) => !!map && (!!map.npcSpots?.[npcId] || !!state.npcExt[npcId]
    || predecessorsOf(state, npcId).some((p) => !!map.npcSpots?.[p]));
  const onMapRoute = (routeSceneId: string) =>
    !!map?.exits?.some((e) => `route_${scene.id}__to__${e.to}` === routeSceneId);
  const cardNpcs = map ? visibleNpcs.filter((n) => !onMap(n.id)) : visibleNpcs;
  const cardRegistryNpcs = map
    ? registryNpcs.filter((n) => !onMap(n.id))
    : registryNpcs;
  const cardRoutes = map
    ? visibleRoutes.filter((r) => !onMapRoute(r.routeSceneId))
    : visibleRoutes;
  const showNpcCard = !map || cardNpcs.length + cardRegistryNpcs.length > 0;
  const showRouteCard = !map || cardRoutes.length > 0;

  // Service spots placed on the map drop out of the cards below.
  const spotKinds = new Set((map?.spots ?? []).map((s) => s.kind));
  const spotArtisanIds = new Set(
    (map?.spots ?? []).flatMap((s) => (s.kind === "artisan" ? [s.artisanId] : [])),
  );
  const spotResourceIds = new Set(
    (map?.spots ?? []).flatMap((s) => (s.kind === "resource" ? [s.resourceId] : [])),
  );
  const showShopBtn = !!shop && !spotKinds.has("shop");
  const showHallBtn = !!hall && !spotKinds.has("sectHall");
  const showPracticeCard = canPractice && !spotKinds.has("practice");
  const cardArtisans = artisans.filter((a) => !spotArtisanIds.has(a.id));
  const cardResources = resources.filter((n) => !spotResourceIds.has(n.resourceId));
  const rumorChannel = resolveRumorChannel(scene.id, state.sectMembership);

  // Shared gather runner — used by the resource cards and map spots.
  // Jail activities: the work overlay while time passes, then the outcome.
  // The gate either opens or offers to sit out the rest of the sentence.
  async function runActivity(id: string) {
    const activity = getActivity(id);
    if (!activity) return;
    const store = useWorldStore.getState();
    const last = store.activityDays[id];
    const cooling = !!activity.place && last !== undefined && store.day - last < (activity.place.cooldownDays ?? 1);
    if (activity.hours > 0 && store.stamina >= activity.stamina && !cooling) {
      flashLoading(`${activity.label}...`, 1200, activity.id === "jail_meditate" ? "rest" : "work", badgePose(activity.badge));
    }
    const result = store.doActivity(id);
    if (result.ok) { toast("success", result.message); return; }
    if (result.reason === "locked") {
      const ok = await confirmDialog({ title: "ประตูคุก", message: `${result.message}\nนั่งนับวันจนพ้นโทษเลยหรือไม่?`,
        confirmText: "นั่งนับวัน", cancelText: "ยังก่อน" });
      if (!ok) return;
      flashLoading("นับวันในห้องขัง...", 1600, "rest", { sheet: "work", row: "meditate" });
      useWorldStore.getState().serveSentence();
      toast("success", "พ้นโทษแล้ว · ผู้คุมไขประตูปล่อยตัว");
      return;
    }
    toast("warn", result.message);
  }

  // Quest objective spots: a short busy beat, then what the player found.
  function runObjective(questId: string, spotIndex: number) {
    const store = useWorldStore.getState();
    const def = getQuest(questId);
    const spot = def ? objectiveSpotsFor(store, def)[spotIndex] : undefined;
    if (!spot) return;
    if (!spot.spot.sceneId) flashLoading(`${spot.spot.label}...`, 1200, "stealth");
    const result = store.doQuestObjective(questId, spotIndex);
    if (!result.ok) { toast("warn", result.message); return; }
    if (result.sceneId) return;
    toast("success", result.message, 6000);
    if (result.advanced) toast("info", `ภารกิจ「${def!.name}」คืบหน้า`);
  }

  function runGather(resourceId: string) {
    const res = getResource(resourceId);
    if (!res) return;
    // Hunting actions kick straight into a battle screen — the loading
    // overlay would flash for a frame and then get yanked when
    // BattleArena mounts. Skip it so the transition feels snappy.
    const isHunt =
      res.skill === "hunting" && res.opponentIds && res.opponentIds.length > 0;
    if (!isHunt) flashLoading("กำลังเก็บของ...", undefined, "work", lifeSkillPose(res.skill));
    const r = gatherResource(resourceId);
    toast(...gatherToast(r));
  }

  // Anything the map hasn't placed — surfaced in the fullscreen drawer
  // so unplaced content is never unreachable.
  const hasLeftovers =
    cardNpcs.length + cardRegistryNpcs.length > 0 ||
    cardRoutes.length > 0 ||
    showShopBtn ||
    showHallBtn ||
    cardArtisans.length > 0 ||
    cardResources.length > 0 ||
    showPracticeCard;

  const cards = (
    <>
      {showNpcCard && (
      <Card>
        <CardContent className="p-3 space-y-2">
          <div className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
            ผู้คน
          </div>
          {cardNpcs.length === 0 && cardRegistryNpcs.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-1">
              ไม่มีใครให้พูดด้วย
            </p>
          ) : (
            <div className="space-y-1.5">
              {cardNpcs.map((npc) => {
                const target = getScene(npc.dialogSceneId);
                const valid = target?.kind === "dialog";
                return (
                  <Button
                    key={npc.id}
                    variant="outline"
                    disabled={!valid}
                    onClick={() => gotoScene(npc.dialogSceneId)}
                    className="w-full justify-start text-left h-auto py-2 whitespace-normal"
                  >
                    <span className="flex flex-col items-start gap-0.5">
                      <span className="font-semibold text-sm">💬 {npc.name}</span>
                      {npc.hint && (
                        <span className="text-[10px] text-muted-foreground">
                          {npc.hint}
                        </span>
                      )}
                    </span>
                  </Button>
                );
              })}
              {cardRegistryNpcs.map((npc) => {
                const canSpar = !!npc.sparOpponentId;
                const canTalk = !!npc.dialogSceneId;
                return (
                  <Button
                    key={`registry-${npc.id}`}
                    variant="outline"
                    onClick={() => setActiveNpc(npc)}
                    className="w-full justify-start text-left h-auto py-2 whitespace-normal"
                  >
                    <span className="flex flex-col items-start gap-0.5 w-full">
                      <span className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-sm">👤 {npc.name}</span>
                        {/* Liveness Layer §4.3 — sim status (dead /
                            secluded / missing). Renders nothing for
                            alive / generic NPCs. */}
                        <NpcStatusBadge npcId={npc.id} />
                        {canTalk && <Badge variant="outline" className="text-[9px]">💬 ทักทาย</Badge>}
                        {canSpar && <Badge variant="outline" className="text-[9px]">⚔ ประลอง</Badge>}
                      </span>
                      {npc.description && (
                        <span className="text-[10px] text-muted-foreground">
                          {npc.description}
                        </span>
                      )}
                    </span>
                  </Button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {showRouteCard && (
      <Card>
        <CardContent className="p-3 space-y-2">
          <div className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
            เส้นทาง
          </div>
          {cardRoutes.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-1">
              ไม่มีเส้นทางออกจากที่นี่
            </p>
          ) : (
            <div className="space-y-1.5">
              {cardRoutes.map((route) => {
                const target = getScene(route.routeSceneId);
                const valid = target?.kind === "route";
                const duplicateLabel = visibleRoutes.some(other => other !== route && other.label === route.label);
                const destinations = valid ? target.destinations.map(destination => getScene(destination.locationId))
                  .flatMap(destination => destination?.kind === "location" ? [destination.name] : []).join(" / ") : "";
                const label = duplicateLabel && destinations ? `${route.label} · ${destinations}` : route.label;
                const tooTired = stamina < TRAVEL_STAMINA_COST;
                return (
                  <Button
                    key={route.routeSceneId}
                    variant="outline"
                    disabled={!valid || tooTired}
                    onClick={() => gotoScene(route.routeSceneId)}
                    className="w-full justify-start text-left h-auto py-2 whitespace-normal"
                  >
                    <span className="flex flex-col items-start gap-0.5">
                      <span className="font-semibold text-sm">🚶 {label}</span>
                      <span className="text-[10px] text-muted-foreground">
                        ⚡ {TRAVEL_STAMINA_COST}
                        {route.hint && <span className="ml-2">{route.hint}</span>}
                        {tooTired && (
                          <span className="text-rose-600 ml-2">พลังไม่พอ</span>
                        )}
                      </span>
                    </span>
                  </Button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      )}

      {/* Liveness Layer §4.1 — "ฟังข่าวลือ" entry. The button itself
          decides whether to render based on the scene id + the player's
          sect membership; rendering this wrapper always is safe. We put
          it inside its own card so it lives next to other location-
          level actions like ซื้อ-ขาย / สำนัก / ฝึกฝน. */}
      {!spotKinds.has("rumor") && <RumorListenSection locationId={scene.id} />}

      {(showShopBtn || showHallBtn) && (
        <Card>
          <CardContent className="p-3 space-y-2">
            <div className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
              บริการในเมือง
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {showShopBtn && shop && (
                <Button
                  variant="outline"
                  onClick={() => setShopOpen(true)}
                  className="justify-start h-auto py-2 whitespace-normal"
                >
                  <span className="flex flex-col items-start gap-0.5">
                    <span className="font-semibold text-sm">{shop.label}</span>
                    <span className="text-[10px] text-muted-foreground">
                      ซื้อ-ขายของ · ขายคืน {Math.round(shop.sellMultiplier * 100)}%
                    </span>
                  </span>
                </Button>
              )}
              {showHallBtn && hall && (
                <Button
                  variant="outline"
                  onClick={() => setHallOpen(true)}
                  className="justify-start h-auto py-2 whitespace-normal"
                >
                  <span className="flex flex-col items-start gap-0.5">
                    <span className="font-semibold text-sm">{hall.label}</span>
                    <span className="text-[10px] text-muted-foreground">
                      เรียนวิชาฝีมือ / วิชาในกาย ขั้น 0–1
                    </span>
                  </span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {cardArtisans.length > 0 && (
        <Card>
          <CardContent className="p-3 space-y-2">
            <div className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
              ช่างฝีมือ
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {cardArtisans.map((a) => (
                <Button
                  key={a.id}
                  variant="outline"
                  onClick={() => setActiveArtisan(a)}
                  className="justify-start h-auto py-2 whitespace-normal"
                >
                  <span className="flex flex-col items-start gap-0.5">
                    <span className="font-semibold text-sm">{a.label}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {LIFE_SKILL_ICON[a.profession]} {LIFE_SKILL_LABEL[a.profession]}
                      {" · ซื้อสูตร / ประดิษฐ์ / ขายของ"}
                    </span>
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showPracticeCard && (
        <Card>
          <CardContent className="p-3 space-y-2">
            <div className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
              การฝึกฝน
            </div>
            <Button
              variant="outline"
              onClick={() => setPracticeOpen(true)}
              disabled={stamina < PRACTICE_STAMINA_COST}
              className="w-full justify-start text-left h-auto py-2 whitespace-normal"
            >
              <span className="flex flex-col items-start gap-0.5">
                <span className="font-semibold text-sm">🧘 ฝึกฝน</span>
                <span className="text-[10px] text-muted-foreground">
                  เลือกวิชาที่จะฝึก · ⚡ {PRACTICE_STAMINA_COST}
                  {stamina < PRACTICE_STAMINA_COST && (
                    <span className="text-rose-600 ml-2">พลังไม่พอ</span>
                  )}
                </span>
              </span>
            </Button>
          </CardContent>
        </Card>
      )}

      {cardResources.length > 0 && (
        <Card>
          <CardContent className="p-3 space-y-2">
            <div className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
              กิจกรรม
            </div>
            <div className="space-y-1.5">
              {cardResources.map((node) => {
                const res = getResource(node.resourceId);
                if (!res) return null;
                const tooLow = stamina < res.staminaCost;
                const lvl = masteryLevel(lifeSkillXp[res.skill] ?? 0);
                const chance = gatherSuccessChance(lvl, res.level);
                const chancePct = Math.round(chance * 100);
                const chanceColor =
                  chance >= 0.7 ? "text-emerald-600" : chance >= 0.4 ? "text-amber-600" : "text-rose-600";
                return (
                  <Button
                    key={node.resourceId}
                    variant="outline"
                    disabled={tooLow}
                    onClick={() => runGather(node.resourceId)}
                    className="w-full justify-start text-left h-auto py-2 whitespace-normal"
                    title={node.hint ?? res.hint}
                  >
                    <span className="flex flex-col items-start gap-0.5 w-full">
                      <span className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-sm">
                          {LIFE_SKILL_ICON[res.skill]} {node.label ?? res.name}
                        </span>
                        <Badge variant="outline" className="text-[9px]">
                          {LIFE_SKILL_LABEL[res.skill]}
                        </Badge>
                        <Badge variant="outline" className="text-[9px]">
                          ระดับ {res.level}
                        </Badge>
                        <span className={`text-[10px] font-semibold ${chanceColor}`}>
                          ✓ {chancePct}%
                        </span>
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        ⚡ {res.staminaCost}
                        <span className="ml-2">มาสเตอร์รี่ของเจ้าระดับ {lvl}</span>
                        {tooLow && <span className="text-rose-600 ml-2">พลังไม่พอ</span>}
                        {res.opponentIds && (
                          <span className="text-amber-600 ml-2">⚔ จะเกิดการต่อสู้</span>
                        )}
                      </span>
                    </span>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

    </>
  );

  const popups = (
    <>
      <NpcInteractionPopup
        open={activeNpc !== null}
        npc={activeNpc}
        onClose={() => setActiveNpc(null)}
      />
      <ShopPopup open={shopOpen} shop={shop} onClose={() => setShopOpen(false)} />
      <SectHallPopup open={hallOpen} hall={hall} onClose={() => setHallOpen(false)} />
      <ArtisanPopup
        open={activeArtisan !== null}
        artisan={activeArtisan}
        onClose={() => setActiveArtisan(null)}
      />
      <StationPopup open={stationOpen} onClose={() => setStationOpen(false)} />
      <TournamentPopup open={tournamentOpen} onClose={() => setTournamentOpen(false)} />
      <PracticePopup
        open={practiceOpen}
        scene={canPractice ? scene : null}
        onClose={() => setPracticeOpen(false)}
      />
      {rumorChannel && (
        <RumorPopup
          open={rumorOpen}
          channel={rumorChannel.channel}
          onClose={() => setRumorOpen(false)}
        />
      )}
    </>
  );

  // ── fullscreen game mode — the map IS the screen ────────────────────
  if (map) {
    return (
      // !mt-0: the page wrapper's space-y-3 would otherwise push this
      // fixed layer 12px down — margins still offset fixed elements.
      <div className="fixed inset-0 z-40 bg-ink !mt-0" inert={readOnly || undefined} aria-hidden={readOnly || undefined}>
        <LocationMap
          key={scene.id}
          scene={scene}
          map={map}
          readOnly={readOnly}
          dialogueSpeakerId={dialogueSpeakerId}
          handlers={{
            onRegistryNpc: setActiveNpc,
            onShop: () => setShopOpen(true),
            onSectHall: () => setHallOpen(true),
            onArtisan: (a) => setActiveArtisan(a),
            onRest: openRestBubble,
            onRumor: () => setRumorOpen(true),
            onPractice: () => setPracticeOpen(true),
            onResource: runGather,
            onActivity: (id) => void runActivity(id),
            onObjective: runObjective,
            onStation: () => setStationOpen(true),
            onTournament: () => setTournamentOpen(true),
          }}
        />
        {!readOnly && <>
        <MapHud />
        <MenuBar hud />
        <RumorBanner locationId={scene.id} floating />
        {hasLeftovers && (
          <button
            type="button"
            title="อื่น ๆ ในบริเวณนี้"
            onClick={() => setDrawerOpen(true)}
            aria-label="อื่น ๆ ในบริเวณนี้"
            data-hud-occluder
            className="journey-extras absolute top-40 right-3 z-30 w-11 h-11 pixel-panel hover:brightness-125"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/ui/log.png" alt="" className="pixel w-7 h-7" draggable={false} />
          </button>
        )}
        <Modal
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title={scene.name}
        >
          <p className="text-xs leading-relaxed text-muted-foreground italic mb-3">
            {scene.description}
          </p>
          <div className="space-y-3">{cards}</div>
        </Modal>
        {popups}
        </>}
      </div>
    );
  }

  // ── classic card layout for locations without a map ─────────────────
  return (
    <div className="space-y-3">
      {/* Liveness Layer §4.2 — passive arrival rumor banner. Renders
          itself only when the scene is city-like and the 7-day cooldown
          has elapsed. No-op everywhere else, so it's safe to mount
          unconditionally above the main location card. */}
      <RumorBanner locationId={scene.id} />

      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
            สถานที่
          </div>
          <h2 className="text-lg font-bold">{scene.name}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground italic">
            {scene.description}
          </p>
        </CardContent>
      </Card>

      {cards}
      {popups}
    </div>
  );
}

// Map the GatherResult discriminator to the right toast kind + message.
type ToastTuple = ["success" | "info" | "warn" | "error", string];
function gatherToast(r: GatherResult): ToastTuple {
  if (!r.ok) {
    if (r.reason === "stamina") return ["warn", "พลังไม่พอสำหรับกิจกรรมนี้"];
    if (r.reason === "no-build") return ["error", "ตัวละครยังไม่พร้อม"];
    return ["error", "ไม่สามารถทำกิจกรรมนี้ได้ขณะนี้"];
  }
  if (r.type === "battle") return ["info", "พบเจอสัตว์ป่า — เตรียมต่อสู้!"];
  if (r.dropCheck === "failed") {
    const pct = Math.round(r.successChance * 100);
    return ["warn", `ลองมือไม่สำเร็จ — มาสเตอร์รี่ยังไม่พอ (โอกาส ${pct}%) · +${r.xpGained} xp`];
  }
  if (r.items.length === 0) return ["info", `เก็บได้แต่ไม่มีของชิ้นใด · +${r.xpGained} xp`];
  const parts = r.items.map((it) => {
    const def = getItem(it.itemId);
    return `${def?.name ?? it.itemId}×${it.count}`;
  });
  return ["success", `${parts.join(", ")} · +${r.xpGained} xp`];
}

// Wraps the RumorListenButton in a header card. Renders nothing when
// the button itself decides not to render — we keep the section + card
// chrome out of the DOM in that case so the LocationView stays clean
// at sect halls the player isn't a member of, wilderness leaves, etc.
function RumorListenSection({ locationId }: { locationId: string }) {
  // Mirror the button's gating so we don't render an empty header.
  // Using the same membership read keeps the resolution in one spot:
  // any change to RumorListenButton's matrix flows here automatically.
  // (The double render of the button's gate is cheap — a couple of
  // string prefix checks per scene mount.)
  const sectMembership = useWorldStore((s) => s.sectMembership);
  const show = (() => {
    if (locationId.includes("market")) return true;
    if (locationId.startsWith("inn_")) return true;
    if (locationId.startsWith("city_")) return true;
    if (locationId.startsWith("sect_")) {
      const sectId = locationId.slice("sect_".length);
      const m = sectMembership[sectId as keyof typeof sectMembership];
      return !!m && m.status === "active";
    }
    return false;
  })();
  if (!show) return null;

  return (
    <Card>
      <CardContent className="p-3 space-y-2">
        <div className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
          ข่าวลือในย่าน
        </div>
        <RumorListenButton locationId={locationId} />
      </CardContent>
    </Card>
  );
}
