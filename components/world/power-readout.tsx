"use client";

import type { BattleBriefing } from "@/lib/world/battle-bridge";

const OUTLOOK_TEXT: Record<BattleBriefing["outlook"], string> = {
  deadly: "อันตรายยิ่ง — ศัตรูเหนือกว่าเจ้ามาก",
  stronger: "ศัตรูเหนือกว่าเจ้าเล็กน้อย จงระวัง",
  even: "ฝีมือสูสีกัน",
  weaker: "ศัตรูด้อยกว่าเจ้าเล็กน้อย",
  trivial: "ศัตรูด้อยกว่าเจ้ามาก",
};

/** The hero's and the enemies' power tiers side by side (names only, no numbers), with how the fight looks. */
export function PowerReadout({ briefing }: { briefing: BattleBriefing }) {
  const { hero, foe, pack, outlook } = briefing;
  const packTop = pack[0];
  return (
    <div className="power-readout" data-testid="power-readout" data-outlook={outlook}
      data-hero-tier={hero.tier.tier} data-foe-tier={foe.tier.tier}>
      <dl>
        <div>
          <dt>ระดับพลังของเจ้า</dt>
          <dd><span className="power-tier-badge">{hero.tier.name}</span></dd>
        </div>
        <div>
          <dt>ระดับพลังของ{foe.name}</dt>
          <dd><span className="power-tier-badge">{foe.tier.name}</span></dd>
        </div>
        {packTop && (
          <div>
            <dt>พรรคพวกที่ติดตามมา</dt>
            <dd>เก่งสุดระดับ <span className="power-tier-badge">{packTop.tier.name}</span></dd>
          </div>
        )}
      </dl>
      <p className={`power-outlook power-outlook-${outlook}`} role="status">{OUTLOOK_TEXT[outlook]}</p>
    </div>
  );
}
