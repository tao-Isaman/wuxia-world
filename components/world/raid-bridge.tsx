"use client";

// World bosses fought by a party (store/cloud-raid.ts, docs/online.md "World
// bosses"): the invitation a party's leader sends, the gathering at the lair,
// and the hand-over to the battle screen when the fight begins. A card, not a
// dialog — the map keeps going, so a member can still walk to the lair.
import { useEffect, useState } from "react";
import { getBoss } from "@/lib/world/data/bosses";
import { getScene } from "@/lib/world";
import { cloudRaid, useRaid } from "@/store/cloud-raid";
import { useWorldStore } from "@/store/world-store";
import { toast } from "@/store/toast-store";
import { raidErrorText } from "@/lib/world/raid-text";

/** Seconds until `until` (ms), never below 0. */
const secondsTo = (until: number | null, now: number) => (until === null ? null : Math.max(0, Math.ceil((until - now) / 1000)));

export function RaidBridge() {
  const view = useRaid((s) => s.view);
  const invite = useRaid((s) => s.invite);
  const here = useWorldStore((s) => s.currentSceneId);
  const inBattle = useWorldStore((s) => !!s.pendingBattle);
  const [now, setNow] = useState(() => Date.now());
  const fight = view?.fight ?? null;

  // The fight began on the server: the battle screen takes over.
  useEffect(() => {
    if (view && fight && fight.phase === "battle" && fight.me) {
      useWorldStore.getState().enterRaidBattle({ bossId: view.bossId, fight: fight.id, unit: fight.me });
    }
  }, [view, fight]);

  // A gathering that ended with too few: say so and forget it.
  useEffect(() => {
    if (fight?.phase === "over" && !fight.start && !inBattle) {
      toast("warn", "คนในคณะมาไม่ครบ — ศึกกับสัตว์ร้ายถูกยกเลิก");
      cloudRaid.stop();
    }
  }, [fight, inBattle]);

  const ticking = !!invite || fight?.phase === "gather";
  useEffect(() => {
    if (!ticking) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [ticking]);

  if (inBattle) return null;

  if (fight && fight.phase === "gather" && view) {
    const boss = getBoss(view.bossId);
    const leader = fight.me === "A";
    const joined = fight.members.filter((m) => m.joined).length;
    const left = secondsTo(fight.deadline, now);
    return (
      <section className="raid-card" data-hud-occluder data-testid="raid-gather" aria-label="รวมพลก่อนศึก">
        <h3>⚔ รวมพลสู้{boss?.name ?? "สัตว์ร้าย"}</h3>
        <ul>
          {fight.members.map((m) => (
            <li key={m.player} data-joined={m.joined}>{m.joined ? "✔" : "…"} {m.name}{m.player === fight.leader ? " (หัวหน้า)" : ""}</li>
          ))}
        </ul>
        <p className="raid-note">{left !== null ? `เริ่มเองในอีก ${left} วินาที` : ""} · มาแล้ว {joined}/{fight.members.length} คน</p>
        {leader
          ? <button type="button" className="pixel-action" disabled={joined < 2} onClick={() => void cloudRaid.begin()} data-testid="raid-begin">เริ่มสู้เลย</button>
          : <p className="raid-note">รอหัวหน้าคณะเริ่มศึก</p>}
      </section>
    );
  }

  if (invite && !fight) {
    const boss = getBoss(invite.bossId);
    const lair = boss ? getScene(boss.lair) : null;
    const lairName = lair && "name" in lair ? lair.name : boss?.lair ?? "";
    const atLair = !!boss && here === boss.lair;
    const left = secondsTo(invite.until, now);
    if (left === 0) return null;
    const join = () => void cloudRaid.join(invite).then((v) => { if (!v?.fight) toast("warn", raidErrorText(useRaid.getState().error, boss?.name)); });
    const guide = () => {
      if (!boss) return;
      useWorldStore.getState()._setFlag("mapWaypoint", boss.lair);
      toast("info", `นำทางไป${lairName}`);
    };
    return (
      <section className="raid-card" data-hud-occluder data-testid="raid-invite" aria-label="คำเชิญร่วมศึก">
        <h3>⚔ {invite.from} เปิดศึกกับ{boss?.name ?? "สัตว์ร้าย"}</h3>
        <p className="raid-note">ที่{lairName}{left !== null ? ` · เหลือ ${left} วินาที` : ""}</p>
        <div className="raid-actions">
          {atLair
            ? <button type="button" className="pixel-action" onClick={join} data-testid="raid-join">เข้าร่วม</button>
            : <button type="button" className="pixel-action" onClick={guide}>🧭 นำทางไป{lairName}</button>}
          <button type="button" className="pixel-action" onClick={() => cloudRaid.dismissInvite()}>ไม่เข้าร่วม</button>
        </div>
      </section>
    );
  }
  return null;
}
