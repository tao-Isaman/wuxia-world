"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { SKILLS, TIERS, WEAPON_FAMILY_LABEL } from "@/lib/game";
import { cn } from "@/lib/utils";

const TIER_COLORS = [
  "bg-stone-200 text-stone-700",
  "bg-emerald-100 text-emerald-800",
  "bg-indigo-100 text-indigo-800",
  "bg-orange-100 text-orange-900",
  "bg-blue-100 text-blue-900",
];

export function SkillLibrary() {
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-3">
          คลังวิชา {SKILLS.length} วิชา — stat รวมต่อวิชา ≤ 20 pts | hpLv+mpLv=70 สำหรับกำลังภายใน
        </h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อวิชา</TableHead>
                <TableHead>ระดับ</TableHead>
                <TableHead>CD</TableHead>
                <TableHead>อาวุธ</TableHead>
                <TableHead>MG</TableHead>
                <TableHead>พลังฐาน</TableHead>
                <TableHead>สถิติ</TableHead>
                <TableHead>ผลกระทบ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SKILLS.map((sk) => {
                const t = TIERS[sk.ti];
                const sb = Object.entries(sk.st)
                  .map(([k, v]) => `${k}+${v}`)
                  .join(" ");
                const kind = sk.at === "phy" ? "⚔Phy" : sk.at === "int" ? "💜Int" : sk.se ? "⟳Buff" : "💥Debuff";
                let bp: React.ReactNode = "—";
                if (sk.at) {
                  const se = Math.round(sk.bp * (1 + sk.p / 100) + sk.f);
                  const parts = [];
                  if (sk.bp) parts.push(`bp${sk.bp}`);
                  if (sk.p) parts.push(`+${sk.p}%`);
                  if (sk.f) parts.push(`+${sk.f}`);
                  if (sk.dm !== 1) parts.push(`×${sk.dm}`);
                  bp = (
                    <div className="text-center">
                      <strong>{se}</strong>
                      <div className="text-[9px] text-muted-foreground">{parts.join(" ")}</div>
                    </div>
                  );
                }
                return (
                  <TableRow key={sk.id}>
                    <TableCell className="font-semibold">{sk.n}</TableCell>
                    <TableCell>
                      <Badge className={cn("font-semibold text-[9px]", TIER_COLORS[sk.ti])}>{t.n}</Badge>
                    </TableCell>
                    <TableCell>{t.cd}</TableCell>
                    <TableCell>{WEAPON_FAMILY_LABEL[sk.w]}</TableCell>
                    <TableCell>+{sk.mg}</TableCell>
                    <TableCell className="text-[10px]">{bp}</TableCell>
                    <TableCell className="text-[10px]">{sb}</TableCell>
                    <TableCell className="text-[10px]">
                      {kind} · {sk.d}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
