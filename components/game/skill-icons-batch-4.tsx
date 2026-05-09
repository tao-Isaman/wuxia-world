import type { IconRenderer } from "./skill-icons-registry";
import { SKILL_ICON_OVERRIDES } from "./skill-icons-registry";

// ─── Batch 4: Jianghu T1 + T2 + beasts T1 ────────────────────────────
// Hand-drawn glyphs that replace the generic weapon icon. Frame +
// background + type accents are still drawn by SkillIcon, so these
// renderers only need to fill the inner 4..60 area.

const BATCH: Record<string, IconRenderer> = {
  // ── ig หมัดเกราะเพชร — diamond armor fist (defensive shield) ────────
  ig: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* shield body */}
      <path
        d="M 32 8 L 52 16 L 52 34 Q 52 50 32 58 Q 12 50 12 34 L 12 16 Z"
        fill={accent}
      />
      {/* diamond facet inside */}
      <polygon
        points="32,18 44,32 32,46 20,32"
        fill="#fff"
        opacity="0.6"
        stroke={ink}
        strokeWidth="1.5"
      />
      <line x1="32" y1="18" x2="32" y2="46" stroke={ink} strokeWidth="1" />
      <line x1="20" y1="32" x2="44" y2="32" stroke={ink} strokeWidth="1" />
      {/* tiny knuckle dots at base of diamond */}
      <circle cx="26" cy="36" r="1.5" fill={ink} />
      <circle cx="32" cy="38" r="1.5" fill={ink} />
      <circle cx="38" cy="36" r="1.5" fill={ink} />
    </g>
  ),

  // ── dp ฝ่ามือมังกร — small dragon palm ──────────────────────────────
  dp: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* open palm */}
      <path
        d="M 18 30 Q 16 22 22 20 L 26 22 L 28 16 L 32 16 L 32 24 L 36 14 L 40 16 L 38 26 L 44 18 L 48 22 L 42 32 L 46 36 Q 46 50 32 54 Q 18 50 18 38 Z"
        fill={accent}
      />
      {/* dragon-head emblem on the palm */}
      <circle cx="32" cy="40" r="6" fill={ink} />
      <circle cx="30" cy="38" r="1.2" fill="#fff" />
      <circle cx="34" cy="38" r="1.2" fill="#fff" />
      <path
        d="M 28 42 Q 32 46 36 42"
        fill="none"
        stroke="#fff"
        strokeWidth="1.2"
      />
      {/* horn flicks */}
      <line x1="28" y1="34" x2="26" y2="30" stroke={ink} strokeWidth="1.5" />
      <line x1="36" y1="34" x2="38" y2="30" stroke={ink} strokeWidth="1.5" />
    </g>
  ),

  // ── pn เข็มพิษ — single poison needle with green drip ──────────────
  pn: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* the needle body */}
      <line x1="22" y1="14" x2="46" y2="38" stroke={accent} strokeWidth="5" />
      <line x1="22" y1="14" x2="46" y2="38" stroke={ink} strokeWidth="1.5" />
      {/* sharp tip */}
      <polygon points="46,38 50,38 48,42" fill={ink} />
      {/* eyelet at the back */}
      <circle cx="20" cy="12" r="3" fill="none" stroke={ink} strokeWidth="2" />
      {/* venom drips falling */}
      <path
        d="M 44 44 Q 42 48 44 52 Q 46 48 44 44 Z"
        fill="#22c55e"
        stroke={ink}
        strokeWidth="1"
      />
      <path
        d="M 36 46 Q 34 50 36 54 Q 38 50 36 46 Z"
        fill="#22c55e"
        stroke={ink}
        strokeWidth="1"
      />
      <circle cx="40" cy="56" r="2" fill="#22c55e" stroke={ink} strokeWidth="1" />
    </g>
  ),

  // ── nm1 ดาบน้ำค้าง — dewdrop blade with water droplet ───────────────
  nm1: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* curved dao blade */}
      <path
        d="M 18 14 Q 50 18 48 42 L 38 42 Q 36 22 18 18 Z"
        fill={accent}
      />
      {/* blade highlight */}
      <path
        d="M 22 18 Q 40 22 42 38"
        fill="none"
        stroke="#fff"
        strokeWidth="1"
        opacity="0.8"
      />
      {/* hilt */}
      <rect x="36" y="42" width="6" height="8" fill={ink} />
      <rect x="34" y="50" width="10" height="3" fill={accent} />
      {/* dew drop falling off the tip */}
      <path
        d="M 26 32 Q 22 38 24 44 Q 28 40 26 32 Z"
        fill="#7dd3fc"
        stroke={ink}
        strokeWidth="1.5"
      />
      <circle cx="22" cy="50" r="2.5" fill="#7dd3fc" stroke={ink} strokeWidth="1" />
      <circle cx="14" cy="46" r="1.5" fill="#7dd3fc" stroke={ink} strokeWidth="1" />
    </g>
  ),

  // ── nm2 ฝ่ามือเกราะ — armored palm with shield motif ───────────────
  nm2: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* palm */}
      <rect x="18" y="22" width="28" height="22" fill={accent} />
      <rect x="20" y="20" width="24" height="4" fill={accent} />
      {/* fingers */}
      <rect x="20" y="20" width="3" height="2" fill={ink} />
      <rect x="26" y="18" width="3" height="4" fill={ink} />
      <rect x="32" y="18" width="3" height="4" fill={ink} />
      <rect x="38" y="18" width="3" height="4" fill={ink} />
      {/* armor plate / shield emblem on palm */}
      <path
        d="M 32 26 L 40 30 L 40 38 Q 40 44 32 46 Q 24 44 24 38 L 24 30 Z"
        fill="#fff"
        opacity="0.7"
        stroke={ink}
        strokeWidth="1.5"
      />
      <line x1="32" y1="26" x2="32" y2="46" stroke={ink} strokeWidth="1" />
      <line x1="24" y1="36" x2="40" y2="36" stroke={ink} strokeWidth="1" />
      {/* armor rivets */}
      <circle cx="22" cy="44" r="1.2" fill={ink} />
      <circle cx="42" cy="44" r="1.2" fill={ink} />
    </g>
  ),

  // ── nd1 แส้แปดทิศ — whip striking 8 directions (compass star) ──────
  nd1: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* central handle */}
      <circle cx="32" cy="32" r="5" fill={ink} />
      <circle cx="32" cy="32" r="2" fill={accent} />
      {/* 8 whip lashes radiating */}
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i * Math.PI) / 4;
        const x1 = 32 + Math.cos(a) * 7;
        const y1 = 32 + Math.sin(a) * 7;
        const x2 = 32 + Math.cos(a) * 22;
        const y2 = 32 + Math.sin(a) * 22;
        // tip arrowhead
        const tx = 32 + Math.cos(a) * 26;
        const ty = 32 + Math.sin(a) * 26;
        const px1 = 32 + Math.cos(a + 0.3) * 22;
        const py1 = 32 + Math.sin(a + 0.3) * 22;
        const px2 = 32 + Math.cos(a - 0.3) * 22;
        const py2 = 32 + Math.sin(a - 0.3) * 22;
        return (
          <g key={i}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={accent}
              strokeWidth="3"
            />
            <polygon points={`${tx},${ty} ${px1},${py1} ${px2},${py2}`} fill={ink} />
          </g>
        );
      })}
    </g>
  ),

  // ── nd2 พัดนกยูง — peacock-feather fan ─────────────────────────────
  nd2: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* fan body */}
      <path
        d="M 32 50 L 12 22 Q 32 12 52 22 Z"
        fill={accent}
      />
      {/* ribs */}
      <line x1="32" y1="50" x2="16" y2="24" stroke={ink} strokeWidth="1" />
      <line x1="32" y1="50" x2="24" y2="18" stroke={ink} strokeWidth="1" />
      <line x1="32" y1="50" x2="32" y2="14" stroke={ink} strokeWidth="1" />
      <line x1="32" y1="50" x2="40" y2="18" stroke={ink} strokeWidth="1" />
      <line x1="32" y1="50" x2="48" y2="24" stroke={ink} strokeWidth="1" />
      {/* peacock eyes (3 ovals near top edge) */}
      <ellipse cx="22" cy="20" rx="2.5" ry="3.5" fill="#1e3a8a" stroke={ink} strokeWidth="1" />
      <circle cx="22" cy="20" r="1.2" fill="#facc15" />
      <ellipse cx="32" cy="17" rx="2.5" ry="3.5" fill="#1e3a8a" stroke={ink} strokeWidth="1" />
      <circle cx="32" cy="17" r="1.2" fill="#facc15" />
      <ellipse cx="42" cy="20" rx="2.5" ry="3.5" fill="#1e3a8a" stroke={ink} strokeWidth="1" />
      <circle cx="42" cy="20" r="1.2" fill="#facc15" />
      {/* pivot */}
      <circle cx="32" cy="50" r="3" fill={ink} />
    </g>
  ),

  // ── nd3 ดาบดาวเหนือ — north-star sword with star motif ─────────────
  nd3: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* slim straight jian */}
      <polygon points="32,8 30,40 34,40" fill={accent} />
      <line x1="32" y1="8" x2="32" y2="40" stroke={ink} strokeWidth="1" />
      <rect x="22" y="40" width="20" height="4" fill={ink} />
      <rect x="30" y="44" width="4" height="8" fill={accent} />
      <circle cx="32" cy="54" r="3" fill={ink} />
      {/* north star above the tip */}
      <polygon
        points="32,4 33.5,8 38,8 34.5,11 36,15 32,12.5 28,15 29.5,11 26,8 30.5,8"
        fill="#facc15"
        stroke={ink}
        strokeWidth="1"
      />
      {/* small constellation dots */}
      <circle cx="48" cy="10" r="1.2" fill={ink} />
      <circle cx="14" cy="14" r="1.2" fill={ink} />
      <circle cx="50" cy="22" r="1.2" fill={ink} />
    </g>
  ),

  // ── nd4 ทวนลม — wind spear with motion lines ───────────────────────
  nd4: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* spear shaft (diagonal) */}
      <line x1="14" y1="50" x2="46" y2="18" stroke={accent} strokeWidth="5" />
      <line x1="14" y1="50" x2="46" y2="18" stroke={ink} strokeWidth="1.5" />
      {/* spearhead */}
      <polygon
        points="46,18 56,12 50,22 52,8"
        fill={accent}
        stroke={ink}
        strokeWidth="1.5"
      />
      <polygon
        points="46,18 52,8 56,12"
        fill="#fff"
        opacity="0.4"
      />
      {/* grip */}
      <rect x="18" y="46" width="6" height="6" fill={ink} transform="rotate(-45 21 49)" />
      {/* wind motion lines */}
      <path
        d="M 8 30 Q 16 28 14 24"
        fill="none"
        stroke={ink}
        strokeWidth="1.5"
      />
      <path
        d="M 8 38 Q 18 36 16 30"
        fill="none"
        stroke={ink}
        strokeWidth="1.5"
      />
      <path
        d="M 14 44 Q 22 42 20 38"
        fill="none"
        stroke={ink}
        strokeWidth="1.5"
      />
    </g>
  ),

  // ── nd6 กระบี่หยาง — sun-yang sword with sun symbol ────────────────
  nd6: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* straight jian */}
      <polygon points="32,12 30,40 34,40" fill={accent} />
      <line x1="32" y1="12" x2="32" y2="40" stroke={ink} strokeWidth="1" />
      <rect x="22" y="40" width="20" height="4" fill={ink} />
      <rect x="30" y="44" width="4" height="8" fill={accent} />
      <circle cx="32" cy="54" r="3" fill={ink} />
      {/* sun behind the blade — radiant rays */}
      <circle cx="32" cy="22" r="9" fill="#facc15" stroke={ink} strokeWidth="1.5" />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i * Math.PI) / 4;
        const x1 = 32 + Math.cos(a) * 11;
        const y1 = 22 + Math.sin(a) * 11;
        const x2 = 32 + Math.cos(a) * 15;
        const y2 = 22 + Math.sin(a) * 15;
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#facc15"
            strokeWidth="2.5"
          />
        );
      })}
      {/* blade tip overlays sun */}
      <polygon points="32,12 31,22 33,22" fill={accent} stroke={ink} strokeWidth="1" />
    </g>
  ),

  // ── nd7 ฝ่ามือเสือ — tiger palm with paw stripes ───────────────────
  nd7: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* paw pad */}
      <ellipse cx="32" cy="42" rx="14" ry="11" fill={accent} />
      {/* 4 toe pads */}
      <ellipse cx="20" cy="26" rx="4" ry="5" fill={accent} />
      <ellipse cx="28" cy="20" rx="4" ry="5" fill={accent} />
      <ellipse cx="36" cy="20" rx="4" ry="5" fill={accent} />
      <ellipse cx="44" cy="26" rx="4" ry="5" fill={accent} />
      {/* claws */}
      <polygon points="20,18 19,22 22,20" fill={ink} />
      <polygon points="28,12 27,16 30,14" fill={ink} />
      <polygon points="36,12 35,16 38,14" fill={ink} />
      <polygon points="44,18 43,22 46,20" fill={ink} />
      {/* tiger stripes on the pad */}
      <path d="M 22 38 L 26 42" stroke={ink} strokeWidth="2" />
      <path d="M 28 36 L 32 40" stroke={ink} strokeWidth="2" />
      <path d="M 34 36 L 38 40" stroke={ink} strokeWidth="2" />
      <path d="M 38 44 L 42 48" stroke={ink} strokeWidth="2" />
    </g>
  ),

  // ── nd8 แส้เหล็กดูดชีพ — iron whip with HP-drain motif ─────────────
  nd8: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* coiled whip — sinuous S-curve */}
      <path
        d="M 14 14 Q 30 14 30 28 Q 30 42 50 42 L 50 50"
        fill="none"
        stroke={accent}
        strokeWidth="5"
      />
      <path
        d="M 14 14 Q 30 14 30 28 Q 30 42 50 42 L 50 50"
        fill="none"
        stroke={ink}
        strokeWidth="1.5"
      />
      {/* iron-segment dots along the whip */}
      <circle cx="20" cy="14" r="2" fill={ink} />
      <circle cx="28" cy="20" r="2" fill={ink} />
      <circle cx="32" cy="34" r="2" fill={ink} />
      <circle cx="42" cy="42" r="2" fill={ink} />
      {/* grip handle */}
      <rect x="10" y="10" width="6" height="8" fill={ink} />
      {/* drain heart at the lash tip */}
      <path
        d="M 50 48 Q 46 44 48 50 Q 50 56 50 56 Q 50 56 52 50 Q 54 44 50 48 Z"
        fill="#dc2626"
        stroke={ink}
        strokeWidth="1.5"
      />
      {/* drain arrow upward */}
      <line x1="50" y1="40" x2="50" y2="32" stroke="#dc2626" strokeWidth="2" />
      <polygon points="50,28 47,32 53,32" fill="#dc2626" stroke={ink} strokeWidth="1" />
    </g>
  ),

  // ── nd9 เข็มตีจุด — 4 acupressure needles to body ──────────────────
  nd9: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* central body silhouette */}
      <circle cx="32" cy="20" r="5" fill={ink} />
      <path
        d="M 26 26 L 38 26 L 40 44 L 24 44 Z"
        fill={ink}
      />
      {/* 4 acupressure points (red dots) on the figure */}
      <circle cx="32" cy="20" r="1.5" fill="#facc15" />
      <circle cx="29" cy="32" r="1.5" fill="#facc15" />
      <circle cx="35" cy="32" r="1.5" fill="#facc15" />
      <circle cx="32" cy="40" r="1.5" fill="#facc15" />
      {/* 4 needles aimed at the points */}
      <line x1="14" y1="14" x2="30" y2="20" stroke={accent} strokeWidth="3" />
      <polygon points="30,20 28,16 28,22" fill={ink} />

      <line x1="14" y1="32" x2="27" y2="32" stroke={accent} strokeWidth="3" />
      <polygon points="27,32 24,30 24,34" fill={ink} />

      <line x1="50" y1="32" x2="37" y2="32" stroke={accent} strokeWidth="3" />
      <polygon points="37,32 40,30 40,34" fill={ink} />

      <line x1="50" y1="48" x2="34" y2="42" stroke={accent} strokeWidth="3" />
      <polygon points="34,42 36,46 36,40" fill={ink} />
    </g>
  ),

  // ── nd10 กรงเล็บเพลิง — fiery claw ──────────────────────────────────
  nd10: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* claw base / palm */}
      <path
        d="M 18 50 Q 14 42 18 36 L 24 38 L 22 30 L 28 28 L 30 36 L 32 24 L 36 24 L 36 36 L 40 26 L 44 28 L 42 38 L 48 36 Q 50 44 46 50 Z"
        fill={accent}
      />
      {/* claw tips (sharpened nails) */}
      <polygon points="22,30 20,22 26,28" fill={ink} />
      <polygon points="30,24 29,16 33,22" fill={ink} />
      <polygon points="36,24 39,16 39,22" fill={ink} />
      <polygon points="42,28 46,22 44,30" fill={ink} />
      {/* fire flames behind the claw */}
      <path
        d="M 14 28 Q 12 18 18 14 Q 16 22 22 18 Q 20 24 26 22"
        fill="#f97316"
        stroke={ink}
        strokeWidth="1.5"
      />
      <path
        d="M 50 28 Q 52 18 46 14 Q 48 22 42 18 Q 44 24 38 22"
        fill="#f97316"
        stroke={ink}
        strokeWidth="1.5"
      />
      {/* ember dot */}
      <circle cx="32" cy="44" r="2" fill="#facc15" />
    </g>
  ),

  // ── nd11 กระบี่ลม — wind sword leaf-curve ──────────────────────────
  nd11: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* curved leaf-shaped blade */}
      <path
        d="M 18 50 Q 16 30 32 12 Q 48 30 46 50 Q 32 44 18 50 Z"
        fill={accent}
      />
      <path
        d="M 32 12 L 32 50"
        stroke={ink}
        strokeWidth="1.2"
      />
      {/* leaf vein lines */}
      <path d="M 32 22 L 26 28" stroke={ink} strokeWidth="1" />
      <path d="M 32 22 L 38 28" stroke={ink} strokeWidth="1" />
      <path d="M 32 32 L 24 38" stroke={ink} strokeWidth="1" />
      <path d="M 32 32 L 40 38" stroke={ink} strokeWidth="1" />
      {/* wind motion swirls around */}
      <path
        d="M 8 24 Q 14 22 12 18"
        fill="none"
        stroke={ink}
        strokeWidth="1.5"
      />
      <path
        d="M 56 24 Q 50 22 52 18"
        fill="none"
        stroke={ink}
        strokeWidth="1.5"
      />
      <path
        d="M 8 40 Q 14 38 12 34"
        fill="none"
        stroke={ink}
        strokeWidth="1.5"
      />
    </g>
  ),

  // ── nd12 ฝ่ามือสร้างกำแพง — wall-building palm bricks ──────────────
  nd12: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* brick wall — staggered rows */}
      <rect x="10" y="32" width="14" height="8" fill={accent} />
      <rect x="24" y="32" width="14" height="8" fill={accent} />
      <rect x="38" y="32" width="14" height="8" fill={accent} />
      <rect x="10" y="40" width="8" height="8" fill={accent} />
      <rect x="18" y="40" width="14" height="8" fill={accent} />
      <rect x="32" y="40" width="14" height="8" fill={accent} />
      <rect x="46" y="40" width="6" height="8" fill={accent} />
      <rect x="10" y="48" width="14" height="8" fill={accent} />
      <rect x="24" y="48" width="14" height="8" fill={accent} />
      <rect x="38" y="48" width="14" height="8" fill={accent} />
      {/* palm pushing forward (top) */}
      <path
        d="M 22 30 L 22 16 L 26 14 L 26 24 L 28 12 L 32 12 L 32 24 L 34 14 L 38 16 L 38 30 Z"
        fill={accent}
      />
      <line x1="22" y1="22" x2="38" y2="22" stroke={ink} strokeWidth="1" />
      {/* impact dust line */}
      <line x1="14" y1="28" x2="50" y2="28" stroke={ink} strokeWidth="1.5" strokeDasharray="2 2" />
    </g>
  ),

  // ── bst_fang เขี้ยวพิษอ่อน — fanged bite with venom drip ───────────
  bst_fang: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* upper jaw */}
      <path
        d="M 10 14 Q 32 10 54 14 L 50 24 L 14 24 Z"
        fill={accent}
      />
      {/* lower jaw */}
      <path
        d="M 14 40 L 50 40 Q 32 54 14 40 Z"
        fill={accent}
      />
      {/* two big fangs from upper jaw */}
      <polygon points="22,24 18,40 24,30" fill="#fff" stroke={ink} strokeWidth="1.5" />
      <polygon points="42,24 46,40 40,30" fill="#fff" stroke={ink} strokeWidth="1.5" />
      {/* small teeth row */}
      <polygon points="28,24 27,30 29,30" fill="#fff" stroke={ink} strokeWidth="0.8" />
      <polygon points="32,24 31,30 33,30" fill="#fff" stroke={ink} strokeWidth="0.8" />
      <polygon points="36,24 35,30 37,30" fill="#fff" stroke={ink} strokeWidth="0.8" />
      {/* venom drips from the two fangs */}
      <path
        d="M 21 42 Q 19 48 21 52 Q 23 48 21 42 Z"
        fill="#22c55e"
        stroke={ink}
        strokeWidth="1"
      />
      <path
        d="M 43 42 Q 41 48 43 52 Q 45 48 43 42 Z"
        fill="#22c55e"
        stroke={ink}
        strokeWidth="1"
      />
      <circle cx="21" cy="55" r="1.5" fill="#22c55e" stroke={ink} strokeWidth="0.8" />
      <circle cx="43" cy="55" r="1.5" fill="#22c55e" stroke={ink} strokeWidth="0.8" />
    </g>
  ),

  // ── bst_roar คำรามขู่ — roaring beast head with sound waves ────────
  bst_roar: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* beast head silhouette */}
      <path
        d="M 16 20 Q 14 14 20 12 L 22 18 Q 28 14 32 18 Q 36 14 42 18 L 44 12 Q 50 14 48 20 L 50 32 Q 48 44 32 48 Q 16 44 14 32 Z"
        fill={accent}
      />
      {/* eyes (angry) */}
      <polygon points="22,26 28,28 26,30" fill={ink} />
      <polygon points="42,26 36,28 38,30" fill={ink} />
      {/* open roaring mouth */}
      <path
        d="M 24 36 Q 32 46 40 36 L 38 40 L 36 36 L 34 40 L 32 36 L 30 40 L 28 36 L 26 40 Z"
        fill={ink}
      />
      {/* sound waves emanating to the right */}
      <path
        d="M 52 18 Q 58 24 52 30"
        fill="none"
        stroke={ink}
        strokeWidth="2"
      />
      <path
        d="M 56 14 Q 64 24 56 34"
        fill="none"
        stroke={ink}
        strokeWidth="1.5"
      />
      {/* sound waves to the left */}
      <path
        d="M 12 18 Q 6 24 12 30"
        fill="none"
        stroke={ink}
        strokeWidth="2"
      />
      <path
        d="M 8 14 Q 0 24 8 34"
        fill="none"
        stroke={ink}
        strokeWidth="1.5"
      />
    </g>
  ),

  // ── ws สองดาบล่องลม — twin floating blades (T2) ─────────────────────
  ws: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* left dao — tilted */}
      <g transform="rotate(-20 22 32)">
        <path
          d="M 14 14 Q 30 18 28 38 L 22 38 Q 22 22 14 18 Z"
          fill={accent}
        />
        <rect x="20" y="38" width="4" height="6" fill={ink} />
      </g>
      {/* right dao — tilted opposite */}
      <g transform="rotate(20 42 32)">
        <path
          d="M 50 14 Q 34 18 36 38 L 42 38 Q 42 22 50 18 Z"
          fill={accent}
        />
        <rect x="40" y="38" width="4" height="6" fill={ink} />
      </g>
      {/* wind / float lines beneath */}
      <path
        d="M 10 52 Q 18 50 14 46"
        fill="none"
        stroke={ink}
        strokeWidth="1.5"
      />
      <path
        d="M 26 56 Q 34 54 30 50"
        fill="none"
        stroke={ink}
        strokeWidth="1.5"
      />
      <path
        d="M 42 52 Q 50 50 46 46"
        fill="none"
        stroke={ink}
        strokeWidth="1.5"
      />
    </g>
  ),

  // ── sa คีตาอาคม — magical music note + skull (T2 yin/internal) ─────
  sa: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* skull (lower) */}
      <path
        d="M 18 36 Q 18 26 32 26 Q 46 26 46 36 L 46 44 L 40 44 L 40 50 L 24 50 L 24 44 L 18 44 Z"
        fill="#e7e5e4"
      />
      <circle cx="26" cy="36" r="2.5" fill={ink} />
      <circle cx="38" cy="36" r="2.5" fill={ink} />
      <polygon points="32,40 30,44 34,44" fill={ink} />
      {/* skull teeth */}
      <line x1="28" y1="46" x2="28" y2="50" stroke={ink} strokeWidth="1" />
      <line x1="32" y1="46" x2="32" y2="50" stroke={ink} strokeWidth="1" />
      <line x1="36" y1="46" x2="36" y2="50" stroke={ink} strokeWidth="1" />
      {/* music note rising from the skull */}
      <ellipse cx="22" cy="20" rx="5" ry="3.5" fill={accent} stroke={ink} strokeWidth="1.5" transform="rotate(-15 22 20)" />
      <line x1="27" y1="20" x2="27" y2="6" stroke={ink} strokeWidth="2" />
      <path
        d="M 27 6 Q 36 8 36 14 Q 32 12 27 14"
        fill={accent}
        stroke={ink}
        strokeWidth="1.5"
      />
      {/* aura sparkles */}
      <circle cx="46" cy="10" r="1.5" fill={accent} stroke={ink} strokeWidth="0.8" />
      <circle cx="50" cy="20" r="1.2" fill={accent} stroke={ink} strokeWidth="0.8" />
      <circle cx="14" cy="20" r="1.2" fill={accent} stroke={ink} strokeWidth="0.8" />
    </g>
  ),

  // ── fs กระบองเพลิง — flaming mace (T2 long yang) ────────────────────
  fs: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* mace shaft (diagonal) */}
      <line x1="14" y1="50" x2="40" y2="24" stroke={ink} strokeWidth="6" />
      <line x1="14" y1="50" x2="40" y2="24" stroke={accent} strokeWidth="3" />
      {/* grip wrap */}
      <line x1="20" y1="44" x2="22" y2="46" stroke={ink} strokeWidth="2" />
      <line x1="24" y1="40" x2="26" y2="42" stroke={ink} strokeWidth="2" />
      {/* mace head — chunky orb with spikes */}
      <circle cx="44" cy="20" r="10" fill={ink} />
      <circle cx="44" cy="20" r="7" fill={accent} />
      {/* spikes */}
      <polygon points="44,6 42,12 46,12" fill={ink} />
      <polygon points="58,20 52,18 52,22" fill={ink} />
      <polygon points="44,34 42,28 46,28" fill={ink} />
      <polygon points="34,10 38,14 34,16" fill={ink} />
      <polygon points="54,30 50,26 50,30" fill={ink} />
      {/* flames bursting from the mace head */}
      <path
        d="M 36 6 Q 32 0 38 2 Q 36 -2 40 0 Q 38 -4 42 0"
        fill="#f97316"
        stroke={ink}
        strokeWidth="1.2"
      />
      <path
        d="M 56 8 Q 60 2 56 0 Q 62 0 60 -2 Q 58 4 54 4"
        fill="#f97316"
        stroke={ink}
        strokeWidth="1.2"
      />
      {/* ember at the very top */}
      <circle cx="44" cy="20" r="2.5" fill="#facc15" />
    </g>
  ),
};

Object.assign(SKILL_ICON_OVERRIDES, BATCH);
