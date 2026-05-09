import type { IconRenderer } from "./skill-icons-registry";
import { SKILL_ICON_OVERRIDES } from "./skill-icons-registry";

// ─── Batch 3: Generic Jianghu T0 + Beast moves ────────────────────────
//
// All icons render inside the 4..60 inner area on a 64×64 viewBox.
// `ink` = frame color (T0 grey #78716c), `accent` = same as ink for T0.
// Style: chunky shapes, stroke 2, readable at 32px. Wuxia ink-on-paper.

const BATCH: Record<string, IconRenderer> = {
  // 1. หมัดตรง — straight jab. Simple closed fist with motion trail.
  basic_punch: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* motion lines behind */}
      <line x1="8" y1="26" x2="20" y2="30" stroke={ink} strokeWidth="2" />
      <line x1="8" y1="32" x2="20" y2="34" stroke={ink} strokeWidth="2" />
      <line x1="8" y1="38" x2="20" y2="38" stroke={ink} strokeWidth="2" />
      {/* fist body */}
      <rect x="22" y="22" width="22" height="22" fill={accent} />
      {/* knuckle ridges on the front (right side) */}
      <rect x="44" y="24" width="4" height="3" fill={ink} />
      <rect x="44" y="29" width="4" height="3" fill={ink} />
      <rect x="44" y="34" width="4" height="3" fill={ink} />
      <rect x="44" y="39" width="4" height="3" fill={ink} />
      {/* thumb on top */}
      <rect x="28" y="18" width="8" height="6" fill={accent} />
      {/* impact star at tip */}
      <polygon points="54,32 50,30 50,34" fill={ink} />
      <line x1="54" y1="28" x2="56" y2="26" stroke={ink} strokeWidth="2" />
      <line x1="54" y1="36" x2="56" y2="38" stroke={ink} strokeWidth="2" />
    </g>
  ),

  // 2. ชิงเฟิงเจี้ยน — slim wind-blade sword. Vertical narrow jian + wind curls.
  qf: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* wind swirls behind blade */}
      <path
        d="M 12 18 Q 20 16 22 22 Q 24 28 18 30"
        fill="none"
        stroke={accent}
        strokeWidth="2"
      />
      <path
        d="M 46 36 Q 54 38 52 44 Q 50 50 44 48"
        fill="none"
        stroke={accent}
        strokeWidth="2"
      />
      {/* slim straight blade pointing up */}
      <polygon points="32,8 30,42 34,42" fill={accent} />
      <line x1="32" y1="10" x2="32" y2="40" stroke={ink} strokeWidth="1" />
      {/* cross-guard */}
      <rect x="24" y="42" width="16" height="3" fill={ink} />
      {/* grip */}
      <rect x="30" y="45" width="4" height="9" fill={accent} />
      {/* pommel */}
      <circle cx="32" cy="56" r="3" fill={ink} />
    </g>
  ),

  // 3. ดามอกุน — heavy great staff (long, hard). Thick pole with iron caps.
  dg: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* thick diagonal staff */}
      <line x1="12" y1="52" x2="52" y2="12" stroke={accent} strokeWidth="9" />
      <line x1="12" y1="52" x2="52" y2="12" stroke={ink} strokeWidth="1" />
      {/* iron caps at both ends */}
      <circle cx="12" cy="52" r="6" fill={ink} />
      <circle cx="52" cy="12" r="6" fill={ink} />
      <circle cx="12" cy="52" r="3" fill={accent} />
      <circle cx="52" cy="12" r="3" fill={accent} />
      {/* iron grip rings */}
      <line x1="22" y1="46" x2="28" y2="40" stroke={ink} strokeWidth="3" />
      <line x1="36" y1="32" x2="42" y2="26" stroke={ink} strokeWidth="3" />
    </g>
  ),

  // 4. เข็มทอง — 4 gold needles in flight. Diagonal converging.
  gn: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="1.5" strokeLinejoin="round">
      {/* 4 needles flying right-down toward target */}
      {/* needle 1 */}
      <line x1="10" y1="14" x2="26" y2="22" stroke="#facc15" strokeWidth="3" />
      <polygon points="26,22 22,20 24,24" fill={ink} />
      {/* needle 2 */}
      <line x1="10" y1="26" x2="26" y2="30" stroke="#facc15" strokeWidth="3" />
      <polygon points="26,30 22,28 24,32" fill={ink} />
      {/* needle 3 */}
      <line x1="10" y1="38" x2="26" y2="36" stroke="#facc15" strokeWidth="3" />
      <polygon points="26,36 22,34 24,38" fill={ink} />
      {/* needle 4 */}
      <line x1="10" y1="50" x2="26" y2="44" stroke="#facc15" strokeWidth="3" />
      <polygon points="26,44 22,42 24,46" fill={ink} />
      {/* impact target — convergence point */}
      <circle cx="44" cy="32" r="6" fill={accent} stroke={ink} strokeWidth="2" />
      <circle cx="44" cy="32" r="2" fill={ink} />
      {/* tail feathers stroke */}
      <line x1="8" y1="12" x2="6" y2="14" stroke={ink} strokeWidth="1.5" />
      <line x1="8" y1="24" x2="6" y2="26" stroke={ink} strokeWidth="1.5" />
      <line x1="8" y1="40" x2="6" y2="38" stroke={ink} strokeWidth="1.5" />
      <line x1="8" y1="52" x2="6" y2="50" stroke={ink} strokeWidth="1.5" />
    </g>
  ),

  // 5. กระบี่เบื้องต้น — basic plain sword. Plain straight jian, no flourish.
  ns1: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* plain straight blade */}
      <polygon points="32,8 28,42 36,42" fill={accent} />
      <line x1="32" y1="10" x2="32" y2="40" stroke={ink} strokeWidth="1" />
      {/* simple cross-guard */}
      <rect x="22" y="42" width="20" height="4" fill={ink} />
      {/* grip with simple wrap */}
      <rect x="29" y="46" width="6" height="10" fill={accent} />
      <line x1="29" y1="49" x2="35" y2="49" stroke={ink} strokeWidth="1" />
      <line x1="29" y1="52" x2="35" y2="52" stroke={ink} strokeWidth="1" />
      {/* small pommel */}
      <rect x="28" y="56" width="8" height="3" fill={ink} />
    </g>
  ),

  // 6. ขอเกี่ยวเบื้องต้น — basic hook with chain. Hook + 3 chain links.
  ns2: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* chain links going from bottom-left up */}
      <ellipse cx="14" cy="50" rx="3" ry="2" fill="none" stroke={ink} strokeWidth="2" />
      <ellipse cx="20" cy="44" rx="2" ry="3" fill="none" stroke={ink} strokeWidth="2" />
      <ellipse cx="26" cy="38" rx="3" ry="2" fill="none" stroke={ink} strokeWidth="2" />
      <ellipse cx="32" cy="32" rx="2" ry="3" fill="none" stroke={ink} strokeWidth="2" />
      {/* hook body — J shape */}
      <path
        d="M 38 28 L 38 14 Q 38 8 44 8 Q 50 8 50 14 L 50 22"
        fill="none"
        stroke={accent}
        strokeWidth="5"
      />
      <path
        d="M 38 28 L 38 14 Q 38 8 44 8 Q 50 8 50 14 L 50 22"
        fill="none"
        stroke={ink}
        strokeWidth="1.5"
      />
      {/* hook barb tip */}
      <polygon points="50,22 47,26 53,26" fill={ink} />
      {/* tassel at chain end */}
      <line x1="14" y1="52" x2="13" y2="58" stroke={ink} strokeWidth="2" />
      <line x1="14" y1="52" x2="15" y2="58" stroke={ink} strokeWidth="2" />
    </g>
  ),

  // 7. กระบี่น้ำ — water-flow sword (sword internal). Sword inside flowing waves.
  nc3: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* water waves behind */}
      <path
        d="M 8 22 Q 16 16 24 22 Q 32 28 40 22 Q 48 16 56 22"
        fill="none"
        stroke="#0ea5e9"
        strokeWidth="2.5"
      />
      <path
        d="M 8 50 Q 16 44 24 50 Q 32 56 40 50 Q 48 44 56 50"
        fill="none"
        stroke="#0ea5e9"
        strokeWidth="2.5"
      />
      {/* slim sword in center */}
      <polygon points="32,12 30,40 34,40" fill={accent} />
      <line x1="32" y1="14" x2="32" y2="38" stroke={ink} strokeWidth="1" />
      <rect x="24" y="40" width="16" height="3" fill={ink} />
      <rect x="30" y="43" width="4" height="8" fill={accent} />
      {/* water droplets along blade */}
      <circle cx="26" cy="28" r="1.5" fill="#0ea5e9" />
      <circle cx="38" cy="34" r="1.5" fill="#0ea5e9" />
    </g>
  ),

  // 8. ฝ่ามือเมฆ — cloud palm wispy. Open palm with cloud trails.
  nc4: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* cloud wisps behind palm */}
      <path
        d="M 8 18 Q 6 14 10 12 Q 14 8 18 12 Q 22 10 22 16"
        fill="#e0f2fe"
        stroke={ink}
        strokeWidth="1.5"
      />
      <path
        d="M 42 48 Q 40 44 44 42 Q 48 38 52 42 Q 56 40 56 46"
        fill="#e0f2fe"
        stroke={ink}
        strokeWidth="1.5"
      />
      {/* open palm — fingers up */}
      <rect x="24" y="30" width="16" height="18" fill={accent} />
      {/* fingers — 4 stubby */}
      <rect x="25" y="20" width="3" height="12" fill={accent} />
      <rect x="29" y="18" width="3" height="14" fill={accent} />
      <rect x="33" y="18" width="3" height="14" fill={accent} />
      <rect x="37" y="20" width="3" height="12" fill={accent} />
      {/* thumb */}
      <rect x="40" y="32" width="6" height="4" fill={accent} />
      {/* palm crease line */}
      <line x1="26" y1="38" x2="38" y2="38" stroke={ink} strokeWidth="1" />
    </g>
  ),

  // 9. ทวนเบื้องต้น — basic spear. Long shaft + leaf-shaped tip + tassel.
  nc5: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* shaft diagonal */}
      <line x1="12" y1="52" x2="48" y2="16" stroke={accent} strokeWidth="5" />
      <line x1="12" y1="52" x2="48" y2="16" stroke={ink} strokeWidth="1" />
      {/* leaf-shaped spearhead */}
      <polygon points="48,16 56,8 52,18 56,16 48,24" fill={accent} />
      <polygon points="48,16 56,8 52,18 56,16 48,24" fill="none" stroke={ink} strokeWidth="2" />
      <line x1="50" y1="14" x2="54" y2="18" stroke={ink} strokeWidth="1" />
      {/* red tassel below tip */}
      <line x1="46" y1="22" x2="44" y2="28" stroke="#dc2626" strokeWidth="2" />
      <line x1="48" y1="20" x2="48" y2="28" stroke="#dc2626" strokeWidth="2" />
      <line x1="50" y1="22" x2="52" y2="28" stroke="#dc2626" strokeWidth="2" />
      {/* shaft butt */}
      <circle cx="12" cy="52" r="3" fill={ink} />
    </g>
  ),

  // 10. กระบองสั้น — short cudgel. Stubby thick club.
  nc6: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* short fat cudgel — diagonal */}
      <path
        d="M 16 50 L 22 44 L 46 16 Q 52 10 54 14 Q 56 18 50 24 L 26 52 L 22 56 Z"
        fill={accent}
      />
      {/* grip wraps near butt */}
      <line x1="18" y1="50" x2="22" y2="54" stroke={ink} strokeWidth="2" />
      <line x1="22" y1="46" x2="26" y2="50" stroke={ink} strokeWidth="2" />
      {/* studded knob detail at striking end */}
      <circle cx="48" cy="18" r="2" fill={ink} />
      <circle cx="44" cy="22" r="1.5" fill={ink} />
      <circle cx="52" cy="14" r="1.5" fill={ink} />
      {/* pommel cap */}
      <circle cx="18" cy="52" r="3" fill={ink} />
    </g>
  ),

  // 11. ดาบยาวพื้นฐาน — basic two-handed long blade. Wide straight blade, two-hand grip.
  nc7: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* wide long blade pointing up */}
      <rect x="27" y="8" width="10" height="32" fill={accent} />
      <line x1="32" y1="10" x2="32" y2="38" stroke={ink} strokeWidth="1" />
      {/* angled tip */}
      <polygon points="27,8 37,8 32,4" fill={accent} />
      {/* heavy guard */}
      <rect x="20" y="40" width="24" height="4" fill={ink} />
      <circle cx="22" cy="42" r="2" fill={accent} />
      <circle cx="42" cy="42" r="2" fill={accent} />
      {/* long two-handed grip */}
      <rect x="29" y="44" width="6" height="14" fill={accent} />
      <line x1="29" y1="48" x2="35" y2="48" stroke={ink} strokeWidth="1" />
      <line x1="29" y1="52" x2="35" y2="52" stroke={ink} strokeWidth="1" />
      <line x1="29" y1="55" x2="35" y2="55" stroke={ink} strokeWidth="1" />
      {/* pommel */}
      <rect x="27" y="58" width="10" height="2" fill={ink} />
    </g>
  ),

  // 12. แส้เบื้องต้น — basic whip. Curling whip lash.
  nc8: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* whip handle */}
      <rect x="8" y="44" width="14" height="6" fill={accent} />
      <line x1="11" y1="44" x2="11" y2="50" stroke={ink} strokeWidth="1" />
      <line x1="15" y1="44" x2="15" y2="50" stroke={ink} strokeWidth="1" />
      <line x1="19" y1="44" x2="19" y2="50" stroke={ink} strokeWidth="1" />
      {/* whip lash — curling S-curve */}
      <path
        d="M 22 47 Q 36 42 42 32 Q 48 22 40 14 Q 32 8 28 16"
        fill="none"
        stroke={accent}
        strokeWidth="4"
      />
      <path
        d="M 22 47 Q 36 42 42 32 Q 48 22 40 14 Q 32 8 28 16"
        fill="none"
        stroke={ink}
        strokeWidth="1"
      />
      {/* whip crack at tip */}
      <line x1="28" y1="16" x2="24" y2="12" stroke={ink} strokeWidth="2" />
      <line x1="28" y1="16" x2="22" y2="18" stroke={ink} strokeWidth="2" />
      <line x1="28" y1="16" x2="26" y2="22" stroke={ink} strokeWidth="2" />
      {/* pommel */}
      <circle cx="8" cy="47" r="3" fill={ink} />
    </g>
  ),

  // 13. พัดพื้นฐาน — basic folding fan. Half-open fan with ribs.
  nc9: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* fan body — half circle radiating from bottom */}
      <path
        d="M 32 52 L 14 22 Q 32 14 50 22 Z"
        fill={accent}
      />
      {/* ribs */}
      <line x1="32" y1="50" x2="16" y2="24" stroke={ink} strokeWidth="1.5" />
      <line x1="32" y1="50" x2="22" y2="20" stroke={ink} strokeWidth="1.5" />
      <line x1="32" y1="50" x2="32" y2="16" stroke={ink} strokeWidth="1.5" />
      <line x1="32" y1="50" x2="42" y2="20" stroke={ink} strokeWidth="1.5" />
      <line x1="32" y1="50" x2="48" y2="24" stroke={ink} strokeWidth="1.5" />
      {/* upper edge */}
      <path
        d="M 14 22 Q 32 14 50 22"
        fill="none"
        stroke={ink}
        strokeWidth="2"
      />
      {/* pivot rivet */}
      <circle cx="32" cy="52" r="3" fill={ink} />
      <circle cx="32" cy="52" r="1" fill={accent} />
      {/* small calligraphy dots on fan face */}
      <circle cx="28" cy="32" r="1" fill={ink} />
      <circle cx="32" cy="28" r="1" fill={ink} />
      <circle cx="36" cy="32" r="1" fill={ink} />
    </g>
  ),

  // 14. ขอเกี่ยวพื้นฐาน — basic grappling hook. 3-prong hook + rope.
  nc10: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* coiled rope at bottom-left */}
      <ellipse cx="14" cy="50" rx="6" ry="2" fill="none" stroke={ink} strokeWidth="2" />
      <ellipse cx="14" cy="48" rx="6" ry="2" fill="none" stroke={ink} strokeWidth="2" />
      {/* rope rising up */}
      <path
        d="M 18 46 Q 24 38 28 30 Q 32 22 32 18"
        fill="none"
        stroke={ink}
        strokeWidth="2"
      />
      {/* 3-prong grappling hook at top */}
      {/* central shaft */}
      <rect x="30" y="14" width="4" height="10" fill={accent} />
      {/* hooks splaying out */}
      <path
        d="M 32 14 Q 24 12 22 6 L 24 6 Q 28 12 32 14"
        fill={accent}
      />
      <path
        d="M 32 14 Q 40 12 42 6 L 40 6 Q 36 12 32 14"
        fill={accent}
      />
      <path
        d="M 32 10 L 32 4"
        stroke={accent}
        strokeWidth="3"
      />
      <polygon points="32,4 30,8 34,8" fill={accent} />
      {/* hook outlines */}
      <path
        d="M 22 6 Q 24 12 32 14 Q 40 12 42 6"
        fill="none"
        stroke={ink}
        strokeWidth="2"
      />
      <line x1="32" y1="4" x2="32" y2="14" stroke={ink} strokeWidth="1" />
      {/* ring connector */}
      <circle cx="32" cy="24" r="3" fill="none" stroke={ink} strokeWidth="2" />
    </g>
  ),

  // 15. เขี้ยวงับ (bst_bite) — fang biting. Two opposing fangs + chomp lines.
  bst_bite: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* upper jaw — curve with teeth */}
      <path
        d="M 10 20 Q 32 12 54 20"
        fill="none"
        stroke={ink}
        strokeWidth="3"
      />
      {/* upper fangs — 2 large + 2 small */}
      <polygon points="20,20 16,30 22,28" fill={accent} stroke={ink} strokeWidth="1.5" />
      <polygon points="44,20 48,30 42,28" fill={accent} stroke={ink} strokeWidth="1.5" />
      <polygon points="28,22 27,28 30,28" fill={accent} stroke={ink} strokeWidth="1" />
      <polygon points="36,22 35,28 38,28" fill={accent} stroke={ink} strokeWidth="1" />
      {/* lower jaw */}
      <path
        d="M 10 44 Q 32 52 54 44"
        fill="none"
        stroke={ink}
        strokeWidth="3"
      />
      {/* lower fangs */}
      <polygon points="20,44 16,34 22,36" fill={accent} stroke={ink} strokeWidth="1.5" />
      <polygon points="44,44 48,34 42,36" fill={accent} stroke={ink} strokeWidth="1.5" />
      <polygon points="28,42 27,36 30,36" fill={accent} stroke={ink} strokeWidth="1" />
      <polygon points="36,42 35,36 38,36" fill={accent} stroke={ink} strokeWidth="1" />
      {/* chomp impact lines on sides */}
      <line x1="6" y1="32" x2="10" y2="32" stroke={ink} strokeWidth="2" />
      <line x1="54" y1="32" x2="58" y2="32" stroke={ink} strokeWidth="2" />
      <line x1="6" y1="26" x2="9" y2="28" stroke={ink} strokeWidth="2" />
      <line x1="55" y1="28" x2="58" y2="26" stroke={ink} strokeWidth="2" />
    </g>
  ),

  // 16. กรงเล็บฉีก (bst_claw) — slashing claw. 4 parallel slash marks.
  bst_claw: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* 4 parallel diagonal slash marks — wider on one end */}
      {/* slash 1 (leftmost, longest) */}
      <path
        d="M 10 50 Q 16 32 18 12"
        fill="none"
        stroke={accent}
        strokeWidth="5"
      />
      <path
        d="M 10 50 Q 16 32 18 12"
        fill="none"
        stroke={ink}
        strokeWidth="1.5"
      />
      {/* slash 2 */}
      <path
        d="M 22 52 Q 28 34 30 14"
        fill="none"
        stroke={accent}
        strokeWidth="5"
      />
      <path
        d="M 22 52 Q 28 34 30 14"
        fill="none"
        stroke={ink}
        strokeWidth="1.5"
      />
      {/* slash 3 */}
      <path
        d="M 34 54 Q 40 36 42 16"
        fill="none"
        stroke={accent}
        strokeWidth="5"
      />
      <path
        d="M 34 54 Q 40 36 42 16"
        fill="none"
        stroke={ink}
        strokeWidth="1.5"
      />
      {/* slash 4 (rightmost, shortest) */}
      <path
        d="M 46 56 Q 52 40 54 22"
        fill="none"
        stroke={accent}
        strokeWidth="5"
      />
      <path
        d="M 46 56 Q 52 40 54 22"
        fill="none"
        stroke={ink}
        strokeWidth="1.5"
      />
      {/* small blood-red drips at slash bottoms */}
      <circle cx="10" cy="52" r="1.5" fill="#dc2626" />
      <circle cx="34" cy="56" r="1.5" fill="#dc2626" />
    </g>
  ),

  // 17. พุ่งเข้าชน (bst_charge) — charging beast head. Bull/boar head w/ horns + speed lines.
  bst_charge: ({ ink, accent }) => (
    <g stroke={ink} strokeWidth="2" strokeLinejoin="round">
      {/* speed lines behind */}
      <line x1="6" y1="20" x2="18" y2="22" stroke={ink} strokeWidth="2" />
      <line x1="6" y1="32" x2="18" y2="32" stroke={ink} strokeWidth="2" />
      <line x1="6" y1="44" x2="18" y2="42" stroke={ink} strokeWidth="2" />
      {/* beast head — angular bull/boar profile facing right */}
      <path
        d="M 22 22 L 22 44 Q 22 50 28 50 L 46 50 Q 54 50 54 42 L 54 26 Q 54 18 46 18 Q 36 18 22 22 Z"
        fill={accent}
      />
      {/* head outline */}
      <path
        d="M 22 22 L 22 44 Q 22 50 28 50 L 46 50 Q 54 50 54 42 L 54 26 Q 54 18 46 18 Q 36 18 22 22 Z"
        fill="none"
        stroke={ink}
        strokeWidth="2"
      />
      {/* two curved horns sweeping up-back from top of head */}
      <path
        d="M 28 22 Q 24 14 20 10"
        fill="none"
        stroke={ink}
        strokeWidth="3"
      />
      <path
        d="M 42 20 Q 40 12 36 8"
        fill="none"
        stroke={ink}
        strokeWidth="3"
      />
      {/* horn tips */}
      <circle cx="20" cy="10" r="2" fill={ink} />
      <circle cx="36" cy="8" r="2" fill={ink} />
      {/* angry eye */}
      <polygon points="40,28 46,28 44,32" fill={ink} />
      {/* snout / nostril */}
      <circle cx="52" cy="38" r="2" fill={ink} />
      <circle cx="52" cy="44" r="1.5" fill={ink} />
      {/* tusk poking out */}
      <polygon points="48,46 50,52 52,46" fill="#fff" stroke={ink} strokeWidth="1" />
    </g>
  ),
};

Object.assign(SKILL_ICON_OVERRIDES, BATCH);
