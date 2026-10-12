"use client";

import { affixCountRange, affixQuality, affixText, enhanceParts, gearTierLabel, parseGear } from "@/lib/game";

// A piece's random options (ออฟชั่นเสริม, lib/game/gear.ts): its tier, how many
// it can roll, and each option in words. Used by the bag, the profile and the
// craft shop's re-roll tab. Each option's colour says how good its roll is
// (affixQuality: the rarity colours, grey for a low roll … red-gold at the top).
export function GearAffixList({ gearKey, className }: { gearKey: string | null | undefined; className?: string }) {
  const g = parseGear(gearKey);
  if (!g) return null;
  const [lo, hi] = affixCountRange(g.def.ti);
  return (
    <div className={`gear-affixes ${className ?? ""}`} data-affix-count={g.affixes.length} data-testid="gear-affixes">
      <p className="gear-affixes-head">
        ออฟชั่นเสริม <span>ชั้น{gearTierLabel(g.def.ti)} · สุ่มได้ {lo === hi ? lo : `${lo}–${hi}`} อย่าง</span>
      </p>
      {g.enhance > 0 && (
        <p className="gear-enhance" data-enhance={g.enhance}>⚒ เสริมพลัง +{g.enhance}: {enhanceParts(g.def.ty, g.enhance).join(" · ")}</p>
      )}
      {g.affixes.length ? (
        <ul>
          {g.affixes.map((a) => {
            const q = affixQuality(a);
            return <li key={a.k} className={`affix-q${q}`} data-quality={q}>✦ {affixText(a)}</li>;
          })}
        </ul>
      ) : (
        <p className="gear-affixes-none">ไม่มีออฟชั่นเสริม</p>
      )}
    </div>
  );
}

/** A piece's options as one coloured line (compact lists: the profile's gear tab). */
export function GearAffixLine({ gearKey }: { gearKey: string | null | undefined }) {
  const g = parseGear(gearKey);
  if (!g?.affixes.length) return null;
  return (
    <small className="gear-affix-line">
      ✦{" "}
      {g.affixes.map((a, i) => (
        <span key={a.k} className={`affix-q${affixQuality(a)}`}>{i > 0 ? " · " : ""}{affixText(a)}</span>
      ))}
    </small>
  );
}
