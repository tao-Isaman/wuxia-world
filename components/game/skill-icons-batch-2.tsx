import type { IconRenderer } from "./skill-icons-registry";
import { SKILL_ICON_OVERRIDES } from "./skill-icons-registry";

// ─── Batch 2: Gumu / Beggars / Mingjiao / Xiaoyao / Xingxiu / Wudu /
//     Blood / Jinyiwei sect skills ──────────────────────────────────────
//
// Each renderer draws inside the inner 56×56 (4..60). Stick to chunky
// shapes that read at 32px. `ink` is the stroke (deep brown #1a120a in
// practice); `accent` is the tier-tinted fill.

const BATCH: Record<string, IconRenderer> = {
  // 1. กระบี่สุสานโบราณ — ancient tomb sword wrapped in cobwebs
  gm_sword: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* cobweb strands behind the blade */}
      <g stroke={ink} strokeWidth="1" fill="none" opacity="0.7">
        <path d="M 8 8 L 32 28" />
        <path d="M 56 8 L 32 28" />
        <path d="M 8 8 Q 20 14 32 14 Q 44 14 56 8" />
        <path d="M 8 8 Q 16 20 24 24" />
        <path d="M 56 8 Q 48 20 40 24" />
      </g>
      {/* slim ancient blade pointing down */}
      <polygon points="32,10 30,46 34,46" fill={accent} />
      <line x1="32" y1="10" x2="32" y2="46" stroke={ink} strokeWidth="1" />
      {/* cross-guard (worn) */}
      <rect x="22" y="46" width="20" height="3" fill={ink} />
      <rect x="20" y="49" width="24" height="2" fill={accent} />
      {/* hilt + pommel */}
      <rect x="30" y="51" width="4" height="6" fill={accent} />
      <circle cx="32" cy="58" r="2.5" fill={ink} />
      {/* dust speck */}
      <circle cx="14" cy="48" r="1" fill={ink} opacity="0.6" />
      <circle cx="50" cy="50" r="1" fill={ink} opacity="0.6" />
    </g>
  ),

  // 2. เพลงกระบี่สุรางคนางค์ใจพิสุทธิ์ — twin slim crossed jade-maiden swords
  ynss: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* left-leaning slim sword */}
      <polygon points="14,12 12,14 42,52 44,50" fill={accent} />
      <line x1="14" y1="12" x2="42" y2="52" stroke={ink} strokeWidth="1" />
      <rect x="42" y="48" width="8" height="3" transform="rotate(45 46 49.5)" fill={ink} />
      {/* right-leaning slim sword */}
      <polygon points="50,12 52,14 22,52 20,50" fill={accent} />
      <line x1="50" y1="12" x2="22" y2="52" stroke={ink} strokeWidth="1" />
      <rect x="14" y="48" width="8" height="3" transform="rotate(-45 18 49.5)" fill={ink} />
      {/* center jade gem */}
      <circle cx="32" cy="32" r="4" fill="#a7f3d0" stroke={ink} strokeWidth="1.5" />
    </g>
  ),

  // 3. ฝ่ามือกำสรดวิญญาณสลาย — sorrowful palm with broken heart + ghost wisp
  ansh: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* upright open palm */}
      <path
        d="M 22 50 L 22 28 Q 22 24 26 24 L 26 36 L 28 36 L 28 18 Q 28 14 32 14 Q 36 14 36 18 L 36 36 L 38 36 L 38 22 Q 38 18 42 18 L 42 36 L 44 36 L 44 28 Q 44 24 48 24 L 48 44 Q 48 54 38 54 L 30 54 Q 22 54 22 50 Z"
        fill={accent}
      />
      {/* broken heart over palm */}
      <path
        d="M 28 30 Q 24 26 28 24 Q 32 24 32 28 Q 32 24 36 24 Q 40 26 36 30 L 32 36 Z"
        fill="#dc2626"
        stroke={ink}
        strokeWidth="1.5"
      />
      <line x1="32" y1="24" x2="32" y2="36" stroke="#fff" strokeWidth="1.5" strokeDasharray="2 1.5" />
      {/* ghost wisp trailing up */}
      <path
        d="M 50 12 Q 54 16 50 20 Q 46 24 50 28"
        fill="none"
        stroke={ink}
        strokeWidth="1.5"
        opacity="0.7"
      />
    </g>
  ),

  // 4. ประกาศิตพรรคยาจก — beggar signal: open palm with sash
  nc1: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* big open palm front-on */}
      <rect x="20" y="26" width="24" height="22" fill={accent} />
      {/* fingers */}
      <rect x="20" y="14" width="5" height="14" fill={accent} />
      <rect x="26" y="10" width="5" height="18" fill={accent} />
      <rect x="32" y="10" width="5" height="18" fill={accent} />
      <rect x="38" y="14" width="5" height="14" fill={accent} />
      {/* thumb */}
      <rect x="14" y="32" width="8" height="6" fill={accent} />
      {/* palm crease */}
      <path d="M 24 34 Q 32 38 40 34" fill="none" stroke={ink} strokeWidth="1.5" />
      {/* tattered sash flapping behind wrist */}
      <path d="M 22 50 L 14 56 L 18 52 L 12 58" fill="none" stroke={ink} strokeWidth="2" />
      <path d="M 42 50 L 50 56 L 46 52 L 52 58" fill="none" stroke={ink} strokeWidth="2" />
    </g>
  ),

  // 5. ไม้เท้าตีสุนัข — beggar staff striking a small dog
  nc2: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* diagonal staff */}
      <line x1="10" y1="14" x2="44" y2="36" stroke={accent} strokeWidth="6" />
      <line x1="10" y1="14" x2="44" y2="36" stroke={ink} strokeWidth="1" />
      {/* staff bindings */}
      <line x1="18" y1="18" x2="22" y2="22" stroke={ink} strokeWidth="2" />
      <line x1="32" y1="28" x2="36" y2="32" stroke={ink} strokeWidth="2" />
      {/* impact star where staff meets dog */}
      <polygon
        points="44,36 50,32 48,38 54,38 48,42 50,48 44,44 38,48 40,42 34,38 40,38 38,32"
        fill="#facc15"
        stroke={ink}
        strokeWidth="1.5"
      />
      {/* small chunky dog at bottom */}
      <rect x="30" y="48" width="14" height="8" fill={ink} />
      <rect x="42" y="44" width="6" height="6" fill={ink} />
      <rect x="30" y="56" width="3" height="4" fill={ink} />
      <rect x="40" y="56" width="3" height="4" fill={ink} />
      <circle cx="46" cy="46" r="1" fill="#fff" />
    </g>
  ),

  // 6. หมัดเมา — drunken fist with wine gourd
  ne8: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* tilted clenched fist */}
      <g transform="rotate(-15 32 36)">
        <rect x="20" y="28" width="24" height="18" fill={accent} />
        <rect x="22" y="26" width="20" height="4" fill={accent} />
        <rect x="22" y="30" width="3" height="2" fill={ink} />
        <rect x="28" y="30" width="3" height="2" fill={ink} />
        <rect x="34" y="30" width="3" height="2" fill={ink} />
        <rect x="40" y="30" width="3" height="2" fill={ink} />
        <rect x="18" y="34" width="4" height="8" fill={accent} />
      </g>
      {/* wine gourd in upper-right */}
      <ellipse cx="50" cy="20" rx="6" ry="8" fill="#b45309" stroke={ink} strokeWidth="1.5" />
      <ellipse cx="50" cy="13" rx="3" ry="3" fill="#b45309" stroke={ink} strokeWidth="1.5" />
      <rect x="49" y="10" width="2" height="2" fill={ink} />
      {/* drunken zigzag motion line */}
      <path
        d="M 8 50 L 12 46 L 10 52 L 14 48"
        fill="none"
        stroke={ink}
        strokeWidth="1.5"
        opacity="0.7"
      />
    </g>
  ),

  // 7. 18 ฝ่ามือมังกร — dragon palm — open hand with curling dragon body
  ep: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* curling dragon body around the back */}
      <path
        d="M 8 14 Q 22 8 36 14 Q 56 22 50 40 Q 44 54 28 50"
        fill="none"
        stroke="#dc2626"
        strokeWidth="5"
      />
      <path
        d="M 8 14 Q 22 8 36 14 Q 56 22 50 40 Q 44 54 28 50"
        fill="none"
        stroke={ink}
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      {/* dragon head — small triangle at start */}
      <polygon points="6,12 12,10 10,18" fill="#dc2626" stroke={ink} strokeWidth="1.5" />
      <circle cx="9" cy="13" r="0.8" fill={ink} />
      {/* big open palm in lower-right */}
      <rect x="26" y="36" width="22" height="18" fill={accent} />
      <rect x="26" y="30" width="4" height="8" fill={accent} />
      <rect x="32" y="26" width="4" height="12" fill={accent} />
      <rect x="38" y="26" width="4" height="12" fill={accent} />
      <rect x="44" y="30" width="4" height="8" fill={accent} />
      <rect x="22" y="40" width="6" height="6" fill={accent} />
      {/* "18" mark on palm */}
      <text x="36" y="50" fontFamily="system-ui, sans-serif" fontSize="9" fontWeight="700" fill={ink} textAnchor="middle">18</text>
    </g>
  ),

  // 8. ฝ่ามือจับมังกร — palm grasping a dragon (claws around serpent)
  ng3: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* serpent dragon body weaving through */}
      <path
        d="M 8 50 Q 20 36 32 44 Q 44 52 56 38 Q 50 24 36 30 Q 22 36 14 22"
        fill="none"
        stroke="#dc2626"
        strokeWidth="5"
      />
      {/* dragon head at top-left */}
      <circle cx="14" cy="20" r="3.5" fill="#dc2626" stroke={ink} strokeWidth="1.5" />
      <circle cx="13" cy="19" r="0.8" fill="#fff" />
      {/* clenched grasping claw — five curved fingers wrapping */}
      <g stroke={ink} strokeWidth="1.5" fill={accent}>
        <path d="M 28 14 Q 32 12 32 18 L 30 22 Z" />
        <path d="M 36 12 Q 40 12 40 18 L 38 22 Z" />
        <path d="M 44 14 Q 48 16 46 22 L 42 24 Z" />
        <path d="M 48 22 Q 50 26 46 30 L 42 28 Z" />
        <rect x="30" y="20" width="20" height="14" />
      </g>
      {/* claw tips */}
      <polygon points="30,12 32,8 33,14" fill={ink} />
      <polygon points="38,10 40,6 41,12" fill={ink} />
      <polygon points="46,12 49,8 49,16" fill={ink} />
    </g>
  ),

  // 9. ฝ่ามือเพลิง — flaming palm
  mi_firepalm: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* flame backdrop */}
      <path
        d="M 16 56 Q 8 40 16 30 Q 14 38 22 32 Q 18 22 28 18 Q 26 26 32 22 Q 30 14 38 16 Q 36 24 44 22 Q 42 32 50 30 Q 50 42 48 56 Z"
        fill="#dc2626"
        stroke={ink}
        strokeWidth="1.5"
      />
      <path
        d="M 22 50 Q 18 42 22 36 Q 26 32 30 36 Q 28 30 34 30 Q 32 24 38 28 Q 36 36 42 34 Q 42 44 40 50 Z"
        fill="#facc15"
      />
      {/* palm silhouette */}
      <rect x="24" y="34" width="16" height="16" fill={accent} stroke={ink} strokeWidth="1.5" />
      <rect x="24" y="28" width="3" height="8" fill={accent} stroke={ink} strokeWidth="1" />
      <rect x="29" y="24" width="3" height="12" fill={accent} stroke={ink} strokeWidth="1" />
      <rect x="34" y="24" width="3" height="12" fill={accent} stroke={ink} strokeWidth="1" />
      <rect x="38" y="28" width="3" height="8" fill={accent} stroke={ink} strokeWidth="1" />
    </g>
  ),

  // 10. เพลงหมัดสราญรมย์ — playful punch + music note
  xy_punch: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* punching fist (slightly tilted) */}
      <g transform="rotate(-10 32 36)">
        <rect x="18" y="30" width="24" height="18" fill={accent} />
        <rect x="20" y="28" width="20" height="4" fill={accent} />
        <rect x="20" y="32" width="3" height="2" fill={ink} />
        <rect x="26" y="32" width="3" height="2" fill={ink} />
        <rect x="32" y="32" width="3" height="2" fill={ink} />
        <rect x="38" y="32" width="3" height="2" fill={ink} />
        <rect x="16" y="36" width="4" height="8" fill={accent} />
        {/* speed lines behind */}
        <line x1="44" y1="34" x2="52" y2="32" stroke={ink} strokeWidth="2" />
        <line x1="44" y1="40" x2="54" y2="42" stroke={ink} strokeWidth="2" />
        <line x1="44" y1="46" x2="50" y2="50" stroke={ink} strokeWidth="2" />
      </g>
      {/* music note up-left */}
      <g stroke={ink} strokeWidth="1.5">
        <ellipse cx="14" cy="18" rx="4" ry="3" fill={ink} />
        <line x1="18" y1="18" x2="18" y2="6" stroke={ink} strokeWidth="2" />
        <path d="M 18 6 Q 24 8 22 14" fill="none" stroke={ink} strokeWidth="2" />
      </g>
    </g>
  ),

  // 11. กระบี่ขลุ่ยหยก — sword + jade flute combo (crossed)
  yxjf: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* slim sword diagonal (bottom-left to top-right) */}
      <polygon points="12,52 14,54 50,18 48,16" fill={accent} />
      <line x1="12" y1="52" x2="50" y2="18" stroke={ink} strokeWidth="1" />
      <rect x="48" y="14" width="8" height="3" transform="rotate(45 52 15.5)" fill={ink} />
      <circle cx="14" cy="54" r="2.5" fill={ink} />
      {/* jade flute diagonal (top-left to bottom-right) */}
      <rect x="12" y="14" width="40" height="6" transform="rotate(45 32 17)" fill="#a7f3d0" stroke={ink} strokeWidth="1.5" />
      <g transform="rotate(45 32 17)">
        <circle cx="22" cy="17" r="1.2" fill={ink} />
        <circle cx="30" cy="17" r="1.2" fill={ink} />
        <circle cx="38" cy="17" r="1.2" fill={ink} />
        <circle cx="46" cy="17" r="1.2" fill={ink} />
      </g>
      {/* center binding ribbon */}
      <circle cx="32" cy="32" r="3" fill="#dc2626" stroke={ink} strokeWidth="1" />
    </g>
  ),

  // 12. กระบี่ 6 ชีพจร — six energy beams from a pointing finger (六脉神剑)
  lmsj: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* pointing fist at lower-left */}
      <rect x="8" y="36" width="14" height="14" fill={accent} />
      <rect x="10" y="34" width="10" height="3" fill={accent} />
      <rect x="6" y="40" width="3" height="6" fill={accent} />
      {/* extended index finger */}
      <rect x="20" y="36" width="14" height="4" fill={accent} stroke={ink} strokeWidth="1.5" />
      {/* six radiating qi beams from fingertip */}
      <g stroke="#facc15" strokeWidth="2.5">
        <line x1="34" y1="38" x2="58" y2="32" />
        <line x1="34" y1="38" x2="58" y2="20" />
        <line x1="34" y1="38" x2="56" y2="10" />
        <line x1="34" y1="38" x2="44" y2="10" />
        <line x1="34" y1="38" x2="58" y2="42" />
        <line x1="34" y1="38" x2="58" y2="50" />
      </g>
      <g stroke={ink} strokeWidth="0.5">
        <line x1="34" y1="38" x2="58" y2="32" />
        <line x1="34" y1="38" x2="58" y2="20" />
        <line x1="34" y1="38" x2="56" y2="10" />
        <line x1="34" y1="38" x2="44" y2="10" />
        <line x1="34" y1="38" x2="58" y2="42" />
        <line x1="34" y1="38" x2="58" y2="50" />
      </g>
      {/* energy burst at fingertip */}
      <circle cx="34" cy="38" r="3" fill="#facc15" stroke={ink} strokeWidth="1" />
    </g>
  ),

  // 13. ฝ่ามือสราญรมย์ — joyful palm with music notes
  xy_palm: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* big open palm */}
      <rect x="20" y="28" width="24" height="22" fill={accent} />
      <rect x="20" y="14" width="5" height="14" fill={accent} />
      <rect x="26" y="10" width="5" height="18" fill={accent} />
      <rect x="32" y="10" width="5" height="18" fill={accent} />
      <rect x="38" y="14" width="5" height="14" fill={accent} />
      <rect x="14" y="32" width="8" height="6" fill={accent} />
      <path d="M 24 38 Q 32 42 40 38" fill="none" stroke={ink} strokeWidth="1.5" />
      {/* dancing music notes */}
      <g stroke={ink} strokeWidth="1.5">
        <ellipse cx="50" cy="50" rx="3" ry="2.2" fill={ink} />
        <line x1="53" y1="50" x2="53" y2="40" stroke={ink} strokeWidth="1.5" />
        <path d="M 53 40 Q 58 41 56 46" fill="none" stroke={ink} strokeWidth="1.5" />
        <ellipse cx="10" cy="14" rx="2.5" ry="1.8" fill={ink} />
        <line x1="12.5" y1="14" x2="12.5" y2="6" stroke={ink} strokeWidth="1.5" />
      </g>
    </g>
  ),

  // 14. ฝ่ามือพิษสลายพลัง — corrupting palm with poison drips
  xx_palm: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* sickly green palm */}
      <rect x="20" y="22" width="24" height="20" fill="#84cc16" />
      <rect x="20" y="10" width="5" height="14" fill="#84cc16" />
      <rect x="26" y="8" width="5" height="16" fill="#84cc16" />
      <rect x="32" y="8" width="5" height="16" fill="#84cc16" />
      <rect x="38" y="10" width="5" height="14" fill="#84cc16" />
      <rect x="14" y="26" width="8" height="6" fill="#84cc16" />
      {/* corruption swirl on palm */}
      <circle cx="32" cy="32" r="5" fill={accent} stroke={ink} strokeWidth="1" />
      <path d="M 30 30 Q 34 30 34 34 Q 30 34 30 30 Z" fill={ink} />
      {/* poison drips falling */}
      <g fill="#84cc16" stroke={ink} strokeWidth="1">
        <path d="M 22 44 Q 22 50 24 52 Q 26 50 26 44 Z" />
        <path d="M 38 46 Q 38 52 40 54 Q 42 52 42 46 Z" />
        <circle cx="50" cy="50" r="2" />
        <circle cx="14" cy="54" r="1.5" />
      </g>
    </g>
  ),

  // 15. ฝ่ามือพิษห้าธาตุ — five-poison palm with snake / scorpion / spider / centipede / toad
  wd_palm: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* open palm background */}
      <rect x="14" y="14" width="36" height="36" fill={accent} stroke={ink} strokeWidth="2" />
      <line x1="14" y1="20" x2="50" y2="20" stroke={ink} strokeWidth="0.5" />
      {/* snake top-left */}
      <path d="M 18 28 Q 22 24 26 28 Q 22 32 18 28 Z" fill="#84cc16" stroke={ink} strokeWidth="1" />
      <circle cx="19" cy="27" r="0.6" fill={ink} />
      {/* scorpion top-right (claws + tail) */}
      <g stroke={ink} strokeWidth="1.2" fill="#1a120a">
        <ellipse cx="42" cy="28" rx="3.5" ry="2" />
        <path d="M 38 28 L 35 26 M 46 28 L 49 26" />
        <path d="M 42 26 Q 44 22 47 24" fill="none" />
        <circle cx="47" cy="24" r="0.8" fill="#dc2626" />
      </g>
      {/* spider center */}
      <g stroke={ink} strokeWidth="1.2">
        <circle cx="32" cy="36" r="3" fill={ink} />
        <line x1="29" y1="34" x2="25" y2="32" />
        <line x1="29" y1="36" x2="25" y2="36" />
        <line x1="29" y1="38" x2="25" y2="40" />
        <line x1="35" y1="34" x2="39" y2="32" />
        <line x1="35" y1="36" x2="39" y2="36" />
        <line x1="35" y1="38" x2="39" y2="40" />
      </g>
      {/* centipede bottom-left */}
      <g stroke={ink} strokeWidth="1.2" fill="#dc2626">
        <ellipse cx="22" cy="44" rx="5" ry="1.5" />
        <line x1="18" y1="43" x2="17" y2="41" />
        <line x1="20" y1="43" x2="19" y2="41" />
        <line x1="22" y1="43" x2="22" y2="41" />
        <line x1="24" y1="43" x2="25" y2="41" />
        <line x1="26" y1="43" x2="27" y2="41" />
      </g>
      {/* toad bottom-right */}
      <g stroke={ink} strokeWidth="1.2" fill="#84cc16">
        <ellipse cx="42" cy="44" rx="4" ry="3" />
        <circle cx="40" cy="42" r="0.8" fill={ink} />
        <circle cx="44" cy="42" r="0.8" fill={ink} />
      </g>
    </g>
  ),

  // 16. ดาบอสุรี — demon blade dripping blood
  bs: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* jagged demon dao blade */}
      <path
        d="M 18 12 L 22 14 L 24 22 L 30 26 L 32 36 L 38 40 L 40 50 L 36 54 L 32 50 L 28 42 L 22 36 L 18 26 L 16 18 Z"
        fill="#dc2626"
      />
      {/* blade highlight */}
      <path d="M 20 16 L 26 24 L 32 32 L 36 44" fill="none" stroke="#fff" strokeWidth="1" opacity="0.6" />
      {/* skull on guard */}
      <rect x="34" y="50" width="14" height="6" fill={ink} />
      <circle cx="38" cy="53" r="1" fill="#dc2626" />
      <circle cx="44" cy="53" r="1" fill="#dc2626" />
      {/* hilt */}
      <rect x="38" y="56" width="6" height="4" fill={accent} />
      {/* blood drips */}
      <g fill="#dc2626" stroke={ink} strokeWidth="0.8">
        <path d="M 20 30 Q 20 36 22 38 Q 24 36 24 30 Z" />
        <circle cx="14" cy="42" r="1.5" />
        <circle cx="10" cy="50" r="1" />
      </g>
    </g>
  ),

  // 17. ดาบยาวสีเลือด — long blood-red blade (broad sweeping dao)
  nf6: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* extra-long curved blade */}
      <path
        d="M 12 14 Q 50 14 52 38 L 44 42 Q 42 22 12 18 Z"
        fill="#dc2626"
      />
      {/* blade ridge highlight */}
      <path d="M 16 16 Q 40 18 46 36" fill="none" stroke="#fff" strokeWidth="1" opacity="0.5" />
      {/* dark blood smears along edge */}
      <line x1="22" y1="16" x2="24" y2="20" stroke={ink} strokeWidth="1.5" />
      <line x1="32" y1="17" x2="34" y2="21" stroke={ink} strokeWidth="1.5" />
      {/* long handle */}
      <rect x="42" y="42" width="6" height="14" fill={ink} />
      <line x1="44" y1="46" x2="46" y2="46" stroke={accent} strokeWidth="1" />
      <line x1="44" y1="50" x2="46" y2="50" stroke={accent} strokeWidth="1" />
      {/* pommel ring */}
      <circle cx="45" cy="58" r="3" fill="none" stroke={accent} strokeWidth="2" />
      {/* drip */}
      <circle cx="14" cy="22" r="1.5" fill="#dc2626" stroke={ink} strokeWidth="0.8" />
    </g>
  ),

  // 18. โซ่กรงเล็บฝึกหัด — basic chain with claw hook
  jy_chain: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* chain links from upper-left, diagonally */}
      <g fill="none" stroke={accent} strokeWidth="3">
        <ellipse cx="14" cy="14" rx="3" ry="4" transform="rotate(45 14 14)" />
        <ellipse cx="22" cy="22" rx="3" ry="4" transform="rotate(45 22 22)" />
        <ellipse cx="30" cy="30" rx="3" ry="4" transform="rotate(45 30 30)" />
        <ellipse cx="38" cy="38" rx="3" ry="4" transform="rotate(45 38 38)" />
      </g>
      <g fill="none" stroke={ink} strokeWidth="0.8">
        <ellipse cx="14" cy="14" rx="3" ry="4" transform="rotate(45 14 14)" />
        <ellipse cx="22" cy="22" rx="3" ry="4" transform="rotate(45 22 22)" />
        <ellipse cx="30" cy="30" rx="3" ry="4" transform="rotate(45 30 30)" />
        <ellipse cx="38" cy="38" rx="3" ry="4" transform="rotate(45 38 38)" />
      </g>
      {/* claw hook at lower-right */}
      <g stroke={ink} strokeWidth="1.5" fill={ink}>
        <path d="M 42 42 L 50 42 Q 56 42 56 48 L 52 48 Q 50 46 48 48 L 48 54" fill="none" strokeWidth="2.5" />
        <polygon points="48,54 46,58 50,58" />
        <polygon points="56,48 54,52 58,52" />
        <polygon points="42,42 38,44 40,46" />
      </g>
    </g>
  ),

  // 19. ดาบราชสำนัก — imperial guard's sabre
  jy_blade: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* upright clean sabre */}
      <path d="M 28 8 Q 36 8 38 14 L 38 44 L 28 44 Z" fill={accent} />
      <line x1="33" y1="10" x2="33" y2="42" stroke={ink} strokeWidth="0.8" />
      {/* gold cross-guard with imperial scroll motif */}
      <rect x="20" y="44" width="26" height="5" fill="#facc15" stroke={ink} strokeWidth="1.5" />
      <circle cx="33" cy="46.5" r="1.5" fill={ink} />
      {/* wrapped grip */}
      <rect x="30" y="49" width="6" height="9" fill="#7c2d12" />
      <line x1="30" y1="51" x2="36" y2="51" stroke={ink} strokeWidth="0.8" />
      <line x1="30" y1="54" x2="36" y2="54" stroke={ink} strokeWidth="0.8" />
      {/* gold pommel */}
      <circle cx="33" cy="60" r="3" fill="#facc15" stroke={ink} strokeWidth="1.5" />
      {/* tassel */}
      <line x1="33" y1="62" x2="31" y2="62" stroke="#dc2626" strokeWidth="1" />
      <line x1="33" y1="62" x2="35" y2="62" stroke="#dc2626" strokeWidth="1" />
    </g>
  ),

  // 20. กรงเล็บอินทรี — eagle talon
  jy_eagleclaw: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* eagle leg coming from top */}
      <rect x="28" y="8" width="8" height="14" fill={accent} />
      <line x1="30" y1="12" x2="34" y2="12" stroke={ink} strokeWidth="0.8" />
      <line x1="30" y1="16" x2="34" y2="16" stroke={ink} strokeWidth="0.8" />
      {/* knuckle joint */}
      <circle cx="32" cy="22" r="4" fill={accent} />
      {/* three forward talons */}
      <g fill={accent} stroke={ink} strokeWidth="1.5">
        <path d="M 26 24 Q 18 32 14 50 L 18 48 Q 22 36 28 30 Z" />
        <path d="M 32 26 Q 30 38 28 56 L 32 54 Q 36 38 36 30 Z" />
        <path d="M 38 24 Q 46 32 50 50 L 46 48 Q 42 36 36 30 Z" />
      </g>
      {/* sharp talon tips */}
      <polygon points="14,50 12,54 16,52" fill={ink} />
      <polygon points="28,56 26,60 32,58" fill={ink} />
      <polygon points="50,50 48,54 52,52" fill={ink} />
      {/* rear talon */}
      <path d="M 32 22 Q 22 16 18 10 L 22 12 Q 28 18 32 22 Z" fill={accent} stroke={ink} strokeWidth="1.5" />
    </g>
  ),

  // 21. กรงเล็บคว้าจับ — grappling claw locking onto wrist
  jy_grapple: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* victim's wrist (horizontal bar) */}
      <rect x="6" y="28" width="52" height="8" fill="#a8a29e" stroke={ink} strokeWidth="1.5" />
      <line x1="6" y1="32" x2="58" y2="32" stroke={ink} strokeWidth="0.8" />
      {/* grappling claw fingers locked from above */}
      <g fill={accent} stroke={ink} strokeWidth="1.5">
        <path d="M 18 14 Q 22 14 22 24 L 22 32 L 18 32 Z" />
        <path d="M 26 12 Q 30 12 30 24 L 30 32 L 26 32 Z" />
        <path d="M 34 12 Q 38 12 38 24 L 38 32 L 34 32 Z" />
        <path d="M 42 14 Q 46 14 46 24 L 46 32 L 42 32 Z" />
      </g>
      {/* knuckle ridge */}
      <rect x="14" y="14" width="36" height="6" fill={accent} stroke={ink} strokeWidth="1.5" />
      {/* squeeze marks (impact) */}
      <line x1="10" y1="40" x2="14" y2="44" stroke={ink} strokeWidth="2" />
      <line x1="54" y1="40" x2="50" y2="44" stroke={ink} strokeWidth="2" />
      <line x1="32" y1="42" x2="32" y2="48" stroke={ink} strokeWidth="2" />
    </g>
  ),

  // 22. กระบี่จารบุรุษ — spy's slim sword (sword + dagger silhouette)
  jy_sword: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* hooded mask backdrop */}
      <path
        d="M 12 12 Q 32 8 52 12 Q 50 28 32 30 Q 14 28 12 12 Z"
        fill={ink}
        opacity="0.85"
      />
      {/* sneaky eye slits */}
      <rect x="20" y="18" width="6" height="2" fill={accent} />
      <rect x="38" y="18" width="6" height="2" fill={accent} />
      {/* slim concealed blade vertical */}
      <polygon points="32,30 30,52 34,52" fill={accent} />
      <line x1="32" y1="30" x2="32" y2="52" stroke={ink} strokeWidth="1" />
      <rect x="26" y="52" width="12" height="3" fill={ink} />
      <rect x="30" y="55" width="4" height="5" fill={accent} />
    </g>
  ),

  // 23. โซ่ทองเก้ามังกร — nine golden dragon chains (radial)
  jy_chainmaster: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* central golden hub */}
      <circle cx="32" cy="32" r="6" fill="#facc15" stroke={ink} strokeWidth="2" />
      <circle cx="32" cy="32" r="2.5" fill="#dc2626" />
      {/* nine chain arms radiating */}
      {Array.from({ length: 9 }).map((_, i) => {
        const a = (i * 2 * Math.PI) / 9 - Math.PI / 2;
        const x1 = 32 + Math.cos(a) * 8;
        const y1 = 32 + Math.sin(a) * 8;
        const x2 = 32 + Math.cos(a) * 24;
        const y2 = 32 + Math.sin(a) * 24;
        const xm = 32 + Math.cos(a) * 16;
        const ym = 32 + Math.sin(a) * 16;
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#facc15" strokeWidth="3" />
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={ink} strokeWidth="0.8" />
            <circle cx={xm} cy={ym} r="2" fill="#facc15" stroke={ink} strokeWidth="0.8" />
            {/* small dragon-head tip */}
            <circle cx={x2} cy={y2} r="2" fill="#dc2626" stroke={ink} strokeWidth="0.8" />
          </g>
        );
      })}
    </g>
  ),

  // 24. ดาบเจ้าพระยา — heavy lord's blade with crown motif
  jy_blade_king: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* tiny crown above */}
      <g fill="#facc15" stroke={ink} strokeWidth="1.5">
        <polygon points="22,8 26,4 28,8 32,4 36,8 38,4 42,8 42,12 22,12" />
        <circle cx="32" cy="10" r="1" fill="#dc2626" />
      </g>
      {/* heavy blade — broad and tall */}
      <path
        d="M 22 14 L 42 14 L 44 42 L 38 46 L 26 46 L 20 42 Z"
        fill={accent}
      />
      {/* central blood groove */}
      <line x1="32" y1="16" x2="32" y2="44" stroke={ink} strokeWidth="1.5" />
      {/* edge highlight */}
      <line x1="24" y1="18" x2="22" y2="40" stroke="#fff" strokeWidth="0.8" opacity="0.5" />
      {/* gold cross-guard wide */}
      <rect x="16" y="46" width="32" height="5" fill="#facc15" stroke={ink} strokeWidth="1.5" />
      {/* wide grip */}
      <rect x="28" y="51" width="8" height="7" fill="#7c2d12" stroke={ink} strokeWidth="1" />
      <line x1="28" y1="54" x2="36" y2="54" stroke={ink} strokeWidth="0.8" />
      {/* gem pommel */}
      <polygon points="32,58 28,60 32,62 36,60" fill="#dc2626" stroke={ink} strokeWidth="1" />
    </g>
  ),

  // 25. ตะปบโหม — beast pouncing pawprint
  bst_pounce: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* main paw pad */}
      <ellipse cx="32" cy="42" rx="14" ry="10" fill={accent} />
      {/* four toe pads */}
      <ellipse cx="18" cy="22" rx="4" ry="5" fill={accent} />
      <ellipse cx="28" cy="14" rx="4.5" ry="5.5" fill={accent} />
      <ellipse cx="38" cy="14" rx="4.5" ry="5.5" fill={accent} />
      <ellipse cx="48" cy="22" rx="4" ry="5" fill={accent} />
      {/* claw marks above each toe */}
      <g stroke={ink} strokeWidth="2" fill="none">
        <path d="M 16 14 L 18 10" />
        <path d="M 27 8 L 28 4" />
        <path d="M 38 8 L 39 4" />
        <path d="M 50 14 L 51 10" />
      </g>
      {/* speed/motion lines (right side, indicating pouncing direction) */}
      <g stroke={ink} strokeWidth="1.5" opacity="0.7">
        <line x1="50" y1="46" x2="58" y2="48" />
        <line x1="50" y1="50" x2="56" y2="54" />
      </g>
    </g>
  ),
};

Object.assign(SKILL_ICON_OVERRIDES, BATCH);
