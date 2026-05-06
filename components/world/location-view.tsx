"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { LocationScene, NpcDef } from "@/lib/world";
import {
  LIFE_SKILL_ICON,
  LIFE_SKILL_LABEL,
  evaluateCondition,
  gatherSuccessChance,
  getItem,
  getNpcsAtLocation,
  getResource,
  getScene,
  getShopAt,
  getSectHallAt,
  masteryLevel,
} from "@/lib/world";
import { NpcInteractionPopup } from "./popups/npc-interaction-popup";
import { ShopPopup } from "./popups/shop-popup";
import { SectHallPopup } from "./popups/sect-hall-popup";
import {
  useWorldStore,
  TRAVEL_STAMINA_COST,
  type GatherResult,
  type RestKind,
} from "@/store/world-store";
import { flashLoading } from "@/store/loading-store";
import { toast } from "@/store/toast-store";
import { RestPanel } from "./rest-panel";

interface Props {
  scene: LocationScene;
}

// Location view: place description, talk-to-NPC list, outbound routes.
// Routes navigate to a route scene (kind "route") which is its own selection
// screen — even single-destination routes get that intermediate screen so
// authors can give travel narration and the back-button stays consistent.
export function LocationView({ scene }: Props) {
  const state = useWorldStore();
  const gotoScene = useWorldStore((s) => s.gotoScene);
  const gatherResource = useWorldStore((s) => s.gatherResource);
  const stamina = useWorldStore((s) => s.stamina);
  const lifeSkillXp = useWorldStore((s) => s.lifeSkillXp);

  // The popup-active NPC. null = no popup. Set by clicking a registry NPC.
  const [activeNpc, setActiveNpc] = useState<NpcDef | null>(null);
  // Toggle state for the shop / sect-hall panels.
  const [shopOpen, setShopOpen] = useState(false);
  const [hallOpen, setHallOpen] = useState(false);

  const shop = getShopAt(scene.id);
  const hall = getSectHallAt(scene.id);

  const visibleNpcs = scene.npcs.filter(
    (n) => !n.visibleIf || evaluateCondition(state, n.visibleIf),
  );
  // Registry NPCs at this location, also filtered by their visibleIf.
  const registryNpcs: NpcDef[] = getNpcsAtLocation(scene.id).filter(
    (n) => !n.visibleIf || evaluateCondition(state, n.visibleIf),
  );
  const visibleRoutes = scene.routes.filter(
    (r) => !r.visibleIf || evaluateCondition(state, r.visibleIf),
  );
  const resources = (scene.resources ?? []).filter(
    (r) => !r.visibleIf || evaluateCondition(state, r.visibleIf),
  );

  // Rest tier by id prefix. Cities and inns charge gold for a full restore,
  // temples / palaces give a free half restore, and every other location
  // (including villages) falls back to the roadside tier.
  const restKind: RestKind = scene.id.startsWith("inn_") || scene.id.startsWith("city_")
    ? "inn"
    : scene.id.startsWith("temple_") || scene.id.startsWith("palace_")
      ? "temple"
      : "route";

  return (
    <div className="space-y-3">
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

      <Card>
        <CardContent className="p-3 space-y-2">
          <div className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
            ผู้คน
          </div>
          {visibleNpcs.length === 0 && registryNpcs.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-1">
              ไม่มีใครให้พูดด้วย
            </p>
          ) : (
            <div className="space-y-1.5">
              {visibleNpcs.map((npc) => {
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
              {registryNpcs.map((npc) => {
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

      <Card>
        <CardContent className="p-3 space-y-2">
          <div className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
            เส้นทาง
          </div>
          {visibleRoutes.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-1">
              ไม่มีเส้นทางออกจากที่นี่
            </p>
          ) : (
            <div className="space-y-1.5">
              {visibleRoutes.map((route) => {
                const target = getScene(route.routeSceneId);
                const valid = target?.kind === "route";
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
                      <span className="font-semibold text-sm">🚶 {route.label}</span>
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

      {(shop || hall) && (
        <Card>
          <CardContent className="p-3 space-y-2">
            <div className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
              บริการในเมือง
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {shop && (
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
              {hall && (
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

      <RestPanel kind={restKind} />

      {resources.length > 0 && (
        <Card>
          <CardContent className="p-3 space-y-2">
            <div className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
              กิจกรรม
            </div>
            <div className="space-y-1.5">
              {resources.map((node) => {
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
                    onClick={() => {
                      flashLoading("กำลังเก็บของ...");
                      const r = gatherResource(node.resourceId);
                      toast(...gatherToast(r));
                    }}
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

      <NpcInteractionPopup
        open={activeNpc !== null}
        npc={activeNpc}
        onClose={() => setActiveNpc(null)}
      />

      <ShopPopup open={shopOpen} shop={shop} onClose={() => setShopOpen(false)} />
      <SectHallPopup open={hallOpen} hall={hall} onClose={() => setHallOpen(false)} />
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
