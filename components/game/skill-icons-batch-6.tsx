import type { IconRenderer } from "./skill-icons-registry";
import { SKILL_ICON_OVERRIDES, ART_ICON_OVERRIDES } from "./skill-icons-registry";

// ─── Batch 6: the legendary beasts' (บอส) moves and inner arts ─────────
//
// The 18 `bss_*` moves and 6 `art_boss_*` arts (sc "สัตว์ร้าย"). Fought,
// never learned, but they show on the battle UI and in the /debug sandbox.
// Same rules as the other batches: 64×64 viewBox, chunky strokes, `ink`
// outlines and the tier `accent` fill (T5 vermilion).

const GOLD = "#f5c518";
const BLOOD = "#b4121f";
const SEA = "#2f9fe0";
const FLAME = "#ff6a1a";

const SKILL_BATCH: Record<string, IconRenderer> = {
  // เขี้ยวพิษทองคำ — two golden fangs dripping venom
  bss_serpent_fang: ({ ink }) => (
    <g>
      <path d="M 14 14 Q 32 6 50 14 L 44 22 Q 32 16 20 22 Z" fill={GOLD} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      <path d="M 22 20 L 26 44 L 30 22 Z" fill="#fff8e0" stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      <path d="M 34 22 L 38 44 L 42 20 Z" fill="#fff8e0" stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      <circle cx={26} cy={50} r={3} fill="#7fdc5a" stroke={ink} strokeWidth={1.5} />
      <circle cx={38} cy={54} r={3} fill="#7fdc5a" stroke={ink} strokeWidth={1.5} />
    </g>
  ),
  // รัดกระดูกแหลก — golden coils crushing a bone
  bss_serpent_coil: ({ ink }) => (
    <g>
      <rect x={28} y={8} width={8} height={48} rx={4} fill="#f4ecd8" stroke={ink} strokeWidth={2} />
      <ellipse cx={32} cy={20} rx={18} ry={6} fill="none" stroke={GOLD} strokeWidth={5} />
      <ellipse cx={32} cy={32} rx={18} ry={6} fill="none" stroke={GOLD} strokeWidth={5} />
      <ellipse cx={32} cy={44} rx={18} ry={6} fill="none" stroke={GOLD} strokeWidth={5} />
      <path d="M 26 30 L 30 34 L 26 38" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <circle cx={50} cy={20} r={2} fill={ink} />
    </g>
  ),
  // ลอกคราบเกล็ดทอง — an empty shed skin peeling away in scales
  bss_serpent_molt: ({ ink, accent }) => (
    <g>
      <path d="M 12 50 Q 20 30 32 34 Q 46 38 50 16" fill="none" stroke={ink} strokeWidth={9} strokeLinecap="round" />
      <path d="M 12 50 Q 20 30 32 34 Q 46 38 50 16" fill="none" stroke={GOLD} strokeWidth={5} strokeLinecap="round" />
      <path d="M 20 40 l 4 -3 M 30 34 l 4 0 M 42 30 l 3 -4" stroke={ink} strokeWidth={1.5} />
      <path d="M 44 50 l 4 -4 l 4 4 l -4 4 Z" fill={accent} stroke={ink} strokeWidth={1.5} />
      <path d="M 52 38 l 3 -3 l 3 3 l -3 3 Z" fill={GOLD} stroke={ink} strokeWidth={1.5} />
      <path d="M 10 18 l 3 -3 l 3 3 l -3 3 Z" fill={GOLD} stroke={ink} strokeWidth={1.5} />
    </g>
  ),
  // กรงเล็บเลือดคราม — three blue-and-blood claw rakes
  bss_tiger_claw: ({ ink }) => (
    <g>
      <path d="M 14 12 Q 22 30 18 54" fill="none" stroke={ink} strokeWidth={7} strokeLinecap="round" />
      <path d="M 30 8 Q 38 30 32 56" fill="none" stroke={ink} strokeWidth={7} strokeLinecap="round" />
      <path d="M 46 12 Q 54 30 48 54" fill="none" stroke={ink} strokeWidth={7} strokeLinecap="round" />
      <path d="M 14 12 Q 22 30 18 54" fill="none" stroke={BLOOD} strokeWidth={3.5} strokeLinecap="round" />
      <path d="M 30 8 Q 38 30 32 56" fill="none" stroke="#3a5fd0" strokeWidth={3.5} strokeLinecap="round" />
      <path d="M 46 12 Q 54 30 48 54" fill="none" stroke={BLOOD} strokeWidth={3.5} strokeLinecap="round" />
    </g>
  ),
  // คำรามสะท้านภพ — a tiger's open maw with shock rings
  bss_tiger_roar: ({ ink, accent }) => (
    <g>
      <path d="M 10 32 Q 10 16 26 16 L 30 28 L 26 44 Q 10 46 10 32 Z" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      <path d="M 18 24 L 20 28 M 18 40 L 20 36" stroke="#fff8e0" strokeWidth={2.5} strokeLinecap="round" />
      <path d="M 38 20 Q 44 32 38 44" fill="none" stroke={ink} strokeWidth={3} strokeLinecap="round" />
      <path d="M 46 14 Q 54 32 46 50" fill="none" stroke={ink} strokeWidth={3} strokeLinecap="round" />
      <path d="M 54 10 Q 62 32 54 54" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
    </g>
  ),
  // โลหิตคลั่ง — a burning red eye with blood veins
  bss_tiger_frenzy: ({ ink }) => (
    <g>
      <path d="M 8 32 Q 32 10 56 32 Q 32 54 8 32 Z" fill="#fff0e8" stroke={ink} strokeWidth={2.5} />
      <circle cx={32} cy={32} r={10} fill={BLOOD} stroke={ink} strokeWidth={2} />
      <ellipse cx={32} cy={32} rx={2.5} ry={8} fill={ink} />
      <path d="M 12 32 L 20 30 M 52 32 L 44 34 M 16 26 L 22 28" stroke={BLOOD} strokeWidth={1.5} />
      <path d="M 26 8 L 32 2 L 38 8" fill="none" stroke={BLOOD} strokeWidth={3} strokeLinecap="round" />
    </g>
  ),
  // ขนนกพันกระบี่ — a fan of sword-feathers
  bss_eagle_feathers: ({ ink }) => (
    <g>
      {[-40, -20, 0, 20, 40].map((a) => (
        <g key={a} transform={`rotate(${a} 32 54)`}>
          <path d="M 32 54 L 28 22 L 32 8 L 36 22 Z" fill="#eef6ff" stroke={ink} strokeWidth={2} strokeLinejoin="round" />
          <line x1={32} y1={50} x2={32} y2={14} stroke={ink} strokeWidth={1} />
        </g>
      ))}
    </g>
  ),
  // ดิ่งฟ้าผ่าภูผา — talons diving onto a split peak
  bss_eagle_dive: ({ ink, accent }) => (
    <g>
      <path d="M 6 58 L 24 30 L 30 40 L 32 58 Z" fill="#a88252" stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      <path d="M 36 58 L 34 40 L 40 30 L 58 58 Z" fill="#a88252" stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      <path d="M 32 4 L 32 30" stroke={accent} strokeWidth={5} strokeLinecap="round" />
      <path d="M 24 24 Q 32 36 40 24" fill="none" stroke={ink} strokeWidth={3} strokeLinecap="round" />
      <path d="M 26 26 L 22 34 M 32 30 L 32 38 M 38 26 L 42 34" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
    </g>
  ),
  // ปีกพายุ — a spread wing whipping up a whirlwind
  bss_eagle_gale: ({ ink, accent }) => (
    <g>
      <path d="M 6 18 Q 26 12 34 26 Q 22 24 18 30 Q 14 26 6 18 Z" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      <path d="M 30 40 Q 44 30 56 40 Q 44 36 36 46" fill="none" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
      <path d="M 26 50 Q 42 42 54 52" fill="none" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
      <path d="M 36 32 Q 48 24 58 30" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <circle cx={48} cy={14} r={2} fill={ink} /><circle cx={54} cy={20} r={1.5} fill={ink} />
    </g>
  ),
  // กระดองแบกตะวัน — a hex shell carrying a sun
  bss_turtle_shell: ({ ink }) => (
    <g>
      <circle cx={32} cy={16} r={8} fill={GOLD} stroke={ink} strokeWidth={2} />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <line key={a} x1={32} y1={16} x2={32 + Math.cos((a * Math.PI) / 180) * 13} y2={16 + Math.sin((a * Math.PI) / 180) * 13} stroke={ink} strokeWidth={1.5} />
      ))}
      <path d="M 8 50 Q 8 28 32 28 Q 56 28 56 50 Z" fill="#6f8f4a" stroke={ink} strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M 26 32 L 38 32 L 42 40 L 38 48 L 26 48 L 22 40 Z" fill="none" stroke={ink} strokeWidth={2} />
    </g>
  ),
  // ตะวันแผดเผา — a blazing sun
  bss_turtle_sun: ({ ink }) => (
    <g>
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => (
        <path key={a} d="M 32 6 L 35 16 L 29 16 Z" transform={`rotate(${a} 32 32)`} fill={FLAME} stroke={ink} strokeWidth={1.2} />
      ))}
      <circle cx={32} cy={32} r={13} fill={GOLD} stroke={ink} strokeWidth={2.5} />
      <circle cx={32} cy={32} r={6} fill="#fff8e0" />
    </g>
  ),
  // ทับภูผา — a mountain crashing down with a dust line
  bss_turtle_quake: ({ ink, accent }) => (
    <g>
      <path d="M 8 40 L 24 12 L 34 26 L 40 18 L 56 40 Z" fill={accent} stroke={ink} strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M 24 4 L 24 10 M 40 8 L 40 14" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
      <path d="M 4 52 L 60 52" stroke={ink} strokeWidth={3} strokeLinecap="round" />
      <path d="M 18 52 L 22 46 L 26 52 L 32 44 L 38 52 L 42 46 L 46 52" fill="none" stroke={ink} strokeWidth={2} />
    </g>
  ),
  // คีมพันดาบ — two crossed crab pincers
  bss_crab_pincers: ({ ink, accent }) => (
    <g>
      <path d="M 10 54 L 30 30 Q 22 18 30 8 Q 34 20 40 18 Q 38 28 30 30" fill={accent} stroke={ink} strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M 54 54 L 34 30 Q 42 18 34 8" fill="none" stroke={ink} strokeWidth={6} strokeLinecap="round" />
      <path d="M 54 54 L 34 30 Q 42 18 34 8" fill="none" stroke="#e8f6ff" strokeWidth={3} strokeLinecap="round" />
      <path d="M 26 46 L 38 46" stroke={ink} strokeWidth={2} />
    </g>
  ),
  // กระดองสะท้อนดาบ — a mirror shell bouncing a blade
  bss_crab_mirror: ({ ink }) => (
    <g>
      <ellipse cx={30} cy={38} rx={20} ry={16} fill="#cfeeff" stroke={ink} strokeWidth={2.5} />
      <path d="M 20 30 L 28 26 M 22 36 L 34 30" stroke="#fff" strokeWidth={3} strokeLinecap="round" />
      <path d="M 58 6 L 44 24" stroke={ink} strokeWidth={4} strokeLinecap="round" />
      <path d="M 44 24 L 58 30" stroke={SEA} strokeWidth={3} strokeLinecap="round" strokeDasharray="3 3" />
      <path d="M 54 26 L 58 30 L 53 32" fill="none" stroke={SEA} strokeWidth={2.5} strokeLinecap="round" />
    </g>
  ),
  // ฟองคลื่นหมอก — a curling wave with foam bubbles
  bss_crab_tide: ({ ink }) => (
    <g>
      <path d="M 6 46 Q 14 22 34 22 Q 50 22 52 36 Q 42 28 34 34 Q 30 40 38 44 Q 24 50 6 46 Z" fill={SEA} stroke={ink} strokeWidth={2.5} strokeLinejoin="round" />
      <circle cx={46} cy={14} r={4} fill="#e8f8ff" stroke={ink} strokeWidth={1.5} />
      <circle cx={56} cy={22} r={3} fill="#e8f8ff" stroke={ink} strokeWidth={1.5} />
      <circle cx={38} cy={10} r={2.5} fill="#e8f8ff" stroke={ink} strokeWidth={1.5} />
      <path d="M 6 56 Q 18 50 30 56 Q 42 62 58 54" fill="none" stroke={ink} strokeWidth={2} />
    </g>
  ),
  // เขาเพลิงพุ่งทะลวง — flaming horns thrusting forward
  bss_bull_charge: ({ ink }) => (
    <g>
      <path d="M 26 40 Q 14 40 10 24 Q 20 30 30 30 Z" fill="#f4ecd8" stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      <path d="M 26 40 Q 40 34 56 36 Q 44 42 30 46 Z" fill="#f4ecd8" stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      <path d="M 8 22 Q 4 14 10 8 Q 10 16 16 18" fill={FLAME} stroke={ink} strokeWidth={1.5} />
      <path d="M 58 36 Q 62 28 56 22 Q 56 30 50 32" fill={FLAME} stroke={ink} strokeWidth={1.5} />
      <path d="M 4 48 L 20 48 M 2 54 L 16 54" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
    </g>
  ),
  // กระทืบธรณี — a hoof stamping a cracked ground
  bss_bull_stomp: ({ ink, accent }) => (
    <g>
      <path d="M 22 8 L 42 8 L 44 30 L 20 30 Z" fill={accent} stroke={ink} strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M 20 30 L 44 30 L 42 38 L 34 38 L 32 34 L 30 38 L 22 38 Z" fill={ink} />
      <path d="M 4 46 L 60 46" stroke={ink} strokeWidth={2.5} />
      <path d="M 32 46 L 26 54 L 30 58 M 32 46 L 40 52 L 38 58 M 32 46 L 14 56" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
    </g>
  ),
  // เพลิงโทสะ — a bull's head wreathed in flame
  bss_bull_rage: ({ ink, accent }) => (
    <g>
      <path d="M 12 14 Q 8 4 18 2 Q 14 10 22 16" fill={FLAME} stroke={ink} strokeWidth={1.5} />
      <path d="M 52 14 Q 56 4 46 2 Q 50 10 42 16" fill={FLAME} stroke={ink} strokeWidth={1.5} />
      <path d="M 20 16 Q 32 10 44 16 L 42 40 Q 32 52 22 40 Z" fill={accent} stroke={ink} strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M 14 14 Q 16 22 22 20 M 50 14 Q 48 22 42 20" fill="none" stroke={ink} strokeWidth={3} strokeLinecap="round" />
      <circle cx={27} cy={26} r={2.5} fill={BLOOD} /><circle cx={37} cy={26} r={2.5} fill={BLOOD} />
      <ellipse cx={32} cy={40} rx={6} ry={3} fill="none" stroke={ink} strokeWidth={2} />
    </g>
  ),
};

const ART_BATCH: Record<string, IconRenderer> = {
  // ลมปราณเกล็ดทองคำ — a coiled golden serpent
  art_boss_serpent: ({ ink }) => (
    <g>
      <path d="M 16 48 Q 8 36 20 30 Q 34 24 44 30 Q 54 38 44 46 Q 32 52 24 44 Q 20 38 30 36" fill="none" stroke={ink} strokeWidth={8} strokeLinecap="round" />
      <path d="M 16 48 Q 8 36 20 30 Q 34 24 44 30 Q 54 38 44 46 Q 32 52 24 44 Q 20 38 30 36" fill="none" stroke={GOLD} strokeWidth={4.5} strokeLinecap="round" />
      <circle cx={32} cy={36} r={2} fill={ink} />
    </g>
  ),
  // ลมปราณพยัคฆ์โลหิต — a tiger's head with blue-blood stripes
  art_boss_tiger: ({ ink, accent }) => (
    <g>
      <path d="M 14 20 L 20 10 L 26 18 L 38 18 L 44 10 L 50 20 Q 54 40 32 54 Q 10 40 14 20 Z" fill={accent} stroke={ink} strokeWidth={2.5} strokeLinejoin="round" />
      <path d="M 22 24 L 18 30 M 42 24 L 46 30 M 32 20 L 32 28" stroke="#3a5fd0" strokeWidth={3} strokeLinecap="round" />
      <circle cx={25} cy={32} r={2.5} fill={ink} /><circle cx={39} cy={32} r={2.5} fill={ink} />
      <path d="M 28 42 L 32 46 L 36 42" fill="none" stroke={BLOOD} strokeWidth={2.5} strokeLinecap="round" />
    </g>
  ),
  // ลมปราณอินทรีกระบี่ — a soaring eagle over a sword
  art_boss_eagle: ({ ink, accent }) => (
    <g>
      <line x1={32} y1={28} x2={32} y2={60} stroke={ink} strokeWidth={3} />
      <line x1={26} y1={52} x2={38} y2={52} stroke={ink} strokeWidth={3} />
      <path d="M 4 22 Q 18 14 32 26 Q 46 14 60 22 Q 46 22 32 32 Q 18 22 4 22 Z" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
    </g>
  ),
  // ลมปราณเต่าตะวัน — a shell with a sun core
  art_boss_turtle: ({ ink }) => (
    <g>
      <path d="M 8 46 Q 8 18 32 18 Q 56 18 56 46 Z" fill="#6f8f4a" stroke={ink} strokeWidth={2.5} strokeLinejoin="round" />
      <circle cx={32} cy={34} r={8} fill={GOLD} stroke={ink} strokeWidth={2} />
      <path d="M 4 50 L 60 50" stroke={ink} strokeWidth={3} strokeLinecap="round" />
    </g>
  ),
  // ลมปราณปูวิเศษ — a crab shell with raised claws
  art_boss_crab: ({ ink, accent }) => (
    <g>
      <ellipse cx={32} cy={40} rx={18} ry={11} fill={accent} stroke={ink} strokeWidth={2.5} />
      <path d="M 16 34 Q 8 24 14 12 Q 18 20 22 18" fill="none" stroke={ink} strokeWidth={3} strokeLinecap="round" />
      <path d="M 48 34 Q 56 24 50 12 Q 46 20 42 18" fill="none" stroke={ink} strokeWidth={3} strokeLinecap="round" />
      <path d="M 18 50 L 12 56 M 26 52 L 22 58 M 46 50 L 52 56 M 38 52 L 42 58" stroke={ink} strokeWidth={2} strokeLinecap="round" />
    </g>
  ),
  // ลมปราณกระทิงเพลิง — horns over a flame
  art_boss_bull: ({ ink }) => (
    <g>
      <path d="M 32 56 Q 18 46 26 32 Q 28 40 32 38 Q 30 28 36 22 Q 38 32 44 36 Q 48 48 32 56 Z" fill={FLAME} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      <path d="M 8 14 Q 12 26 26 24" fill="none" stroke={ink} strokeWidth={4} strokeLinecap="round" />
      <path d="M 56 14 Q 52 26 38 24" fill="none" stroke={ink} strokeWidth={4} strokeLinecap="round" />
    </g>
  ),
};

Object.assign(SKILL_ICON_OVERRIDES, SKILL_BATCH);
Object.assign(ART_ICON_OVERRIDES, ART_BATCH);
