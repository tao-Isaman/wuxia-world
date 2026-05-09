import type { IconRenderer } from "./skill-icons-registry";
import { SKILL_ICON_OVERRIDES, ART_ICON_OVERRIDES } from "./skill-icons-registry";

// ─── Batch 5: T2-T4 Jianghu skills + beast moves + Wuxia inner-energy arts ───
//
// Each renderer draws inside a 64×64 viewBox, focused on the inner
// 56×56 area (x: 4..60). Glyphs are CHUNKY (stroke 2) so they read
// at 32px thumbnails. `ink` = outlines, `accent` = tier-tinted fill.

const SKILL_BATCH: Record<string, IconRenderer> = {
  // 1. ch โซ่เกี่ยวสังหาร — killing chain hook
  ch: ({ ink, accent }) => (
    <g>
      {/* chain links diagonal */}
      <ellipse cx={14} cy={50} rx={5} ry={3} fill={accent} stroke={ink} strokeWidth={2} transform="rotate(-45 14 50)" />
      <ellipse cx={20} cy={42} rx={5} ry={3} fill={accent} stroke={ink} strokeWidth={2} transform="rotate(-45 20 42)" />
      <ellipse cx={26} cy={34} rx={5} ry={3} fill={accent} stroke={ink} strokeWidth={2} transform="rotate(-45 26 34)" />
      <ellipse cx={32} cy={26} rx={5} ry={3} fill={accent} stroke={ink} strokeWidth={2} transform="rotate(-45 32 26)" />
      {/* curved hook at end */}
      <path d="M 36 22 Q 50 14 54 26 Q 54 38 42 38" fill="none" stroke={ink} strokeWidth={3} strokeLinecap="round" />
      <path d="M 42 38 L 38 34" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
      {/* hook barb */}
      <polygon points="40,40 46,42 42,46" fill={ink} />
    </g>
  ),

  // 2. na1 กระบี่ดาวเหนือ — north star sword with constellation
  na1: ({ ink, accent }) => (
    <g>
      {/* constellation dots top */}
      <circle cx={14} cy={12} r={2} fill={ink} />
      <circle cx={22} cy={8} r={2} fill={ink} />
      <circle cx={30} cy={14} r={2} fill={ink} />
      <circle cx={40} cy={10} r={2} fill={ink} />
      <circle cx={48} cy={16} r={3} fill={accent} stroke={ink} strokeWidth={2} />
      {/* connecting lines */}
      <line x1={14} y1={12} x2={22} y2={8} stroke={ink} strokeWidth={1.5} />
      <line x1={22} y1={8} x2={30} y2={14} stroke={ink} strokeWidth={1.5} />
      <line x1={30} y1={14} x2={40} y2={10} stroke={ink} strokeWidth={1.5} />
      <line x1={40} y1={10} x2={48} y2={16} stroke={ink} strokeWidth={1.5} />
      {/* vertical sword */}
      <polygon points="30,22 34,22 34,46 32,50 30,46" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      <line x1={32} y1={24} x2={32} y2={44} stroke={ink} strokeWidth={1.5} />
      <rect x={22} y={46} width={20} height={3} fill={ink} />
      <rect x={29} y={49} width={6} height={9} fill={accent} stroke={ink} strokeWidth={2} />
      <circle cx={32} cy={59} r={2.5} fill={ink} />
    </g>
  ),

  // 3. na2 หมัดมวยจีน — Chinese boxing fist with healing aura
  na2: ({ ink, accent }) => (
    <g>
      {/* aura rings */}
      <circle cx={32} cy={32} r={26} fill="none" stroke={accent} strokeWidth={2} opacity={0.5} />
      <circle cx={32} cy={32} r={20} fill="none" stroke={accent} strokeWidth={2} opacity={0.7} />
      {/* fist */}
      <rect x={20} y={26} width={24} height={18} fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      <line x1={26} y1={26} x2={26} y2={20} stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <line x1={32} y1={26} x2={32} y2={18} stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <line x1={38} y1={26} x2={38} y2={20} stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <circle cx={26} cy={20} r={2.5} fill={accent} stroke={ink} strokeWidth={2} />
      <circle cx={32} cy={18} r={2.5} fill={accent} stroke={ink} strokeWidth={2} />
      <circle cx={38} cy={20} r={2.5} fill={accent} stroke={ink} strokeWidth={2} />
      {/* healing cross on knuckles */}
      <line x1={32} y1={32} x2={32} y2={40} stroke={ink} strokeWidth={2} />
      <line x1={28} y1={36} x2={36} y2={36} stroke={ink} strokeWidth={2} />
    </g>
  ),

  // 4. ne3 ทวนหมุนฟ้า — sky-spinning spear
  ne3: ({ ink, accent }) => (
    <g>
      {/* swirl arcs */}
      <path d="M 12 20 Q 32 8 52 20" fill="none" stroke={accent} strokeWidth={2.5} strokeLinecap="round" />
      <path d="M 8 28 Q 32 12 56 28" fill="none" stroke={accent} strokeWidth={2} opacity={0.6} strokeLinecap="round" />
      {/* spear shaft diagonal */}
      <line x1={10} y1={56} x2={50} y2={20} stroke={ink} strokeWidth={4} strokeLinecap="round" />
      <line x1={10} y1={56} x2={50} y2={20} stroke={accent} strokeWidth={2} strokeLinecap="round" />
      {/* spearhead */}
      <polygon points="50,20 58,12 54,22 56,8" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* tassel */}
      <line x1={48} y1={24} x2={42} y2={28} stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <line x1={48} y1={24} x2={44} y2={32} stroke={ink} strokeWidth={2} strokeLinecap="round" />
      {/* butt cap */}
      <circle cx={10} cy={56} r={3} fill={ink} />
    </g>
  ),

  // 5. ne4 ดอกบัวนพรัตน์ — 9-jewel lotus
  ne4: ({ ink, accent }) => (
    <g>
      {/* 8 outer petals */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const r = (deg * Math.PI) / 180;
        const cx = 32 + Math.cos(r) * 16;
        const cy = 32 + Math.sin(r) * 16;
        return (
          <ellipse key={deg} cx={cx} cy={cy} rx={6} ry={3.5} fill={accent} stroke={ink} strokeWidth={2}
            transform={`rotate(${deg} ${cx} ${cy})`} />
        );
      })}
      {/* center jewel */}
      <circle cx={32} cy={32} r={7} fill={accent} stroke={ink} strokeWidth={2} />
      <polygon points="32,27 36,32 32,37 28,32" fill={ink} />
      {/* 8 jewel dots on petals */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const r = (deg * Math.PI) / 180;
        const cx = 32 + Math.cos(r) * 16;
        const cy = 32 + Math.sin(r) * 16;
        return <circle key={deg} cx={cx} cy={cy} r={1.5} fill={ink} />;
      })}
    </g>
  ),

  // 6. ne5 กระบี่วิ่งบนน้ำ — sword skimming water
  ne5: ({ ink, accent }) => (
    <g>
      {/* horizontal sword skimming */}
      <polygon points="6,28 10,24 50,28 50,32 10,32" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      <polygon points="50,28 58,30 50,32" fill={ink} />
      <line x1={12} y1={30} x2={48} y2={30} stroke={ink} strokeWidth={1.5} />
      {/* handle */}
      <rect x={6} y={26} width={4} height={8} fill={ink} />
      {/* water ripples below */}
      <path d="M 8 42 Q 14 38 20 42 Q 26 46 32 42 Q 38 38 44 42 Q 50 46 56 42" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <path d="M 12 50 Q 20 46 28 50 Q 36 54 44 50 Q 50 46 54 50" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" opacity={0.7} />
      <path d="M 14 58 Q 24 54 32 58 Q 42 54 50 58" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" opacity={0.5} />
      {/* splash droplets */}
      <circle cx={20} cy={36} r={1.5} fill={ink} />
      <circle cx={36} cy={36} r={1.5} fill={ink} />
      <circle cx={48} cy={38} r={1.5} fill={ink} />
    </g>
  ),

  // 7. ne6 แส้ทะลุปราการ — wall-piercing whip (3 hits)
  ne6: ({ ink, accent }) => (
    <g>
      {/* brick wall */}
      <rect x={42} y={8} width={18} height={48} fill="none" stroke={ink} strokeWidth={2} />
      <line x1={42} y1={20} x2={60} y2={20} stroke={ink} strokeWidth={1.5} />
      <line x1={42} y1={32} x2={60} y2={32} stroke={ink} strokeWidth={1.5} />
      <line x1={42} y1={44} x2={60} y2={44} stroke={ink} strokeWidth={1.5} />
      <line x1={50} y1={8} x2={50} y2={20} stroke={ink} strokeWidth={1.5} />
      <line x1={50} y1={32} x2={50} y2={44} stroke={ink} strokeWidth={1.5} />
      {/* whip handle bottom-left */}
      <rect x={6} y={50} width={10} height={6} fill={ink} />
      {/* sinuous whip lashing through */}
      <path d="M 16 53 Q 22 36 32 40 Q 42 44 48 26" fill="none" stroke={ink} strokeWidth={3} strokeLinecap="round" />
      <path d="M 16 53 Q 22 36 32 40 Q 42 44 48 26" fill="none" stroke={accent} strokeWidth={1.5} strokeLinecap="round" />
      {/* impact sparks on wall */}
      <circle cx={48} cy={26} r={2.5} fill={accent} stroke={ink} strokeWidth={1.5} />
      {/* crack lines */}
      <line x1={48} y1={26} x2={54} y2={20} stroke={ink} strokeWidth={1.5} />
      <line x1={48} y1={26} x2={54} y2={32} stroke={ink} strokeWidth={1.5} />
      <line x1={48} y1={26} x2={42} y2={22} stroke={ink} strokeWidth={1.5} />
    </g>
  ),

  // 8. ne7 ฝ่ามือน้ำแข็ง — ice palm with frost shards
  ne7: ({ ink, accent }) => (
    <g>
      {/* open palm */}
      <path d="M 18 56 L 18 32 Q 18 28 22 28 L 26 28 L 26 14 Q 26 12 28 12 L 30 12 L 30 28 L 32 28 L 32 12 Q 32 10 34 10 Q 36 10 36 12 L 36 28 L 38 28 L 38 14 Q 38 12 40 12 L 42 12 L 42 28 Q 46 28 46 32 L 46 56 Z" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* ice shards radiating from palm */}
      <polygon points="32,40 30,46 32,52 34,46" fill={accent} stroke={ink} strokeWidth={1.5} />
      <line x1={32} y1={40} x2={32} y2={52} stroke={ink} strokeWidth={1} />
      {/* frost crystal at center */}
      <line x1={28} y1={44} x2={36} y2={44} stroke={ink} strokeWidth={2} />
      <line x1={32} y1={40} x2={32} y2={48} stroke={ink} strokeWidth={2} />
      <line x1={29} y1={41} x2={35} y2={47} stroke={ink} strokeWidth={1.5} />
      <line x1={29} y1={47} x2={35} y2={41} stroke={ink} strokeWidth={1.5} />
      {/* floating frost specks */}
      <polygon points="10,18 12,16 14,18 12,20" fill={accent} stroke={ink} strokeWidth={1} />
      <polygon points="50,22 52,20 54,22 52,24" fill={accent} stroke={ink} strokeWidth={1} />
      <polygon points="8,38 10,36 12,38 10,40" fill={accent} stroke={ink} strokeWidth={1} />
    </g>
  ),

  // 9. ne9 ดาบยาวมังกร — dragon long-blade
  ne9: ({ ink, accent }) => (
    <g>
      {/* large curved blade */}
      <path d="M 14 56 L 18 60 Q 30 50 44 30 L 56 8 L 50 6 Q 38 24 26 38 Q 18 46 14 56 Z" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* blade edge highlight */}
      <path d="M 16 58 Q 28 46 42 30 L 52 10" fill="none" stroke={ink} strokeWidth={1.5} />
      {/* dragon eye on blade */}
      <circle cx={36} cy={28} r={3} fill={accent} stroke={ink} strokeWidth={2} />
      <circle cx={36} cy={28} r={1} fill={ink} />
      {/* dragon scales pattern */}
      <path d="M 28 38 Q 30 36 32 38" fill="none" stroke={ink} strokeWidth={1.5} />
      <path d="M 32 34 Q 34 32 36 34" fill="none" stroke={ink} strokeWidth={1.5} />
      <path d="M 40 24 Q 42 22 44 24" fill="none" stroke={ink} strokeWidth={1.5} />
      {/* handle */}
      <rect x={6} y={52} width={12} height={6} fill={ink} transform="rotate(-45 12 55)" />
    </g>
  ),

  // 10. ne10 พลองลม — wind-staff with breeze
  ne10: ({ ink, accent }) => (
    <g>
      {/* diagonal staff */}
      <line x1={10} y1={54} x2={50} y2={14} stroke={ink} strokeWidth={4} strokeLinecap="round" />
      <line x1={10} y1={54} x2={50} y2={14} stroke={accent} strokeWidth={2} strokeLinecap="round" />
      <circle cx={10} cy={54} r={3} fill={ink} />
      <circle cx={50} cy={14} r={3} fill={ink} />
      {/* wind swirls around staff */}
      <path d="M 18 28 Q 28 24 26 34 Q 24 42 14 38" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <path d="M 36 18 Q 50 22 46 32 Q 42 42 32 38" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <path d="M 42 46 Q 56 48 54 56" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      {/* small wind lines */}
      <line x1={14} y1={20} x2={22} y2={20} stroke={ink} strokeWidth={1.5} strokeLinecap="round" />
      <line x1={50} y1={42} x2={56} y2={42} stroke={ink} strokeWidth={1.5} strokeLinecap="round" />
    </g>
  ),

  // 11. ne11 กรงเล็บสิงห์ — lion claw paw
  ne11: ({ ink, accent }) => (
    <g>
      {/* paw pad */}
      <ellipse cx={32} cy={42} rx={14} ry={10} fill={accent} stroke={ink} strokeWidth={2} />
      {/* 4 toe pads */}
      <ellipse cx={20} cy={26} rx={4} ry={5} fill={accent} stroke={ink} strokeWidth={2} />
      <ellipse cx={28} cy={20} rx={4} ry={5} fill={accent} stroke={ink} strokeWidth={2} />
      <ellipse cx={36} cy={20} rx={4} ry={5} fill={accent} stroke={ink} strokeWidth={2} />
      <ellipse cx={44} cy={26} rx={4} ry={5} fill={accent} stroke={ink} strokeWidth={2} />
      {/* claws */}
      <polygon points="18,18 20,8 22,18" fill={ink} />
      <polygon points="26,12 28,4 30,12" fill={ink} />
      <polygon points="34,12 36,4 38,12" fill={ink} />
      <polygon points="42,18 44,8 46,18" fill={ink} />
      {/* center pad mark */}
      <circle cx={32} cy={42} r={3} fill={ink} />
    </g>
  ),

  // 12. ne12 กระบี่เก้าฟ้า — nine-heaven sword
  ne12: ({ ink, accent }) => (
    <g>
      {/* 9 stars in a halo above */}
      {[0, 40, 80, 100, 140, 180, 220, 260, 300].map((deg, i) => {
        const r = (deg * Math.PI) / 180;
        const cx = 32 + Math.cos(r) * 18;
        const cy = 24 + Math.sin(r) * 10;
        return <circle key={i} cx={cx} cy={cy} r={1.5} fill={ink} />;
      })}
      {/* central halo ring */}
      <ellipse cx={32} cy={24} rx={20} ry={10} fill="none" stroke={accent} strokeWidth={1.5} opacity={0.6} />
      {/* vertical sword */}
      <polygon points="30,28 34,28 34,50 32,54 30,50" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      <line x1={32} y1={30} x2={32} y2={48} stroke={ink} strokeWidth={1.5} />
      <rect x={22} y={50} width={20} height={3} fill={ink} />
      <rect x={29} y={53} width={6} height={6} fill={accent} stroke={ink} strokeWidth={2} />
      <circle cx={32} cy={60} r={2} fill={ink} />
      {/* aura at blade tip */}
      <circle cx={32} cy={28} r={3} fill={accent} stroke={ink} strokeWidth={1.5} />
    </g>
  ),

  // 13. ne13 ทวนหยินหยาง — yin-yang spear half black/half white
  ne13: ({ ink, accent }) => (
    <g>
      {/* spear shaft - left half white, right half black */}
      <rect x={28} y={14} width={4} height={42} fill={accent} stroke={ink} strokeWidth={2} />
      <rect x={32} y={14} width={4} height={42} fill={ink} />
      {/* spearhead split */}
      <polygon points="28,14 32,14 32,4 28,8" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      <polygon points="32,14 36,14 36,8 32,4" fill={ink} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* yin-yang circle in middle */}
      <circle cx={32} cy={34} r={10} fill={accent} stroke={ink} strokeWidth={2} />
      <path d="M 32 24 A 10 10 0 0 1 32 44 A 5 5 0 0 1 32 34 A 5 5 0 0 0 32 24 Z" fill={ink} />
      <circle cx={32} cy={29} r={1.5} fill={accent} />
      <circle cx={32} cy={39} r={1.5} fill={accent} />
      {/* tassel */}
      <line x1={28} y1={18} x2={22} y2={22} stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <line x1={36} y1={18} x2={42} y2={22} stroke={ink} strokeWidth={2} strokeLinecap="round" />
    </g>
  ),

  // 14. bst_maul ฉีกตะปบ — vicious clawed maul
  bst_maul: ({ ink, accent }) => (
    <g>
      {/* large beast paw */}
      <path d="M 14 50 Q 14 38 22 32 L 42 32 Q 50 38 50 50 L 46 56 L 18 56 Z" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* 4 fierce curved claws raking down */}
      <path d="M 16 40 Q 12 48 14 58" fill="none" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
      <path d="M 24 36 Q 22 48 22 58" fill="none" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
      <path d="M 40 36 Q 42 48 42 58" fill="none" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
      <path d="M 48 40 Q 52 48 50 58" fill="none" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
      {/* slash marks above */}
      <line x1={12} y1={20} x2={28} y2={6} stroke={ink} strokeWidth={3} strokeLinecap="round" />
      <line x1={24} y1={22} x2={42} y2={6} stroke={ink} strokeWidth={3} strokeLinecap="round" />
      <line x1={36} y1={20} x2={56} y2={8} stroke={ink} strokeWidth={3} strokeLinecap="round" />
      {/* tear marks */}
      <circle cx={20} cy={42} r={2} fill={ink} />
      <circle cx={32} cy={40} r={2} fill={ink} />
      <circle cx={44} cy={42} r={2} fill={ink} />
    </g>
  ),

  // 15. bst_venom เขี้ยวพิษแรง — concentrated venom fang
  bst_venom: ({ ink, accent }) => (
    <g>
      {/* large curved fang */}
      <path d="M 24 8 Q 20 16 22 30 Q 26 48 32 56 Q 38 48 42 30 Q 44 16 40 8 Z" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* venom channel down center */}
      <line x1={32} y1={12} x2={32} y2={48} stroke={ink} strokeWidth={2} />
      {/* venom drop at tip */}
      <ellipse cx={32} cy={56} rx={3} ry={4} fill={accent} stroke={ink} strokeWidth={2} />
      {/* fang tip */}
      <circle cx={32} cy={56} r={1.5} fill={ink} />
      {/* secondary venom drops */}
      <ellipse cx={16} cy={42} rx={2.5} ry={3.5} fill={accent} stroke={ink} strokeWidth={1.5} />
      <ellipse cx={48} cy={46} rx={2.5} ry={3.5} fill={accent} stroke={ink} strokeWidth={1.5} />
      {/* venom fumes top */}
      <path d="M 26 8 Q 22 4 26 0" fill="none" stroke={ink} strokeWidth={1.5} />
      <path d="M 38 8 Q 42 4 38 0" fill="none" stroke={ink} strokeWidth={1.5} />
    </g>
  ),

  // 16. bst_constrict บีบรัด — coiling snake constriction
  bst_constrict: ({ ink, accent }) => (
    <g>
      {/* victim silhouette in center (vertical bar) */}
      <rect x={28} y={10} width={8} height={44} fill={ink} opacity={0.4} />
      {/* coiling snake body */}
      <path d="M 12 8 Q 30 8 30 16 Q 30 24 18 24 Q 8 24 8 32 Q 8 40 22 40 Q 36 40 36 48 Q 36 56 50 56" fill="none" stroke={ink} strokeWidth={5} strokeLinecap="round" />
      <path d="M 12 8 Q 30 8 30 16 Q 30 24 18 24 Q 8 24 8 32 Q 8 40 22 40 Q 36 40 36 48 Q 36 56 50 56" fill="none" stroke={accent} strokeWidth={2.5} strokeLinecap="round" />
      {/* snake head */}
      <ellipse cx={52} cy={56} rx={6} ry={4} fill={accent} stroke={ink} strokeWidth={2} />
      {/* snake eye */}
      <circle cx={54} cy={55} r={1.5} fill={ink} />
      {/* tongue */}
      <line x1={58} y1={56} x2={62} y2={54} stroke={ink} strokeWidth={1.5} strokeLinecap="round" />
      <line x1={58} y1={56} x2={62} y2={58} stroke={ink} strokeWidth={1.5} strokeLinecap="round" />
      {/* tail tip */}
      <polygon points="8,8 12,4 14,10" fill={ink} />
    </g>
  ),

  // 17. zs กู่ฉินสะท้านจิต — qin (zither) striking minds
  zs: ({ ink, accent }) => (
    <g>
      {/* zither body horizontal */}
      <rect x={6} y={32} width={52} height={14} rx={2} fill={accent} stroke={ink} strokeWidth={2} />
      {/* zither strings */}
      <line x1={10} y1={36} x2={54} y2={36} stroke={ink} strokeWidth={1} />
      <line x1={10} y1={39} x2={54} y2={39} stroke={ink} strokeWidth={1} />
      <line x1={10} y1={42} x2={54} y2={42} stroke={ink} strokeWidth={1} />
      {/* end caps */}
      <rect x={4} y={30} width={4} height={18} fill={ink} />
      <rect x={56} y={30} width={4} height={18} fill={ink} />
      {/* sound waves emanating up */}
      <path d="M 16 28 Q 20 22 24 28" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <path d="M 28 26 Q 32 18 36 26" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <path d="M 40 28 Q 44 22 48 28" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      {/* mind ripple at top */}
      <circle cx={32} cy={12} r={6} fill="none" stroke={accent} strokeWidth={2} />
      <circle cx={32} cy={12} r={3} fill={accent} stroke={ink} strokeWidth={1.5} />
      <circle cx={32} cy={12} r={1} fill={ink} />
      {/* shockwave dots */}
      <circle cx={20} cy={54} r={1.5} fill={ink} />
      <circle cx={44} cy={54} r={1.5} fill={ink} />
    </g>
  ),

  // 18. nh1 พลองเทวดา — divine staff with halo
  nh1: ({ ink, accent }) => (
    <g>
      {/* halo at top */}
      <circle cx={32} cy={14} r={10} fill="none" stroke={accent} strokeWidth={2.5} />
      <circle cx={32} cy={14} r={6} fill="none" stroke={ink} strokeWidth={1.5} />
      {/* halo rays */}
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const r = (deg * Math.PI) / 180;
        const x1 = 32 + Math.cos(r) * 11;
        const y1 = 14 + Math.sin(r) * 11;
        const x2 = 32 + Math.cos(r) * 15;
        const y2 = 14 + Math.sin(r) * 15;
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke={ink} strokeWidth={2} strokeLinecap="round" />;
      })}
      {/* vertical staff */}
      <rect x={29} y={24} width={6} height={34} fill={accent} stroke={ink} strokeWidth={2} />
      {/* staff bands */}
      <line x1={28} y1={32} x2={36} y2={32} stroke={ink} strokeWidth={2} />
      <line x1={28} y1={42} x2={36} y2={42} stroke={ink} strokeWidth={2} />
      <line x1={28} y1={52} x2={36} y2={52} stroke={ink} strokeWidth={2} />
      {/* foot cap */}
      <rect x={26} y={56} width={12} height={4} fill={ink} />
    </g>
  ),

  // 19. nh2 กระบี่วิเศษ — magical sword with sparkles
  nh2: ({ ink, accent }) => (
    <g>
      {/* vertical magical sword */}
      <polygon points="30,8 34,8 34,42 32,46 30,42" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      <line x1={32} y1={10} x2={32} y2={42} stroke={ink} strokeWidth={1.5} />
      {/* magical glow on blade */}
      <line x1={32} y1={14} x2={32} y2={20} stroke="white" strokeWidth={1.5} opacity={0.8} />
      {/* crossguard */}
      <rect x={22} y={42} width={20} height={3} fill={ink} />
      {/* handle */}
      <rect x={29} y={45} width={6} height={9} fill={accent} stroke={ink} strokeWidth={2} />
      <circle cx={32} cy={56} r={2.5} fill={ink} />
      {/* sparkles around */}
      <g>
        <line x1={12} y1={16} x2={16} y2={16} stroke={ink} strokeWidth={1.5} />
        <line x1={14} y1={14} x2={14} y2={18} stroke={ink} strokeWidth={1.5} />
      </g>
      <g>
        <line x1={48} y1={20} x2={54} y2={20} stroke={ink} strokeWidth={1.5} />
        <line x1={51} y1={17} x2={51} y2={23} stroke={ink} strokeWidth={1.5} />
      </g>
      <g>
        <line x1={10} y1={36} x2={14} y2={36} stroke={ink} strokeWidth={1.5} />
        <line x1={12} y1={34} x2={12} y2={38} stroke={ink} strokeWidth={1.5} />
      </g>
      <g>
        <line x1={50} y1={40} x2={54} y2={40} stroke={ink} strokeWidth={1.5} />
        <line x1={52} y1={38} x2={52} y2={42} stroke={ink} strokeWidth={1.5} />
      </g>
      <circle cx={20} cy={26} r={1.5} fill={accent} stroke={ink} strokeWidth={1} />
      <circle cx={46} cy={30} r={1.5} fill={accent} stroke={ink} strokeWidth={1} />
    </g>
  ),

  // 20. yyz ดัชนีเอกสุริยัน — single sun-finger 一阳指
  yyz: ({ ink, accent }) => (
    <g>
      {/* sun behind finger */}
      <circle cx={36} cy={16} r={10} fill={accent} stroke={ink} strokeWidth={2} />
      {/* sun rays */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const r = (deg * Math.PI) / 180;
        const x1 = 36 + Math.cos(r) * 11;
        const y1 = 16 + Math.sin(r) * 11;
        const x2 = 36 + Math.cos(r) * 15;
        const y2 = 16 + Math.sin(r) * 15;
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke={ink} strokeWidth={2} strokeLinecap="round" />;
      })}
      {/* hand fist */}
      <path d="M 14 56 L 14 38 Q 14 34 18 34 L 26 34 L 26 28 Q 26 24 30 24 Q 34 24 34 28 L 34 36 L 38 36 Q 42 36 42 40 L 42 56 Z" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* extended finger up to sun */}
      <rect x={28} y={20} width={4} height={16} fill={accent} stroke={ink} strokeWidth={2} />
      {/* fingertip glow */}
      <circle cx={30} cy={22} r={2.5} fill={accent} stroke={ink} strokeWidth={1.5} />
    </g>
  ),

  // 21. nf1 กู่ฉินสังหาร — killer zither dark
  nf1: ({ ink, accent }) => (
    <g>
      {/* dark zither vertical */}
      <rect x={20} y={6} width={14} height={50} rx={2} fill={ink} stroke={ink} strokeWidth={2} />
      {/* strings */}
      <line x1={23} y1={10} x2={23} y2={52} stroke={accent} strokeWidth={1} />
      <line x1={26} y1={10} x2={26} y2={52} stroke={accent} strokeWidth={1} />
      <line x1={29} y1={10} x2={29} y2={52} stroke={accent} strokeWidth={1} />
      <line x1={32} y1={10} x2={32} y2={52} stroke={accent} strokeWidth={1} />
      {/* end caps */}
      <rect x={18} y={4} width={18} height={4} fill={accent} stroke={ink} strokeWidth={2} />
      <rect x={18} y={54} width={18} height={4} fill={accent} stroke={ink} strokeWidth={2} />
      {/* dark sound blades emanating right */}
      <polygon points="36,16 50,12 48,18 50,22" fill={accent} stroke={ink} strokeWidth={1.5} />
      <polygon points="36,30 56,28 52,34" fill={accent} stroke={ink} strokeWidth={1.5} />
      <polygon points="36,44 50,46 48,52 50,56" fill={accent} stroke={ink} strokeWidth={1.5} />
      {/* skull mark on zither */}
      <circle cx={27} cy={30} r={3.5} fill={accent} stroke={ink} strokeWidth={1.5} />
      <circle cx={25.5} cy={29.5} r={0.7} fill={ink} />
      <circle cx={28.5} cy={29.5} r={0.7} fill={ink} />
    </g>
  ),

  // 22. nf2 ดาบโดดเดี่ยว — lone blade
  nf2: ({ ink, accent }) => (
    <g>
      {/* solitary curved blade */}
      <path d="M 12 56 L 16 60 Q 30 50 44 30 L 56 8 L 50 6 Q 38 22 28 38 Q 18 50 12 56 Z" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* edge highlight */}
      <path d="M 14 58 Q 28 46 42 30 L 52 10" fill="none" stroke={ink} strokeWidth={1.5} />
      {/* handle */}
      <rect x={4} y={52} width={12} height={6} fill={ink} transform="rotate(-45 10 55)" />
      {/* lone moon in upper-left */}
      <path d="M 14 14 A 5 5 0 1 0 14 22 A 4 4 0 1 1 14 14 Z" fill={accent} stroke={ink} strokeWidth={1.5} />
    </g>
  ),

  // 23. nf3 ทวนประทับมังกร — dragon-seal spear
  nf3: ({ ink, accent }) => (
    <g>
      {/* diagonal spear */}
      <line x1={10} y1={56} x2={50} y2={16} stroke={ink} strokeWidth={4} strokeLinecap="round" />
      <line x1={10} y1={56} x2={50} y2={16} stroke={accent} strokeWidth={2} strokeLinecap="round" />
      {/* large spearhead */}
      <polygon points="48,18 60,6 56,18 58,8" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* dragon seal stamp on shaft */}
      <rect x={20} y={32} width={16} height={16} fill={accent} stroke={ink} strokeWidth={2} transform="rotate(-45 28 40)" />
      <text x={28} y={44} textAnchor="middle" fontSize={10} fontWeight="bold" fill={ink} transform="rotate(-45 28 40)">龍</text>
      {/* tassel */}
      <line x1={46} y1={20} x2={40} y2={22} stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <line x1={46} y1={20} x2={42} y2={28} stroke={ink} strokeWidth={2} strokeLinecap="round" />
      {/* butt cap */}
      <circle cx={10} cy={56} r={3} fill={ink} />
    </g>
  ),

  // 24. nf4 ฝ่ามือยมฑูต — death messenger palm with skull
  nf4: ({ ink, accent }) => (
    <g>
      {/* dark palm */}
      <path d="M 16 56 L 16 32 Q 16 28 20 28 L 24 28 L 24 14 Q 24 12 26 12 L 28 12 L 28 28 L 30 28 L 30 10 Q 30 8 32 8 Q 34 8 34 10 L 34 28 L 36 28 L 36 12 Q 36 10 38 10 L 40 10 L 40 28 L 44 28 Q 48 28 48 32 L 48 56 Z" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* skull on palm */}
      <ellipse cx={32} cy={42} rx={6} ry={7} fill="white" stroke={ink} strokeWidth={2} />
      <circle cx={29.5} cy={41} r={1.5} fill={ink} />
      <circle cx={34.5} cy={41} r={1.5} fill={ink} />
      <line x1={31} y1={45} x2={31} y2={48} stroke={ink} strokeWidth={1.5} />
      <line x1={33} y1={45} x2={33} y2={48} stroke={ink} strokeWidth={1.5} />
      {/* dark wisps rising */}
      <path d="M 12 18 Q 14 12 12 6" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <path d="M 52 20 Q 50 14 52 8" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
    </g>
  ),

  // 25. nf5 หมัดเพลิง — flame fist
  nf5: ({ ink, accent }) => (
    <g>
      {/* flame aura around fist */}
      <path d="M 18 24 Q 12 18 16 8 Q 18 14 22 12 Q 20 6 26 4 Q 26 12 32 10 Q 30 4 38 4 Q 36 12 42 12 Q 42 6 48 8 Q 46 16 50 22 Q 46 30 32 30 Q 18 30 18 24 Z" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* fist */}
      <rect x={20} y={28} width={24} height={20} fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      <line x1={26} y1={28} x2={26} y2={22} stroke={ink} strokeWidth={2} />
      <line x1={32} y1={28} x2={32} y2={20} stroke={ink} strokeWidth={2} />
      <line x1={38} y1={28} x2={38} y2={22} stroke={ink} strokeWidth={2} />
      {/* flame highlights inside fist */}
      <path d="M 28 38 Q 32 32 36 38" fill="none" stroke={ink} strokeWidth={1.5} />
      {/* wrist */}
      <rect x={22} y={48} width={20} height={6} fill={accent} stroke={ink} strokeWidth={2} />
      {/* embers below */}
      <circle cx={14} cy={56} r={1.5} fill={ink} />
      <circle cx={50} cy={58} r={1.5} fill={ink} />
    </g>
  ),

  // 26. nf7 แส้เก้าหัว — 9-headed whip
  nf7: ({ ink, accent }) => (
    <g>
      {/* whip handle top */}
      <rect x={28} y={4} width={8} height={14} fill={ink} />
      {/* central knot/binding */}
      <circle cx={32} cy={20} r={5} fill={accent} stroke={ink} strokeWidth={2} />
      {/* 9 whip strands radiating downward */}
      {Array.from({ length: 9 }).map((_, i) => {
        const angle = -90 + (i - 4) * 22; // spread fan downward
        const r = (angle * Math.PI) / 180;
        const x2 = 32 + Math.cos(r) * 32;
        const y2 = 20 - Math.sin(r) * 32;
        return (
          <g key={i}>
            <path d={`M 32 24 Q ${(32 + x2) / 2 + (i % 2 === 0 ? 2 : -2)} ${(20 + y2) / 2} ${x2} ${y2}`}
              fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
            <circle cx={x2} cy={y2} r={1.5} fill={ink} />
          </g>
        );
      })}
    </g>
  ),

  // 27. nf8 พัดเพลิงสวรรค์ — heavenly fire fan
  nf8: ({ ink, accent }) => (
    <g>
      {/* fan opened wide */}
      <path d="M 32 56 L 8 24 Q 32 8 56 24 Z" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* fan ribs */}
      <line x1={32} y1={56} x2={8} y2={24} stroke={ink} strokeWidth={1.5} />
      <line x1={32} y1={56} x2={20} y2={16} stroke={ink} strokeWidth={1.5} />
      <line x1={32} y1={56} x2={32} y2={12} stroke={ink} strokeWidth={1.5} />
      <line x1={32} y1={56} x2={44} y2={16} stroke={ink} strokeWidth={1.5} />
      <line x1={32} y1={56} x2={56} y2={24} stroke={ink} strokeWidth={1.5} />
      {/* fan handle/pin */}
      <circle cx={32} cy={56} r={3} fill={ink} />
      {/* flames atop fan */}
      <path d="M 16 22 Q 18 16 20 22" fill={ink} />
      <path d="M 24 18 Q 26 12 28 18" fill={ink} />
      <path d="M 32 14 Q 34 8 36 14" fill={ink} />
      <path d="M 40 18 Q 42 12 44 18" fill={ink} />
      <path d="M 48 22 Q 50 16 52 22" fill={ink} />
    </g>
  ),

  // 28. ft ขลุ่ยสะท้านฟ้า — sky-shaking flute
  ft: ({ ink, accent }) => (
    <g>
      {/* horizontal flute */}
      <rect x={6} y={30} width={52} height={6} rx={3} fill={accent} stroke={ink} strokeWidth={2} />
      {/* flute holes */}
      <circle cx={18} cy={33} r={1.5} fill={ink} />
      <circle cx={26} cy={33} r={1.5} fill={ink} />
      <circle cx={32} cy={33} r={1.5} fill={ink} />
      <circle cx={38} cy={33} r={1.5} fill={ink} />
      <circle cx={46} cy={33} r={1.5} fill={ink} />
      {/* mouthpiece */}
      <rect x={4} y={28} width={4} height={10} fill={ink} />
      {/* end cap */}
      <rect x={56} y={28} width={4} height={10} fill={ink} />
      {/* sky-shaking ripples above */}
      <path d="M 8 22 Q 16 14 24 22" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <path d="M 22 18 Q 32 8 42 18" fill="none" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
      <path d="M 40 22 Q 48 14 56 22" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      {/* shockwaves below */}
      <path d="M 12 46 Q 20 52 28 46" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" opacity={0.7} />
      <path d="M 36 46 Q 44 52 52 46" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" opacity={0.7} />
      {/* lightning crack */}
      <polygon points="30,42 34,42 32,52 36,52 28,60 32,52 28,52" fill={accent} stroke={ink} strokeWidth={1.5} strokeLinejoin="round" />
    </g>
  ),

  // 29. nu1 มังกรฟ้า — sky dragon blade
  nu1: ({ ink, accent }) => (
    <g>
      {/* curved sky-blade */}
      <path d="M 10 56 L 14 60 Q 28 48 44 26 L 58 6 L 50 4 Q 36 18 26 34 Q 16 48 10 56 Z" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      <path d="M 12 58 Q 26 46 42 28 L 52 10" fill="none" stroke={ink} strokeWidth={1.5} />
      {/* dragon spine ridge */}
      <line x1={20} y1={42} x2={26} y2={36} stroke={ink} strokeWidth={2} />
      <line x1={28} y1={32} x2={34} y2={26} stroke={ink} strokeWidth={2} />
      <line x1={36} y1={22} x2={42} y2={16} stroke={ink} strokeWidth={2} />
      {/* dragon eye */}
      <circle cx={36} cy={26} r={2.5} fill={accent} stroke={ink} strokeWidth={1.5} />
      <circle cx={36} cy={26} r={0.8} fill={ink} />
      {/* clouds top-right */}
      <path d="M 40 8 Q 48 6 50 12 Q 56 8 56 16 Q 50 18 44 14 Q 40 16 40 8 Z" fill="none" stroke={ink} strokeWidth={1.5} />
      {/* handle */}
      <rect x={4} y={52} width={10} height={6} fill={ink} transform="rotate(-45 9 55)" />
    </g>
  ),

  // 30. nu2 หมัดสะท้านจักรวาล — universe-shaking fist with cosmic ring
  nu2: ({ ink, accent }) => (
    <g>
      {/* cosmic ring (saturn-like) */}
      <ellipse cx={32} cy={32} rx={28} ry={8} fill="none" stroke={ink} strokeWidth={2} />
      <ellipse cx={32} cy={32} rx={28} ry={8} fill="none" stroke={accent} strokeWidth={1.5} opacity={0.6} />
      {/* stars on ring */}
      <circle cx={6} cy={32} r={1.5} fill={ink} />
      <circle cx={58} cy={32} r={1.5} fill={ink} />
      <circle cx={14} cy={26} r={1} fill={ink} />
      <circle cx={50} cy={38} r={1} fill={ink} />
      {/* central fist */}
      <rect x={22} y={26} width={20} height={16} fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      <line x1={27} y1={26} x2={27} y2={20} stroke={ink} strokeWidth={2} />
      <line x1={32} y1={26} x2={32} y2={18} stroke={ink} strokeWidth={2} />
      <line x1={37} y1={26} x2={37} y2={20} stroke={ink} strokeWidth={2} />
      <circle cx={27} cy={20} r={2} fill={accent} stroke={ink} strokeWidth={1.5} />
      <circle cx={32} cy={18} r={2} fill={accent} stroke={ink} strokeWidth={1.5} />
      <circle cx={37} cy={20} r={2} fill={accent} stroke={ink} strokeWidth={1.5} />
      {/* impact spark on fist */}
      <line x1={32} y1={34} x2={32} y2={36} stroke="white" strokeWidth={2} />
    </g>
  ),

  // 31. ng1 เก้าฟ้าหนึ่งกระบี่ — nine-heaven one-sword
  ng1: ({ ink, accent }) => (
    <g>
      {/* 9 stars in arc */}
      {Array.from({ length: 9 }).map((_, i) => {
        const t = (i / 8) * Math.PI;
        const x = 8 + (Math.cos(Math.PI - t) * 24 + 24);
        const y = 16 - Math.sin(t) * 8;
        return <circle key={i} cx={x} cy={y} r={1.5} fill={ink} />;
      })}
      {/* arc connecting stars */}
      <path d="M 8 16 Q 32 0 56 16" fill="none" stroke={accent} strokeWidth={1.5} opacity={0.6} />
      {/* one majestic vertical sword */}
      <polygon points="28,20 36,20 36,46 32,52 28,46" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      <line x1={32} y1={22} x2={32} y2={48} stroke={ink} strokeWidth={2} />
      {/* dual-grooves */}
      <line x1={30} y1={24} x2={30} y2={44} stroke={ink} strokeWidth={1} />
      <line x1={34} y1={24} x2={34} y2={44} stroke={ink} strokeWidth={1} />
      {/* ornate crossguard with curls */}
      <path d="M 18 46 Q 22 42 26 46 L 38 46 Q 42 42 46 46 L 46 50 L 18 50 Z" fill={ink} />
      {/* handle wraps */}
      <rect x={28} y={50} width={8} height={10} fill={accent} stroke={ink} strokeWidth={2} />
      <line x1={28} y1={54} x2={36} y2={54} stroke={ink} strokeWidth={1} />
      <line x1={28} y1={57} x2={36} y2={57} stroke={ink} strokeWidth={1} />
      {/* pommel */}
      <circle cx={32} cy={62} r={2} fill={ink} />
    </g>
  ),

  // 32. ng2 ทวนประจักษ์พยาน — witness spear
  ng2: ({ ink, accent }) => (
    <g>
      {/* huge eye at top (witness) */}
      <ellipse cx={32} cy={14} rx={14} ry={7} fill={accent} stroke={ink} strokeWidth={2} />
      <circle cx={32} cy={14} r={4} fill="white" stroke={ink} strokeWidth={1.5} />
      <circle cx={32} cy={14} r={2} fill={ink} />
      {/* eyelashes/rays */}
      <line x1={20} y1={10} x2={16} y2={6} stroke={ink} strokeWidth={1.5} />
      <line x1={32} y1={6} x2={32} y2={2} stroke={ink} strokeWidth={1.5} />
      <line x1={44} y1={10} x2={48} y2={6} stroke={ink} strokeWidth={1.5} />
      {/* vertical spear */}
      <rect x={29} y={22} width={6} height={32} fill={accent} stroke={ink} strokeWidth={2} />
      {/* spearhead bottom */}
      <polygon points="26,54 38,54 32,62" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* dragon-print pattern on shaft */}
      <line x1={28} y1={28} x2={36} y2={28} stroke={ink} strokeWidth={1.5} />
      <line x1={28} y1={36} x2={36} y2={36} stroke={ink} strokeWidth={1.5} />
      <line x1={28} y1={44} x2={36} y2={44} stroke={ink} strokeWidth={1.5} />
    </g>
  ),

  // 33. ng4 หมัดพระอินทร์ — Indra fist with lightning
  ng4: ({ ink, accent }) => (
    <g>
      {/* lightning bolt zigzag from top */}
      <polygon points="28,4 38,4 32,18 40,18 24,38 30,22 22,22" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* fist */}
      <rect x={20} y={36} width={24} height={20} fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      <line x1={26} y1={36} x2={26} y2={30} stroke={ink} strokeWidth={2} />
      <line x1={32} y1={36} x2={32} y2={28} stroke={ink} strokeWidth={2} />
      <line x1={38} y1={36} x2={38} y2={30} stroke={ink} strokeWidth={2} />
      <circle cx={26} cy={30} r={2} fill={accent} stroke={ink} strokeWidth={1.5} />
      <circle cx={32} cy={28} r={2} fill={accent} stroke={ink} strokeWidth={1.5} />
      <circle cx={38} cy={30} r={2} fill={accent} stroke={ink} strokeWidth={1.5} />
      {/* electric arcs around fist */}
      <polyline points="14,42 10,46 14,50" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <polyline points="50,42 54,46 50,50" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <polyline points="18,56 14,58 18,60" fill="none" stroke={ink} strokeWidth={1.5} strokeLinecap="round" />
      <polyline points="46,56 50,58 46,60" fill="none" stroke={ink} strokeWidth={1.5} strokeLinecap="round" />
    </g>
  ),

  // 34. ng5 ดาบยาวเทพสังหาร — godkiller long blade
  ng5: ({ ink, accent }) => (
    <g>
      {/* massive blade vertical */}
      <polygon points="22,8 42,8 42,46 32,54 22,46" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      <line x1={32} y1={10} x2={32} y2={50} stroke={ink} strokeWidth={2} />
      <line x1={26} y1={12} x2={26} y2={44} stroke={ink} strokeWidth={1} />
      <line x1={38} y1={12} x2={38} y2={44} stroke={ink} strokeWidth={1} />
      {/* god-killer rune on blade */}
      <circle cx={32} cy={26} r={4} fill="white" stroke={ink} strokeWidth={1.5} />
      <line x1={29} y1={26} x2={35} y2={26} stroke={ink} strokeWidth={1.5} />
      <line x1={32} y1={23} x2={32} y2={29} stroke={ink} strokeWidth={1.5} />
      {/* blood drips */}
      <ellipse cx={20} cy={56} rx={2} ry={3} fill={ink} />
      <ellipse cx={44} cy={58} rx={2} ry={3} fill={ink} />
      {/* heavy crossguard + grip */}
      <rect x={14} y={46} width={36} height={4} fill={ink} />
      <rect x={28} y={50} width={8} height={10} fill={accent} stroke={ink} strokeWidth={2} />
      {/* corner spikes */}
      <polygon points="14,46 12,42 16,46" fill={ink} />
      <polygon points="50,46 52,42 48,46" fill={ink} />
    </g>
  ),

  // 35. ng6 ขลุ่ยพลิกโลก — world-flipping flute with poison
  ng6: ({ ink, accent }) => (
    <g>
      {/* flute diagonal */}
      <rect x={6} y={36} width={52} height={6} rx={3} fill={accent} stroke={ink} strokeWidth={2} transform="rotate(-25 32 39)" />
      {/* finger holes */}
      <circle cx={20} cy={36} r={1.5} fill={ink} transform="rotate(-25 32 39)" />
      <circle cx={28} cy={36} r={1.5} fill={ink} transform="rotate(-25 32 39)" />
      <circle cx={36} cy={36} r={1.5} fill={ink} transform="rotate(-25 32 39)" />
      <circle cx={44} cy={36} r={1.5} fill={ink} transform="rotate(-25 32 39)" />
      {/* world disc */}
      <circle cx={48} cy={20} r={8} fill={accent} stroke={ink} strokeWidth={2} />
      <path d="M 40 20 Q 48 14 56 20" fill="none" stroke={ink} strokeWidth={1.5} />
      {/* upside-down indicator */}
      <polygon points="48,12 52,18 44,18" fill={ink} />
      {/* poison fumes */}
      <path d="M 16 56 Q 12 50 16 44" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <path d="M 22 58 Q 18 52 22 46" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      {/* poison drop */}
      <ellipse cx={32} cy={56} rx={2} ry={3} fill={ink} />
      <circle cx={36} cy={50} r={1.5} fill={ink} />
    </g>
  ),
};

const ART_BATCH: Record<string, IconRenderer> = {
  // 36. t0_lohan ลมปราณอรหันต์ — arhat breath, golden halo
  t0_lohan: ({ ink, accent }) => (
    <g>
      {/* halo ring */}
      <circle cx={32} cy={28} r={18} fill="none" stroke={accent} strokeWidth={3} />
      <circle cx={32} cy={28} r={14} fill="none" stroke={ink} strokeWidth={1.5} />
      {/* halo radial rays */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
        const r = (deg * Math.PI) / 180;
        const x1 = 32 + Math.cos(r) * 19;
        const y1 = 28 + Math.sin(r) * 19;
        const x2 = 32 + Math.cos(r) * 23;
        const y2 = 28 + Math.sin(r) * 23;
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke={ink} strokeWidth={1.5} strokeLinecap="round" />;
      })}
      {/* arhat head silhouette */}
      <circle cx={32} cy={28} r={8} fill={accent} stroke={ink} strokeWidth={2} />
      {/* meditative dot on forehead */}
      <circle cx={32} cy={26} r={1.5} fill={ink} />
      {/* breath wisps below */}
      <path d="M 22 50 Q 26 48 28 52 Q 32 48 36 52 Q 38 48 42 50" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <path d="M 26 56 Q 32 54 38 56" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" opacity={0.6} />
    </g>
  ),

  // 37. t1_goldenbell กระดิ่งทองพื้นฐาน — golden bell ringing
  t1_goldenbell: ({ ink, accent }) => (
    <g>
      {/* bell body */}
      <path d="M 18 14 Q 18 10 20 10 L 44 10 Q 46 10 46 14 L 50 44 L 14 44 Z" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* bell ring base */}
      <ellipse cx={32} cy={44} rx={18} ry={4} fill={accent} stroke={ink} strokeWidth={2} />
      {/* clapper inside */}
      <line x1={32} y1={14} x2={32} y2={42} stroke={ink} strokeWidth={1.5} />
      <circle cx={32} cy={44} r={3} fill={ink} />
      {/* hanging loop top */}
      <circle cx={32} cy={8} r={3} fill="none" stroke={ink} strokeWidth={2} />
      {/* sound waves left/right */}
      <path d="M 8 26 Q 4 30 8 34" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <path d="M 4 22 Q -2 30 4 38" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" opacity={0.6} />
      <path d="M 56 26 Q 60 30 56 34" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <path d="M 60 22 Q 66 30 60 38" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" opacity={0.6} />
      {/* gold glint */}
      <circle cx={26} cy={22} r={2} fill="white" opacity={0.7} />
    </g>
  ),

  // 38. t2_dharma ลมปราณพุทธธรรม — dharma-wheel breath
  t2_dharma: ({ ink, accent }) => (
    <g>
      {/* dharma wheel */}
      <circle cx={32} cy={30} r={20} fill={accent} stroke={ink} strokeWidth={2} />
      <circle cx={32} cy={30} r={4} fill={ink} />
      {/* 8 spokes */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const r = (deg * Math.PI) / 180;
        const x1 = 32 + Math.cos(r) * 4;
        const y1 = 30 + Math.sin(r) * 4;
        const x2 = 32 + Math.cos(r) * 20;
        const y2 = 30 + Math.sin(r) * 20;
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke={ink} strokeWidth={2.5} strokeLinecap="round" />;
      })}
      {/* breath swirl below */}
      <path d="M 14 56 Q 24 52 32 56 Q 42 60 50 56" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <path d="M 18 60 Q 32 56 46 60" fill="none" stroke={ink} strokeWidth={1.5} strokeLinecap="round" opacity={0.6} />
    </g>
  ),

  // 39. t3_onefinger เอกนิ้วเซน — single zen finger 一指禅
  t3_onefinger: ({ ink, accent }) => (
    <g>
      {/* zen circle (enso) */}
      <path d="M 50 18 A 18 18 0 1 0 50 42" fill="none" stroke={ink} strokeWidth={3} strokeLinecap="round" />
      <path d="M 50 18 A 18 18 0 1 0 50 42" fill="none" stroke={accent} strokeWidth={1.5} strokeLinecap="round" />
      {/* hand fist with single extended finger */}
      <path d="M 22 56 L 22 40 Q 22 36 26 36 L 32 36 L 32 40 L 36 40 Q 40 40 40 44 L 40 56 Z" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* extended index finger straight up */}
      <rect x={28} y={20} width={6} height={20} fill={accent} stroke={ink} strokeWidth={2} />
      {/* fingertip energy point */}
      <circle cx={31} cy={20} r={3} fill={accent} stroke={ink} strokeWidth={2} />
      <circle cx={31} cy={20} r={1} fill={ink} />
      {/* zen ki dot near tip */}
      <circle cx={42} cy={14} r={2} fill={ink} />
    </g>
  ),

  // 40. tendon พลังเปลี่ยนเส้นเอ็น — tendon-changing classic
  tendon: ({ ink, accent }) => (
    <g>
      {/* meridian body silhouette */}
      <path d="M 28 6 Q 36 6 36 14 Q 36 18 32 20 L 32 30 L 38 30 L 38 56 L 26 56 L 26 30 L 32 30" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* tendons crisscrossing limbs */}
      <path d="M 18 30 Q 26 26 26 36 Q 26 46 18 50" fill="none" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
      <path d="M 46 30 Q 38 26 38 36 Q 38 46 46 50" fill="none" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
      {/* meridian glow points */}
      <circle cx={32} cy={36} r={2.5} fill={accent} stroke={ink} strokeWidth={1.5} />
      <circle cx={32} cy={46} r={2.5} fill={accent} stroke={ink} strokeWidth={1.5} />
      {/* energy spirals on arms */}
      <path d="M 14 38 Q 12 42 14 46" fill="none" stroke={ink} strokeWidth={1.5} />
      <path d="M 50 38 Q 52 42 50 46" fill="none" stroke={ink} strokeWidth={1.5} />
    </g>
  ),

  // 41. diamond จินกังชี่ — diamond qi with diamond crystal
  diamond: ({ ink, accent }) => (
    <g>
      {/* diamond crystal large */}
      <polygon points="32,8 48,22 32,56 16,22" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* facets */}
      <line x1={32} y1={8} x2={32} y2={22} stroke={ink} strokeWidth={1.5} />
      <line x1={16} y1={22} x2={48} y2={22} stroke={ink} strokeWidth={1.5} />
      <line x1={16} y1={22} x2={32} y2={56} stroke={ink} strokeWidth={1.5} />
      <line x1={48} y1={22} x2={32} y2={56} stroke={ink} strokeWidth={1.5} />
      <line x1={32} y1={22} x2={32} y2={56} stroke={ink} strokeWidth={1} />
      {/* shine */}
      <polygon points="24,16 28,12 30,18" fill="white" opacity={0.7} />
      {/* small radiating sparkles */}
      <line x1={6} y1={32} x2={10} y2={32} stroke={ink} strokeWidth={1.5} />
      <line x1={54} y1={32} x2={58} y2={32} stroke={ink} strokeWidth={1.5} />
      <line x1={32} y1={2} x2={32} y2={6} stroke={ink} strokeWidth={1.5} />
    </g>
  ),

  // 42. t4_demonsubduer ลมปราณอรหันต์ปราบมาร — demon-subduing arhat with crossed vajras
  t4_demonsubduer: ({ ink, accent }) => (
    <g>
      {/* halo */}
      <circle cx={32} cy={32} r={26} fill="none" stroke={accent} strokeWidth={2} opacity={0.5} />
      {/* crossed vajras (X shape) */}
      <line x1={10} y1={10} x2={54} y2={54} stroke={ink} strokeWidth={4} strokeLinecap="round" />
      <line x1={54} y1={10} x2={10} y2={54} stroke={ink} strokeWidth={4} strokeLinecap="round" />
      <line x1={10} y1={10} x2={54} y2={54} stroke={accent} strokeWidth={2} strokeLinecap="round" />
      <line x1={54} y1={10} x2={10} y2={54} stroke={accent} strokeWidth={2} strokeLinecap="round" />
      {/* vajra prongs at ends */}
      <circle cx={10} cy={10} r={3.5} fill={accent} stroke={ink} strokeWidth={2} />
      <circle cx={54} cy={10} r={3.5} fill={accent} stroke={ink} strokeWidth={2} />
      <circle cx={10} cy={54} r={3.5} fill={accent} stroke={ink} strokeWidth={2} />
      <circle cx={54} cy={54} r={3.5} fill={accent} stroke={ink} strokeWidth={2} />
      {/* center dharma seal */}
      <circle cx={32} cy={32} r={6} fill={accent} stroke={ink} strokeWidth={2} />
      <text x={32} y={36} textAnchor="middle" fontSize={9} fontWeight="bold" fill={ink}>卍</text>
    </g>
  ),

  // 43. t3_yinyang หยินหยางสมดุล — yin-yang balanced
  t3_yinyang: ({ ink, accent }) => (
    <g>
      {/* large taijitu */}
      <circle cx={32} cy={32} r={24} fill={accent} stroke={ink} strokeWidth={2} />
      <path d="M 32 8 A 24 24 0 0 1 32 56 A 12 12 0 0 1 32 32 A 12 12 0 0 0 32 8 Z" fill={ink} />
      {/* eye dots */}
      <circle cx={32} cy={20} r={3.5} fill={ink} />
      <circle cx={32} cy={44} r={3.5} fill={accent} />
      {/* outer balance ring */}
      <circle cx={32} cy={32} r={28} fill="none" stroke={ink} strokeWidth={1} opacity={0.5} />
      {/* compass marks */}
      <line x1={32} y1={2} x2={32} y2={6} stroke={ink} strokeWidth={2} />
      <line x1={32} y1={58} x2={32} y2={62} stroke={ink} strokeWidth={2} />
      <line x1={2} y1={32} x2={6} y2={32} stroke={ink} strokeWidth={2} />
      <line x1={58} y1={32} x2={62} y2={32} stroke={ink} strokeWidth={2} />
    </g>
  ),

  // 44. taiji ไทจี้เจิ้นชี่ — taiji true-qi big yin-yang
  taiji: ({ ink, accent }) => (
    <g>
      {/* swirling taiji with motion lines */}
      <circle cx={32} cy={32} r={22} fill={accent} stroke={ink} strokeWidth={2.5} />
      <path d="M 32 10 A 22 22 0 0 1 32 54 A 11 11 0 0 1 32 32 A 11 11 0 0 0 32 10 Z" fill={ink} />
      <circle cx={32} cy={21} r={3} fill={accent} />
      <circle cx={32} cy={43} r={3} fill={ink} stroke={accent} strokeWidth={1} />
      {/* swirling motion arcs */}
      <path d="M 8 32 Q 16 18 32 18" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" opacity={0.5} />
      <path d="M 56 32 Q 48 46 32 46" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" opacity={0.5} />
      {/* qi sparks on edge */}
      <circle cx={10} cy={20} r={1.5} fill={ink} />
      <circle cx={54} cy={44} r={1.5} fill={ink} />
    </g>
  ),

  // 45. zixia จื่อเสียเซินกง — purple-mist divine art with mist
  zixia: ({ ink, accent }) => (
    <g>
      {/* central energy core */}
      <circle cx={32} cy={32} r={8} fill={accent} stroke={ink} strokeWidth={2} />
      <circle cx={32} cy={32} r={3} fill={ink} />
      {/* purple mist swirls */}
      <path d="M 8 24 Q 16 16 24 24 Q 32 30 24 36 Q 14 38 8 32 Z" fill={accent} stroke={ink} strokeWidth={1.5} opacity={0.7} />
      <path d="M 56 24 Q 48 16 40 24 Q 32 30 40 36 Q 50 38 56 32 Z" fill={accent} stroke={ink} strokeWidth={1.5} opacity={0.7} />
      <path d="M 16 50 Q 24 44 32 48 Q 40 44 48 50 Q 40 58 32 54 Q 24 58 16 50 Z" fill={accent} stroke={ink} strokeWidth={1.5} opacity={0.7} />
      {/* mist tendrils */}
      <path d="M 8 12 Q 12 10 16 14" fill="none" stroke={ink} strokeWidth={1.5} strokeLinecap="round" />
      <path d="M 48 14 Q 52 10 56 12" fill="none" stroke={ink} strokeWidth={1.5} strokeLinecap="round" />
      {/* small mist dots */}
      <circle cx={14} cy={14} r={1.5} fill={ink} />
      <circle cx={50} cy={14} r={1.5} fill={ink} />
      <circle cx={14} cy={54} r={1.5} fill={ink} />
      <circle cx={50} cy={54} r={1.5} fill={ink} />
    </g>
  ),

  // 46. emei ง้อไบ๊เซินกง — Emei nun divine art with moon
  emei: ({ ink, accent }) => (
    <g>
      {/* crescent moon large */}
      <path d="M 22 14 A 22 22 0 1 0 22 50 A 16 16 0 1 1 22 14 Z" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* moon glow stars */}
      <circle cx={48} cy={18} r={1.5} fill={ink} />
      <circle cx={52} cy={28} r={2} fill={ink} />
      <circle cx={50} cy={40} r={1.5} fill={ink} />
      <circle cx={44} cy={48} r={1.5} fill={ink} />
      {/* nun's prayer dot */}
      <circle cx={20} cy={32} r={3} fill={ink} />
      {/* small flowing energy lines (peaceful) */}
      <path d="M 30 56 Q 40 54 50 56" fill="none" stroke={ink} strokeWidth={1.5} strokeLinecap="round" />
      <path d="M 32 60 Q 44 58 56 60" fill="none" stroke={ink} strokeWidth={1.5} strokeLinecap="round" opacity={0.6} />
      {/* floating petal */}
      <ellipse cx={56} cy={50} rx={2} ry={1.2} fill={accent} stroke={ink} strokeWidth={1} transform="rotate(30 56 50)" />
    </g>
  ),

  // 47. huashan หัวซานเซินกง — Huashan divine art with mountain
  huashan: ({ ink, accent }) => (
    <g>
      {/* tall jagged mountain peaks */}
      <polygon points="6,56 18,32 24,42 32,18 40,42 46,32 58,56" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* snow caps */}
      <polygon points="14,38 18,32 22,38 18,42" fill="white" stroke={ink} strokeWidth={1.5} strokeLinejoin="round" />
      <polygon points="28,28 32,18 36,28 32,32" fill="white" stroke={ink} strokeWidth={1.5} strokeLinejoin="round" />
      <polygon points="42,38 46,32 50,38 46,42" fill="white" stroke={ink} strokeWidth={1.5} strokeLinejoin="round" />
      {/* sun behind */}
      <circle cx={48} cy={14} r={5} fill={accent} stroke={ink} strokeWidth={2} />
      {/* qi rays */}
      <line x1={42} y1={8} x2={48} y2={14} stroke={ink} strokeWidth={1.5} />
      <line x1={48} y1={6} x2={48} y2={14} stroke={ink} strokeWidth={1.5} />
      <line x1={56} y1={8} x2={48} y2={14} stroke={ink} strokeWidth={1.5} />
    </g>
  ),

  // 48. qzzq ลมปราณชวนจินก่า — Quanzhen pure-yang qi with three trigrams
  qzzq: ({ ink, accent }) => (
    <g>
      {/* central yang sun */}
      <circle cx={32} cy={32} r={10} fill={accent} stroke={ink} strokeWidth={2} />
      <circle cx={32} cy={32} r={4} fill={ink} />
      {/* trigram bars top — qian (heaven, 3 solid) */}
      <line x1={22} y1={10} x2={42} y2={10} stroke={ink} strokeWidth={3} strokeLinecap="round" />
      <line x1={22} y1={14} x2={42} y2={14} stroke={ink} strokeWidth={3} strokeLinecap="round" />
      <line x1={22} y1={18} x2={42} y2={18} stroke={ink} strokeWidth={3} strokeLinecap="round" />
      {/* trigram bars left — li (fire, broken middle) */}
      <line x1={4} y1={28} x2={14} y2={28} stroke={ink} strokeWidth={3} strokeLinecap="round" />
      <line x1={4} y1={32} x2={7} y2={32} stroke={ink} strokeWidth={3} strokeLinecap="round" />
      <line x1={11} y1={32} x2={14} y2={32} stroke={ink} strokeWidth={3} strokeLinecap="round" />
      <line x1={4} y1={36} x2={14} y2={36} stroke={ink} strokeWidth={3} strokeLinecap="round" />
      {/* trigram bars right — kan (water, broken top/bottom) */}
      <line x1={50} y1={28} x2={53} y2={28} stroke={ink} strokeWidth={3} strokeLinecap="round" />
      <line x1={57} y1={28} x2={60} y2={28} stroke={ink} strokeWidth={3} strokeLinecap="round" />
      <line x1={50} y1={32} x2={60} y2={32} stroke={ink} strokeWidth={3} strokeLinecap="round" />
      <line x1={50} y1={36} x2={53} y2={36} stroke={ink} strokeWidth={3} strokeLinecap="round" />
      <line x1={57} y1={36} x2={60} y2={36} stroke={ink} strokeWidth={3} strokeLinecap="round" />
      {/* pure-yang glow rays from center */}
      <line x1={32} y1={42} x2={32} y2={48} stroke={accent} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={32} y1={48} x2={28} y2={56} stroke={accent} strokeWidth={2} strokeLinecap="round" />
      <line x1={32} y1={48} x2={36} y2={56} stroke={accent} strokeWidth={2} strokeLinecap="round" />
    </g>
  ),

  // 49. ynxj คัมภีร์สาวหยก — jade maiden classic with heart
  ynxj: ({ ink, accent }) => (
    <g>
      {/* scroll/book open */}
      <path d="M 8 14 L 8 50 Q 8 54 12 54 L 32 54 L 32 14 Q 20 8 8 14 Z" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      <path d="M 56 14 L 56 50 Q 56 54 52 54 L 32 54 L 32 14 Q 44 8 56 14 Z" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* center spine */}
      <line x1={32} y1={14} x2={32} y2={54} stroke={ink} strokeWidth={2} />
      {/* heart in center */}
      <path d="M 32 36 Q 28 30 24 32 Q 22 34 22 38 Q 22 42 32 48 Q 42 42 42 38 Q 42 34 40 32 Q 36 30 32 36 Z" fill={ink} stroke={ink} strokeWidth={1.5} strokeLinejoin="round" />
      {/* page lines */}
      <line x1={12} y1={22} x2={28} y2={22} stroke={ink} strokeWidth={1} />
      <line x1={12} y1={26} x2={28} y2={26} stroke={ink} strokeWidth={1} />
      <line x1={36} y1={22} x2={52} y2={22} stroke={ink} strokeWidth={1} />
      <line x1={36} y1={26} x2={52} y2={26} stroke={ink} strokeWidth={1} />
    </g>
  ),

  // 50. wanderer เจียงหูชี่ — jianghu wanderer qi with traveler hat
  wanderer: ({ ink, accent }) => (
    <g>
      {/* bamboo hat top view (cone) */}
      <path d="M 8 28 Q 32 8 56 28 Z" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* hat brim ring */}
      <ellipse cx={32} cy={28} rx={24} ry={4} fill={accent} stroke={ink} strokeWidth={2} />
      {/* hat top knob */}
      <circle cx={32} cy={10} r={2.5} fill={ink} />
      {/* bamboo lines */}
      <line x1={20} y1={20} x2={32} y2={10} stroke={ink} strokeWidth={1.5} />
      <line x1={32} y1={10} x2={44} y2={20} stroke={ink} strokeWidth={1.5} />
      <line x1={14} y1={26} x2={32} y2={10} stroke={ink} strokeWidth={1} />
      <line x1={32} y1={10} x2={50} y2={26} stroke={ink} strokeWidth={1} />
      {/* traveler's road - dashed line below */}
      <line x1={8} y1={42} x2={14} y2={42} stroke={ink} strokeWidth={2} />
      <line x1={18} y1={42} x2={26} y2={42} stroke={ink} strokeWidth={2} />
      <line x1={30} y1={42} x2={38} y2={42} stroke={ink} strokeWidth={2} />
      <line x1={42} y1={42} x2={50} y2={42} stroke={ink} strokeWidth={2} />
      <line x1={54} y1={42} x2={58} y2={42} stroke={ink} strokeWidth={2} />
      {/* footsteps */}
      <ellipse cx={20} cy={52} rx={3} ry={5} fill={ink} />
      <ellipse cx={44} cy={52} rx={3} ry={5} fill={ink} />
    </g>
  ),

  // 51. qiankun เฉียนคุนต้าหนัวอี — heaven-earth shift with rotating arrows
  qiankun: ({ ink, accent }) => (
    <g>
      {/* central yin-yang */}
      <circle cx={32} cy={32} r={10} fill={accent} stroke={ink} strokeWidth={2} />
      <path d="M 32 22 A 10 10 0 0 1 32 42 A 5 5 0 0 1 32 32 A 5 5 0 0 0 32 22 Z" fill={ink} />
      {/* rotating arrows around */}
      <path d="M 50 24 A 22 22 0 0 1 40 50" fill="none" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
      <polygon points="40,50 36,46 42,46" fill={ink} />
      <path d="M 14 40 A 22 22 0 0 1 24 14" fill="none" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
      <polygon points="24,14 28,18 22,18" fill={ink} />
      {/* corner energy points */}
      <circle cx={10} cy={10} r={2} fill={ink} />
      <circle cx={54} cy={10} r={2} fill={ink} />
      <circle cx={10} cy={54} r={2} fill={ink} />
      <circle cx={54} cy={54} r={2} fill={ink} />
    </g>
  ),

  // 52. yxhd ดาวเคลื่อนดาราคล้อย — star-shifting with falling stars
  yxhd: ({ ink, accent }) => (
    <g>
      {/* trail lines diagonal */}
      <path d="M 8 8 Q 20 16 32 24" fill="none" stroke={ink} strokeWidth={1.5} opacity={0.6} />
      <path d="M 56 12 Q 44 22 32 30" fill="none" stroke={ink} strokeWidth={1.5} opacity={0.6} />
      <path d="M 12 36 Q 22 42 32 44" fill="none" stroke={ink} strokeWidth={1.5} opacity={0.6} />
      {/* shooting stars */}
      <g>
        <polygon points="32,20 34,26 40,26 35,30 37,36 32,32 27,36 29,30 24,26 30,26" fill={accent} stroke={ink} strokeWidth={1.5} strokeLinejoin="round" />
      </g>
      {/* smaller stars */}
      <polygon points="12,40 13,42 15,42 14,44 14,46 12,45 10,46 11,44 9,42 11,42" fill={accent} stroke={ink} strokeWidth={1} strokeLinejoin="round" />
      <polygon points="50,46 51,48 53,48 52,50 53,52 50,51 48,52 49,50 47,48 49,48" fill={accent} stroke={ink} strokeWidth={1} strokeLinejoin="round" />
      <polygon points="22,52 23,54 25,54 24,55 25,57 22,56 20,57 21,55 19,54 21,54" fill={accent} stroke={ink} strokeWidth={1} strokeLinejoin="round" />
      <polygon points="42,8 43,10 45,10 44,11 45,13 42,12 40,13 41,11 39,10 41,10" fill={accent} stroke={ink} strokeWidth={1} strokeLinejoin="round" />
    </g>
  ),

  // 53. bmzq ลมปราณภูติอุดร — northern netherworld qi
  bmzq: ({ ink, accent }) => (
    <g>
      {/* northern compass star */}
      <polygon points="32,4 36,28 60,32 36,36 32,60 28,36 4,32 28,28" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* center void */}
      <circle cx={32} cy={32} r={6} fill={ink} />
      <circle cx={32} cy={32} r={2.5} fill={accent} />
      {/* dark wisps spilling out */}
      <path d="M 12 14 Q 18 18 14 24" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <path d="M 52 14 Q 46 18 50 24" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <path d="M 12 50 Q 18 46 14 40" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <path d="M 52 50 Q 46 46 50 40" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      {/* N marker */}
      <text x={32} y={16} textAnchor="middle" fontSize={6} fontWeight="bold" fill={ink}>北</text>
    </g>
  ),

  // 54. bmsg มหาเวทดูดดาว — star-sucking great art with vortex
  bmsg: ({ ink, accent }) => (
    <g>
      {/* vortex spiral */}
      <path d="M 32 32 Q 32 12 48 12 Q 60 12 60 30 Q 60 56 32 56 Q 4 56 4 32 Q 4 8 32 8" fill="none" stroke={ink} strokeWidth={3} strokeLinecap="round" />
      <path d="M 32 32 Q 32 12 48 12 Q 60 12 60 30 Q 60 56 32 56 Q 4 56 4 32 Q 4 8 32 8" fill="none" stroke={accent} strokeWidth={1.5} strokeLinecap="round" />
      {/* inner spiral */}
      <path d="M 32 32 Q 32 22 40 22 Q 48 22 48 30 Q 48 42 36 42" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      {/* getting-sucked stars */}
      <polygon points="56,4 58,8 62,6 58,10 60,14 56,12 52,14 54,10 50,8 54,8" fill={accent} stroke={ink} strokeWidth={1} strokeLinejoin="round" opacity={0.7} />
      <polygon points="50,18 51,20 53,19 51,21 52,23 50,22 48,23 49,21 47,19 49,20" fill={accent} stroke={ink} strokeWidth={1} strokeLinejoin="round" opacity={0.6} />
      {/* center black hole */}
      <circle cx={32} cy={32} r={3} fill={ink} />
    </g>
  ),

  // 55. hgdf วิชาสลายพลัง — power-dissolving art with swirling break
  hgdf: ({ ink, accent }) => (
    <g>
      {/* incoming energy ball (left) */}
      <circle cx={14} cy={32} r={6} fill={accent} stroke={ink} strokeWidth={2} />
      <line x1={4} y1={26} x2={10} y2={28} stroke={ink} strokeWidth={1.5} />
      <line x1={4} y1={32} x2={10} y2={32} stroke={ink} strokeWidth={1.5} />
      <line x1={4} y1={38} x2={10} y2={36} stroke={ink} strokeWidth={1.5} />
      {/* dissolving swirl in middle */}
      <path d="M 22 32 Q 28 22 36 28 Q 42 36 36 42 Q 28 46 24 38" fill="none" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
      <path d="M 26 30 Q 32 26 38 30" fill="none" stroke={ink} strokeWidth={1.5} strokeLinecap="round" />
      {/* dispersing fragments (right) */}
      <circle cx={48} cy={20} r={1.5} fill={ink} />
      <circle cx={54} cy={26} r={1.5} fill={ink} />
      <circle cx={56} cy={36} r={1.5} fill={ink} />
      <circle cx={50} cy={44} r={1.5} fill={ink} />
      <circle cx={54} cy={50} r={1.5} fill={ink} />
      {/* outward arrows */}
      <line x1={42} y1={20} x2={48} y2={16} stroke={ink} strokeWidth={1.5} strokeLinecap="round" />
      <line x1={44} y1={48} x2={50} y2={52} stroke={ink} strokeWidth={1.5} strokeLinecap="round" />
    </g>
  ),

  // 56. t2_snakeform งูพิษเจ็ดสี — 7-color venom snake
  t2_snakeform: ({ ink, accent }) => (
    <g>
      {/* coiled snake body s-curve */}
      <path d="M 8 14 Q 32 14 32 26 Q 32 38 16 38 Q 8 38 8 46 Q 8 54 24 54 Q 40 54 40 46" fill="none" stroke={ink} strokeWidth={5} strokeLinecap="round" />
      <path d="M 8 14 Q 32 14 32 26 Q 32 38 16 38 Q 8 38 8 46 Q 8 54 24 54 Q 40 54 40 46" fill="none" stroke={accent} strokeWidth={2.5} strokeLinecap="round" />
      {/* color bands (7) */}
      <circle cx={20} cy={14} r={2} fill={ink} />
      <circle cx={32} cy={20} r={2} fill={accent} stroke={ink} strokeWidth={1} />
      <circle cx={28} cy={36} r={2} fill={ink} />
      <circle cx={14} cy={42} r={2} fill={accent} stroke={ink} strokeWidth={1} />
      <circle cx={20} cy={54} r={2} fill={ink} />
      <circle cx={32} cy={50} r={2} fill={accent} stroke={ink} strokeWidth={1} />
      <circle cx={38} cy={46} r={2} fill={ink} />
      {/* snake head right */}
      <ellipse cx={48} cy={42} rx={6} ry={4} fill={accent} stroke={ink} strokeWidth={2} />
      <circle cx={50} cy={41} r={1.2} fill={ink} />
      {/* forked tongue */}
      <line x1={54} y1={42} x2={58} y2={40} stroke={ink} strokeWidth={1.5} strokeLinecap="round" />
      <line x1={54} y1={42} x2={58} y2={44} stroke={ink} strokeWidth={1.5} strokeLinecap="round" />
    </g>
  ),

  // 57. np เบญจพิษรวมกาย — five-poison body
  np: ({ ink, accent }) => (
    <g>
      {/* central body silhouette */}
      <circle cx={32} cy={32} r={10} fill={accent} stroke={ink} strokeWidth={2} />
      <text x={32} y={36} textAnchor="middle" fontSize={11} fontWeight="bold" fill={ink}>毒</text>
      {/* 5 poisonous creatures around */}
      {/* snake top */}
      <path d="M 28 10 Q 32 6 36 10 Q 36 14 32 14 Q 28 14 28 10 Z" fill={accent} stroke={ink} strokeWidth={1.5} strokeLinejoin="round" />
      <circle cx={31} cy={11} r={0.8} fill={ink} />
      {/* scorpion left */}
      <ellipse cx={10} cy={32} rx={4} ry={3} fill={accent} stroke={ink} strokeWidth={1.5} />
      <path d="M 6 28 Q 4 24 8 22" fill="none" stroke={ink} strokeWidth={1.5} strokeLinecap="round" />
      {/* spider right */}
      <circle cx={54} cy={32} r={3} fill={accent} stroke={ink} strokeWidth={1.5} />
      <line x1={50} y1={28} x2={48} y2={26} stroke={ink} strokeWidth={1.5} />
      <line x1={50} y1={32} x2={47} y2={32} stroke={ink} strokeWidth={1.5} />
      <line x1={50} y1={36} x2={48} y2={38} stroke={ink} strokeWidth={1.5} />
      <line x1={58} y1={28} x2={60} y2={26} stroke={ink} strokeWidth={1.5} />
      <line x1={58} y1={32} x2={61} y2={32} stroke={ink} strokeWidth={1.5} />
      <line x1={58} y1={36} x2={60} y2={38} stroke={ink} strokeWidth={1.5} />
      {/* toad bottom-left */}
      <ellipse cx={16} cy={52} rx={4} ry={3} fill={accent} stroke={ink} strokeWidth={1.5} />
      <circle cx={15} cy={51} r={0.8} fill={ink} />
      {/* centipede bottom-right */}
      <path d="M 42 52 Q 48 50 54 52" fill="none" stroke={accent} strokeWidth={3} strokeLinecap="round" />
      <path d="M 42 52 Q 48 50 54 52" fill="none" stroke={ink} strokeWidth={1.5} strokeLinecap="round" />
      <line x1={44} y1={50} x2={43} y2={48} stroke={ink} strokeWidth={1} />
      <line x1={48} y1={50} x2={48} y2={48} stroke={ink} strokeWidth={1} />
      <line x1={52} y1={50} x2={53} y2={48} stroke={ink} strokeWidth={1} />
    </g>
  ),

  // 58. blood โลหิตอสุรา — demon blood art with bloody aura
  blood: ({ ink, accent }) => (
    <g>
      {/* demon horn silhouette */}
      <path d="M 22 36 L 22 16 Q 22 8 14 6 Q 26 12 28 26 L 28 36 Z" fill={ink} stroke={ink} strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M 42 36 L 42 16 Q 42 8 50 6 Q 38 12 36 26 L 36 36 Z" fill={ink} stroke={ink} strokeWidth={1.5} strokeLinejoin="round" />
      {/* blood drop large */}
      <path d="M 32 18 Q 22 36 32 50 Q 42 36 32 18 Z" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* highlight on drop */}
      <ellipse cx={28} cy={32} rx={2} ry={4} fill="white" opacity={0.5} />
      {/* blood splatters */}
      <ellipse cx={10} cy={48} rx={3} ry={2} fill={accent} stroke={ink} strokeWidth={1.5} transform="rotate(20 10 48)" />
      <ellipse cx={54} cy={50} rx={3} ry={2} fill={accent} stroke={ink} strokeWidth={1.5} transform="rotate(-20 54 50)" />
      <circle cx={16} cy={56} r={1.5} fill={accent} stroke={ink} strokeWidth={1} />
      <circle cx={48} cy={58} r={1.5} fill={accent} stroke={ink} strokeWidth={1} />
      <circle cx={32} cy={58} r={2} fill={accent} stroke={ink} strokeWidth={1} />
    </g>
  ),

  // 59. military จวินเจิ้นชี่ — military true-qi with helmet/banner
  military: ({ ink, accent }) => (
    <g>
      {/* helmet */}
      <path d="M 16 32 Q 16 16 32 12 Q 48 16 48 32 L 48 38 L 16 38 Z" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* helmet plume */}
      <path d="M 32 12 Q 28 4 32 0 Q 36 4 32 12" fill={ink} stroke={ink} strokeWidth={1.5} strokeLinejoin="round" />
      {/* helmet ridge */}
      <line x1={32} y1={12} x2={32} y2={38} stroke={ink} strokeWidth={2} />
      {/* face guard */}
      <rect x={20} y={38} width={24} height={4} fill={ink} />
      {/* banner pole right */}
      <line x1={56} y1={4} x2={56} y2={60} stroke={ink} strokeWidth={2} />
      <polygon points="56,8 56,28 48,18" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      <text x={50} y={22} textAnchor="middle" fontSize={6} fontWeight="bold" fill={ink}>軍</text>
      {/* shield insignia */}
      <circle cx={32} cy={50} r={6} fill={accent} stroke={ink} strokeWidth={2} />
      <line x1={32} y1={46} x2={32} y2={54} stroke={ink} strokeWidth={1.5} />
      <line x1={28} y1={50} x2={36} y2={50} stroke={ink} strokeWidth={1.5} />
    </g>
  ),

  // 60. lotus เหลียนฮวาชี่ — lotus qi with serene flower
  lotus: ({ ink, accent }) => (
    <g>
      {/* outer 8 lotus petals */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const r = (deg * Math.PI) / 180;
        const cx = 32 + Math.cos(r) * 16;
        const cy = 32 + Math.sin(r) * 16;
        return (
          <ellipse key={deg} cx={cx} cy={cy} rx={8} ry={4} fill={accent} stroke={ink} strokeWidth={2}
            transform={`rotate(${deg} ${cx} ${cy})`} />
        );
      })}
      {/* inner 4 petals */}
      {[22, 112, 202, 292].map((deg) => {
        const r = (deg * Math.PI) / 180;
        const cx = 32 + Math.cos(r) * 8;
        const cy = 32 + Math.sin(r) * 8;
        return (
          <ellipse key={deg} cx={cx} cy={cy} rx={5} ry={3} fill={accent} stroke={ink} strokeWidth={1.5}
            transform={`rotate(${deg} ${cx} ${cy})`} opacity={0.85} />
        );
      })}
      {/* center seed pod */}
      <circle cx={32} cy={32} r={5} fill={ink} />
      <circle cx={30} cy={30} r={1} fill={accent} />
      <circle cx={34} cy={30} r={1} fill={accent} />
      <circle cx={30} cy={34} r={1} fill={accent} />
      <circle cx={34} cy={34} r={1} fill={accent} />
      <circle cx={32} cy={32} r={1} fill={accent} />
    </g>
  ),

  // 61. scholar เหวินชี่ — scholar qi with brush + scroll
  scholar: ({ ink, accent }) => (
    <g>
      {/* unrolled scroll horizontal */}
      <rect x={6} y={28} width={52} height={20} fill={accent} stroke={ink} strokeWidth={2} />
      {/* scroll roll ends */}
      <ellipse cx={6} cy={38} rx={3} ry={10} fill={ink} />
      <ellipse cx={58} cy={38} rx={3} ry={10} fill={ink} />
      {/* brush stroke characters */}
      <path d="M 14 34 L 18 34 M 16 34 L 16 42" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <path d="M 24 34 L 28 38 L 24 42" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <path d="M 34 34 L 34 42 M 32 38 L 36 38" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <path d="M 42 34 Q 46 38 42 42" stroke={ink} strokeWidth={2} strokeLinecap="round" fill="none" />
      {/* brush diagonal above */}
      <line x1={48} y1={6} x2={42} y2={20} stroke={ink} strokeWidth={3} strokeLinecap="round" />
      <polygon points="44,16 40,24 48,18" fill={ink} />
      <rect x={48} y={4} width={8} height={4} fill={accent} stroke={ink} strokeWidth={1.5} transform="rotate(-30 52 6)" />
      {/* ink drop */}
      <ellipse cx={36} cy={26} rx={1.5} ry={2} fill={ink} />
    </g>
  ),

  // 62. poison อินตู๋ชี่ — venom qi with skull motif
  poison: ({ ink, accent }) => (
    <g>
      {/* skull */}
      <path d="M 18 18 Q 18 6 32 6 Q 46 6 46 18 L 46 36 L 38 36 L 38 44 L 26 44 L 26 36 L 18 36 Z" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* eye sockets */}
      <ellipse cx={26} cy={22} rx={4} ry={5} fill={ink} />
      <ellipse cx={38} cy={22} rx={4} ry={5} fill={ink} />
      {/* venom drips from eyes */}
      <path d="M 26 28 Q 24 32 26 36" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <path d="M 38 28 Q 40 32 38 36" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      {/* nose hole */}
      <polygon points="32,28 30,34 34,34" fill={ink} />
      {/* teeth */}
      <line x1={28} y1={36} x2={28} y2={44} stroke={ink} strokeWidth={1} />
      <line x1={32} y1={36} x2={32} y2={44} stroke={ink} strokeWidth={1} />
      <line x1={36} y1={36} x2={36} y2={44} stroke={ink} strokeWidth={1} />
      {/* venom puddle below */}
      <ellipse cx={32} cy={54} rx={14} ry={4} fill={ink} />
      {/* bubbles in puddle */}
      <circle cx={20} cy={54} r={1.5} fill={accent} />
      <circle cx={32} cy={50} r={1.5} fill={accent} />
      <circle cx={44} cy={54} r={1.5} fill={accent} />
    </g>
  ),

  // 63. heaven เฉียนคุนต้าฝ่า — heaven-earth great art with cosmic disk
  heaven: ({ ink, accent }) => (
    <g>
      {/* outer disk */}
      <circle cx={32} cy={32} r={26} fill={accent} stroke={ink} strokeWidth={2} />
      {/* horizon line splitting heaven/earth */}
      <line x1={6} y1={32} x2={58} y2={32} stroke={ink} strokeWidth={2} />
      {/* upper sky — sun + clouds */}
      <circle cx={32} cy={20} r={4} fill={ink} />
      <path d="M 12 24 Q 18 20 24 24" fill="none" stroke={ink} strokeWidth={1.5} />
      <path d="M 40 22 Q 46 18 52 22" fill="none" stroke={ink} strokeWidth={1.5} />
      {/* lower earth — mountains */}
      <polygon points="6,46 16,36 22,42 28,34 36,42 42,36 50,42 58,38 58,46" fill={ink} />
      {/* center disc divider point */}
      <circle cx={32} cy={32} r={3} fill={ink} />
      <circle cx={32} cy={32} r={1} fill={accent} />
      {/* outer constellation dots */}
      <circle cx={6} cy={20} r={1.5} fill={ink} />
      <circle cx={58} cy={20} r={1.5} fill={ink} />
    </g>
  ),

  // 64. snow กำแพงหิมะ — snow wall with snowflakes
  snow: ({ ink, accent }) => (
    <g>
      {/* wall — three layers of bricks */}
      <rect x={8} y={36} width={48} height={8} fill={accent} stroke={ink} strokeWidth={2} />
      <rect x={8} y={44} width={48} height={8} fill={accent} stroke={ink} strokeWidth={2} />
      <rect x={8} y={52} width={48} height={6} fill={accent} stroke={ink} strokeWidth={2} />
      <line x1={20} y1={36} x2={20} y2={44} stroke={ink} strokeWidth={1.5} />
      <line x1={36} y1={36} x2={36} y2={44} stroke={ink} strokeWidth={1.5} />
      <line x1={52} y1={36} x2={52} y2={44} stroke={ink} strokeWidth={1.5} />
      <line x1={14} y1={44} x2={14} y2={52} stroke={ink} strokeWidth={1.5} />
      <line x1={28} y1={44} x2={28} y2={52} stroke={ink} strokeWidth={1.5} />
      <line x1={44} y1={44} x2={44} y2={52} stroke={ink} strokeWidth={1.5} />
      <line x1={20} y1={52} x2={20} y2={58} stroke={ink} strokeWidth={1.5} />
      <line x1={36} y1={52} x2={36} y2={58} stroke={ink} strokeWidth={1.5} />
      <line x1={52} y1={52} x2={52} y2={58} stroke={ink} strokeWidth={1.5} />
      {/* snow drift on top */}
      <path d="M 8 36 Q 14 30 20 34 Q 28 28 36 34 Q 44 28 50 34 Q 56 32 56 36" fill="white" stroke={ink} strokeWidth={1.5} strokeLinejoin="round" />
      {/* snowflakes falling */}
      <g stroke={ink} strokeWidth={1.5} strokeLinecap="round">
        <line x1={16} y1={10} x2={16} y2={18} />
        <line x1={12} y1={14} x2={20} y2={14} />
        <line x1={13} y1={11} x2={19} y2={17} />
        <line x1={13} y1={17} x2={19} y2={11} />
      </g>
      <g stroke={ink} strokeWidth={1.5} strokeLinecap="round">
        <line x1={32} y1={4} x2={32} y2={12} />
        <line x1={28} y1={8} x2={36} y2={8} />
      </g>
      <g stroke={ink} strokeWidth={1.5} strokeLinecap="round">
        <line x1={48} y1={14} x2={48} y2={22} />
        <line x1={44} y1={18} x2={52} y2={18} />
        <line x1={45} y1={15} x2={51} y2={21} />
        <line x1={45} y1={21} x2={51} y2={15} />
      </g>
    </g>
  ),

  // 65. fire เพลิงสวรรค์ — heaven fire with phoenix flame
  fire: ({ ink, accent }) => (
    <g>
      {/* phoenix-shaped flame */}
      <path d="M 32 4 Q 24 14 20 28 Q 14 24 16 36 Q 8 38 16 46 Q 20 54 32 56 Q 44 54 48 46 Q 56 38 48 36 Q 50 24 44 28 Q 40 14 32 4 Z" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* phoenix wings */}
      <path d="M 16 36 Q 8 32 4 24" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <path d="M 48 36 Q 56 32 60 24" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      {/* inner flame */}
      <path d="M 32 14 Q 26 26 28 38 Q 32 32 36 38 Q 38 26 32 14 Z" fill={ink} stroke={ink} strokeWidth={1} strokeLinejoin="round" />
      {/* phoenix eye */}
      <circle cx={32} cy={26} r={1.5} fill={accent} />
      {/* tail flame */}
      <path d="M 32 56 Q 28 60 32 62 Q 36 60 32 56" fill={ink} />
    </g>
  ),

  // 66. sand พายุทราย — sandstorm swirl
  sand: ({ ink, accent }) => (
    <g>
      {/* swirling spiral */}
      <path d="M 32 32 Q 48 32 48 16 Q 32 16 32 32 Q 16 32 16 48 Q 32 48 32 32" fill="none" stroke={ink} strokeWidth={3} strokeLinecap="round" />
      <path d="M 32 32 Q 48 32 48 16 Q 32 16 32 32 Q 16 32 16 48 Q 32 48 32 32" fill="none" stroke={accent} strokeWidth={1.5} strokeLinecap="round" />
      {/* outer swirl band */}
      <path d="M 8 24 Q 16 8 32 8 Q 56 8 56 32 Q 56 56 32 56 Q 8 56 8 40" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" opacity={0.6} />
      {/* sand particles */}
      <circle cx={10} cy={14} r={1.2} fill={ink} />
      <circle cx={54} cy={20} r={1.2} fill={ink} />
      <circle cx={56} cy={48} r={1.2} fill={ink} />
      <circle cx={10} cy={50} r={1.2} fill={ink} />
      <circle cx={20} cy={6} r={1} fill={ink} />
      <circle cx={48} cy={58} r={1} fill={ink} />
      <circle cx={6} cy={32} r={1} fill={ink} />
      <circle cx={58} cy={32} r={1} fill={ink} />
    </g>
  ),

  // 67. shadow เงาสังหาร — assassination shadow with dagger silhouette
  shadow: ({ ink, accent }) => (
    <g>
      {/* shadow figure (cloaked) */}
      <path d="M 24 8 Q 16 16 16 32 L 16 56 L 32 56 L 32 32 Q 32 22 28 18 Z" fill={ink} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* hood opening */}
      <ellipse cx={24} cy={20} rx={4} ry={5} fill={accent} />
      <circle cx={23} cy={20} r={1} fill={ink} />
      {/* dagger held diagonal */}
      <polygon points="36,18 40,18 56,38 52,42" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      <polygon points="34,16 42,16 40,20 36,20" fill={ink} />
      <line x1={38} y1={20} x2={54} y2={40} stroke={ink} strokeWidth={1} />
      {/* drop of blood */}
      <ellipse cx={56} cy={44} rx={1.5} ry={2.5} fill={ink} />
      {/* shadow puddle below */}
      <ellipse cx={24} cy={58} rx={14} ry={3} fill={ink} opacity={0.5} />
    </g>
  ),

  // 68. jiuyin เก้าหยินจิงชี่ — nine-yin classic qi with bone
  jiuyin: ({ ink, accent }) => (
    <g>
      {/* dark moon background */}
      <circle cx={32} cy={28} r={18} fill={ink} stroke={ink} strokeWidth={2} />
      <circle cx={28} cy={24} r={2} fill={accent} />
      <circle cx={36} cy={32} r={1.5} fill={accent} />
      <circle cx={26} cy={34} r={1.5} fill={accent} />
      {/* "九" character on moon */}
      <text x={32} y={34} textAnchor="middle" fontSize={14} fontWeight="bold" fill={accent}>九</text>
      {/* crossed bones below */}
      <g stroke={ink} strokeWidth={2.5} strokeLinecap="round">
        <line x1={14} y1={48} x2={50} y2={58} stroke={accent} strokeWidth={6} />
        <line x1={50} y1={48} x2={14} y2={58} stroke={accent} strokeWidth={6} />
        <line x1={14} y1={48} x2={50} y2={58} />
        <line x1={50} y1={48} x2={14} y2={58} />
      </g>
      {/* bone knobs */}
      <circle cx={14} cy={48} r={2.5} fill={accent} stroke={ink} strokeWidth={1.5} />
      <circle cx={50} cy={58} r={2.5} fill={accent} stroke={ink} strokeWidth={1.5} />
      <circle cx={50} cy={48} r={2.5} fill={accent} stroke={ink} strokeWidth={1.5} />
      <circle cx={14} cy={58} r={2.5} fill={accent} stroke={ink} strokeWidth={1.5} />
    </g>
  ),

  // 69. jiuyang เก้าหยางเซินกง — nine-yang divine art with sun
  jiuyang: ({ ink, accent }) => (
    <g>
      {/* radiant sun */}
      <circle cx={32} cy={32} r={14} fill={accent} stroke={ink} strokeWidth={2} />
      {/* sun rays — 12 */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
        const r = (deg * Math.PI) / 180;
        const x1 = 32 + Math.cos(r) * 16;
        const y1 = 32 + Math.sin(r) * 16;
        const x2 = 32 + Math.cos(r) * 26;
        const y2 = 32 + Math.sin(r) * 26;
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke={ink} strokeWidth={2.5} strokeLinecap="round" />;
      })}
      {/* "九" character on sun */}
      <text x={32} y={37} textAnchor="middle" fontSize={14} fontWeight="bold" fill={ink}>九</text>
    </g>
  ),

  // 70. shenzhao เซินจ้าวจิง — divine illumination scripture with eye
  shenzhao: ({ ink, accent }) => (
    <g>
      {/* large eye of illumination */}
      <path d="M 6 32 Q 32 12 58 32 Q 32 52 6 32 Z" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* iris */}
      <circle cx={32} cy={32} r={10} fill="white" stroke={ink} strokeWidth={2} />
      <circle cx={32} cy={32} r={5} fill={ink} />
      <circle cx={34} cy={30} r={1.5} fill="white" />
      {/* light rays from eye */}
      <line x1={32} y1={6} x2={32} y2={12} stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <line x1={32} y1={52} x2={32} y2={58} stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <line x1={14} y1={14} x2={18} y2={20} stroke={ink} strokeWidth={1.5} strokeLinecap="round" />
      <line x1={50} y1={14} x2={46} y2={20} stroke={ink} strokeWidth={1.5} strokeLinecap="round" />
      <line x1={14} y1={50} x2={18} y2={44} stroke={ink} strokeWidth={1.5} strokeLinecap="round" />
      <line x1={50} y1={50} x2={46} y2={44} stroke={ink} strokeWidth={1.5} strokeLinecap="round" />
    </g>
  ),

  // 71. taiyin ไต้อินเจิ้นชี่ — great-yin true-qi with cold moon
  taiyin: ({ ink, accent }) => (
    <g>
      {/* large crescent moon */}
      <path d="M 18 8 A 24 24 0 1 0 18 56 A 18 18 0 1 1 18 8 Z" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* moon craters */}
      <circle cx={20} cy={24} r={2.5} fill={ink} />
      <circle cx={14} cy={36} r={2} fill={ink} />
      <circle cx={22} cy={44} r={1.5} fill={ink} />
      {/* cold breath/aura */}
      <path d="M 40 14 Q 48 18 44 24" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <path d="M 50 28 Q 58 32 50 36" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <path d="M 40 50 Q 48 46 44 40" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      {/* frost stars */}
      <g stroke={ink} strokeWidth={1.5} strokeLinecap="round">
        <line x1={50} y1={10} x2={54} y2={14} />
        <line x1={54} y1={10} x2={50} y2={14} />
      </g>
      <g stroke={ink} strokeWidth={1.5} strokeLinecap="round">
        <line x1={56} y1={50} x2={60} y2={54} />
        <line x1={60} y1={50} x2={56} y2={54} />
      </g>
      <circle cx={56} cy={32} r={1.5} fill={ink} />
    </g>
  ),

  // 72. huoxue ฮั่วเสวียสินฝ่า — blood-vitalizing heart art with heart pulse
  huoxue: ({ ink, accent }) => (
    <g>
      {/* large heart */}
      <path d="M 32 56 Q 8 38 8 22 Q 8 12 18 12 Q 26 12 32 22 Q 38 12 46 12 Q 56 12 56 22 Q 56 38 32 56 Z" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* ecg pulse line through heart */}
      <polyline points="6,32 14,32 18,28 22,40 26,20 30,44 34,32 50,32 58,32"
        fill="none" stroke={ink} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* heart highlight */}
      <ellipse cx={20} cy={22} rx={3} ry={4} fill="white" opacity={0.5} />
    </g>
  ),

  // 73. dongxuan ตงซวนเซินกง — dark-mystery divine art with void portal
  dongxuan: ({ ink, accent }) => (
    <g>
      {/* portal rings — concentric */}
      <circle cx={32} cy={32} r={26} fill={ink} stroke={ink} strokeWidth={2} />
      <circle cx={32} cy={32} r={20} fill="none" stroke={accent} strokeWidth={2} />
      <circle cx={32} cy={32} r={14} fill="none" stroke={accent} strokeWidth={1.5} opacity={0.7} />
      <circle cx={32} cy={32} r={8} fill="none" stroke={accent} strokeWidth={1.5} opacity={0.5} />
      {/* void center */}
      <circle cx={32} cy={32} r={4} fill={accent} />
      <circle cx={32} cy={32} r={1.5} fill={ink} />
      {/* mystery glyphs around */}
      <text x={32} y={14} textAnchor="middle" fontSize={6} fontWeight="bold" fill={accent}>玄</text>
      <text x={14} y={36} textAnchor="middle" fontSize={6} fontWeight="bold" fill={accent}>洞</text>
      <text x={50} y={36} textAnchor="middle" fontSize={6} fontWeight="bold" fill={accent}>神</text>
      <text x={32} y={56} textAnchor="middle" fontSize={6} fontWeight="bold" fill={accent}>功</text>
    </g>
  ),

  // 74. ng7 นพเก้าฟ้าคืนดาว — nine-heaven star-return with constellation
  ng7: ({ ink, accent }) => (
    <g>
      {/* 9 stars in a complex constellation */}
      <circle cx={12} cy={12} r={2.5} fill={accent} stroke={ink} strokeWidth={1.5} />
      <circle cx={26} cy={8} r={2.5} fill={accent} stroke={ink} strokeWidth={1.5} />
      <circle cx={40} cy={14} r={2.5} fill={accent} stroke={ink} strokeWidth={1.5} />
      <circle cx={54} cy={10} r={2.5} fill={accent} stroke={ink} strokeWidth={1.5} />
      <circle cx={20} cy={28} r={2.5} fill={accent} stroke={ink} strokeWidth={1.5} />
      <circle cx={32} cy={32} r={4} fill={accent} stroke={ink} strokeWidth={2} />
      <circle cx={32} cy={32} r={1.5} fill={ink} />
      <circle cx={48} cy={28} r={2.5} fill={accent} stroke={ink} strokeWidth={1.5} />
      <circle cx={18} cy={48} r={2.5} fill={accent} stroke={ink} strokeWidth={1.5} />
      <circle cx={46} cy={50} r={2.5} fill={accent} stroke={ink} strokeWidth={1.5} />
      {/* connection lines */}
      <g stroke={ink} strokeWidth={1} opacity={0.6}>
        <line x1={12} y1={12} x2={26} y2={8} />
        <line x1={26} y1={8} x2={40} y2={14} />
        <line x1={40} y1={14} x2={54} y2={10} />
        <line x1={26} y1={8} x2={20} y2={28} />
        <line x1={20} y1={28} x2={32} y2={32} />
        <line x1={32} y1={32} x2={48} y2={28} />
        <line x1={40} y1={14} x2={48} y2={28} />
        <line x1={20} y1={28} x2={18} y2={48} />
        <line x1={32} y1={32} x2={46} y2={50} />
        <line x1={18} y1={48} x2={46} y2={50} />
      </g>
      {/* return arrow */}
      <path d="M 56 56 Q 60 50 56 44" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <polygon points="54,42 56,46 60,44" fill={ink} />
    </g>
  ),

  // 75. khbt คัมภีร์ทานตะวัน — sunflower manual with sunflower
  khbt: ({ ink, accent }) => (
    <g>
      {/* sunflower face */}
      <circle cx={32} cy={26} r={9} fill={ink} stroke={ink} strokeWidth={2} />
      {/* seed pattern */}
      <circle cx={30} cy={24} r={0.8} fill={accent} />
      <circle cx={34} cy={24} r={0.8} fill={accent} />
      <circle cx={32} cy={26} r={0.8} fill={accent} />
      <circle cx={30} cy={28} r={0.8} fill={accent} />
      <circle cx={34} cy={28} r={0.8} fill={accent} />
      {/* sunflower petals — 12 */}
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
        const r = (deg * Math.PI) / 180;
        const cx = 32 + Math.cos(r) * 14;
        const cy = 26 + Math.sin(r) * 14;
        return (
          <ellipse key={deg} cx={cx} cy={cy} rx={5} ry={2.5} fill={accent} stroke={ink} strokeWidth={1.5}
            transform={`rotate(${deg} ${cx} ${cy})`} />
        );
      })}
      {/* stem */}
      <line x1={32} y1={42} x2={32} y2={58} stroke={ink} strokeWidth={3} strokeLinecap="round" />
      {/* leaves */}
      <path d="M 32 50 Q 22 48 20 54" fill={accent} stroke={ink} strokeWidth={1.5} strokeLinejoin="round" />
      <path d="M 32 50 Q 42 48 44 54" fill={accent} stroke={ink} strokeWidth={1.5} strokeLinejoin="round" />
    </g>
  ),
};

Object.assign(SKILL_ICON_OVERRIDES, SKILL_BATCH);
Object.assign(ART_ICON_OVERRIDES, ART_BATCH);
