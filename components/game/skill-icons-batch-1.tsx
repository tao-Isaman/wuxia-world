import type { IconRenderer } from "./skill-icons-registry";
import { SKILL_ICON_OVERRIDES, SKILL_ICON_RASTER } from "./skill-icons-registry";

// ─── Batch 1: Shaolin + Wudang + Huashan + Quanzhen sects ─────────────
//
// Each renderer draws inside a 64×64 viewBox, focused on the inner
// 56×56 area (x: 4..60). Glyphs are chunky (stroke 2) so they read
// at 32px thumbnails. `ink` = outlines, `accent` = tier-tinted fill.

const BATCH: Record<string, IconRenderer> = {
  // 1. หมัดเส้าหลิน — basic Shaolin punch, plain fist
  sf: ({ ink, accent }) => (
    <g>
      {/* knuckle row + fist body */}
      <rect x={18} y={26} width={28} height={20} fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* knuckles */}
      <line x1={25} y1={26} x2={25} y2={20} stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <line x1={32} y1={26} x2={32} y2={18} stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <line x1={39} y1={26} x2={39} y2={20} stroke={ink} strokeWidth={2} strokeLinecap="round" />
      {/* knuckle caps */}
      <circle cx={25} cy={20} r={3} fill={accent} stroke={ink} strokeWidth={2} />
      <circle cx={32} cy={18} r={3} fill={accent} stroke={ink} strokeWidth={2} />
      <circle cx={39} cy={20} r={3} fill={accent} stroke={ink} strokeWidth={2} />
      {/* wrist */}
      <rect x={20} y={46} width={24} height={8} fill={accent} stroke={ink} strokeWidth={2} />
    </g>
  ),

  // 2. หมัดยาวพุทธธรรม — long-arm reach punch with dharma wheel
  sl_long_dharma: ({ ink, accent }) => (
    <g>
      {/* extended arm */}
      <rect x={6} y={30} width={32} height={8} fill={accent} stroke={ink} strokeWidth={2} />
      {/* fist at end */}
      <rect x={36} y={26} width={14} height={16} fill={accent} stroke={ink} strokeWidth={2} />
      {/* dharma wheel behind fist */}
      <circle cx={50} cy={34} r={10} fill="none" stroke={ink} strokeWidth={2} />
      <circle cx={50} cy={34} r={3} fill={accent} stroke={ink} strokeWidth={2} />
      {/* spokes */}
      <line x1={50} y1={24} x2={50} y2={44} stroke={ink} strokeWidth={2} />
      <line x1={40} y1={34} x2={60} y2={34} stroke={ink} strokeWidth={2} />
      <line x1={43} y1={27} x2={57} y2={41} stroke={ink} strokeWidth={2} />
      <line x1={43} y1={41} x2={57} y2={27} stroke={ink} strokeWidth={2} />
    </g>
  ),

  // 3. หมัดอรหันต์ — arhat 3-punch flurry, motion lines
  nd5: ({ ink, accent }) => (
    <g>
      {/* three fist silhouettes overlapping */}
      <rect x={8} y={28} width={14} height={12} fill={accent} stroke={ink} strokeWidth={2} opacity={0.5} />
      <rect x={22} y={26} width={14} height={14} fill={accent} stroke={ink} strokeWidth={2} opacity={0.75} />
      <rect x={38} y={24} width={16} height={16} fill={accent} stroke={ink} strokeWidth={2} />
      {/* knuckle bumps on lead fist */}
      <line x1={42} y1={24} x2={42} y2={20} stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <line x1={46} y1={24} x2={46} y2={18} stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <line x1={50} y1={24} x2={50} y2={20} stroke={ink} strokeWidth={2} strokeLinecap="round" />
      {/* speed lines */}
      <line x1={6} y1={48} x2={24} y2={48} stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <line x1={10} y1={52} x2={28} y2={52} stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <line x1={14} y1={56} x2={26} y2={56} stroke={ink} strokeWidth={2} strokeLinecap="round" />
    </g>
  ),

  // 4. ไม้พลองพุทธธรรม — staff with dharma wheel
  sl_staff_dharma: ({ ink, accent }) => (
    <g>
      {/* diagonal staff */}
      <line x1={10} y1={54} x2={50} y2={14} stroke={ink} strokeWidth={4} strokeLinecap="round" />
      <line x1={10} y1={54} x2={50} y2={14} stroke={accent} strokeWidth={2} strokeLinecap="round" />
      {/* end caps */}
      <circle cx={10} cy={54} r={3} fill={ink} />
      <circle cx={50} cy={14} r={3} fill={ink} />
      {/* dharma wheel hub */}
      <circle cx={42} cy={42} r={11} fill={accent} stroke={ink} strokeWidth={2} />
      <circle cx={42} cy={42} r={2.5} fill={ink} />
      <line x1={42} y1={33} x2={42} y2={51} stroke={ink} strokeWidth={2} />
      <line x1={33} y1={42} x2={51} y2={42} stroke={ink} strokeWidth={2} />
      <line x1={36} y1={36} x2={48} y2={48} stroke={ink} strokeWidth={2} />
      <line x1={36} y1={48} x2={48} y2={36} stroke={ink} strokeWidth={2} />
    </g>
  ),

  // 5. ไม้พลองเส้าหลิน — Shaolin staff swept
  sl_staff_shaolin: ({ ink, accent }) => (
    <g>
      {/* curved sweep arc */}
      <path d="M 8 50 Q 32 6 56 30" fill="none" stroke={accent} strokeWidth={3} strokeLinecap="round" opacity={0.6} />
      {/* horizontal swept staff */}
      <rect x={8} y={32} width={48} height={6} fill={accent} stroke={ink} strokeWidth={2} />
      {/* metal end caps */}
      <rect x={4} y={30} width={6} height={10} fill={ink} />
      <rect x={54} y={30} width={6} height={10} fill={ink} />
      {/* grip wraps */}
      <line x1={22} y1={32} x2={22} y2={38} stroke={ink} strokeWidth={2} />
      <line x1={28} y1={32} x2={28} y2={38} stroke={ink} strokeWidth={2} />
      <line x1={36} y1={32} x2={36} y2={38} stroke={ink} strokeWidth={2} />
      <line x1={42} y1={32} x2={42} y2={38} stroke={ink} strokeWidth={2} />
      {/* motion swoosh below */}
      <path d="M 14 50 Q 32 56 50 50" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
    </g>
  ),

  // 6. วิชากรงเล็บมังกร — dragon claw, talon
  ne1: ({ ink, accent }) => (
    <g>
      {/* palm base */}
      <path d="M 18 50 Q 18 40 24 36 L 40 36 Q 46 40 46 50 Z" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* 3 curved talons */}
      <path d="M 22 36 Q 16 24 14 14" fill="none" stroke={ink} strokeWidth={3} strokeLinecap="round" />
      <path d="M 22 36 Q 18 24 18 12" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      <path d="M 32 34 Q 32 22 30 10" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      <path d="M 42 36 Q 46 24 46 12" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* talon tips */}
      <circle cx={18} cy={12} r={1.5} fill={ink} />
      <circle cx={30} cy={10} r={1.5} fill={ink} />
      <circle cx={46} cy={12} r={1.5} fill={ink} />
      {/* scale dots */}
      <circle cx={26} cy={44} r={1.5} fill={ink} />
      <circle cx={32} cy={46} r={1.5} fill={ink} />
      <circle cx={38} cy={44} r={1.5} fill={ink} />
    </g>
  ),

  // 7. ดาบอรหันต์เส้าหลิน — Shaolin straight sword + flame
  ne2: ({ ink, accent }) => (
    <g>
      {/* flame halo behind blade */}
      <path d="M 32 6 Q 24 14 28 22 Q 22 18 24 28 Q 32 16 40 28 Q 42 18 36 22 Q 40 14 32 6 Z" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* straight blade pointing down */}
      <polygon points="30,22 34,22 34,46 32,50 30,46" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* central blood groove */}
      <line x1={32} y1={24} x2={32} y2={44} stroke={ink} strokeWidth={1.5} />
      {/* crossguard */}
      <rect x={22} y={46} width={20} height={4} fill={ink} />
      {/* handle */}
      <rect x={28} y={50} width={8} height={10} fill={accent} stroke={ink} strokeWidth={2} />
      {/* pommel */}
      <circle cx={32} cy={60} r={2.5} fill={ink} />
    </g>
  ),

  // 8. กระบี่วิธีเซน — calm sword with leaf
  sl_zen_sword: ({ ink, accent }) => (
    <g>
      {/* slim blade tilted */}
      <polygon points="14,52 18,56 52,22 48,18" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* tip */}
      <polygon points="48,18 54,16 52,22" fill={ink} />
      {/* handle */}
      <rect x={8} y={50} width={10} height={4} fill={ink} transform="rotate(-45 13 52)" />
      {/* zen leaf at top */}
      <path d="M 44 8 Q 56 8 54 22 Q 44 22 44 8 Z" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      <line x1={45} y1={10} x2={52} y2={20} stroke={ink} strokeWidth={1.5} />
      {/* falling leaf detail */}
      <ellipse cx={20} cy={20} rx={4} ry={2} fill={accent} stroke={ink} strokeWidth={1.5} transform="rotate(-30 20 20)" />
    </g>
  ),

  // 9. ฝ่ามือโพธิสัตว์ — open compassionate palm with bodhi leaf
  sl_bodhi_palm: ({ ink, accent }) => (
    <g>
      {/* open palm */}
      <path d="M 18 56 L 18 32 Q 18 28 22 28 Q 22 18 26 18 Q 26 16 28 16 L 28 30 L 30 30 L 30 12 Q 30 10 32 10 Q 34 10 34 12 L 34 30 L 36 30 L 36 16 Q 36 14 38 14 Q 40 14 40 16 L 40 30 L 42 30 L 42 22 Q 42 20 44 20 Q 46 20 46 22 L 46 36 Q 46 56 32 56 Z" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* bodhi leaf at top */}
      <path d="M 32 4 Q 24 8 26 16 Q 32 12 38 16 Q 40 8 32 4 Z" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      <line x1={32} y1={6} x2={32} y2={14} stroke={ink} strokeWidth={1.5} />
      {/* palm chakra dot */}
      <circle cx={32} cy={42} r={3} fill={ink} />
    </g>
  ),

  // 10. ดัชนีเด็ดบุปผา — single finger plucking flower petal
  sl_petal_finger: ({ ink, accent }) => (
    <g>
      {/* hand base */}
      <path d="M 14 56 L 14 38 Q 14 34 18 34 L 30 34 Q 30 28 32 28 Q 34 28 34 34 L 38 34 Q 38 30 40 30 Q 42 30 42 34 L 42 56 Z" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* extended index finger pointing up */}
      <rect x={30} y={10} width={6} height={20} fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* fingertip dot */}
      <circle cx={33} cy={10} r={2} fill={ink} />
      {/* flower petal being plucked */}
      <path d="M 44 8 Q 52 6 54 14 Q 50 18 44 14 Z" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* falling petal */}
      <path d="M 48 24 Q 54 22 56 28 Q 52 32 48 28 Z" fill="none" stroke={ink} strokeWidth={1.5} strokeLinejoin="round" />
    </g>
  ),

  // 11. หมัดทลายผา — fist crushing rock, debris
  sl_rock_punch: ({ ink, accent }) => (
    <g>
      {/* fist coming down from top */}
      <rect x={20} y={8} width={24} height={20} fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      <line x1={26} y1={8} x2={26} y2={14} stroke={ink} strokeWidth={2} />
      <line x1={32} y1={8} x2={32} y2={14} stroke={ink} strokeWidth={2} />
      <line x1={38} y1={8} x2={38} y2={14} stroke={ink} strokeWidth={2} />
      {/* impact crack lines */}
      <line x1={32} y1={28} x2={32} y2={36} stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={32} y1={36} x2={26} y2={42} stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={32} y1={36} x2={38} y2={44} stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
      {/* shattered rock chunks */}
      <polygon points="8,52 16,46 22,54 14,58" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      <polygon points="42,50 52,44 58,52 48,58" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* debris specks */}
      <circle cx={12} cy={42} r={1.5} fill={ink} />
      <circle cx={52} cy={38} r={1.5} fill={ink} />
      <circle cx={32} cy={52} r={2} fill={ink} />
    </g>
  ),

  // 12. อรหันต์พันกร — many arms radiating, thousand-arm Buddha
  sl_thousand_arms: ({ ink, accent }) => (
    <g>
      {/* central head/body */}
      <circle cx={32} cy={32} r={9} fill={accent} stroke={ink} strokeWidth={2} />
      {/* radiating arms — 8 directions */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const r = (deg * Math.PI) / 180;
        const x1 = 32 + Math.cos(r) * 9;
        const y1 = 32 + Math.sin(r) * 9;
        const x2 = 32 + Math.cos(r) * 22;
        const y2 = 32 + Math.sin(r) * 22;
        const fx = 32 + Math.cos(r) * 26;
        const fy = 32 + Math.sin(r) * 26;
        return (
          <g key={deg}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={ink} strokeWidth={3} strokeLinecap="round" />
            <circle cx={fx} cy={fy} r={3} fill={accent} stroke={ink} strokeWidth={2} />
          </g>
        );
      })}
      {/* center dot */}
      <circle cx={32} cy={32} r={2.5} fill={ink} />
    </g>
  ),

  // 13. ไม้เท้าสัจธรรม — heavy staff with sutra scroll, lightning
  sl_truth_staff: ({ ink, accent }) => (
    <g>
      {/* vertical heavy staff */}
      <rect x={28} y={6} width={8} height={52} fill={accent} stroke={ink} strokeWidth={2} />
      {/* head ornament */}
      <circle cx={32} cy={10} r={5} fill={accent} stroke={ink} strokeWidth={2} />
      {/* scroll wrapped around middle */}
      <rect x={20} y={26} width={24} height={12} fill={accent} stroke={ink} strokeWidth={2} />
      <line x1={24} y1={30} x2={40} y2={30} stroke={ink} strokeWidth={1.5} />
      <line x1={24} y1={34} x2={40} y2={34} stroke={ink} strokeWidth={1.5} />
      {/* scroll roll edges */}
      <circle cx={20} cy={32} r={3} fill={ink} />
      <circle cx={44} cy={32} r={3} fill={ink} />
      {/* lightning bolt */}
      <polygon points="48,42 54,42 50,50 56,50 46,60 50,52 44,52" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* foot cap */}
      <rect x={26} y={56} width={12} height={4} fill={ink} />
    </g>
  ),

  // 14. ไทจี้เจี้ยน — taiji sword with yin-yang
  tj: ({ ink, accent }) => (
    <g>
      {/* yin-yang circle behind */}
      <circle cx={20} cy={22} r={11} fill="none" stroke={ink} strokeWidth={2} />
      <path d="M 20 11 A 11 11 0 0 1 20 33 A 5.5 5.5 0 0 1 20 22 A 5.5 5.5 0 0 0 20 11 Z" fill={ink} />
      <circle cx={20} cy={16.5} r={1.5} fill={accent} />
      <circle cx={20} cy={27.5} r={1.5} fill={accent} />
      {/* slim diagonal sword */}
      <polygon points="50,52 54,56 30,32 26,36" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      <polygon points="50,52 58,52 56,56 54,56" fill={ink} />
      {/* crossguard */}
      <line x1={22} y1={28} x2={28} y2={34} stroke={ink} strokeWidth={3} strokeLinecap="round" />
      {/* handle + tassel */}
      <rect x={22} y={36} width={4} height={10} fill={ink} transform="rotate(-45 24 41)" />
      <circle cx={18} cy={42} r={2} fill={accent} stroke={ink} strokeWidth={1.5} />
    </g>
  ),

  // 15. สะท้อนพลัง — palm reflecting energy back
  rf: ({ ink, accent }) => (
    <g>
      {/* defensive palm facing right */}
      <path d="M 14 14 L 14 50 Q 14 54 18 54 L 22 54 L 22 18 Q 22 14 26 14 L 30 14 L 30 50 Q 30 54 26 54 Z M 30 22 L 30 46 Q 30 50 34 50 L 36 50 L 36 28 L 32 28" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      {/* incoming energy waves bouncing right */}
      <path d="M 38 24 Q 50 28 38 32" fill="none" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
      <path d="M 42 32 Q 56 36 42 40" fill="none" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
      <path d="M 38 40 Q 50 44 38 48" fill="none" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
      {/* impact spark on palm */}
      <circle cx={34} cy={32} r={3} fill={accent} stroke={ink} strokeWidth={2} />
    </g>
  ),

  // 16. ก้าวเมฆหมอก — wispy cloud-step footprint
  cs: ({ ink, accent }) => (
    <g>
      {/* footprint */}
      <ellipse cx={32} cy={42} rx={10} ry={14} fill={accent} stroke={ink} strokeWidth={2} />
      {/* toes */}
      <circle cx={26} cy={28} r={2.5} fill={accent} stroke={ink} strokeWidth={1.5} />
      <circle cx={31} cy={26} r={2.5} fill={accent} stroke={ink} strokeWidth={1.5} />
      <circle cx={36} cy={26} r={2.5} fill={accent} stroke={ink} strokeWidth={1.5} />
      <circle cx={40} cy={28} r={2.5} fill={accent} stroke={ink} strokeWidth={1.5} />
      {/* cloud wisps below foot */}
      <path d="M 8 56 Q 12 50 18 54 Q 22 48 30 54 Q 36 48 42 54 Q 50 50 56 56" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <path d="M 14 60 Q 22 56 32 60 Q 42 56 50 60" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
      {/* swirl above foot */}
      <path d="M 44 16 Q 52 16 52 22 Q 52 14 44 14" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
    </g>
  ),

  // 17. หยิน-หยางฝ่า — yin-yang palm split black/white
  yy: ({ ink, accent }) => (
    <g>
      {/* large yin-yang circle */}
      <circle cx={32} cy={32} r={24} fill={accent} stroke={ink} strokeWidth={2} />
      {/* the S-curve and dark half */}
      <path d="M 32 8 A 24 24 0 0 1 32 56 A 12 12 0 0 1 32 32 A 12 12 0 0 0 32 8 Z" fill={ink} />
      {/* eye dots */}
      <circle cx={32} cy={20} r={3} fill={accent} />
      <circle cx={32} cy={44} r={3} fill={ink} stroke={accent} strokeWidth={1.5} />
      {/* palm overlay — small palm in center */}
      <path d="M 28 30 L 28 38 L 36 38 L 36 30 Z" fill="none" stroke={accent} strokeWidth={1.5} />
    </g>
  ),

  // 18. เก้ากระบี่เดียวดาย — 9 sword silhouettes radiating
  dgjj: ({ ink, accent }) => (
    <g>
      {/* 9 swords radiating from center */}
      {Array.from({ length: 9 }).map((_, i) => {
        const angle = (i * 360) / 9 - 90;
        const r = (angle * Math.PI) / 180;
        const cx = 32 + Math.cos(r) * 4;
        const cy = 32 + Math.sin(r) * 4;
        const tx = 32 + Math.cos(r) * 26;
        const ty = 32 + Math.sin(r) * 26;
        return (
          <g key={i}>
            <line x1={cx} y1={cy} x2={tx} y2={ty} stroke={ink} strokeWidth={3} strokeLinecap="round" />
            <line x1={cx} y1={cy} x2={tx} y2={ty} stroke={accent} strokeWidth={1.5} strokeLinecap="round" />
          </g>
        );
      })}
      {/* center hub */}
      <circle cx={32} cy={32} r={5} fill={accent} stroke={ink} strokeWidth={2} />
      <circle cx={32} cy={32} r={1.5} fill={ink} />
    </g>
  ),

  // 19. กระบี่ชวนจินก่า — Quanzhen sword with three trigrams
  qzjf: ({ ink, accent }) => (
    <g>
      {/* vertical sword centered */}
      <polygon points="30,8 34,8 34,42 32,46 30,42" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      <line x1={32} y1={10} x2={32} y2={42} stroke={ink} strokeWidth={1.5} />
      {/* crossguard */}
      <rect x={22} y={42} width={20} height={3} fill={ink} />
      {/* handle */}
      <rect x={28} y={45} width={8} height={9} fill={accent} stroke={ink} strokeWidth={2} />
      {/* pommel */}
      <circle cx={32} cy={56} r={3} fill={ink} />
      {/* three trigram bars left of blade — qian (heaven) */}
      <line x1={10} y1={18} x2={22} y2={18} stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={10} y1={24} x2={22} y2={24} stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={10} y1={30} x2={22} y2={30} stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
      {/* three trigram bars right — kun (earth, broken) */}
      <line x1={42} y1={18} x2={47} y2={18} stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={49} y1={18} x2={54} y2={18} stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={42} y1={24} x2={47} y2={24} stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={49} y1={24} x2={54} y2={24} stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={42} y1={30} x2={47} y2={30} stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
      <line x1={49} y1={30} x2={54} y2={30} stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
    </g>
  ),

  // 20. หมัดชวนจินก่า — Quanzhen punch with three trigrams
  qz_punch: ({ ink, accent }) => (
    <g>
      {/* fist on right */}
      <rect x={32} y={28} width={20} height={18} fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
      <line x1={38} y1={28} x2={38} y2={22} stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <line x1={44} y1={28} x2={44} y2={20} stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <line x1={50} y1={28} x2={50} y2={22} stroke={ink} strokeWidth={2} strokeLinecap="round" />
      <circle cx={38} cy={22} r={2.5} fill={accent} stroke={ink} strokeWidth={2} />
      <circle cx={44} cy={20} r={2.5} fill={accent} stroke={ink} strokeWidth={2} />
      <circle cx={50} cy={22} r={2.5} fill={accent} stroke={ink} strokeWidth={2} />
      {/* wrist */}
      <rect x={34} y={46} width={16} height={6} fill={accent} stroke={ink} strokeWidth={2} />
      {/* trigram bars on left side — solid (heaven), broken (earth alt) */}
      <line x1={8} y1={18} x2={26} y2={18} stroke={ink} strokeWidth={3} strokeLinecap="round" />
      <line x1={8} y1={26} x2={15} y2={26} stroke={ink} strokeWidth={3} strokeLinecap="round" />
      <line x1={19} y1={26} x2={26} y2={26} stroke={ink} strokeWidth={3} strokeLinecap="round" />
      <line x1={8} y1={34} x2={26} y2={34} stroke={ink} strokeWidth={3} strokeLinecap="round" />
      {/* qi swirl between trigram and fist */}
      <path d="M 26 42 Q 30 38 30 44 Q 30 50 24 50" fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
    </g>
  ),
};

Object.assign(SKILL_ICON_OVERRIDES, BATCH);

// Raster (PNG) overrides — drop hand-painted / AI-generated art into
// public/icons/skills/<id>.png and register the path here. The raster
// renders inside the tier frame, so type accents + multi-hit badge
// still layer on top.
Object.assign(SKILL_ICON_RASTER, {
  lmsj: "/icons/skills/lmsj.png", // กระบี่ 6 ชีพจร
  ep: "/icons/skills/ep.png",     // 18 ฝ่ามือมังกร
});
