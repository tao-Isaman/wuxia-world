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
  sf: "/icons/skills/sf.png", // หมัดเส้าหลิน
  sl_long_dharma: "/icons/skills/sl_long_dharma.png", // หมัดยาวพุทธธรรม
  nd5: "/icons/skills/nd5.png", // หมัดอรหันต์
  sl_staff_dharma: "/icons/skills/sl_staff_dharma.png", // ไม้พลองพุทธธรรม
  sl_staff_shaolin: "/icons/skills/sl_staff_shaolin.png", // ไม้พลองเส้าหลิน
  ne1: "/icons/skills/ne1.png", // วิชากรงเล็บมังกร
  ne2: "/icons/skills/ne2.png", // ดาบอรหันต์เส้าหลิน
  sl_zen_sword: "/icons/skills/sl_zen_sword.png", // กระบี่วิธีเซน
  sl_bodhi_palm: "/icons/skills/sl_bodhi_palm.png", // ฝ่ามือโพธิสัตว์
  sl_petal_finger: "/icons/skills/sl_petal_finger.png", // ดัชนีเด็ดบุปผา
  sl_rock_punch: "/icons/skills/sl_rock_punch.png", // หมัดทลายผา
  sl_thousand_arms: "/icons/skills/sl_thousand_arms.png", // อรหันต์พันกร
  sl_truth_staff: "/icons/skills/sl_truth_staff.png", // ไม้เท้าสัจธรรม
  tj: "/icons/skills/tj.png", // ไทจี้เจี้ยน
  rf: "/icons/skills/rf.png", // สะท้อนพลัง
  cs: "/icons/skills/cs.png", // ก้าวเมฆหมอก
  wd_taiji_sword: "/icons/skills/wd_taiji_sword.png", // กระบี่ไทเก๊ก
  yy: "/icons/skills/yy.png", // หยิน-หยางฝ่า
  wd_yinyang_sword: "/icons/skills/wd_yinyang_sword.png", // กระบี่หยินหยาง
  wd_cloud_palm: "/icons/skills/wd_cloud_palm.png", // หมัดเคลื่อนเมฆา
  wd_cloud_sword: "/icons/skills/wd_cloud_sword.png", // กระบี่เคลื่อนเมฆา
  wd_heaven_sword: "/icons/skills/wd_heaven_sword.png", // กระบี่เหนือฟ้า
  wd_taiji_fist: "/icons/skills/wd_taiji_fist.png", // เพลงหมัดไทเก๊ก
  em_graceful_sword: "/icons/skills/em_graceful_sword.png", // กระบี่อ่อนช้อย
  em_blossom_sword: "/icons/skills/em_blossom_sword.png", // กระบี่ดอกบุปผา
  em_heart_sword: "/icons/skills/em_heart_sword.png", // กระบี่รักษาใจ
  em_heart_palm: "/icons/skills/em_heart_palm.png", // ฝ่ามือรักษาใจ
  em_lotus_palm: "/icons/skills/em_lotus_palm.png", // ฝ่ามือดอกบัวบาน
  em_buddha_sword: "/icons/skills/em_buddha_sword.png", // กระบี่วิธีพุทธ
  em_plum_sword: "/icons/skills/em_plum_sword.png", // กระบี่ดอกเหมย
  em_bodhi_palm: "/icons/skills/em_bodhi_palm.png", // ฝ่ามือโพธิสัตว์ง้อไบ๊
  em_bodhi_sword: "/icons/skills/em_bodhi_sword.png", // กระบี่พิทักษ์โพธิสัตว์
  hs_basic_sword: "/icons/skills/hs_basic_sword.png", // กระบี่หัวซาน
  hs_floating_cloud: "/icons/skills/hs_floating_cloud.png", // กระบี่เมฆาล่องลอย
  hs_purple_cloud: "/icons/skills/hs_purple_cloud.png", // กระบี่เมฆาม่วง
  ssh_basic_sword: "/icons/skills/ssh_basic_sword.png", // กระบี่เหล็กซงซาน
  ssh_iron_strike: "/icons/skills/ssh_iron_strike.png", // เพลงกระบี่ตีเหล็ก
  ssh_central_blade: "/icons/skills/ssh_central_blade.png", // กระบี่ยอดเขากลาง
  ssh_song_pillar: "/icons/skills/ssh_song_pillar.png", // กระบี่เสาภูผาซงซาน
  tsh_basic_sword: "/icons/skills/tsh_basic_sword.png", // กระบี่ไท่ซาน
  tsh_dawn_strike: "/icons/skills/tsh_dawn_strike.png", // กระบี่อรุณรุ่ง
  tsh_east_blade: "/icons/skills/tsh_east_blade.png", // กระบี่บูรพาส่อง
  tsh_sun_pierce: "/icons/skills/tsh_sun_pierce.png", // กระบี่ทะลวงสุริยัน
  hgs_basic_sword: "/icons/skills/hgs_basic_sword.png", // กระบี่เฮิงซาน
  hgs_dancing_step: "/icons/skills/hgs_dancing_step.png", // กระบี่ระบำเริงรำ
  hgs_five_peaks: "/icons/skills/hgs_five_peaks.png", // กระบี่ห้ายอด
  hgs_swift_blade: "/icons/skills/hgs_swift_blade.png", // กระบี่ลมรวดเร็ว
  hgn_basic_sword: "/icons/skills/hgn_basic_sword.png", // กระบี่ธรรมเหิงซาน
  hgn_dharma_guard: "/icons/skills/hgn_dharma_guard.png", // กระบี่อารักษ์ธรรม
  hgn_iron_robe: "/icons/skills/hgn_iron_robe.png", // กระบี่จีวรเหล็ก
  hgn_mirror_blade: "/icons/skills/hgn_mirror_blade.png", // กระบี่กระจกธรรม
  qz_heavy_sword: "/icons/skills/qz_heavy_sword.png", // กระบี่หนักชวนจิน
  qz_hot_sword: "/icons/skills/qz_hot_sword.png", // กระบี่ร้อนชวนจิน
  qzjf: "/icons/skills/qzjf.png", // กระบี่ชวนจินก่า
  qz_punch: "/icons/skills/qz_punch.png", // หมัดชวนจินก่า
  qz_sun_fist: "/icons/skills/qz_sun_fist.png", // หมัดสุริยัน
  qz_sun_sword: "/icons/skills/qz_sun_sword.png", // กระบี่สะกดสุริยันต์
  gm_sword: "/icons/skills/gm_sword.png", // กระบี่สุสานโบราณ
  ynss: "/icons/skills/ynss.png", // เพลงกระบี่สุรางคนางค์ใจพิสุทธิ์
  ansh: "/icons/skills/ansh.png", // ฝ่ามือกำสรดวิญญาณสลาย
  nc1: "/icons/skills/nc1.png", // ประกาศิตพรรคยาจก
  nc2: "/icons/skills/nc2.png", // ไม้เท้าขอทาน
  bg_snake_fist: "/icons/skills/bg_snake_fist.png", // เพลงหมัดอสรพิษคนจร
  bg_snake_staff: "/icons/skills/bg_snake_staff.png", // ไม้เท้าอสรพิษคนจร
  bg_drift_staff: "/icons/skills/bg_drift_staff.png", // ไม้เท้าล่องลอย
  bg_drift_fist: "/icons/skills/bg_drift_fist.png", // เพลงหมัดล่องลอย
  bg_wander_staff: "/icons/skills/bg_wander_staff.png", // ไม้เท้าพเนจร
  ng3: "/icons/skills/ng3.png", // ฝ่ามือจับมังกร
  ep: "/icons/skills/ep.png", // 18 ฝ่ามือมังกร
  bg_lucky_staff: "/icons/skills/bg_lucky_staff.png", // เพลงไม้เท้าตีสุข
  mi_firepalm: "/icons/skills/mi_firepalm.png", // ฝ่ามือเพลิง
  xy_lesserdemon_blade: "/icons/skills/xy_lesserdemon_blade.png", // ดาบอสูรน้อย
  xy_pathless_sword: "/icons/skills/xy_pathless_sword.png", // กระบี่ไร้วิถี
  xy_lesserdemon_fist: "/icons/skills/xy_lesserdemon_fist.png", // หมัดอสูรน้อย
  xy_demon_wind_sword: "/icons/skills/xy_demon_wind_sword.png", // กระบี่ลมอสูร
  xy_root_poison_fist: "/icons/skills/xy_root_poison_fist.png", // หมัดรากพิษ
  xy_punch: "/icons/skills/xy_punch.png", // เพลงหมัดสราญรมย์
  yxjf: "/icons/skills/yxjf.png", // กระบี่ขลุ่ยหยก
  xy_palm: "/icons/skills/xy_palm.png", // ฝ่ามือสราญรมย์
  xx_palm: "/icons/skills/xx_palm.png", // ฝ่ามือพิษสลายพลัง
  wd_palm: "/icons/skills/wd_palm.png", // ฝ่ามือพิษห้าธาตุ
  bs: "/icons/skills/bs.png", // ดาบอสุรี
  nf6: "/icons/skills/nf6.png", // ดาบยาวสีเลือด
  jy_chain: "/icons/skills/jy_chain.png", // โซ่กรงเล็บฝึกหัด
  jy_blade: "/icons/skills/jy_blade.png", // ดาบราชสำนัก
  jy_eagleclaw: "/icons/skills/jy_eagleclaw.png", // กรงเล็บอินทรี
  jy_grapple: "/icons/skills/jy_grapple.png", // กรงเล็บคว้าจับ
  jy_sword: "/icons/skills/jy_sword.png", // กระบี่จารบุรุษ
  jy_chainmaster: "/icons/skills/jy_chainmaster.png", // โซ่ทองเก้ามังกร
  jy_blade_king: "/icons/skills/jy_blade_king.png", // ดาบเจ้าพระยา
  jy_execution_sword: "/icons/skills/jy_execution_sword.png", // กระบี่สำเร็จโทษ
  jy_execution_blade: "/icons/skills/jy_execution_blade.png", // ดาบประหารชีพ
  jy_chain_assassin: "/icons/skills/jy_chain_assassin.png", // โซ่ล่าสังหาร
  tang_basic_knife: "/icons/skills/tang_basic_knife.png", // มีดบินพื้นฐาน
  tang_poison_knife: "/icons/skills/tang_poison_knife.png", // มีดบินเคลือบพิษ
  tang_starscatter: "/icons/skills/tang_starscatter.png", // ดารากระจายฟ้า
  tang_meteorpierce: "/icons/skills/tang_meteorpierce.png", // ดาวตกแหวกฟ้า
  tang_viperblade: "/icons/skills/tang_viperblade.png", // มีดสั้นร้อยอสรพิษ
  tang_goldsnake: "/icons/skills/tang_goldsnake.png", // มีดสั้นงูทอง
  tang_starrain: "/icons/skills/tang_starrain.png", // ดาราพิรุณโปรย
  tang_heartpierce: "/icons/skills/tang_heartpierce.png", // มีดสั้นทะลวงใจ
  basic_punch: "/icons/skills/basic_punch.png", // หมัดตรง
  qf: "/icons/skills/qf.png", // ชิงเฟิงเจี้ยน
  dg: "/icons/skills/dg.png", // ดามอกุน
  gn: "/icons/skills/gn.png", // เข็มทอง
  ns1: "/icons/skills/ns1.png", // กระบี่เบื้องต้น
  ns2: "/icons/skills/ns2.png", // ขอเกี่ยวเบื้องต้น
  nc3: "/icons/skills/nc3.png", // กระบี่น้ำ
  nc4: "/icons/skills/nc4.png", // ฝ่ามือเมฆ
  nc5: "/icons/skills/nc5.png", // ทวนเบื้องต้น
  nc6: "/icons/skills/nc6.png", // กระบองสั้น
  nc7: "/icons/skills/nc7.png", // ดาบยาวพื้นฐาน
  nc8: "/icons/skills/nc8.png", // แส้เบื้องต้น
  nc9: "/icons/skills/nc9.png", // พัดพื้นฐาน
  nc10: "/icons/skills/nc10.png", // ขอเกี่ยวพื้นฐาน
  bst_bite: "/icons/skills/bst_bite.png", // เขี้ยวงับ
  bst_claw: "/icons/skills/bst_claw.png", // กรงเล็บฉีก
  bst_charge: "/icons/skills/bst_charge.png", // พุ่งเข้าชน
  ig: "/icons/skills/ig.png", // หมัดเกราะเพชร
  dp: "/icons/skills/dp.png", // ฝ่ามือมังกร
  pn: "/icons/skills/pn.png", // เข็มพิษ
  nm1: "/icons/skills/nm1.png", // ดาบน้ำค้าง
  nm2: "/icons/skills/nm2.png", // ฝ่ามือเกราะ
  nd1: "/icons/skills/nd1.png", // แส้แปดทิศ
  nd2: "/icons/skills/nd2.png", // พัดนกยูง
  nd3: "/icons/skills/nd3.png", // ดาบดาวเหนือ
  nd4: "/icons/skills/nd4.png", // ทวนลม
  nd6: "/icons/skills/nd6.png", // กระบี่หยาง
  nd7: "/icons/skills/nd7.png", // ฝ่ามือเสือ
  nd8: "/icons/skills/nd8.png", // แส้เหล็กดูดชีพ
  nd9: "/icons/skills/nd9.png", // เข็มตีจุด
  nd10: "/icons/skills/nd10.png", // กรงเล็บเพลิง
  nd11: "/icons/skills/nd11.png", // กระบี่ลม
  nd12: "/icons/skills/nd12.png", // ฝ่ามือสร้างกำแพง
  bst_pounce: "/icons/skills/bst_pounce.png", // ตะปบโหม
  bst_fang: "/icons/skills/bst_fang.png", // เขี้ยวพิษอ่อน
  bst_roar: "/icons/skills/bst_roar.png", // คำรามขู่
  ne8: "/icons/skills/ne8.png", // หมัดเมา
  ws: "/icons/skills/ws.png", // สองดาบล่องลม
  sa: "/icons/skills/sa.png", // คีตาอาคม
  fs: "/icons/skills/fs.png", // กระบองเพลิง
  ch: "/icons/skills/ch.png", // โซ่เกี่ยวสังหาร
  na1: "/icons/skills/na1.png", // กระบี่ดาวเหนือ
  na2: "/icons/skills/na2.png", // หมัดมวยจีน
  ne3: "/icons/skills/ne3.png", // ทวนหมุนฟ้า
  ne4: "/icons/skills/ne4.png", // ดอกบัวนพรัตน์
  ne5: "/icons/skills/ne5.png", // กระบี่วิ่งบนน้ำ
  ne6: "/icons/skills/ne6.png", // แส้ทะลุปราการ
  ne7: "/icons/skills/ne7.png", // ฝ่ามือน้ำแข็ง
  ne9: "/icons/skills/ne9.png", // ดาบยาวมังกร
  ne10: "/icons/skills/ne10.png", // พลองลม
  ne11: "/icons/skills/ne11.png", // กรงเล็บสิงห์
  ne12: "/icons/skills/ne12.png", // กระบี่เก้าฟ้า
  ne13: "/icons/skills/ne13.png", // ทวนหยินหยาง
  bst_maul: "/icons/skills/bst_maul.png", // ฉีกตะปบ
  bst_venom: "/icons/skills/bst_venom.png", // เขี้ยวพิษแรง
  bst_constrict: "/icons/skills/bst_constrict.png", // บีบรัด
  zs: "/icons/skills/zs.png", // กู่ฉินสะท้านจิต
  nh1: "/icons/skills/nh1.png", // พลองเทวดา
  nh2: "/icons/skills/nh2.png", // กระบี่วิเศษ
  yyz: "/icons/skills/yyz.png", // ดัชนีเอกสุริยัน
  nf1: "/icons/skills/nf1.png", // กู่ฉินสังหาร
  nf2: "/icons/skills/nf2.png", // ดาบโดดเดี่ยว
  nf3: "/icons/skills/nf3.png", // ทวนประทับมังกร
  nf4: "/icons/skills/nf4.png", // ฝ่ามือยมฑูต
  nf5: "/icons/skills/nf5.png", // หมัดเพลิง
  nf7: "/icons/skills/nf7.png", // แส้เก้าหัว
  nf8: "/icons/skills/nf8.png", // พัดเพลิงสวรรค์
  lmsj: "/icons/skills/lmsj.png", // กระบี่ 6 ชีพจร
  ft: "/icons/skills/ft.png", // ขลุ่ยสะท้านฟ้า
  nu1: "/icons/skills/nu1.png", // มังกรฟ้า
  nu2: "/icons/skills/nu2.png", // หมัดสะท้านจักรวาล
  ng1: "/icons/skills/ng1.png", // เก้าฟ้าหนึ่งกระบี่
  ng2: "/icons/skills/ng2.png", // ทวนประจักษ์พยาน
  dgjj: "/icons/skills/dgjj.png", // เก้ากระบี่เดียวดาย
  ng4: "/icons/skills/ng4.png", // หมัดพระอินทร์
  ng5: "/icons/skills/ng5.png", // ดาบยาวเทพสังหาร
  ng6: "/icons/skills/ng6.png", // ขลุ่ยพลิกโลก
});
