// ชีพจร — the 95 meridian charts (content). See lib/game/meridian-types.ts.
//
// T0 20 · T1 20 · T2 15 · T3 15 · T4 15 · T5 10 charts; points per chart by
// MERIDIAN_NODES_BY_TIER; three ranks per point. Each point is written as
// n(id, Thai name, body spot, { key: [rank1, rank2, rank3] }) — the numbers
// are what each rank ADDS (rank 2 = rank 1's + rank 2's). Keys are base stats
// (STR…INT) or combat fields (atk, pd, id_, hp, mp, pa, ia, spd, acc, res, cri,
// eva, pct_atk, pct_red, hp_regen).
//
// Requirements: many moves of mixed tiers, all learnable by one hero — jianghu
// (ยุทธจักร) moves plus moves of at most one sect:
//   T0 2–3 · T1 3–4 · T2 4–5 · T3 5–6 · T4 6–7 · T5 7–8 skills + arts.
//
// Balance (a chart fully opened, in base-stat points; combat fields count
// 1 point = atk 4.5 · pd/id_/pa/acc/eva 3 · ia 4.5 · hp 30 · mp 15 · spd/res 2.25 · cri 1.5).
// Within each band a chart that asks for more moves (and has more points) sits higher:
//   base / combat  T0 8–12 · T1 20–26 · T2 36–44 · T3 52–62 · T4 72–82 · T5 100–115
//   ability        % attack T0 3–4 · T1 6.5–7.5 · T2 10.5–11.5 · T3 14.5–15.5 · T4 19.5–20.5 · T5 24–26
//                  % damage reduction T0 2.5–3.5 · T1 5.5–6.5 · T2 8.5–9.5 · T3 11.5–12.5 · T4 15–16.5 · T5 19–20
//                  % HP per turn T0 0.75–1 · T1 1.5–2 · T2 2.25–2.75 · T3 3–3.5 · T4 4–4.75 · T5 5.5–6
//                  (two effects: 85 % each) on the last point and every second one back;
//                  the points between carry support stats at 80 % of the base budget
//   buff           stats at 80 % of the base budget, the last point adds 70 % of the ability
//                  total (45 % each for two effects, 35 % each for three)
// Charts without a battle effect give 40 % more stats than the band above;
// each effect a chart carries costs 6 % of its stats (1: ×0.94, 2: ×0.88, 3: ×0.82).
// (The % attack / reduction / HP-regen effects of ability and buff charts are not scaled.)
//
// Battle effects: the optional 5th argument of n(); they switch on when that
// point is filled (rank 3) — the last point, or a "gate" point in the middle
// (n / 2) or the first quarter (n / 4).
//   opening  +v % for the first 5 turns: T0 5 · T1 8 · T2 12 · T3 16 · T4 20 · T5 25 (spd/cri/eva/acc ×0.7)
//   rage     per stack fire/earth/wind T0 2 · T1 3 … T5 8 %, water 0.75 … 2.5, thunder 2 … 7;
//            chance 20 → 40 %, 3 → 5 turns, 3 → 5 stacks
//   shield   % of max HP: T0 3 · T1 5 · T2 8 · T3 12 · T4 16 · T5 22
//   ward     debuffs blocked: T0–T1 2 · T2 3 · T3+ 5
//   sap      chance 15 → 35 %, v 6 → 20 %, 2 turns (3 at T4–T5)
//   revive   50 % HP, T3+ only and rare
// About 45 % of each tier's charts carry 1–3 effects; the rest are stat-heavy.
// Where each chart's item is found: lib/world/data/meridian-sources.ts.

import type { MeridianChart, MeridianCombat, MeridianEffect, MeridianNode, MeridianBodyPoint, MeridianRank } from "../meridian-types";
import type { PartialStats, StatKey } from "../types";

type Key = StatKey | keyof MeridianCombat;
type Three = readonly [number, number, number];
const BASE: readonly string[] = ["STR", "AGI", "POW", "VIT", "DEX", "LUK", "DEF", "INT"];

/** One point: per-key increments for ranks 1, 2 and 3. */
function n(id: string, name: string, at: MeridianBodyPoint, values: Partial<Record<Key, Three>>, effects?: readonly MeridianEffect[]): MeridianNode {
  const ranks = [0, 1, 2].map((r) => {
    const stats: PartialStats = {};
    const combat: Partial<MeridianCombat> = {};
    let hasStats = false;
    let hasCombat = false;
    for (const [k, v] of Object.entries(values) as [Key, Three][]) {
      if (BASE.includes(k)) { stats[k as StatKey] = v[r]; hasStats = true; }
      else { combat[k as keyof MeridianCombat] = v[r]; hasCombat = true; }
    }
    const rank: MeridianRank = {};
    if (hasStats) rank.stats = stats;
    if (hasCombat) rank.combat = combat;
    return rank;
  }) as unknown as readonly [MeridianRank, MeridianRank, MeridianRank];
  return effects ? { id, name, at, ranks, effects } : { id, name, at, ranks };
}

// ─── T0 ────────────────────────────────────────────────────────────
const T0: readonly MeridianChart[] = [
  {
    id: "root_breath", name: "ชีพจรรากลมปราณ", ti: 0, kind: "base",
    description: "เส้นลมปราณสั้นที่สุดใต้สะดือ ผู้เริ่มฝึกห้าธาตุใช้เป็นที่หยั่งรากพลังภายในก่อนสิ่งใด",
    requires: { skills: ["nc10"], arts: ["t0_fiveyuan"] },
    nodes: [
      n("qihai", "จุดฉี่ไห่", "dantian", { POW: [2, 2, 2] }),
      n("tianshu", "จุดเทียนซู", "navel", { POW: [2, 2, 3] }),
    ],
  },
  {
    id: "iron_sinew", name: "ชีพจรเอ็นเหล็กน้อย", ti: 0, kind: "base",
    description: "เส้นเอ็นแขนขวาที่นักดาบยาวฝึกจนแข็งดั่งลวดเหล็ก ยกดาบหนักได้ไม่สั่น",
    requires: { skills: ["nm1", "nc7"], arts: ["t0_ironshirt"] },
    nodes: [
      n("tianjing_r", "จุดเทียนจิ่ง", "r_elbow", { STR: [2, 2, 3] }),
      n("yangchi_r", "จุดหยางฉือ", "r_wrist", { STR: [3, 3, 4] }),
    ],
  },
  {
    id: "light_heel", name: "ชีพจรส้นเท้าเบา", ti: 0, kind: "base",
    description: "ปราณผีเสื้อไหลลงสู่ส้นเท้า ก้าวเดินเบาราวไม่แตะพื้น",
    requires: { skills: ["qf"], arts: ["t0_butterfly"] },
    nodes: [
      n("sanyinjiao_l", "จุดซานอินเจียว", "l_ankle", { AGI: [2, 2, 2] }),
      n("yongquan_l", "จุดหย่งเฉวียน", "l_sole", { AGI: [2, 2, 3] }),
    ],
  },
  {
    id: "stone_skin", name: "ชีพจรผิวศิลา", ti: 0, kind: "base",
    description: "ศิษย์ซงซานกลั้นปราณไว้กลางอก ผิวกายกระด้างรับหมัดได้ดั่งหินผา",
    requires: { skills: ["ssh_iron_strike", "ssh_basic_sword"], arts: ["t0_ssh_qi"] },
    nodes: [
      n("tanzhong", "จุดถานจง", "chest", { DEF: [5, 5, 5] }),
    ],
  },
  {
    id: "clear_eye", name: "ชีพจรตาใส", ti: 0, kind: "base",
    description: "จุดกลางหว่างคิ้วของช่างเข็มทอง เปิดแล้วตามองเห็นช่องว่างเล็กเท่าปลายเข็ม",
    requires: { skills: ["gn", "nc8"] },
    nodes: [
      n("yintang", "จุดอิ้นถัง", "brow", { DEX: [3, 4, 4] }),
    ],
  },
  {
    id: "lucky_cloud", name: "ชีพจรเมฆมงคล", ti: 0, kind: "base",
    description: "หมอดูเร่ร่อนเชื่อว่าเมฆมงคลวนอยู่เหนือกระหม่อม ผู้เปิดเส้นนี้มักเจอโชคกลางทาง",
    requires: { skills: ["nd2", "nc9"], arts: ["t0_ironshirt"] },
    nodes: [
      n("baihui", "จุดไป่ฮุ่ย", "crown", { LUK: [2, 2, 3] }),
      n("shangxing", "จุดซั่งซิง", "brow", { LUK: [3, 3, 4] }),
    ],
  },
  {
    id: "scholar_lamp", name: "ชีพจรตะเกียงบัณฑิต", ti: 0, kind: "base",
    description: "ตะเกียงในกระหม่อมที่บัณฑิตจุดด้วยการนับเจ็ดดาว ความคิดแจ่มใสตลอดคืน",
    requires: { skills: ["nc3"], arts: ["t0_sevenstar"] },
    nodes: [
      n("baihui", "จุดไป่ฮุ่ย", "crown", { INT: [3, 4, 4] }),
    ],
  },
  {
    id: "ox_back", name: "ชีพจรหลังวัวเหล็ก", ti: 0, kind: "base",
    description: "เส้นแผ่นหลังที่พระเณรเส้าหลินฝึกด้วยการแบกน้ำขึ้นเขา ทนทานดั่งวัวไถนา",
    requires: { skills: ["nd5", "sf", "sl_long_dharma"] },
    nodes: [
      n("mingmen", "จุดมิ่งเหมิน", "lower_back", { VIT: [2, 2, 3] }),
      n("lingtai", "จุดหลิงไถ", "upper_back", { VIT: [3, 3, 4] }),
    ],
  },
  {
    id: "first_edge", name: "ชีพจรคมแรก", ti: 0, kind: "combat",
    description: "เส้นแรกที่ครูกระบี่ทุกสำนักสอนให้รู้จัก แรงจากไหล่ส่งถึงข้อมือไม่ตกหล่น",
    requires: { skills: ["ns1", "nc3"] },
    nodes: [
      n("zhongfu_r", "จุดจงฝู่", "r_shoulder", { atk: [9, 9, 9] }),
      n("lieque_r", "จุดเลี่ยเชวีย", "r_wrist", { atk: [10, 11, 11] }),
    ],
  },
  {
    id: "turtle_shell", name: "ชีพจรกระดองเต่า", ti: 0, kind: "combat",
    description: "ปราณเกราะผ้าเหล็กแผ่คลุมแผ่นหลังดั่งกระดองเต่า กันทั้งหมัดและพลังฝ่ามือ",
    requires: { skills: ["nd4", "dg"], arts: ["t0_ironshirt"] },
    nodes: [
      n("feishu", "จุดเฟ่ยซู", "upper_back", { pd: [5, 5, 5] }, [{ t: "ward", count: 2 }]),
      n("mingmen", "จุดมิ่งเหมิน", "lower_back", { id_: [6, 6, 6] }, [{ t: "shield", pct: 3 }]),
    ],
  },
  {
    id: "blood_spring", name: "ชีพจรน้ำพุโลหิต", ti: 0, kind: "combat",
    description: "จุดใต้หัวใจที่สูบเลือดให้แรงขึ้น บาดแผลเดิมก็ไม่ทำให้ล้มง่าย",
    requires: { skills: ["nc4", "nc6"] },
    nodes: [
      n("jiuwei", "จุดจิ๋วเหว่ย", "heart", { hp: [110, 110, 110] }),
    ],
  },
  {
    id: "swift_step", name: "ชีพจรก้าวไว", ti: 0, kind: "combat",
    description: "คนใช้แส้ต้องถอยเร็วกว่าคู่ต่อสู้หนึ่งก้าว เส้นนี้ทำให้เข่าและข้อเท้าไวขึ้น",
    requires: { skills: ["pn", "nc8", "ns2"] },
    nodes: [
      n("zusanli_r", "จุดจู๋ซานหลี่", "r_knee", { spd: [3, 4, 4] }),
      n("kunlun_r", "จุดคุนหลุน", "r_ankle", { eva: [6, 6, 6] }, [{ t: "opening", stat: "spd", v: 4, turns: 5 }]),
    ],
  },
  {
    id: "needle_eye", name: "ชีพจรรูเข็ม", ti: 0, kind: "combat",
    description: "สกุลถังสอนให้ปล่อยมีดบินจากข้อมือ ไม่ใช่จากไหล่ เส้นนี้ทำให้มือนิ่งและแม่น",
    requires: { skills: ["tang_basic_knife", "nc10"] },
    nodes: [
      n("shenmen_r", "จุดเสินเหมิน", "r_wrist", { acc: [4, 4, 4] }),
      n("hegu_r", "จุดเหอกู่", "r_palm", { cri: [2, 3, 3] }, [{ t: "sap", stat: "eva", v: 6, turns: 2, chance: 15 }]),
    ],
  },
  {
    id: "inner_pool", name: "ชีพจรสระปราณ", ti: 0, kind: "combat",
    description: "นักพรตอู่ตังนั่งสมาธิให้ปราณไหลลงสู่ตันเถียนดั่งน้ำเติมสระ",
    requires: { skills: ["wd_taiji_sword", "tj"], arts: ["t0_meditation"] },
    nodes: [
      n("zhongwan", "จุดจงหว่าน", "solar", { mp: [35, 35, 35] }),
      n("qihai", "จุดฉี่ไห่", "dantian", { ia: [15, 15, 15] }),
    ],
  },
  {
    id: "tiger_mouth", name: "ชีพจรปากเสือ", ti: 0, kind: "ability",
    description: "จุดเหอกู่ที่ง่ามนิ้วโป้งคือปากเสือ เปิดแล้วทุกการจับอาวุธหนักแน่นขึ้น",
    requires: { skills: ["dg", "nc5"] },
    nodes: [
      n("hegu_r", "จุดเหอกู่", "r_palm", { pct_atk: [1, 1, 1] }, [{ t: "opening", stat: "atk", v: 5, turns: 5 }]),
    ],
  },
  {
    id: "still_water", name: "ชีพจรน้ำนิ่ง", ti: 0, kind: "ability",
    description: "ใจนิ่งดั่งน้ำในบ่อ แรงกระแทกที่เข้ามาก็กระจายหายไปครึ่งหนึ่ง",
    requires: { skills: ["em_blossom_sword", "em_graceful_sword"], arts: ["t0_em_meditation"] },
    nodes: [
      n("qihai", "จุดฉี่ไห่", "dantian", { DEF: [1, 1, 1] }),
      n("mingmen", "จุดมิ่งเหมิน", "lower_back", { pct_red: [1, 1, 1.5] }, [{ t: "shield", pct: 3 }]),
    ],
  },
  {
    id: "dew_drop", name: "ชีพจรหยาดน้ำค้าง", ti: 0, kind: "ability",
    description: "ปราณเย็นที่สะดือหยดลงทีละหยดดั่งน้ำค้างยามเช้า บาดแผลเล็กค่อย ๆ สมาน",
    requires: { skills: ["nc3", "qf"] },
    nodes: [
      n("yinjiao", "จุดอินเจียว", "navel", { hp_regen: [0.25, 0.25, 0.25] }, [{ t: "rage", element: "water", v: 0.75, turns: 3, chance: 20, maxStacks: 3 }]),
    ],
  },
  {
    id: "wind_gate", name: "ชีพจรประตูลม", ti: 0, kind: "ability",
    description: "ลมกระบี่ชิงเฟิงพัดผ่านต้นคอขึ้นสู่กระหม่อม ทุกกระบวนท่าคมขึ้นอีกเส้นผม",
    requires: { skills: ["nd11", "qf", "ns1"] },
    nodes: [
      n("fengchi", "จุดเฟิงฉือ", "nape", { AGI: [1, 1, 1] }, [{ t: "sap", stat: "eva", v: 6, turns: 2, chance: 15 }]),
      n("baihui", "จุดไป่ฮุ่ย", "crown", { pct_atk: [1, 1.5, 1.5] }, [{ t: "rage", element: "wind", v: 2, turns: 3, chance: 20, maxStacks: 3 }, { t: "opening", stat: "spd", v: 4, turns: 5 }]),
    ],
  },
  {
    id: "morning_sun", name: "ชีพจรตะวันแรก", ti: 0, kind: "buff",
    description: "ศิษย์ไท่ซานรับแสงอรุณแรกที่ยอดเขาตะวันออก ปราณอุ่นลุกจากท้องขึ้นสู่อก",
    requires: { skills: ["tsh_basic_sword"], arts: ["t0_tsh_qi"] },
    nodes: [
      n("qihai", "จุดฉี่ไห่", "dantian", { STR: [1, 1, 1] }, [{ t: "rage", element: "fire", v: 2, turns: 3, chance: 20, maxStacks: 3 }]),
      n("tanzhong", "จุดถานจง", "chest", { STR: [1, 1, 1], pct_atk: [0.5, 1, 1] }, [{ t: "opening", stat: "atk", v: 5, turns: 5 }]),
    ],
  },
  {
    id: "plum_branch", name: "ชีพจรกิ่งเหมย", ti: 0, kind: "buff",
    description: "กิ่งเหมยอ่อนแต่ไม่หักกลางหิมะ เส้นนี้ทำให้มือซ้ายปัดป้องได้นุ่มนวล",
    requires: { skills: ["xy_pathless_sword", "xy_lesserdemon_blade"], arts: ["t0_xy_plum"] },
    nodes: [
      n("lieque_l", "จุดเลี่ยเชวีย", "l_wrist", { DEX: [1, 1, 2] }, [{ t: "ward", count: 2 }]),
      n("laogong_l", "จุดเหลาข่ง", "l_palm", { DEX: [1, 2, 2], pct_red: [0.5, 1, 1] }, [{ t: "opening", stat: "reduce", v: 5, turns: 5 }]),
    ],
  },
];

// ─── T1 ────────────────────────────────────────────────────────────
const T1: readonly MeridianChart[] = [
  {
    id: "leopard_spine", name: "ชีพจรสันหลังเสือดาว", ti: 1, kind: "base",
    description: "สันหลังโค้งงอได้ดั่งเสือดาวก่อนกระโจน แรงพุ่งออกจากกระดูกก้นกบถึงต้นคอ",
    requires: { skills: ["nd7", "nc4"], arts: ["t0_fiveyuan"] },
    nodes: [
      n("huiyin", "จุดฮุ่ยอิน", "tailbone", { AGI: [2, 2, 3] }),
      n("shenshu", "จุดเซิ่นซู", "lower_back", { STR: [2, 2, 3] }),
      n("gaohuang", "จุดเกาหวง", "upper_back", { AGI: [2, 3, 3] }),
      n("fengfu", "จุดเฟิงฝู่", "nape", { STR: [3, 3, 3] }),
    ],
  },
  {
    id: "bronze_bell", name: "ชีพจรระฆังทองแดง", ti: 1, kind: "base",
    description: "ขั้นแรกของกระดิ่งทอง ลำตัวด้านหน้าก้องกังวานรับแรงตีดั่งระฆังทองแดง",
    requires: { skills: ["sl_staff_dharma", "sf", "sl_long_dharma"], arts: ["t1_goldenbell"] },
    nodes: [
      n("tiantu", "จุดเทียนทู", "throat", { DEF: [3, 3, 3] }),
      n("yutang", "จุดอวี้ถัง", "chest", { VIT: [3, 4, 4] }),
      n("qimen", "จุดฉีเหมิน", "solar", { DEF: [4, 4, 5] }),
    ],
  },
  {
    id: "cloud_mind", name: "ชีพจรจิตเมฆา", ti: 1, kind: "base",
    description: "จิตล่องลอยตามเมฆแต่ไม่หลงทาง นักพรตใช้เส้นนี้ฝึกให้ความคิดโปร่ง",
    requires: { skills: ["tj"], arts: ["t1_naturalqi", "t0_meditation"] },
    nodes: [
      n("houding", "จุดโฮ่วติ่ง", "crown", { INT: [2, 3, 3] }),
      n("shangxing", "จุดซั่งซิง", "brow", { POW: [3, 3, 3] }),
      n("lianquan", "จุดเหลียนเฉวียน", "throat", { INT: [3, 4, 4] }),
    ],
  },
  {
    id: "river_arm", name: "ชีพจรแขนสายน้ำ", ti: 1, kind: "base",
    description: "แรงไหลจากไหล่ถึงฝ่ามือดั่งสายน้ำไม่สะดุด ดาบน้ำค้างจึงทั้งหนักและเร็ว",
    requires: { skills: ["nm1", "nc7"], arts: ["t1_eagleclaw", "t0_fiveyuan"] },
    nodes: [
      n("jianzhen_r", "จุดเจียนเจิน", "r_shoulder", { STR: [2, 3, 3] }),
      n("shousanli_r", "จุดโส่วซานหลี่", "r_elbow", { DEX: [3, 3, 3] }),
      n("neiguan_r", "จุดเน่ยกวน", "r_wrist", { STR: [3, 3, 3] }),
      n("hegu_r", "จุดเหอกู่", "r_palm", { DEX: [3, 3, 4] }),
    ],
  },
  {
    id: "crane_leg", name: "ชีพจรขากระเรียน", ti: 1, kind: "base",
    description: "ยืนขาเดียวดั่งกระเรียนริมบึงได้ทั้งวัน ขาซ้ายมั่นคงและเบาในเวลาเดียวกัน",
    requires: { skills: ["nd2", "nc9"], arts: ["t0_butterfly"] },
    nodes: [
      n("juliao_l", "จุดจวีเหลียว", "l_hip", { AGI: [2, 2, 3] }),
      n("yanglingquan_l", "จุดหยางหลิงเฉวียน", "l_knee", { LUK: [2, 2, 3] }),
      n("jiexi_l", "จุดเจี่ยซี", "l_ankle", { AGI: [2, 3, 3] }),
      n("taibai_l", "จุดไท่ไป๋", "l_sole", { LUK: [3, 3, 3] }),
    ],
  },
  {
    id: "mountain_root", name: "ชีพจรรากภูผา", ti: 1, kind: "base",
    description: "ปราณหนักดั่งเหล็กหยั่งจากท้องลงฝ่าเท้า ผลักอย่างไรก็ไม่ขยับ",
    requires: { skills: ["ssh_basic_sword"], arts: ["t1_ssh_iron", "t1_blackiron", "t0_ssh_qi"] },
    nodes: [
      n("guanyuan", "จุดกวนเอวี๋ยน", "dantian", { VIT: [3, 3, 3] }),
      n("yanglingquan_r", "จุดหยางหลิงเฉวียน", "r_knee", { DEF: [3, 4, 4] }),
      n("yinbai_r", "จุดอิ่นไป๋", "r_sole", { VIT: [4, 4, 5] }),
    ],
  },
  {
    id: "fox_heart", name: "ชีพจรใจจิ้งจอก", ti: 1, kind: "base",
    description: "ใจเจ้าเล่ห์ดั่งจิ้งจอก มือเข็มพิษอ่านคู่ต่อสู้ออกก่อนเขาจะขยับ",
    requires: { skills: ["pn", "gn", "nc8"] },
    nodes: [
      n("lingxu", "จุดหลิงซวี", "heart", { LUK: [2, 3, 3] }),
      n("jianli", "จุดเจี้ยนหลี่", "solar", { INT: [3, 3, 3] }),
      n("tianshu", "จุดเทียนซู", "navel", { LUK: [3, 4, 4] }),
    ],
  },
  {
    id: "eagle_talon", name: "ชีพจรกรงเล็บอินทรี", ti: 1, kind: "combat",
    description: "เส้นแขนซ้ายของผู้ฝึกกรงเล็บอินทรี จับแล้วบีบจนกระดูกลั่น",
    requires: { skills: ["ns2", "nc10"], arts: ["t1_eagleclaw", "t1_whitehorse"] },
    nodes: [
      n("yunmen_l", "จุดอวิ๋นเหมิน", "l_shoulder", { pa: [5, 5, 5] }),
      n("quchi_l", "จุดชวี่ฉือ", "l_elbow", { cri: [3, 3, 3] }),
      n("shenmen_l", "จุดเสินเหมิน", "l_wrist", { pa: [6, 6, 6] }),
      n("shaoshang_l", "จุดเส้าซาง", "l_palm", { cri: [3, 4, 4] }, [{ t: "sap", stat: "def", v: 8, turns: 2, chance: 15 }]),
    ],
  },
  {
    id: "white_horse", name: "ชีพจรม้าขาวทะยาน", ti: 1, kind: "combat",
    description: "ปราณม้าขาววิ่งพันลี้ไม่หอบ ขาซ้ายพาร่างพุ่งเข้าออกวงต่อสู้",
    requires: { skills: ["nc6", "nc5"], arts: ["t1_whitehorse"] },
    nodes: [
      n("huantiao_l", "จุดหวนเทียว", "l_hip", { spd: [3, 4, 4] }, [{ t: "rage", element: "wind", v: 3, turns: 3, chance: 20, maxStacks: 3 }]),
      n("yinlingquan_l", "จุดอินหลิงเฉวียน", "l_knee", { hp: [60, 60, 60] }),
      n("zhaohai_l", "จุดเจ้าไห่", "l_ankle", { spd: [5, 5, 6] }, [{ t: "opening", stat: "spd", v: 6, turns: 5 }]),
    ],
  },
  {
    id: "black_iron_wall", name: "ชีพจรกำแพงเหล็กดำ", ti: 1, kind: "combat",
    description: "แผ่นหลังที่ฝึกฝ่ามือเกราะคู่กับปราณเหล็กดำ ตั้งรับได้ดั่งกำแพงเมือง",
    requires: { skills: ["nm2", "nc4", "dg"], arts: ["t1_blackiron"] },
    nodes: [
      n("fengfu", "จุดเฟิงฝู่", "nape", { pd: [9, 9, 9] }),
      n("shenzhu", "จุดเซินจู้", "upper_back", { id_: [11, 11, 11] }),
      n("mingmen", "จุดมิ่งเหมิน", "lower_back", { pd: [13, 13, 13] }),
    ],
  },
  {
    id: "red_lotus_flame", name: "ชีพจรเพลิงบัวแดง", ti: 1, kind: "combat",
    description: "เปลวไฟเล็ก ๆ ผลิบานจากตันเถียนขึ้นถึงอก ฝ่ามือที่ส่งออกจึงร้อนระอุ",
    requires: { skills: ["nc9"], arts: ["t1_redlotus", "t0_sevenstar"] },
    nodes: [
      n("shimen", "จุดสือเหมิน", "dantian", { ia: [10, 11, 11] }),
      n("shangwan", "จุดซั่งหว่าน", "solar", { atk: [10, 11, 11] }),
      n("juque", "จุดจวี้เชวี่ย", "heart", { ia: [12, 12, 12] }),
      n("xuanji", "จุดซวนจี", "chest", { atk: [13, 14, 14] }),
    ],
  },
  {
    id: "north_star_edge", name: "ชีพจรคมดาวเหนือ", ti: 1, kind: "combat",
    description: "ตาจับดาวเหนือ มือส่งดาบตามสายตา ฟันครั้งใดตรงเป้าครั้งนั้น",
    requires: { skills: ["nd3", "nd11", "ns1", "qf"] },
    nodes: [
      n("shenting", "จุดเสินถิง", "brow", { atk: [12, 12, 12] }),
      n("jianzhen_r", "จุดเจียนเจิน", "r_shoulder", { acc: [9, 9, 9] }),
      n("shousanli_r", "จุดโส่วซานหลี่", "r_elbow", { atk: [13, 14, 14] }),
      n("shenmen_r", "จุดเสินเหมิน", "r_wrist", { acc: [10, 10, 10] }),
    ],
  },
  {
    id: "cloud_mist_step", name: "ชีพจรก้าวเมฆหมอก", ti: 1, kind: "combat",
    description: "ศิษย์อู่ตังเดินบนเมฆหมอกด้วยแรงจากสะโพก ร่างพร่าเลือนจนคู่ต่อสู้จับไม่ได้",
    requires: { skills: ["cs", "tj"], arts: ["t0_meditation"] },
    nodes: [
      n("tianshu", "จุดเทียนซู", "navel", { eva: [8, 8, 8] }),
      n("huantiao_r", "จุดหวนเทียว", "r_hip", { spd: [6, 7, 7] }),
      n("weizhong_r", "จุดเหว่ยจง", "r_knee", { eva: [11, 11, 11] }),
    ],
  },
  {
    id: "hundred_poison_skin", name: "ชีพจรผิวร้อยพิษ", ti: 1, kind: "ability",
    description: "สกุลถังกินพิษทีละน้อยจนผิวด้าน เส้นนี้ทำให้ร่างทนทั้งพิษและคมอาวุธ",
    requires: { skills: ["tang_poison_knife", "tang_basic_knife"], arts: ["t1_tang_venombody", "t0_tang_sharp"] },
    nodes: [
      n("lianquan", "จุดเหลียนเฉวียน", "throat", { res: [3, 3, 3] }),
      n("yutang", "จุดอวี้ถัง", "chest", { pct_red: [1, 1, 1] }),
      n("jianli", "จุดเจี้ยนหลี่", "solar", { res: [3, 4, 4] }),
      n("tianshu", "จุดเทียนซู", "navel", { pct_red: [1, 1, 1.5] }, [{ t: "rage", element: "earth", v: 3, turns: 3, chance: 20, maxStacks: 3 }]),
    ],
  },
  {
    id: "little_dragon_palm", name: "ชีพจรฝ่ามือมังกรน้อย", ti: 1, kind: "ability",
    description: "แรงฝ่ามือมังกรม้วนจากไหล่ออกฝ่ามือ ยิ่งตียิ่งหนัก",
    requires: { skills: ["dp", "nc4"], arts: ["t0_sevenstar"] },
    nodes: [
      n("jianyu_r", "จุดเจียนอวี๋", "r_shoulder", { pct_atk: [1, 1, 1] }),
      n("tianjing_r", "จุดเทียนจิ่ง", "r_elbow", { atk: [7, 8, 8] }),
      n("laogong_r", "จุดเหลาข่ง", "r_palm", { pct_atk: [1, 1, 1.5] }, [{ t: "rage", element: "fire", v: 3, turns: 3, chance: 20, maxStacks: 3 }]),
    ],
  },
  {
    id: "spring_well", name: "ชีพจรบ่อน้ำพุ", ti: 1, kind: "ability",
    description: "บัวบานในบ่อน้ำพุใต้ฝ่าเท้า ปราณเย็นไหลวนกลับมาซ่อมร่างทุกลมหายใจ",
    requires: { skills: ["em_blossom_sword", "em_graceful_sword"], arts: ["t1_em_lotus", "t0_em_meditation"] },
    nodes: [
      n("guanyuan", "จุดกวนเอวี๋ยน", "dantian", { hp_regen: [0.25, 0.25, 0.25] }, [{ t: "shield", pct: 5 }]),
      n("zusanli_l", "จุดจู๋ซานหลี่", "l_knee", { VIT: [2, 2, 2] }),
      n("taibai_l", "จุดไท่ไป๋", "l_sole", { hp_regen: [0.25, 0.25, 0.5] }, [{ t: "rage", element: "water", v: 1, turns: 3, chance: 20, maxStacks: 3 }]),
    ],
  },
  {
    id: "vajra_knuckle", name: "ชีพจรข้อนิ้วเพชร", ti: 1, kind: "ability",
    description: "หมัดเกราะเพชรต้องมีข้อนิ้วที่ไม่แตก เส้นนี้ส่งปราณไปห่อกำปั้นทั้งสอง",
    requires: { skills: ["ig", "nc4"], arts: ["t0_ironshirt"] },
    nodes: [
      n("chize_l", "จุดฉื่อเจ๋อ", "l_elbow", { pa: [3, 3, 3] }),
      n("neiguan_l", "จุดเน่ยกวน", "l_wrist", { pct_atk: [1, 1, 1] }, [{ t: "sap", stat: "def", v: 8, turns: 2, chance: 15 }]),
      n("hegu_l", "จุดเหอกู่", "l_palm", { pa: [4, 4, 4] }, [{ t: "opening", stat: "atk", v: 8, turns: 5 }]),
      n("yuji_r", "จุดอวี๋จี้", "r_palm", { pct_atk: [1, 1.5, 1.5] }, [{ t: "rage", element: "earth", v: 3, turns: 3, chance: 20, maxStacks: 3 }]),
    ],
  },
  {
    id: "drunken_moon", name: "ชีพจรจันทร์เมามาย", ti: 1, kind: "buff",
    description: "แสงจันทร์ร้อยสายพันรอบร่างดั่งคนเมา เดินเซแต่ไม่มีใครตีถูก",
    requires: { arts: ["t1_sm_moonweave", "t1_sm_sunfire", "t0_sm_dual", "t0_butterfly"] },
    nodes: [
      n("qianding", "จุดเฉียนติ่ง", "crown", { AGI: [1, 1, 2] }),
      n("lianquan", "จุดเหลียนเฉวียน", "throat", { eva: [5, 5, 5] }),
      n("juque", "จุดจวี้เชวี่ย", "heart", { AGI: [1, 2, 2] }),
      n("yinjiao", "จุดอินเจียว", "navel", { eva: [5, 5, 5], pct_red: [1.5, 1.5, 1.5] }, [{ t: "opening", stat: "eva", v: 6, turns: 5 }]),
    ],
  },
  {
    id: "silk_thread", name: "ชีพจรเส้นไหม", ti: 1, kind: "buff",
    description: "องครักษ์เสื้อแพรเดินบนเส้นไหมไม่ให้ขาด เท้าเบาแต่มือหนัก",
    requires: { skills: ["jy_chain"], arts: ["jy_a1_silktread", "jy_a0_brocade"] },
    nodes: [
      n("juliao_r", "จุดจวีเหลียว", "r_hip", { DEX: [1, 2, 2] }),
      n("kunlun_r", "จุดคุนหลุน", "r_ankle", { spd: [3, 4, 4] }),
      n("yongquan_r", "จุดหย่งเฉวียน", "r_sole", { DEX: [1, 2, 2], pct_atk: [1.5, 1.5, 1.5] }, [{ t: "sap", stat: "spd", v: 8, turns: 2, chance: 15 }]),
    ],
  },
  {
    id: "beggar_bowl", name: "ชีพจรชามขอทาน", ti: 1, kind: "buff",
    description: "คนจรกินอยู่ไม่แน่นอน ท้องจึงเก็บปราณไว้ดั่งชามข้าวที่ไม่เคยว่าง",
    requires: { skills: ["bg_snake_staff", "nc2"], arts: ["t1_bg_sunshadow", "t0_bg_survival"] },
    nodes: [
      n("jianli", "จุดเจี้ยนหลี่", "solar", { LUK: [1, 1, 2] }),
      n("tianshu", "จุดเทียนซู", "navel", { hp: [40, 40, 40] }, [{ t: "ward", count: 2 }]),
      n("qihai", "จุดฉี่ไห่", "dantian", { LUK: [1, 2, 2] }),
      n("baliao", "จุดปาเหลียว", "tailbone", { hp: [50, 50, 50], hp_regen: [0.5, 0.5, 0.5] }, [{ t: "shield", pct: 5 }]),
    ],
  },
];

// ─── T2 ────────────────────────────────────────────────────────────
const T2: readonly MeridianChart[] = [
  {
    id: "five_peaks_breath", name: "ลมปราณห้ายอดเขา", ti: 2, kind: "base",
    description: "ลมหายใจเฮิงซานไต่ห้ายอดเขาผ่านสองขา ร่างเบาและมือไวไปพร้อมกัน",
    requires: { skills: ["hgs_five_peaks", "hgs_dancing_step"], arts: ["t2_hgs_cloud", "t1_hgs_step"] },
    nodes: [
      n("tianshu", "จุดเทียนซู", "navel", { AGI: [2, 3, 3] }),
      n("qihai", "จุดฉี่ไห่", "dantian", { DEX: [2, 3, 3] }),
      n("fengshi_l", "จุดเฟิงซื่อ", "l_hip", { AGI: [3, 3, 3] }),
      n("zusanli_l", "จุดจู๋ซานหลี่", "l_knee", { DEX: [3, 3, 3] }),
      n("taixi_l", "จุดไท่ซี", "l_ankle", { AGI: [3, 3, 4] }),
      n("taibai_l", "จุดไท่ไป๋", "l_sole", { DEX: [3, 4, 4] }),
    ],
  },
  {
    id: "bodhi_root", name: "ชีพจรรากโพธิ์", ti: 2, kind: "base",
    description: "รากโพธิ์ชอนไชจากตันเถียนขึ้นตามกระดูกสันหลัง พระธรรมหยั่งลึกในกาย",
    requires: { skills: ["sl_zen_sword", "nd6"], arts: ["t2_dharma", "t1_goldenbell", "t0_lohan"] },
    nodes: [
      n("qihai", "จุดฉี่ไห่", "dantian", { POW: [2, 2, 2] }),
      n("baliao", "จุดปาเหลียว", "tailbone", { INT: [2, 2, 2] }, [{ t: "shield", pct: 8 }]),
      n("zhishi", "จุดจื้อซื่อ", "lower_back", { POW: [2, 2, 3] }, [{ t: "opening", stat: "def", v: 12, turns: 5 }]),
      n("lingtai", "จุดหลิงไถ", "upper_back", { INT: [2, 2, 3] }),
      n("fengchi", "จุดเฟิงฉือ", "nape", { POW: [2, 2, 3] }, [{ t: "ward", count: 3 }]),
    ],
  },
  {
    id: "tiger_roar_lung", name: "ชีพจรปอดเสือคำราม", ti: 2, kind: "base",
    description: "ปอดที่ขยายจนเสียงคำรามสะท้านป่า แรงกายพุ่งจากอกลงถึงตันเถียน",
    requires: { skills: ["ne9", "nd12", "nd10"], arts: ["t2_tigerroar"] },
    nodes: [
      n("yintang", "จุดอิ้นถัง", "brow", { STR: [2, 3, 3] }),
      n("renying", "จุดเหรินอิ๋ง", "throat", { VIT: [2, 3, 3] }),
      n("xuanji", "จุดซวนจี", "chest", { STR: [3, 3, 3] }),
      n("jiuwei", "จุดจิ๋วเหว่ย", "heart", { VIT: [3, 3, 3] }),
      n("zhongwan", "จุดจงหว่าน", "solar", { STR: [3, 3, 4] }),
      n("yinjiao", "จุดอินเจียว", "navel", { VIT: [3, 4, 4] }),
    ],
  },
  {
    id: "crane_stillness", name: "ชีพจรกระเรียนสงบ", ti: 2, kind: "base",
    description: "กระเรียนยืนนิ่งริมน้ำรอปลา ผู้เปิดเส้นนี้รอจังหวะได้ไม่รู้เบื่อ",
    requires: { skills: ["nd9", "nd8", "gn"], arts: ["t2_craneform", "t2_plumblossom"] },
    nodes: [
      n("zhishi", "จุดจื้อซื่อ", "lower_back", { INT: [3, 3, 4] }),
      n("xinshu", "จุดซินซู", "upper_back", { LUK: [3, 4, 4] }),
      n("yamen", "จุดย่าเหมิน", "nape", { INT: [3, 4, 4] }),
      n("houding", "จุดโฮ่วติ่ง", "crown", { LUK: [4, 4, 4] }),
      n("shangxing", "จุดซั่งซิง", "brow", { INT: [4, 4, 5] }),
    ],
  },
  {
    id: "mind_body_one", name: "ชีพจรจิตกายหนึ่งเดียว", ti: 2, kind: "base",
    description: "เมื่อจิตกับกายเป็นหนึ่ง ปราณไหลรอบด้านหน้าจากหว่างคิ้วลงถึงสะดือ",
    requires: { skills: ["yy", "rf", "cs"], arts: ["t2_mindbody"] },
    nodes: [
      n("taiyang", "จุดไท่หยาง", "brow", { POW: [2, 3, 3] }),
      n("lianquan", "จุดเหลียนเฉวียน", "throat", { DEF: [2, 3, 3] }),
      n("huagai", "จุดหัวไก้", "chest", { POW: [3, 3, 3] }),
      n("juque", "จุดจวี้เชวี่ย", "heart", { DEF: [3, 3, 3] }),
      n("qimen", "จุดฉีเหมิน", "solar", { POW: [3, 3, 4] }),
      n("shuifen", "จุดสุ่ยเฟิน", "navel", { DEF: [3, 4, 4] }),
    ],
  },
  {
    id: "eight_trigram_web", name: "ชีพจรใยแปดทิศ", ti: 2, kind: "combat",
    description: "ปราณแปดทิศถักเป็นใยรอบแขนซ้าย จับทางหมัดและหลบทางพิษได้ทุกทิศ",
    requires: { skills: ["ne8", "nd7", "ig", "nc4"], arts: ["t2_eighttri"] },
    nodes: [
      n("jianyu_l", "จุดเจียนอวี๋", "l_shoulder", { acc: [10, 10, 10] }),
      n("tianjing_l", "จุดเทียนจิ่ง", "l_elbow", { eva: [11, 11, 11] }),
      n("shenmen_l", "จุดเสินเหมิน", "l_wrist", { res: [8, 8, 9] }),
      n("shaoshang_l", "จุดเส้าซาง", "l_palm", { acc: [12, 12, 12] }),
      n("xuanji", "จุดซวนจี", "chest", { eva: [13, 13, 13] }),
    ],
  },
  {
    id: "five_petal_plum", name: "ชีพจรเหมยห้ากลีบ", ti: 2, kind: "combat",
    description: "กระบี่ปลายแหลมผลิดอกเหมยห้ากลีบ ทุกกลีบคือจุดตายของคู่ต่อสู้",
    requires: { skills: ["na1", "nd6", "nd3"], arts: ["t2_plumblossom"] },
    nodes: [
      n("fengfu", "จุดเฟิงฝู่", "nape", { cri: [4, 4, 4] }),
      n("shenzhu", "จุดเซินจู้", "upper_back", { atk: [12, 12, 12] }),
      n("jianyu_r", "จุดเจียนอวี๋", "r_shoulder", { cri: [4, 5, 5] }),
      n("tianjing_r", "จุดเทียนจิ่ง", "r_elbow", { atk: [13, 14, 14] }),
      n("yangchi_r", "จุดหยางฉือ", "r_wrist", { cri: [5, 5, 5] }),
      n("laogong_r", "จุดเหลาข่ง", "r_palm", { atk: [16, 17, 17] }),
    ],
  },
  {
    id: "seven_color_serpent", name: "ชีพจรอสรพิษเจ็ดสี", ti: 2, kind: "combat",
    description: "งูเจ็ดสีเลื้อยจากอกไปตามแขนขวา ฝ่ามือที่ส่งออกมีพิษเย็นแฝง",
    requires: { skills: ["nd1", "pn", "ns2"], arts: ["t2_snakeform", "t2_plumblossom"] },
    nodes: [
      n("tanzhong", "จุดถานจง", "chest", { ia: [15, 15, 15] }),
      n("jianzhen_r", "จุดเจียนเจิน", "r_shoulder", { res: [8, 8, 9] }),
      n("shousanli_r", "จุดโส่วซานหลี่", "r_elbow", { ia: [16, 17, 17] }),
      n("taiyuan_r", "จุดไท่เยวียน", "r_wrist", { res: [9, 9, 9] }),
      n("houxi_r", "จุดโฮ่วซี", "r_palm", { ia: [19, 20, 20] }),
    ],
  },
  {
    id: "golden_armor", name: "ชีพจรเกราะทอง", ti: 2, kind: "combat",
    description: "องครักษ์ที่ยืนขวางคมดาบแทนเจ้านาย ปราณห่อหลังและศีรษะดั่งเกราะทอง",
    requires: { skills: ["jy_grapple", "jy_blade"], arts: ["jy_a2_goldarmor", "jy_a1_silktread"] },
    nodes: [
      n("changqiang", "จุดฉางเฉียง", "tailbone", { pd: [8, 8, 8] }),
      n("yaoyangguan", "จุดเยาหยางกวน", "lower_back", { id_: [8, 8, 8] }),
      n("gaohuang", "จุดเกาหวง", "upper_back", { hp: [90, 90, 90] }),
      n("fengfu", "จุดเฟิงฝู่", "nape", { pd: [9, 9, 9] }),
      n("baihui", "จุดไป่ฮุ่ย", "crown", { id_: [10, 10, 10] }),
      n("taiyang", "จุดไท่หยาง", "brow", { hp: [110, 110, 110] }),
    ],
  },
  {
    id: "ice_palm", name: "ชีพจรฝ่ามือน้ำแข็ง", ti: 2, kind: "ability",
    description: "ความเย็นจากฝ่ามือน้ำแข็งย้อนกลับมาเคลือบร่าง แรงที่กระทบก็แข็งตัวลง",
    requires: { skills: ["ne7", "na2", "ig", "dp", "nc7"] },
    nodes: [
      n("guanyuan", "จุดกวนเอวี๋ยน", "dantian", { pct_red: [0.5, 1, 1] }),
      n("zhongwan", "จุดจงหว่าน", "solar", { id_: [5, 5, 5] }),
      n("lingxu", "จุดหลิงซวี", "heart", { pct_red: [1, 1, 1] }),
      n("jianyu_l", "จุดเจียนอวี๋", "l_shoulder", { VIT: [2, 2, 3] }),
      n("tianjing_l", "จุดเทียนจิ่ง", "l_elbow", { pct_red: [1, 1, 1.5] }, [{ t: "sap", stat: "spd", v: 10, turns: 2, chance: 20 }]),
    ],
  },
  {
    id: "twin_wind_blades", name: "ชีพจรสองดาบล่องลม", ti: 2, kind: "ability",
    description: "สองมือถือสองดาบให้ลมพัดพา มือหนึ่งล่อ อีกมือหนึ่งฟันซ้ำ",
    requires: { skills: ["ws", "ne5", "nd11", "nd3"] },
    nodes: [
      n("shenmen_l", "จุดเสินเหมิน", "l_wrist", { spd: [2, 2, 3] }),
      n("shaoshang_l", "จุดเส้าซาง", "l_palm", { pct_atk: [1, 1, 1.5] }),
      n("zigong", "จุดจื่อกง", "chest", { AGI: [1, 1, 2] }),
      n("zhongfu_r", "จุดจงฝู่", "r_shoulder", { pct_atk: [1, 1, 1.5] }, [{ t: "sap", stat: "eva", v: 10, turns: 2, chance: 20 }]),
      n("chize_r", "จุดฉื่อเจ๋อ", "r_elbow", { spd: [3, 4, 4] }),
      n("waiguan_r", "จุดไว่กวน", "r_wrist", { pct_atk: [1, 1.5, 1.5] }, [{ t: "rage", element: "wind", v: 4, turns: 3, chance: 25, maxStacks: 3 }]),
    ],
  },
  {
    id: "garland_spring", name: "ชีพจรน้ำพุมาลัย", ti: 2, kind: "ability",
    description: "ร้อยบุปผาเป็นมาลัยคล้องร่าง ทุกดอกที่บานคือบาดแผลที่หาย",
    requires: { skills: ["em_heart_sword", "em_blossom_sword", "em_graceful_sword"], arts: ["t2_em_garland", "t1_em_lotus"] },
    nodes: [
      n("juque", "จุดจวี้เชวี่ย", "heart", { hp_regen: [0.25, 0.25, 0.25] }),
      n("qimen", "จุดฉีเหมิน", "solar", { hp: [50, 50, 50] }),
      n("shuifen", "จุดสุ่ยเฟิน", "navel", { hp_regen: [0.25, 0.25, 0.25] }),
      n("guanyuan", "จุดกวนเอวี๋ยน", "dantian", { INT: [2, 2, 3] }),
      n("huantiao_l", "จุดหวนเทียว", "l_hip", { hp_regen: [0.25, 0.25, 0.5] }, [{ t: "rage", element: "water", v: 1.25, turns: 3, chance: 25, maxStacks: 3 }]),
    ],
  },
  {
    id: "rooted_peak", name: "ชีพจรภูผาหยั่งราก", ti: 2, kind: "buff",
    description: "ยอดเขากลางไม่เคยเอนแม้พายุ ปราณซงซานหยั่งจากขาสู่เอว",
    requires: { skills: ["ssh_central_blade", "ssh_iron_strike"], arts: ["t2_ssh_root", "t1_ssh_iron"] },
    nodes: [
      n("zhiyin_r", "จุดจื้ออิน", "r_sole", { DEF: [1, 2, 2] }),
      n("jiexi_r", "จุดเจี่ยซี", "r_ankle", { pd: [5, 5, 5] }),
      n("xuehai_r", "จุดเสวี่ยไห่", "r_knee", { VIT: [1, 2, 2] }),
      n("fengshi_r", "จุดเฟิงซื่อ", "r_hip", { DEF: [1, 2, 2] }),
      n("huiyin", "จุดฮุ่ยอิน", "tailbone", { pd: [5, 5, 5] }),
      n("shenshu", "จุดเซิ่นซู", "lower_back", { VIT: [1, 2, 2], pct_red: [2, 2, 2] }, [{ t: "rage", element: "earth", v: 4, turns: 3, chance: 25, maxStacks: 3 }]),
    ],
  },
  {
    id: "drunken_immortal", name: "ชีพจรเซียนเมา", ti: 2, kind: "buff",
    description: "เซียนเมาโซเซไปมาทั้งร่าง หมัดที่ดูหลงทางกลับพุ่งเข้าจุดตายทุกครั้ง",
    requires: { skills: ["ne8", "ne11", "nm2", "nd12", "ns1"] },
    nodes: [
      n("baihui", "จุดไป่ฮุ่ย", "crown", { LUK: [1, 2, 2] }),
      n("tiantu", "จุดเทียนทู", "throat", { eva: [6, 6, 6] }),
      n("zigong", "จุดจื่อกง", "chest", { AGI: [2, 2, 2] }),
      n("shangwan", "จุดซั่งหว่าน", "solar", { LUK: [2, 2, 2] }),
      n("qihai", "จุดฉี่ไห่", "dantian", { eva: [7, 7, 7], pct_atk: [2.5, 2.5, 3] }, [{ t: "opening", stat: "eva", v: 8, turns: 5 }]),
    ],
  },
  {
    id: "sun_body", name: "ชีพจรกายสุริยัน", ti: 2, kind: "buff",
    description: "แสงตะวันส่องจากกระหม่อมลงถึงตันเถียน กายร้อนแรงทั้งรุกและรับ",
    requires: { arts: ["t2_sm_sunbody", "t2_sm_moonbody", "t1_sm_sunfire", "t1_sm_moonweave"] },
    nodes: [
      n("baihui", "จุดไป่ฮุ่ย", "crown", { STR: [1, 1, 2] }),
      n("taiyang", "จุดไท่หยาง", "brow", { atk: [6, 6, 6] }),
      n("tiantu", "จุดเทียนทู", "throat", { POW: [1, 1, 2] }),
      n("xuanji", "จุดซวนจี", "chest", { STR: [1, 2, 2] }, [{ t: "opening", stat: "atk", v: 12, turns: 5 }]),
      n("juque", "จุดจวี้เชวี่ย", "heart", { atk: [7, 8, 8] }),
      n("qimen", "จุดฉีเหมิน", "solar", { POW: [1, 2, 2], pct_atk: [1.5, 1.5, 2], pct_red: [1, 1.5, 1.5] }, [{ t: "rage", element: "fire", v: 4, turns: 3, chance: 25, maxStacks: 3 }]),
    ],
  },
];

// ─── T3 ────────────────────────────────────────────────────────────
const T3: readonly MeridianChart[] = [
  {
    id: "dragon_elephant", name: "ชีพจรมังกรช้างสาร", ti: 3, kind: "base",
    description: "พลังช้างสารบนบก พลังมังกรในน้ำ ปราณไหลจากอกลงถึงฝ่าเท้าซ้ายหนักหน่วงดั่งภูเขา",
    requires: { skills: ["nf3", "fs", "ne3", "nd4"], arts: ["t3_dragonelephant"] },
    nodes: [
      n("renying", "จุดเหรินอิ๋ง", "throat", { STR: [2, 3, 3] }),
      n("yutang", "จุดอวี้ถัง", "chest", { VIT: [3, 3, 3] }),
      n("juque", "จุดจวี้เชวี่ย", "heart", { POW: [3, 3, 3] }),
      n("qimen", "จุดฉีเหมิน", "solar", { STR: [3, 3, 4] }),
      n("shuifen", "จุดสุ่ยเฟิน", "navel", { VIT: [3, 3, 4] }),
      n("guanyuan", "จุดกวนเอวี๋ยน", "dantian", { POW: [3, 3, 4] }),
      n("huantiao_l", "จุดหวนเทียว", "l_hip", { STR: [3, 4, 4] }),
      n("yinlingquan_l", "จุดอินหลิงเฉวียน", "l_knee", { STR: [1, 1, 1], VIT: [1, 1, 2], POW: [1, 1, 2] }),
    ],
  },
  {
    id: "heart_mind_lattice", name: "ชีพจรกลใจเป็นจิต", ti: 3, kind: "base",
    description: "นักพิณใช้กลใจถักเสียงเป็นอาวุธ เส้นนี้เชื่อมหัวใจกับกระหม่อมให้คิดเร็วดั่งดีดสาย",
    requires: { skills: ["zs", "sa", "ne4", "nd2", "nc9"], arts: ["t3_heartmind"] },
    nodes: [
      n("sishencong", "จุดซื่อเสินชง", "crown", { INT: [3, 3, 4] }),
      n("yintang", "จุดอิ้นถัง", "brow", { DEX: [3, 3, 4] }),
      n("lianquan", "จุดเหลียนเฉวียน", "throat", { INT: [3, 4, 4] }),
      n("yutang", "จุดอวี้ถัง", "chest", { DEX: [4, 4, 4] }),
      n("jiuwei", "จุดจิ๋วเหว่ย", "heart", { INT: [4, 4, 4] }),
      n("zhongwan", "จุดจงหว่าน", "solar", { DEX: [4, 4, 5] }),
      n("yinjiao", "จุดอินเจียว", "navel", { INT: [2, 2, 2], DEX: [2, 2, 3] }),
    ],
  },
  {
    id: "jade_maiden", name: "ชีพจรสาวหยก", ti: 3, kind: "base",
    description: "คัมภีร์สาวหยกแห่งสุสานโบราณให้ร่างเย็นดั่งหยก เบาดั่งปุยเมฆ",
    requires: { skills: ["ynss", "ne5", "ne12", "nd6"], arts: ["ynxj"] },
    nodes: [
      n("feishu", "จุดเฟ่ยซู", "upper_back", { AGI: [2, 3, 3] }),
      n("yunmen_l", "จุดอวิ๋นเหมิน", "l_shoulder", { DEX: [3, 3, 3] }),
      n("quchi_l", "จุดชวี่ฉือ", "l_elbow", { LUK: [3, 3, 3] }),
      n("yangchi_l", "จุดหยางฉือ", "l_wrist", { AGI: [3, 3, 4] }),
      n("laogong_l", "จุดเหลาข่ง", "l_palm", { DEX: [3, 3, 4] }),
      n("lingxu", "จุดหลิงซวี", "heart", { LUK: [3, 3, 4] }),
      n("jianli", "จุดเจี้ยนหลี่", "solar", { AGI: [3, 4, 4] }),
      n("guanyuan", "จุดกวนเอวี๋ยน", "dantian", { AGI: [1, 1, 1], DEX: [1, 1, 2], LUK: [1, 1, 2] }),
    ],
  },
  {
    id: "northern_ghost", name: "ชีพจรภูติอุดร", ti: 3, kind: "base",
    description: "ปราณภูติอุดรเย็นยะเยือกหมุนรอบตันเถียนไม่หยุด เก็บพลังไว้ไม่รั่วไหล",
    requires: { skills: ["xy_demon_wind_sword", "xy_pathless_sword"], arts: ["bmzq", "t3_xy_seepower", "t2_xy_formless_greater", "t0_xy_plum"] },
    nodes: [
      n("zhongji", "จุดจงจี๋", "dantian", { POW: [3, 3, 4] }),
      n("huiyin", "จุดฮุ่ยอิน", "tailbone", { VIT: [3, 3, 4] }),
      n("shenshu", "จุดเซิ่นซู", "lower_back", { POW: [3, 4, 4] }),
      n("feishu", "จุดเฟ่ยซู", "upper_back", { VIT: [4, 4, 4] }),
      n("tianzhu", "จุดเทียนจู้", "nape", { POW: [4, 4, 4] }),
      n("qianding", "จุดเฉียนติ่ง", "crown", { VIT: [4, 4, 5] }),
      n("shenting", "จุดเสินถิง", "brow", { POW: [2, 2, 2], VIT: [2, 2, 3] }),
    ],
  },
  {
    id: "one_finger", name: "ชีพจรเอกดัชนี", ti: 3, kind: "combat",
    description: "รวมปราณทั้งร่างไว้ที่ปลายนิ้วเดียว ดัชนีเอกสุริยันจึงเจาะได้ทุกเกราะ",
    requires: { skills: ["yyz", "nf5", "ne11", "ne7", "nd10"] },
    nodes: [
      n("shenting", "จุดเสินถิง", "brow", { ia: [12, 12, 12] }),
      n("fengfu", "จุดเฟิงฝู่", "nape", { acc: [9, 9, 9] }),
      n("shenzhu", "จุดเซินจู้", "upper_back", { cri: [4, 5, 5] }),
      n("jianyu_r", "จุดเจียนอวี๋", "r_shoulder", { ia: [15, 15, 15] }),
      n("tianjing_r", "จุดเทียนจิ่ง", "r_elbow", { acc: [10, 10, 10] }),
      n("neiguan_r", "จุดเน่ยกวน", "r_wrist", { cri: [5, 5, 5] }),
      n("hegu_r", "จุดเหอกู่", "r_palm", { ia: [16, 17, 17] }),
      n("shenfeng", "จุดเสินเฟิง", "heart", { ia: [4, 5, 5], acc: [4, 4, 4], cri: [2, 2, 2] }),
    ],
  },
  {
    id: "void_step", name: "ชีพจรก้าวว่าง", ti: 3, kind: "combat",
    description: "ก้าวลงที่ว่างโดยไม่ทิ้งรอย ศัตรูตีถูกเพียงเงาที่เพิ่งจากไป",
    requires: { skills: ["nh2", "na1", "ne5", "nd3", "nc3"], arts: ["t3_voidstep"] },
    nodes: [
      n("qihai", "จุดฉี่ไห่", "dantian", { spd: [7, 8, 8] }),
      n("fengshi_l", "จุดเฟิงซื่อ", "l_hip", { eva: [10, 10, 10] }),
      n("xuehai_l", "จุดเสวี่ยไห่", "l_knee", { spd: [8, 8, 9] }),
      n("shenmai_l", "จุดเซินม่าย", "l_ankle", { eva: [12, 12, 12] }),
      n("taichong_l", "จุดไท่ชง", "l_sole", { spd: [9, 9, 9] }),
      n("zhiyin_r", "จุดจื้ออิน", "r_sole", { eva: [13, 13, 13] }),
      n("kunlun_r", "จุดคุนหลุน", "r_ankle", { spd: [4, 5, 5], eva: [7, 7, 7] }),
    ],
  },
  {
    id: "thunder_stride", name: "ชีพจรอัสนีก้าวย่าง", ti: 3, kind: "combat",
    description: "องครักษ์เสื้อแพรไล่ล่าดั่งฟ้าผ่า ก้าวแรกยังไม่ทันได้ยินเสียง ดาบก็ถึงคอ",
    requires: { skills: ["jy_blade_king", "jy_eagleclaw", "jy_blade"], arts: ["jy_a3_thunderstride", "jy_a2_goldarmor"] },
    nodes: [
      n("zhiyin_l", "จุดจื้ออิน", "l_sole", { spd: [6, 6, 6] }),
      n("zhaohai_l", "จุดเจ้าไห่", "l_ankle", { atk: [13, 14, 14] }),
      n("liangqiu_l", "จุดเหลียงชิว", "l_knee", { acc: [9, 9, 9] }),
      n("huantiao_l", "จุดหวนเทียว", "l_hip", { spd: [7, 8, 8] }),
      n("baliao", "จุดปาเหลียว", "tailbone", { atk: [15, 15, 15] }),
      n("zhishi", "จุดจื้อซื่อ", "lower_back", { acc: [10, 10, 10] }),
      n("gaohuang", "จุดเกาหวง", "upper_back", { spd: [8, 8, 9] }),
      n("fengfu", "จุดเฟิงฝู่", "nape", { spd: [2, 2, 3], atk: [6, 6, 6], acc: [4, 4, 4] }),
    ],
  },
  {
    id: "blood_blade", name: "ชีพจรดาบโลหิต", ti: 3, kind: "combat",
    description: "เส้นที่สำนักดาบโลหิตย้อมด้วยเลือดศัตรู ยิ่งเห็นเลือดยิ่งฟันแรง",
    requires: { skills: ["bs", "nf6", "ne9", "ws", "nm1", "nc7"] },
    nodes: [
      n("zhongfu_r", "จุดจงฝู่", "r_shoulder", { atk: [15, 15, 15] }),
      n("chize_r", "จุดฉื่อเจ๋อ", "r_elbow", { cri: [5, 5, 5] }),
      n("neiguan_r", "จุดเน่ยกวน", "r_wrist", { pa: [11, 11, 11] }),
      n("hegu_r", "จุดเหอกู่", "r_palm", { atk: [18, 18, 18] }),
      n("juque", "จุดจวี้เชวี่ย", "heart", { cri: [6, 6, 6] }),
      n("qimen", "จุดฉีเหมิน", "solar", { pa: [13, 13, 13] }),
      n("shimen", "จุดสือเหมิน", "dantian", { atk: [6, 6, 6], cri: [2, 2, 2], pa: [5, 5, 5] }),
    ],
  },
  {
    id: "dharma_mirror", name: "ชีพจรกระจกธรรม", ti: 3, kind: "ability",
    description: "ใจใสดั่งกระจก แรงที่ฟาดเข้ามาก็สะท้อนกลับไปครึ่งทาง",
    requires: { skills: ["hgn_mirror_blade", "hgn_iron_robe", "hgn_dharma_guard"], arts: ["t3_hgn_mirror", "t2_hgn_bell"] },
    nodes: [
      n("lianquan", "จุดเหลียนเฉวียน", "throat", { DEF: [1, 1, 2] }),
      n("zigong", "จุดจื่อกง", "chest", { pct_red: [0.5, 1, 1] }),
      n("juque", "จุดจวี้เชวี่ย", "heart", { res: [3, 3, 3] }),
      n("qimen", "จุดฉีเหมิน", "solar", { pct_red: [1, 1, 1] }),
      n("shuifen", "จุดสุ่ยเฟิน", "navel", { DEF: [1, 2, 2] }, [{ t: "shield", pct: 12 }]),
      n("guanyuan", "จุดกวนเอวี๋ยน", "dantian", { pct_red: [1, 1, 1] }),
      n("changqiang", "จุดฉางเฉียง", "tailbone", { res: [4, 5, 5] }),
      n("yaoyangguan", "จุดเยาหยางกวน", "lower_back", { pct_red: [1, 1, 1.5] }, [{ t: "ward", count: 5 }]),
    ],
  },
  {
    id: "sun_renewal", name: "ชีพจรตะวันฟื้นคืน", ti: 3, kind: "ability",
    description: "ตะวันตกแล้วก็ขึ้นใหม่ทุกวัน คนจรที่เปิดเส้นนี้ล้มแล้วลุกได้เสมอ",
    requires: { skills: ["bg_wander_staff", "bg_drift_staff", "bg_snake_staff", "nc2"], arts: ["t3_bg_sunrenew", "t2_bg_nineshadow"] },
    nodes: [
      n("tanzhong", "จุดถานจง", "chest", { hp_regen: [0.25, 0.25, 0.25] }),
      n("shangwan", "จุดซั่งหว่าน", "solar", { VIT: [1, 2, 2] }),
      n("qihai", "จุดฉี่ไห่", "dantian", { hp_regen: [0.25, 0.25, 0.25] }),
      n("liangqiu_l", "จุดเหลียงชิว", "l_knee", { hp: [60, 60, 60] }, [{ t: "revive", hpPct: 50 }]),
      n("zhiyin_l", "จุดจื้ออิน", "l_sole", { hp_regen: [0.25, 0.25, 0.25] }),
      n("yongquan_r", "จุดหย่งเฉวียน", "r_sole", { VIT: [2, 2, 3] }),
      n("yanglingquan_r", "จุดหยางหลิงเฉวียน", "r_knee", { hp_regen: [0.25, 0.25, 0.5] }, [{ t: "rage", element: "water", v: 1.5, turns: 4, chance: 30, maxStacks: 4 }]),
    ],
  },
  {
    id: "sun_piercer", name: "ชีพจรทะลวงสุริยัน", ti: 3, kind: "ability",
    description: "หนึ่งกระบี่บูชาตะวันของไท่ซาน รวมแสงทั้งวันไว้ในการแทงครั้งเดียว",
    requires: { skills: ["tsh_sun_pierce", "tsh_east_blade", "tsh_dawn_strike"], arts: ["t3_tsh_sun", "t2_tsh_peak"] },
    nodes: [
      n("baihui", "จุดไป่ฮุ่ย", "crown", { atk: [6, 6, 6] }),
      n("taiyang", "จุดไท่หยาง", "brow", { pct_atk: [1, 1, 1.5] }),
      n("dazhui", "จุดต้าจุย", "nape", { STR: [1, 2, 2] }),
      n("lingtai", "จุดหลิงไถ", "upper_back", { pct_atk: [1, 1, 1.5] }),
      n("jianjing_r", "จุดเจี้ยนจิ่ง", "r_shoulder", { atk: [7, 8, 8] }),
      n("shaohai_r", "จุดเส้าไห่", "r_elbow", { pct_atk: [1, 1.5, 1.5] }),
      n("shenmen_r", "จุดเสินเหมิน", "r_wrist", { STR: [2, 2, 2] }),
      n("shaoshang_r", "จุดเส้าซาง", "r_palm", { pct_atk: [1, 1.5, 1.5] }, [{ t: "rage", element: "fire", v: 5, turns: 4, chance: 30, maxStacks: 4 }]),
    ],
  },
  {
    id: "viper_venom", name: "ชีพจรพิษอสรพิษ", ti: 3, kind: "ability",
    description: "พิษอสรพิษไหลไปตามแขนสู่ปลายมีด บาดแผลเล็กก็ร้ายแรงกว่าที่เห็น",
    requires: { skills: ["tang_viperblade", "tang_starscatter", "tang_poison_knife", "tang_basic_knife"], arts: ["t3_tang_viperpower", "t2_tang_wavewind"] },
    nodes: [
      n("taiyuan_l", "จุดไท่เยวียน", "l_wrist", { pct_atk: [1, 1, 1] }),
      n("houxi_l", "จุดโฮ่วซี", "l_palm", { DEX: [1, 2, 2] }),
      n("huagai", "จุดหัวไก้", "chest", { pct_atk: [1, 1, 1.5] }),
      n("jianjing_r", "จุดเจี้ยนจิ่ง", "r_shoulder", { cri: [3, 3, 3] }, [{ t: "sap", stat: "spd", v: 13, turns: 2, chance: 25 }]),
      n("shaohai_r", "จุดเส้าไห่", "r_elbow", { pct_atk: [1, 1.5, 1.5] }),
      n("shenmen_r", "จุดเสินเหมิน", "r_wrist", { DEX: [2, 2, 3] }),
      n("shaoshang_r", "จุดเส้าซาง", "r_palm", { pct_atk: [1.5, 1.5, 1.5] }, [{ t: "sap", stat: "atk", v: 13, turns: 2, chance: 25 }]),
    ],
  },
  {
    id: "dual_fusion", name: "ชีพจรสองขั้วผสาน", ti: 3, kind: "buff",
    description: "ตะวันและจันทร์ผสานในกายเดียว ร้อนและเย็นหมุนเวียนจนกลายเป็นพลังใหม่",
    requires: { skills: ["mi_firepalm", "ne7"], arts: ["t3_sm_dualfusion", "t2_sm_moonbody", "t1_sm_moonweave"] },
    nodes: [
      n("qihai", "จุดฉี่ไห่", "dantian", { POW: [1, 1, 2] }),
      n("liangqiu_l", "จุดเหลียงชิว", "l_knee", { ia: [7, 8, 8] }),
      n("yongquan_l", "จุดหย่งเฉวียน", "l_sole", { INT: [1, 2, 2] }),
      n("yinbai_r", "จุดอิ่นไป๋", "r_sole", { POW: [1, 2, 2] }),
      n("yanglingquan_r", "จุดหยางหลิงเฉวียน", "r_knee", { ia: [7, 8, 8] }, [{ t: "rage", element: "water", v: 1.5, turns: 4, chance: 30, maxStacks: 4 }]),
      n("baliao", "จุดปาเหลียว", "tailbone", { INT: [1, 2, 2] }),
      n("lingtai", "จุดหลิงไถ", "upper_back", { POW: [1, 2, 2] }),
      n("fengchi", "จุดเฟิงฉือ", "nape", { ia: [7, 8, 8], pct_atk: [2, 2, 2.5], hp_regen: [0.5, 0.5, 0.5] }, [{ t: "rage", element: "fire", v: 5, turns: 4, chance: 30, maxStacks: 4 }]),
    ],
  },
  {
    id: "dragon_slaying_tide", name: "ชีพจรคลื่นพิฆาตมังกร", ti: 3, kind: "buff",
    description: "คลื่นทะเลซัดจากอกลงถึงขา หมัดสุริยันของชวนจินจึงหนักดั่งพิฆาตมังกร",
    requires: { skills: ["qz_sun_fist", "qz_punch", "qzjf", "qz_hot_sword", "qz_heavy_sword"], arts: ["t3_qz_dragon"] },
    nodes: [
      n("tanzhong", "จุดถานจง", "chest", { STR: [1, 2, 2] }),
      n("juque", "จุดจวี้เชวี่ย", "heart", { pa: [6, 6, 6] }),
      n("qimen", "จุดฉีเหมิน", "solar", { VIT: [2, 2, 2] }),
      n("shuifen", "จุดสุ่ยเฟิน", "navel", { STR: [2, 2, 2] }),
      n("guanyuan", "จุดกวนเอวี๋ยน", "dantian", { pa: [7, 7, 7] }),
      n("huantiao_r", "จุดหวนเทียว", "r_hip", { VIT: [2, 2, 3] }),
      n("yinlingquan_r", "จุดอินหลิงเฉวียน", "r_knee", { STR: [2, 2, 3], pct_atk: [3.5, 3.5, 3.5] }, [{ t: "rage", element: "earth", v: 5, turns: 4, chance: 30, maxStacks: 4 }]),
    ],
  },
  {
    id: "purple_cloud", name: "ชีพจรเมฆาม่วง", ti: 3, kind: "buff",
    description: "เมฆม่วงลอยเหนือหัวซานยามรุ่งอรุณ ปราณม่วงห่อกระบี่และร่างไว้ด้วยกัน",
    requires: { skills: ["hs_purple_cloud", "nf2", "ne12", "hs_floating_cloud"], arts: ["t2_huashan_cloud"] },
    nodes: [
      n("sishencong", "จุดซื่อเสินชง", "crown", { DEX: [1, 1, 2] }),
      n("yintang", "จุดอิ้นถัง", "brow", { acc: [4, 4, 4] }),
      n("yamen", "จุดย่าเหมิน", "nape", { POW: [1, 1, 2] }, [{ t: "sap", stat: "def", v: 13, turns: 2, chance: 25 }]),
      n("feishu", "จุดเฟ่ยซู", "upper_back", { DEX: [1, 2, 2] }),
      n("yunmen_l", "จุดอวิ๋นเหมิน", "l_shoulder", { acc: [5, 5, 5] }, [{ t: "opening", stat: "acc", v: 11, turns: 5 }]),
      n("quchi_l", "จุดชวี่ฉือ", "l_elbow", { POW: [1, 2, 2] }),
      n("yangchi_l", "จุดหยางฉือ", "l_wrist", { DEX: [1, 2, 2] }),
      n("laogong_l", "จุดเหลาข่ง", "l_palm", { acc: [5, 5, 5], pct_atk: [2, 2, 2.5], pct_red: [1.5, 2, 2] }, [{ t: "ward", count: 5 }]),
    ],
  },
];

// ─── T4 ────────────────────────────────────────────────────────────
const T4: readonly MeridianChart[] = [
  {
    id: "tendon_change", name: "ชีพจรผลัดเส้นเอ็น", ti: 4, kind: "base",
    description: "คัมภีร์เปลี่ยนเส้นเอ็นหลอมเอ็นทั้งร่างใหม่ จากฝ่าเท้าไต่ขึ้นถึงกระหม่อมดั่งต้นไม้ผลัดเปลือก",
    requires: { skills: ["sl_rock_punch", "sl_bodhi_palm", "ne1", "nd5"], arts: ["tendon", "t2_dharma"] },
    nodes: [
      n("yinbai_l", "จุดอิ่นไป๋", "l_sole", { STR: [2, 2, 2] }),
      n("shenmai_l", "จุดเซินม่าย", "l_ankle", { VIT: [2, 2, 2] }),
      n("zusanli_l", "จุดจู๋ซานหลี่", "l_knee", { DEF: [2, 2, 3] }),
      n("fengshi_l", "จุดเฟิงซื่อ", "l_hip", { STR: [2, 2, 3] }),
      n("huiyin", "จุดฮุ่ยอิน", "tailbone", { VIT: [2, 2, 3] }),
      n("shenshu", "จุดเซิ่นซู", "lower_back", { DEF: [2, 2, 3] }),
      n("shenzhu", "จุดเซินจู้", "upper_back", { STR: [2, 2, 3] }),
      n("dazhui", "จุดต้าจุย", "nape", { VIT: [2, 3, 3] }),
      n("qianding", "จุดเฉียนติ่ง", "crown", { DEF: [2, 3, 3] }),
      n("shenting", "จุดเสินถิง", "brow", { STR: [1, 1, 2], VIT: [1, 1, 2] }, [{ t: "revive", hpPct: 50 }]),
    ],
  },
  {
    id: "taiji_cycle", name: "ชีพจรวงจรไทจี๋", ti: 4, kind: "base",
    description: "หยินหยางหมุนวนเป็นวงไม่มีต้นไม่มีปลาย ปราณเดินรอบกายครบหนึ่งรอบใหญ่",
    requires: { skills: ["wd_heaven_sword", "wd_taiji_fist", "wd_cloud_sword", "wd_yinyang_sword", "yy", "tj"], arts: ["t3_yinyang"] },
    nodes: [
      n("zhongji", "จุดจงจี๋", "dantian", { POW: [3, 3, 4] }),
      n("huiyin", "จุดฮุ่ยอิน", "tailbone", { AGI: [3, 3, 4] }),
      n("shenshu", "จุดเซิ่นซู", "lower_back", { INT: [3, 4, 4] }),
      n("gaohuang", "จุดเกาหวง", "upper_back", { POW: [4, 4, 4] }),
      n("fengfu", "จุดเฟิงฝู่", "nape", { AGI: [4, 4, 4] }),
      n("qianding", "จุดเฉียนติ่ง", "crown", { INT: [4, 4, 5] }),
      n("shenting", "จุดเสินถิง", "brow", { POW: [4, 4, 5] }),
      n("renying", "จุดเหรินอิ๋ง", "throat", { AGI: [4, 5, 5] }),
      n("tanzhong", "จุดถานจง", "chest", { POW: [1, 1, 2], AGI: [1, 2, 2], INT: [1, 2, 2] }),
    ],
  },
  {
    id: "star_devouring", name: "ชีพจรดาราดูดกลืน", ti: 4, kind: "base",
    description: "เส้นลับของมหาเวทดูดดาว ปราณไหลเข้าเหมือนแม่น้ำไหลลงทะเล ไม่เคยเต็ม",
    requires: { skills: ["xy_punch", "xy_lesserdemon_fist", "xy_root_poison_fist"], arts: ["bmsg", "t3_xy_root_poison_qi", "t1_xy_formless_lesser"] },
    nodes: [
      n("sishencong", "จุดซื่อเสินชง", "crown", { POW: [3, 3, 3] }),
      n("lianquan", "จุดเหลียนเฉวียน", "throat", { LUK: [3, 3, 3] }),
      n("tanzhong", "จุดถานจง", "chest", { VIT: [3, 3, 4] }),
      n("jianli", "จุดเจี้ยนหลี่", "solar", { POW: [3, 3, 4] }),
      n("guanyuan", "จุดกวนเอวี๋ยน", "dantian", { LUK: [3, 3, 4] }),
      n("yanglingquan_l", "จุดหยางหลิงเฉวียน", "l_knee", { VIT: [3, 4, 4] }),
      n("zhiyin_l", "จุดจื้ออิน", "l_sole", { POW: [3, 4, 4] }),
      n("yongquan_r", "จุดหย่งเฉวียน", "r_sole", { LUK: [4, 4, 4] }),
      n("liangqiu_r", "จุดเหลียงชิว", "r_knee", { VIT: [4, 4, 4] }),
      n("changqiang", "จุดฉางเฉียง", "tailbone", { POW: [1, 1, 2], LUK: [1, 1, 2], VIT: [1, 1, 2] }),
    ],
  },
  {
    id: "emei_frost_grace", name: "ชีพจรน้ำค้างแข็งง้อไบ๊", ti: 4, kind: "base",
    description: "ร่างพริ้วไหวและลมหายใจเย็นเยือกของศิษย์หญิงง้อไบ๊ผสานเป็นเส้นเดียว",
    requires: { skills: ["em_bodhi_sword", "em_bodhi_palm", "em_heart_palm", "em_lotus_palm", "em_blossom_sword"], arts: ["t3_em_grace", "t3_em_ice"] },
    nodes: [
      n("shenting", "จุดเสินถิง", "brow", { DEX: [3, 3, 4] }),
      n("dazhui", "จุดต้าจุย", "nape", { AGI: [3, 3, 4] }),
      n("lingtai", "จุดหลิงไถ", "upper_back", { INT: [3, 4, 4] }),
      n("jianjing_r", "จุดเจี้ยนจิ่ง", "r_shoulder", { DEX: [4, 4, 4] }),
      n("shaohai_r", "จุดเส้าไห่", "r_elbow", { AGI: [4, 4, 4] }),
      n("lieque_r", "จุดเลี่ยเชวีย", "r_wrist", { INT: [4, 4, 5] }),
      n("zhongchong_r", "จุดจงชง", "r_palm", { DEX: [4, 4, 5] }),
      n("shenfeng", "จุดเสินเฟิง", "heart", { AGI: [4, 5, 5] }),
      n("shangwan", "จุดซั่งหว่าน", "solar", { DEX: [1, 1, 2], AGI: [1, 2, 2], INT: [1, 2, 2] }),
    ],
  },
  {
    id: "army_breaker", name: "ชีพจรภูผาทะลายทัพ", ti: 4, kind: "combat",
    description: "ขุนพลโบราณบุกทะลวงทัพหมื่นด้วยร่างเดียว เส้นนี้ส่งแรงจากศีรษะลงถึงเท้าไม่ขาดสาย",
    requires: { skills: ["nf3", "nh1", "ne13", "ne10", "nd4"], arts: ["military"] },
    nodes: [
      n("shenting", "จุดเสินถิง", "brow", { atk: [13, 14, 14] }),
      n("tiantu", "จุดเทียนทู", "throat", { hp: [90, 90, 90] }),
      n("huagai", "จุดหัวไก้", "chest", { pd: [10, 10, 10] }),
      n("shenfeng", "จุดเสินเฟิง", "heart", { atk: [15, 15, 15] }),
      n("shangwan", "จุดซั่งหว่าน", "solar", { hp: [100, 100, 100] }),
      n("shenque", "จุดเสินเชวี่ย", "navel", { pd: [11, 11, 11] }),
      n("zhongji", "จุดจงจี๋", "dantian", { atk: [16, 17, 17] }),
      n("biguan_r", "จุดปี้กวน", "r_hip", { hp: [120, 120, 120] }),
      n("weizhong_r", "จุดเหว่ยจง", "r_knee", { pd: [12, 12, 12] }),
      n("kunlun_r", "จุดคุนหลุน", "r_ankle", { atk: [6, 6, 6], hp: [40, 40, 40], pd: [4, 4, 4] }),
    ],
  },
  {
    id: "heaven_flame", name: "ชีพจรเพลิงสวรรค์", ti: 4, kind: "combat",
    description: "ตำราเพลิงสวรรค์จุดไฟในตันเถียนแล้วส่งออกทางสองแขน พัดหนึ่งครั้งเพลิงลุกทั้งลาน",
    requires: { skills: ["lmsj", "nf8", "nf4", "ne4", "na2", "nd10"], arts: ["fire"] },
    nodes: [
      n("shimen", "จุดสือเหมิน", "dantian", { ia: [15, 15, 15] }),
      n("shangwan", "จุดซั่งหว่าน", "solar", { mp: [50, 50, 50] }),
      n("juque", "จุดจวี้เชวี่ย", "heart", { cri: [5, 6, 6] }),
      n("jianzhen_l", "จุดเจียนเจินซ้าย", "l_shoulder", { ia: [18, 18, 18] }),
      n("shousanli_l", "จุดโส่วซานหลี่", "l_elbow", { mp: [60, 60, 60] }),
      n("waiguan_l", "จุดไว่กวน", "l_wrist", { cri: [6, 7, 7] }),
      n("yuji_l", "จุดอวี๋จี้", "l_palm", { ia: [19, 20, 20] }),
      n("tanzhong", "จุดถานจง", "chest", { mp: [70, 70, 70] }),
      n("jianzhen_r", "จุดเจียนเจินขวา", "r_shoulder", { ia: [6, 6, 6], mp: [25, 25, 25], cri: [2, 3, 3] }),
    ],
  },
  {
    id: "six_meridian_sword", name: "ชีพจรกระบี่หกสาย", ti: 4, kind: "combat",
    description: "หกสายลมกระบี่ออกจากปลายนิ้วทั้งหก ผู้รู้ต้นทางของมันเท่านั้นจึงเปิดเส้นนี้ได้",
    requires: { skills: ["lmsj", "yyz", "nf5", "ne11", "ne8", "dp"] },
    nodes: [
      n("lingxu", "จุดหลิงซวี", "heart", { ia: [13, 14, 14] }),
      n("jianyu_l", "จุดเจียนอวี๋ซ้าย", "l_shoulder", { acc: [9, 9, 9] }),
      n("tianjing_l", "จุดเทียนจิ่งซ้าย", "l_elbow", { atk: [15, 15, 15] }),
      n("lieque_l", "จุดเลี่ยเชวีย", "l_wrist", { ia: [15, 15, 15] }),
      n("zhongchong_l", "จุดจงชง", "l_palm", { acc: [10, 10, 10] }),
      n("xuanji", "จุดซวนจี", "chest", { atk: [16, 17, 17] }),
      n("jianyu_r", "จุดเจียนอวี๋ขวา", "r_shoulder", { ia: [16, 17, 17] }),
      n("tianjing_r", "จุดเทียนจิ่งขวา", "r_elbow", { acc: [12, 12, 12] }),
      n("taiyuan_r", "จุดไท่เยวียน", "r_wrist", { atk: [18, 18, 18] }),
      n("houxi_r", "จุดโฮ่วซี", "r_palm", { ia: [6, 6, 6], acc: [4, 4, 4], atk: [6, 6, 6] }),
    ],
  },
  {
    id: "lonely_nine_swords", name: "ชีพจรเก้ากระบี่เดียวดาย", ti: 4, kind: "combat",
    description: "ไร้กระบวนท่าจึงไร้ช่องโหว่ เส้นนี้ทำให้มือขวาตามช่องว่างของศัตรูก่อนตาเห็น",
    requires: { skills: ["dgjj", "nf2", "nh2", "na1", "ne12", "nd6"], arts: ["fire"] },
    nodes: [
      n("gaohuang", "จุดเกาหวง", "upper_back", { acc: [10, 10, 10] }),
      n("jianzhen_r", "จุดเจียนเจิน", "r_shoulder", { cri: [5, 5, 5] }),
      n("shousanli_r", "จุดโส่วซานหลี่", "r_elbow", { eva: [11, 11, 11] }),
      n("waiguan_r", "จุดไว่กวน", "r_wrist", { acc: [12, 12, 12] }),
      n("yuji_r", "จุดอวี๋จี้", "r_palm", { cri: [6, 6, 6] }),
      n("jiuwei", "จุดจิ๋วเหว่ย", "heart", { eva: [13, 13, 13] }),
      n("zhongwan", "จุดจงหว่าน", "solar", { acc: [13, 13, 13] }),
      n("zhongji", "จุดจงจี๋", "dantian", { cri: [7, 7, 7] }),
      n("zhishi", "จุดจื้อซื่อ", "lower_back", { acc: [4, 4, 4], cri: [2, 3, 3], eva: [5, 5, 5] }),
    ],
  },
  {
    id: "dragon_subduing", name: "ชีพจรพิชิตมังกร", ti: 4, kind: "ability",
    description: "สิบแปดฝ่ามือต้องมีเส้นแขนที่ไม่ขาดแม้ตีครบทั้งชุด ยิ่งตียิ่งหนักดั่งมังกรโถม",
    requires: { skills: ["ep", "ng3", "bg_wander_staff", "bg_drift_fist", "bg_drift_staff", "bg_snake_fist"] },
    nodes: [
      n("shenfeng", "จุดเสินเฟิง", "heart", { STR: [1, 1, 2] }),
      n("jianjing_l", "จุดเจี้ยนจิ่งซ้าย", "l_shoulder", { pct_atk: [1, 1, 1.5] }),
      n("shaohai_l", "จุดเส้าไห่ซ้าย", "l_elbow", { pa: [5, 5, 5] }),
      n("waiguan_l", "จุดไว่กวน", "l_wrist", { pct_atk: [1, 1, 1.5] }),
      n("yuji_l", "จุดอวี๋จี้", "l_palm", { STR: [1, 2, 2] }),
      n("huagai", "จุดหัวไก้", "chest", { pct_atk: [1, 1.5, 1.5] }, [{ t: "opening", stat: "atk", v: 20, turns: 5 }]),
      n("jianjing_r", "จุดเจี้ยนจิ่งขวา", "r_shoulder", { pa: [6, 6, 6] }),
      n("shaohai_r", "จุดเส้าไห่ขวา", "r_elbow", { pct_atk: [1.5, 1.5, 1.5] }),
      n("neiguan_r", "จุดเน่ยกวน", "r_wrist", { STR: [2, 2, 2] }),
      n("hegu_r", "จุดเหอกู่", "r_palm", { pct_atk: [1.5, 1.5, 1.5] }, [{ t: "rage", element: "fire", v: 6.5, turns: 4, chance: 35, maxStacks: 4 }]),
    ],
  },
  {
    id: "vajra_body", name: "ชีพจรกายวัชระ", ti: 4, kind: "ability",
    description: "จินกังชี่หลอมกระดูกสันหลังให้เป็นวัชระ ดาบฟันลงก็กระเด็นกลับ",
    requires: { skills: ["sl_bodhi_palm", "sl_rock_punch", "ne1", "ne2", "nd5"], arts: ["diamond", "tendon"] },
    nodes: [
      n("zhishi", "จุดจื้อซื่อ", "lower_back", { pct_red: [1, 1, 1] }),
      n("feishu", "จุดเฟ่ยซู", "upper_back", { DEF: [1, 2, 2] }),
      n("tianzhu", "จุดเทียนจู้", "nape", { pct_red: [1, 1, 1] }, [{ t: "revive", hpPct: 50 }]),
      n("houding", "จุดโฮ่วติ่ง", "crown", { hp: [50, 50, 50] }),
      n("shangxing", "จุดซั่งซิง", "brow", { pct_red: [1, 1, 1] }, [{ t: "ward", count: 5 }]),
      n("lianquan", "จุดเหลียนเฉวียน", "throat", { DEF: [2, 2, 2] }),
      n("yutang", "จุดอวี้ถัง", "chest", { pct_red: [1, 1, 1.5] }),
      n("lingxu", "จุดหลิงซวี", "heart", { hp: [70, 70, 70] }),
      n("jianli", "จุดเจี้ยนหลี่", "solar", { pct_red: [1, 1, 1.5] }, [{ t: "shield", pct: 16 }]),
    ],
  },
  {
    id: "cosmos_fist", name: "ชีพจรหมัดสะท้านจักรวาล", ti: 4, kind: "ability",
    description: "หมัดเดียวสะเทือนฟ้าดิน แรงหมุนจากอกลงถึงเท้าแล้วย้อนขึ้นตามแผ่นหลัง",
    requires: { skills: ["nu2", "yyz", "na2", "ne11", "nd7"], arts: ["t3_dragonelephant"] },
    nodes: [
      n("huagai", "จุดหัวไก้", "chest", { atk: [6, 6, 6] }),
      n("shangwan", "จุดซั่งหว่าน", "solar", { pct_atk: [1, 1, 1.5] }),
      n("qihai", "จุดฉี่ไห่", "dantian", { VIT: [1, 2, 2] }),
      n("weizhong_l", "จุดเหว่ยจง", "l_knee", { pct_atk: [1, 1, 1.5] }),
      n("taichong_l", "จุดไท่ชง", "l_sole", { atk: [7, 8, 8] }),
      n("zhiyin_r", "จุดจื้ออิน", "r_sole", { pct_atk: [1, 1.5, 1.5] }, [{ t: "sap", stat: "def", v: 16, turns: 3, chance: 30 }]),
      n("xuehai_r", "จุดเสวี่ยไห่", "r_knee", { VIT: [2, 2, 2] }),
      n("baliao", "จุดปาเหลียว", "tailbone", { pct_atk: [1.5, 1.5, 1.5] }),
      n("shenzhu", "จุดเซินจู้", "upper_back", { atk: [9, 9, 9] }),
      n("dazhui", "จุดต้าจุย", "nape", { pct_atk: [1.5, 1.5, 1.5] }, [{ t: "rage", element: "earth", v: 6.5, turns: 4, chance: 35, maxStacks: 4 }]),
    ],
  },
  {
    id: "universe_shift", name: "ชีพจรเฉียนคุนเคลื่อนย้าย", ti: 4, kind: "buff",
    description: "เคลื่อนฟ้าย้ายดินด้วยปราณ แรงของศัตรูถูกยืมแล้วส่งกลับไปทวีคูณ",
    requires: { skills: ["mi_firepalm"], arts: ["qiankun", "yxhd", "t3_sm_sunmoon", "t2_sm_sunbody", "t2_sm_moonbody", "t1_sm_sunfire"] },
    nodes: [
      n("qimen", "จุดฉีเหมิน", "solar", { POW: [1, 2, 2] }),
      n("shenfeng", "จุดเสินเฟิง", "heart", { res: [3, 4, 4] }),
      n("jianyu_l", "จุดเจียนอวี๋ซ้าย", "l_shoulder", { AGI: [1, 2, 2] }, [{ t: "rage", element: "wind", v: 6.5, turns: 4, chance: 35, maxStacks: 4 }]),
      n("tianjing_l", "จุดเทียนจิ่งซ้าย", "l_elbow", { POW: [1, 2, 2] }),
      n("yangchi_l", "จุดหยางฉือ", "l_wrist", { res: [3, 4, 4] }),
      n("laogong_l", "จุดเหลาข่ง", "l_palm", { AGI: [1, 2, 2] }, [{ t: "shield", pct: 16 }]),
      n("xuanji", "จุดซวนจี", "chest", { POW: [2, 2, 2] }),
      n("jianyu_r", "จุดเจียนอวี๋ขวา", "r_shoulder", { res: [4, 5, 5] }),
      n("tianjing_r", "จุดเทียนจิ่งขวา", "r_elbow", { AGI: [2, 2, 2] }),
      n("lieque_r", "จุดเลี่ยเชวีย", "r_wrist", { POW: [2, 2, 2], pct_red: [2.5, 2.5, 2.5], pct_atk: [3, 3, 3] }, [{ t: "ward", count: 5 }]),
    ],
  },
  {
    id: "witness_spear", name: "ชีพจรทวนประจักษ์", ti: 4, kind: "buff",
    description: "ทวนที่เคยเป็นพยานการสู้รบนับร้อย เส้นนี้ทำให้แขนซ้ายจับด้ามทวนไม่ไหวติง",
    requires: { skills: ["ng2", "nf3", "nh1", "ne3", "ne13"], arts: ["t1_redlotus"] },
    nodes: [
      n("fengchi", "จุดเฟิงฉือ", "nape", { STR: [2, 3, 3] }),
      n("xinshu", "จุดซินซู", "upper_back", { atk: [12, 12, 12] }),
      n("zhongfu_l", "จุดจงฝู่", "l_shoulder", { DEX: [2, 3, 3] }),
      n("chize_l", "จุดฉื่อเจ๋อ", "l_elbow", { STR: [3, 3, 3] }),
      n("lieque_l", "จุดเลี่ยเชวีย", "l_wrist", { atk: [13, 14, 14] }),
      n("zhongchong_l", "จุดจงชง", "l_palm", { DEX: [3, 3, 3] }),
      n("shenfeng", "จุดเสินเฟิง", "heart", { STR: [3, 3, 4] }),
      n("shangwan", "จุดซั่งหว่าน", "solar", { atk: [15, 15, 15] }),
      n("qihai", "จุดฉี่ไห่", "dantian", { DEX: [3, 3, 4], pct_atk: [4.5, 4.5, 4.5] }),
    ],
  },
  {
    id: "godslayer_blade", name: "ชีพจรดาบเทพสังหาร", ti: 4, kind: "buff",
    description: "ดาบยาวที่กล้าฟันแม้เทพ ผู้ถือต้องมีร่างที่ทนแรงสะท้อนของดาบได้",
    requires: { skills: ["ng5", "nf7", "ne9", "ch", "nd9"], arts: ["military", "t3_dragonelephant"] },
    nodes: [
      n("baihui", "จุดไป่ฮุ่ย", "crown", { STR: [1, 2, 2] }),
      n("taiyang", "จุดไท่หยาง", "brow", { cri: [2, 3, 3] }),
      n("fengfu", "จุดเฟิงฝู่", "nape", { VIT: [1, 2, 2] }),
      n("shenzhu", "จุดเซินจู้", "upper_back", { STR: [2, 2, 2] }),
      n("jianyu_r", "จุดเจียนอวี๋", "r_shoulder", { cri: [3, 3, 3] }),
      n("tianjing_r", "จุดเทียนจิ่ง", "r_elbow", { VIT: [2, 2, 2] }, [{ t: "rage", element: "fire", v: 6.5, turns: 4, chance: 35, maxStacks: 4 }]),
      n("shenmen_r", "จุดเสินเหมิน", "r_wrist", { STR: [2, 2, 2] }),
      n("shaoshang_r", "จุดเส้าซาง", "r_palm", { cri: [3, 3, 3] }),
      n("juque", "จุดจวี้เชวี่ย", "heart", { VIT: [2, 2, 2] }),
      n("qimen", "จุดฉีเหมิน", "solar", { STR: [2, 2, 3], pct_atk: [3, 3, 3], pct_red: [2.5, 2.5, 2.5] }, [{ t: "revive", hpPct: 50 }]),
    ],
  },
  {
    id: "five_poison_body", name: "ชีพจรเบญจพิษรวมกาย", ti: 4, kind: "buff",
    description: "พิษห้าธาตุหลอมรวมในเส้นเลือด กายกลายเป็นยาและพิษในคราวเดียว",
    requires: { skills: ["wd_palm", "nf4", "ne7", "nm2"], arts: ["np", "t2_snakeform"] },
    nodes: [
      n("qimen", "จุดฉีเหมิน", "solar", { POW: [1, 2, 2] }),
      n("shimen", "จุดสือเหมิน", "dantian", { res: [3, 4, 4] }),
      n("yinlingquan_l", "จุดอินหลิงเฉวียน", "l_knee", { DEX: [2, 2, 2] }),
      n("taibai_l", "จุดไท่ไป๋", "l_sole", { POW: [2, 2, 2] }),
      n("taichong_r", "จุดไท่ชง", "r_sole", { res: [4, 5, 5] }),
      n("zusanli_r", "จุดจู๋ซานหลี่", "r_knee", { DEX: [2, 2, 2] }),
      n("yaoshu", "จุดเยาซู", "tailbone", { POW: [2, 2, 2] }),
      n("xinshu", "จุดซินซู", "upper_back", { res: [5, 5, 6] }),
      n("yamen", "จุดย่าเหมิน", "nape", { DEX: [2, 2, 3], pct_atk: [3, 3, 3], hp_regen: [0.5, 0.5, 0.75] }, [{ t: "sap", stat: "atk", v: 16, turns: 3, chance: 30 }]),
    ],
  },
];

// ─── T5 ────────────────────────────────────────────────────────────
const T5: readonly MeridianChart[] = [
  {
    id: "nine_yang", name: "ชีพจรเก้าสุริยะ", ti: 5, kind: "base",
    description: "วิชาเก้าเอี้ยงเปิดครบรอบโคจรใหญ่ ปราณหยางไหลเวียนไม่หยุดดั่งตะวันเก้าดวง ร่างกายไม่มีวันอ่อนล้า",
    requires: { skills: ["nu2", "nf4", "yyz", "na2", "ne8", "nd7"], arts: ["kuyt"] },
    nodes: [
      n("zhongji", "จุดจงจี๋", "dantian", { STR: [2, 2, 3] }),
      n("huiyin", "จุดฮุ่ยอิน", "tailbone", { VIT: [2, 2, 3] }),
      n("shenshu", "จุดเซิ่นซู", "lower_back", { POW: [2, 2, 3] }),
      n("shenzhu", "จุดเซินจู้", "upper_back", { STR: [2, 2, 3] }),
      n("dazhui", "จุดต้าจุย", "nape", { VIT: [2, 2, 3] }),
      n("qianding", "จุดเฉียนติ่ง", "crown", { POW: [2, 2, 3] }),
      n("shenting", "จุดเสินถิง", "brow", { STR: [2, 3, 3] }, [{ t: "rage", element: "fire", v: 8, turns: 5, chance: 40, maxStacks: 5 }]),
      n("tiantu", "จุดเทียนทู", "throat", { VIT: [2, 3, 3] }),
      n("xuanji", "จุดซวนจี", "chest", { POW: [2, 3, 3] }),
      n("shenfeng", "จุดเสินเฟิง", "heart", { STR: [2, 3, 3] }),
      n("shangwan", "จุดซั่งหว่าน", "solar", { VIT: [2, 3, 3] }),
      n("shenque", "จุดเสินเชวี่ย", "navel", { STR: [1, 1, 1], VIT: [1, 1, 1], POW: [1, 1, 1] }, [{ t: "revive", hpPct: 50 }]),
    ],
  },
  {
    id: "nine_yin", name: "ชีพจรเก้ายิน", ti: 5, kind: "base",
    description: "คัมภีร์เก้าอิมเปิดทางปราณหยินจากศีรษะลงถึงเท้าแล้ววนกลับ ร่างเบาและมือไวเกินสายตาคน",
    requires: { skills: ["lmsj", "nf1", "zs", "sa", "nd12"], arts: ["kgim", "t2_eighttri", "t0_sevenstar"] },
    nodes: [
      n("baihui", "จุดไป่ฮุ่ย", "crown", { AGI: [3, 4, 4] }),
      n("renying", "จุดเหรินอิ๋ง", "throat", { DEX: [3, 4, 4] }),
      n("yutang", "จุดอวี้ถัง", "chest", { INT: [4, 4, 4] }),
      n("shangwan", "จุดซั่งหว่าน", "solar", { AGI: [4, 4, 4] }),
      n("qihai", "จุดฉี่ไห่", "dantian", { DEX: [4, 4, 4] }),
      n("yinlingquan_l", "จุดอินหลิงเฉวียน", "l_knee", { INT: [4, 4, 5] }),
      n("taibai_l", "จุดไท่ไป๋", "l_sole", { AGI: [4, 4, 5] }),
      n("taichong_r", "จุดไท่ชง", "r_sole", { DEX: [4, 5, 5] }),
      n("zusanli_r", "จุดจู๋ซานหลี่", "r_knee", { INT: [4, 5, 5] }),
      n("baliao", "จุดปาเหลียว", "tailbone", { AGI: [5, 5, 5] }),
      n("xinshu", "จุดซินซู", "upper_back", { DEX: [5, 5, 5] }),
      n("yamen", "จุดย่าเหมิน", "nape", { AGI: [1, 2, 2], DEX: [1, 2, 2], INT: [1, 2, 2] }),
    ],
  },
  {
    id: "eight_extraordinary", name: "ลมปราณแปดเส้นพิสดาร", ti: 5, kind: "base",
    description: "แปดเส้นลมปราณพิสดารที่ไม่อยู่ในสิบสองเส้นหลัก ผู้รู้วิชาช้างสาร กลใจ และก้าวว่างเท่านั้นจึงต่อเส้นทั้งแปดได้ครบ",
    requires: { skills: ["ng2", "ne10"], arts: ["kuyt", "t3_dragonelephant", "t3_heartmind", "t3_voidstep", "t1_eagleclaw"] },
    nodes: [
      n("taibai_l", "จุดไท่ไป๋", "l_sole", { POW: [3, 3, 4] }),
      n("sanyinjiao_l", "จุดซานอินเจียว", "l_ankle", { AGI: [3, 3, 4] }),
      n("weizhong_l", "จุดเหว่ยจง", "l_knee", { VIT: [3, 4, 4] }),
      n("huantiao_l", "จุดหวนเทียว", "l_hip", { DEX: [3, 4, 4] }),
      n("baliao", "จุดปาเหลียว", "tailbone", { POW: [3, 4, 4] }),
      n("zhishi", "จุดจื้อซื่อ", "lower_back", { AGI: [4, 4, 4] }),
      n("feishu", "จุดเฟ่ยซู", "upper_back", { VIT: [4, 4, 4] }),
      n("tianzhu", "จุดเทียนจู้", "nape", { DEX: [4, 4, 5] }),
      n("houding", "จุดโฮ่วติ่ง", "crown", { POW: [4, 4, 5] }),
      n("shangxing", "จุดซั่งซิง", "brow", { AGI: [4, 4, 5] }),
      n("tiantu", "จุดเทียนทู", "throat", { VIT: [4, 5, 5] }),
      n("yutang", "จุดอวี้ถัง", "chest", { POW: [1, 1, 1], AGI: [1, 1, 1], VIT: [1, 1, 2], DEX: [1, 1, 2] }),
    ],
  },
  {
    id: "sunflower_needle", name: "ชีพจรทานตะวันเข็มเดียว", ti: 5, kind: "combat",
    description: "คัมภีร์ทานตะวันแลกทุกสิ่งกับความเร็ว ปราณพุ่งดั่งเข็มเดียวจากกระหม่อมถึงปลายนิ้ว ตาคนตามไม่ทัน",
    requires: { skills: ["nf7", "ne6", "ch", "nd1", "ns2"], arts: ["khbt", "military", "t3_voidstep"] },
    nodes: [
      n("qianding", "จุดเฉียนติ่ง", "crown", { spd: [8, 8, 9] }),
      n("shenting", "จุดเสินถิง", "brow", { eva: [11, 11, 11] }),
      n("tianzhu", "จุดเทียนจู้", "nape", { cri: [6, 6, 6] }),
      n("gaohuang", "จุดเกาหวง", "upper_back", { atk: [18, 18, 18] }),
      n("jianzhen_r", "จุดเจียนเจิน", "r_shoulder", { spd: [9, 9, 9] }),
      n("shousanli_r", "จุดโส่วซานหลี่", "r_elbow", { eva: [13, 13, 13] }),
      n("lieque_r", "จุดเลี่ยเชวีย", "r_wrist", { cri: [6, 7, 7] }),
      n("zhongchong_r", "จุดจงชง", "r_palm", { atk: [21, 21, 21] }),
      n("shenfeng", "จุดเสินเฟิง", "heart", { spd: [10, 11, 11] }),
      n("shangwan", "จุดซั่งหว่าน", "solar", { eva: [15, 15, 15] }),
      n("qihai", "จุดฉี่ไห่", "dantian", { cri: [7, 8, 8] }),
      n("yaoyangguan", "จุดเยาหยางกวน", "lower_back", { spd: [2, 2, 3], eva: [4, 4, 4], cri: [2, 2, 2], atk: [6, 6, 6] }),
    ],
  },
  {
    id: "hidden_dragon", name: "ชีพจรมังกรซ่อน", ti: 5, kind: "combat",
    description: "มังกรซ่อนในเหวลึกไม่แสดงตน จนวันที่ทะยานขึ้นฟ้า ดาบทวนและตำราศึกรวมเป็นปราณสายเดียว",
    requires: { skills: ["ng5", "ng2", "fs", "ws"], arts: ["kgim", "military", "t1_eagleclaw"] },
    nodes: [
      n("sishencong", "จุดซื่อเสินชง", "crown", { atk: [15, 15, 15] }),
      n("yintang", "จุดอิ้นถัง", "brow", { pa: [10, 10, 10] }),
      n("tiantu", "จุดเทียนทู", "throat", { hp: [110, 110, 110] }),
      n("xuanji", "จุดซวนจี", "chest", { pd: [11, 11, 11] }),
      n("jiuwei", "จุดจิ๋วเหว่ย", "heart", { atk: [16, 17, 17] }),
      n("zhongwan", "จุดจงหว่าน", "solar", { pa: [12, 12, 12] }),
      n("yinjiao", "จุดอินเจียว", "navel", { hp: [120, 120, 120] }),
      n("shimen", "จุดสือเหมิน", "dantian", { pd: [13, 13, 13] }),
      n("juliao_r", "จุดจวีเหลียว", "r_hip", { atk: [19, 20, 20] }),
      n("xuehai_r", "จุดเสวี่ยไห่", "r_knee", { pa: [13, 13, 13] }),
      n("shenmai_r", "จุดเซินม่าย", "r_ankle", { hp: [140, 140, 140] }),
      n("yongquan_r", "จุดหย่งเฉวียน", "r_sole", { atk: [4, 5, 5], pa: [3, 3, 3], hp: [40, 40, 40], pd: [4, 4, 4] }),
    ],
  },
  {
    id: "heaven_sword_heart", name: "ชีพจรใจกระบี่เหนือฟ้า", ti: 5, kind: "combat",
    description: "เมื่อใจเป็นกระบี่ กระบี่ก็ไม่ต้องมีรูป สิบสองจุดจากตันเถียนถึงปลายมือทั้งสองกลายเป็นคมเดียว",
    requires: { skills: ["lmsj", "dgjj", "nh2", "ne5", "nm2", "nc3"], arts: ["kgim", "t2_tigerroar"] },
    nodes: [
      n("zhongji", "จุดจงจี๋", "dantian", { acc: [11, 11, 11] }),
      n("jianli", "จุดเจี้ยนหลี่", "solar", { atk: [16, 17, 17] }),
      n("jiuwei", "จุดจิ๋วเหว่ย", "heart", { cri: [6, 6, 6] }),
      n("jianjing_l", "จุดเจี้ยนจิ่งซ้าย", "l_shoulder", { ia: [18, 18, 18] }),
      n("shaohai_l", "จุดเส้าไห่ซ้าย", "l_elbow", { acc: [12, 12, 12] }),
      n("shenmen_l", "จุดเสินเหมิน", "l_wrist", { atk: [19, 20, 20] }),
      n("shaoshang_l", "จุดเส้าซาง", "l_palm", { cri: [6, 7, 7] }),
      n("huagai", "จุดหัวไก้", "chest", { ia: [21, 21, 21] }),
      n("jianjing_r", "จุดเจี้ยนจิ่งขวา", "r_shoulder", { acc: [14, 14, 14] }),
      n("shaohai_r", "จุดเส้าไห่ขวา", "r_elbow", { atk: [22, 23, 23] }),
      n("waiguan_r", "จุดไว่กวน", "r_wrist", { cri: [7, 8, 8] }),
      n("yuji_r", "จุดอวี๋จี้", "r_palm", { acc: [3, 3, 3], atk: [6, 6, 6], cri: [2, 2, 2], ia: [6, 6, 6] }),
    ],
  },
  {
    id: "deathless_vajra", name: "ชีพจรวัชระอมตะ", ti: 5, kind: "ability",
    description: "เปลี่ยนเส้นเอ็นแล้วหลอมกายวัชระ ร่างที่ไม่มีอาวุธใดในยุทธภพทำลายได้",
    requires: { skills: ["ne2", "sl_staff_shaolin"], arts: ["kuyt", "tendon", "diamond", "t3_onefinger", "t2_dharma"] },
    nodes: [
      n("shenting", "จุดเสินถิง", "brow", { VIT: [1, 1, 2] }),
      n("renying", "จุดเหรินอิ๋ง", "throat", { hp_regen: [0.5, 0.5, 0.5] }),
      n("xuanji", "จุดซวนจี", "chest", { DEF: [1, 2, 2] }),
      n("shenfeng", "จุดเสินเฟิง", "heart", { pct_red: [1.5, 1.5, 2] }, [{ t: "ward", count: 5 }]),
      n("shangwan", "จุดซั่งหว่าน", "solar", { hp: [50, 50, 50] }),
      n("shenque", "จุดเสินเชวี่ย", "navel", { hp_regen: [0.5, 0.5, 0.5] }),
      n("zhongji", "จุดจงจี๋", "dantian", { VIT: [2, 2, 2] }, [{ t: "shield", pct: 22 }]),
      n("huiyin", "จุดฮุ่ยอิน", "tailbone", { pct_red: [1.5, 2, 2] }),
      n("shenshu", "จุดเซิ่นซู", "lower_back", { DEF: [2, 2, 2] }),
      n("lingtai", "จุดหลิงไถ", "upper_back", { hp_regen: [0.5, 0.5, 0.75] }),
      n("fengchi", "จุดเฟิงฉือ", "nape", { hp: [70, 70, 70] }),
      n("qianding", "จุดเฉียนติ่ง", "crown", { pct_red: [2, 2, 2] }, [{ t: "revive", hpPct: 50 }]),
    ],
  },
  {
    id: "heavenly_demon", name: "ชีพจรมารสวรรค์", ti: 5, kind: "ability",
    description: "เส้นต้องห้ามของสำนักดาบโลหิต เลือดเดือดด้วยเพลิงสวรรค์ ทุกคมที่ฟันออกไปคือความพินาศ",
    requires: { skills: ["bs", "ne9", "nm1", "nc7"], arts: ["khbt", "blood", "fire", "t2_tigerroar"] },
    nodes: [
      n("taibai_l", "จุดไท่ไป๋", "l_sole", { STR: [1, 2, 2] }),
      n("taichong_r", "จุดไท่ชง", "r_sole", { pct_atk: [1, 1, 1.5] }),
      n("liangqiu_r", "จุดเหลียงชิว", "r_knee", { cri: [2, 3, 3] }),
      n("changqiang", "จุดฉางเฉียง", "tailbone", { pct_atk: [1, 1.5, 1.5] }, [{ t: "revive", hpPct: 50 }]),
      n("xinshu", "จุดซินซู", "upper_back", { POW: [2, 2, 2] }),
      n("yamen", "จุดย่าเหมิน", "nape", { pct_atk: [1, 1.5, 1.5] }),
      n("sishencong", "จุดซื่อเสินชง", "crown", { STR: [2, 2, 2] }, [{ t: "sap", stat: "atk", v: 20, turns: 3, chance: 35 }]),
      n("lianquan", "จุดเหลียนเฉวียน", "throat", { pct_atk: [1.5, 1.5, 1.5] }),
      n("tanzhong", "จุดถานจง", "chest", { cri: [3, 4, 4] }),
      n("jianli", "จุดเจี้ยนหลี่", "solar", { pct_atk: [1.5, 1.5, 1.5] }),
      n("guanyuan", "จุดกวนเอวี๋ยน", "dantian", { POW: [2, 2, 3] }),
      n("yanglingquan_l", "จุดหยางหลิงเฉวียน", "l_knee", { pct_atk: [1.5, 1.5, 2] }, [{ t: "rage", element: "fire", v: 8, turns: 5, chance: 40, maxStacks: 5 }]),
    ],
  },
  {
    id: "starry_revolution", name: "ชีพจรดาราหมุนเวียน", ti: 5, kind: "buff",
    description: "ดาวเคลื่อนดาราคล้อยคู่กับเฉียนคุน ปราณศัตรูหมุนเข้าวงโคจรของร่างแล้วถูกส่งคืนไปทั้งหมด",
    requires: { arts: ["khbt", "yxhd", "qiankun", "t3_sm_dualfusion", "t2_sm_sunbody", "t2_sm_moonbody", "t1_sm_moonweave"] },
    nodes: [
      n("shenque", "จุดเสินเชวี่ย", "navel", { POW: [1, 2, 2] }),
      n("zhongji", "จุดจงจี๋", "dantian", { eva: [5, 5, 5] }),
      n("biguan_l", "จุดปี้กวน", "l_hip", { LUK: [1, 2, 2] }),
      n("yinlingquan_l", "จุดอินหลิงเฉวียน", "l_knee", { res: [3, 4, 4] }, [{ t: "rage", element: "water", v: 2.5, turns: 5, chance: 40, maxStacks: 5 }]),
      n("zhaohai_l", "จุดเจ้าไห่", "l_ankle", { POW: [1, 2, 2] }),
      n("yongquan_l", "จุดหย่งเฉวียน", "l_sole", { eva: [6, 6, 6] }),
      n("yinbai_r", "จุดอิ่นไป๋", "r_sole", { LUK: [2, 2, 2] }, [{ t: "shield", pct: 22 }]),
      n("taixi_r", "จุดไท่ซี", "r_ankle", { res: [4, 5, 5] }),
      n("yanglingquan_r", "จุดหยางหลิงเฉวียน", "r_knee", { POW: [2, 2, 2] }),
      n("fengshi_r", "จุดเฟิงซื่อ", "r_hip", { eva: [6, 6, 6] }),
      n("huiyin", "จุดฮุ่ยอิน", "tailbone", { LUK: [2, 2, 2] }),
      n("shenshu", "จุดเซิ่นซู", "lower_back", { res: [4, 5, 5], pct_red: [2, 2, 2.5], pct_atk: [2.5, 3, 3], hp_regen: [0.5, 0.75, 0.75] }, [{ t: "ward", count: 5 }]),
    ],
  },
  {
    id: "grand_circuit", name: "มหาจักรวาลชีพจร", ti: 5, kind: "buff",
    description: "โคจรใหญ่ของฟ้าดินในกายมนุษย์ ปราณเดินครบสิบสองจุดแล้วกลับมาที่เดิมเป็นหนึ่งรอบจักรวาล",
    requires: { skills: ["nu2", "lmsj", "na2", "dp", "nc5"], arts: ["kuyt", "fire", "t2_tigerroar"] },
    nodes: [
      n("baliao", "จุดปาเหลียว", "tailbone", { STR: [2, 2, 2] }),
      n("xinshu", "จุดซินซู", "upper_back", { atk: [9, 9, 9] }),
      n("yamen", "จุดย่าเหมิน", "nape", { VIT: [2, 2, 2] }),
      n("baihui", "จุดไป่ฮุ่ย", "crown", { spd: [5, 5, 6] }),
      n("tiantu", "จุดเทียนทู", "throat", { STR: [2, 2, 3] }),
      n("tanzhong", "จุดถานจง", "chest", { atk: [10, 11, 11] }),
      n("shangwan", "จุดซั่งหว่าน", "solar", { VIT: [2, 2, 3] }),
      n("qihai", "จุดฉี่ไห่", "dantian", { spd: [5, 5, 6] }),
      n("weizhong_l", "จุดเหว่ยจง", "l_knee", { STR: [2, 2, 3] }),
      n("zhiyin_l", "จุดจื้ออิน", "l_sole", { atk: [12, 12, 12] }),
      n("yongquan_r", "จุดหย่งเฉวียน", "r_sole", { VIT: [2, 3, 3] }),
      n("xuehai_r", "จุดเสวี่ยไห่", "r_knee", { spd: [6, 6, 6], pct_atk: [3, 3, 3], pct_red: [2, 2.5, 2.5], hp_regen: [0.5, 0.75, 0.75] }, [{ t: "opening", stat: "atk", v: 25, turns: 5 }]),
    ],
  },
];

export const MERIDIAN_CHARTS: readonly MeridianChart[] = [...T0, ...T1, ...T2, ...T3, ...T4, ...T5];
