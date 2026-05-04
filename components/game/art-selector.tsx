"use client";

import { ARTS, deriveAll, type Side, getArt } from "@/lib/game";
import { useCharacterStore } from "@/store/character-store";
import { Combobox } from "@/components/ui/combobox";
import { Slider } from "@/components/ui/slider";

interface Props {
  side: Side;
}

export function ArtSelector({ side }: Props) {
  const build = useCharacterStore((s) => s.builds[side]);
  const setArt = useCharacterStore((s) => s.setArt);
  const setLevel = useCharacterStore((s) => s.setArtLevel);

  const art = getArt(build.artId);
  const lv = build.artLevel;
  const all = deriveAll(build);

  const options = ARTS.map((a) => ({ value: a.id, label: a.n }));
  const statBonuses =
    art.id === "none"
      ? ""
      : Object.entries(art.stats)
          .map(([k, v]) => `${k}+${Math.floor((v as number) * (lv / 10))}`)
          .join(" ");

  return (
    <section className="border-t pt-3 mt-3">
      <h3 className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-2">
        กำลังภายใน
      </h3>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <Combobox
            options={options}
            value={build.artId}
            onChange={(v) => setArt(side, v ?? "none")}
            allowClear={false}
          />
        </div>
        <label className="text-[11px] text-muted-foreground shrink-0">ขั้น</label>
        <Slider
          min={1}
          max={10}
          step={1}
          value={[lv]}
          onValueChange={(v) => setLevel(side, v[0])}
          className="w-20"
        />
        <span className="text-xs font-semibold w-5 text-right">{lv}</span>
      </div>

      {art.id !== "none" && (
        <div className="rounded-md bg-muted/40 p-3 text-[11px] leading-relaxed">
          <div>
            <strong>{art.sc}</strong> · {art.tp}
          </div>
          <div>
            {statBonuses} | HP+{art.hL * lv} MP+{art.mL * lv}
          </div>
          {art.act && (
            <div>
              ⚡ <strong>{art.act.n}</strong> (MP {art.act.c}): {art.act.d}
            </div>
          )}
          {art.pas && <div>◆ {art.pas.d}</div>}
          <div className="mt-2 border-l-2 border-primary pl-2">
            รวม HP <strong>{all.HP}</strong> · MP <strong>{all.MP}</strong>
          </div>
        </div>
      )}
    </section>
  );
}
