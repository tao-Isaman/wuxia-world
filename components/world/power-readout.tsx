"use client";

import type { BattleBriefing } from "@/lib/world/battle-bridge";

const OUTLOOK_TEXT: Record<BattleBriefing["outlook"], string> = {
  deadly: "อันตรายยิ่ง — ศัตรูเหนือกว่าเจ้าหลายขั้น",
  stronger: "ศัตรูเหนือกว่าเจ้าหนึ่งขั้น จงระวัง",
  even: "ฝีมือสูสีกัน",
  weaker: "ศัตรูด้อยกว่าเจ้าหนึ่งขั้น",
  trivial: "ศัตรูด้อยกว่าเจ้าหลายขั้น",
};

/** The hero's and the enemies' power tiers side by side, with how the fight looks. */
export function PowerReadout({ briefing }: { briefing: BattleBriefing }) {
  const { hero, foe, pack, outlook } = briefing;
  const packTop = pack[0];
  return (
    <div className="power-readout" data-testid="power-readout" data-outlook={outlook}
      data-hero-tier={hero.tier.tier} data-foe-tier={foe.tier.tier}>
      <dl>
        <div>
          <dt>ระดับพลังของเจ้า</dt>
          <dd><span className="power-tier-badge">ขั้น {hero.tier.tier}</span> {hero.tier.name}</dd>
        </div>
        <div>
          <dt>ระดับพลังของ{foe.name}</dt>
          <dd><span className="power-tier-badge" data-tier={foe.tier.tier}>ขั้น {foe.tier.tier}</span> {foe.tier.name}</dd>
        </div>
        {packTop && (
          <div>
            <dt>พรรคพวกอีก {pack.length} คน</dt>
            <dd>สูงสุด <span className="power-tier-badge">ขั้น {packTop.tier.tier}</span> {packTop.tier.name}</dd>
          </div>
        )}
      </dl>
      <p className={`power-outlook power-outlook-${outlook}`} role="status">{OUTLOOK_TEXT[outlook]}</p>
    </div>
  );
}
