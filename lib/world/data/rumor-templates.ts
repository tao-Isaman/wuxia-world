// Liveness Layer §3.2 + §5.2 — rumor template pools.
// Filled by Phase 2 Agent E. Each event kind / player action / warning
// kind owns one or more templates; the rumor engine renders a chosen
// template against an event-payload object using {placeholder} subs.

import type { NpcEventKind, RumorChannel, RumorTruth } from "../types";

// Template tokens supported (fail loudly when unknown):
// {npc}        — actor's name
// {npc2}       — secondary actor's name (rival, victim, killer)
// {location}   — location label
// {sect}       — sect display name
// {art}        — art display name
// {item}       — item label
// {archetype}  — player archetype label
// {days}       — day count for warning rumors
// {event}      — scheduled-event label (warning rumors only)
export interface RumorTemplate {
  text: string;
  // 0-10. Boosted ×2 by rumor engine when actor sectRank ≤ 3 OR event
  // kind in {death_combat, master_art, betray_sect}.
  weight: number;
  // For event-derived rumors. Default 60 days. Big news (death of
  // grandmaster, betrayal) bumps to 120.
  lifespan: number;
  channel: RumorChannel;
  // Optional distorted version of the same news (engine rolls 15%).
  distorted?: string;
  // Optional false version (engine rolls 5%).
  fake?: string;
}

// Event-echo templates — keyed by NpcEventKind.
export const NPC_EVENT_TEMPLATES: Partial<Record<NpcEventKind, readonly RumorTemplate[]>> = {
  // ─── death_natural — peaceful death by age ─────────────────────────────
  death_natural: [
    {
      text: "ได้ยินว่า{npc}แห่งสำนัก{sect}สิ้นบุญด้วยอาการสงบที่{location}",
      weight: 5,
      lifespan: 60,
      channel: "inn",
      distorted: "ลือว่า{npc}จากไปแล้ว แต่บางคนว่ายังเห็นเงาท่านเดินอยู่บนเขาในยามค่ำ",
    },
    {
      text: "ข่าวจากสำนัก{sect}บอกว่าปรมาจารย์{npc}สิ้นอายุขัยอย่างสงบ ลูกศิษย์ทั่วยุทธจักรล้วนมาคารวะ",
      weight: 4,
      lifespan: 60,
      channel: "inn",
    },
  ],

  // ─── death_combat — slain in a duel (BIG NEWS) ─────────────────────────
  death_combat: [
    {
      text: "ลือกันสนั่นยุทธจักรว่า{npc2}สังหาร{npc}ที่{location} เลือดนองพื้น",
      weight: 9,
      lifespan: 120,
      channel: "inn",
      distorted: "{npc}ถูกพบศพที่{location} ไม่รู้ฝีมือใครจริง ๆ บ้างก็ว่า{npc2} บ้างก็ว่าผู้ลึกลับ",
      fake: "ข่าวลือว่า{npc}ถูก{npc2}สังหารที่{location} แต่หลังเหตุการณ์ยังเห็นท่านนั่งสมาธิอยู่",
    },
    {
      text: "นักท่องยุทธ์เล่ากันว่า{npc}กับ{npc2}ปะทะกันถึงตายที่{location} — สุดท้าย{npc2}เป็นผู้รอดเพียงคนเดียว",
      weight: 8,
      lifespan: 120,
      channel: "inn",
      distorted: "ที่{location} {npc2}บาดเจ็บสาหัสในการต่อสู้กับ{npc} ผลแพ้ชนะยังไม่แน่ชัด",
      fake: "ลือว่า{npc}ตายในมือ{npc2}แล้ว ทว่ามีคนเห็นท่านขี่ม้าผ่านไปทางทิศตะวันตก",
    },
  ],

  // ─── sect_promotion — promoted to a new rank ───────────────────────────
  sect_promotion: [
    {
      text: "ข่าวจากสำนัก{sect}บอกว่า{npc}ได้รับการเลื่อนตำแหน่งใหม่ในวงในของสำนัก",
      weight: 5,
      lifespan: 60,
      channel: "inn",
      distorted: "ลือว่า{npc}ขึ้นเป็นใหญ่ในสำนัก{sect}เพราะมีของกำนัลกับผู้ใหญ่ในสำนัก",
    },
    {
      text: "ใคร ๆ ว่าสำนัก{sect}แต่งตั้ง{npc}ขึ้นรับตำแหน่งใหม่ เพราะวิทยายุทธ์เพิ่มมากขึ้นในไม่กี่เดือนนี้",
      weight: 4,
      lifespan: 60,
      channel: "inn",
    },
  ],

  // ─── sect_demotion — demoted ───────────────────────────────────────────
  sect_demotion: [
    {
      text: "ลือว่า{npc}ถูกลดตำแหน่งในสำนัก{sect} เพราะทำผิดวินัยใหญ่",
      weight: 4,
      lifespan: 60,
      channel: "inn",
      distorted: "ใคร ๆ ว่า{npc}โดน{sect}ถอดยศเพราะแอบสอนวิชาให้คนนอก — แต่บ้างก็ว่าเป็นเรื่องของหญิง",
    },
    {
      text: "ข่าววงในจากสำนัก{sect}บอกว่า{npc}ตกชั้นอย่างไม่มีปี่มีขลุ่ย ลูกศิษย์ต่างพากันสงสัย",
      weight: 4,
      lifespan: 60,
      channel: "sect_internal",
    },
  ],

  // ─── master_art — finished mastering an art (BIG NEWS) ─────────────────
  master_art: [
    {
      text: "ลือสะท้านยุทธจักรว่า{npc}แห่ง{sect}สำเร็จวิชา{art}แล้วในที่สุด",
      weight: 9,
      lifespan: 120,
      channel: "inn",
      distorted: "ลือว่า{npc}สำเร็จวิชา{art}ระดับขั้นต้นเท่านั้น ยังไม่ใช่ขั้นแก่นแท้อย่างที่ใครบางคนว่ากัน",
      fake: "ข่าวลือว่า{npc}ฝึกวิชา{art}สำเร็จขั้นสูงสุด ทว่ามีผู้พบท่านนั่งครุ่นคิดอยู่ที่{location}เหมือนยังหาทางออกไม่ได้",
    },
    {
      text: "ผู้คนเล่าขานว่า{npc}แห่งสำนัก{sect}แสดงวิชา{art}อย่างสมบูรณ์เป็นครั้งแรก ลูกศิษย์ต่างก้มกราบ",
      weight: 8,
      lifespan: 120,
      channel: "inn",
      distorted: "ใคร ๆ ว่า{npc}สำเร็จวิชา{art}ก็จริง แต่ต้องแลกด้วยกำลังภายในที่หายไปครึ่งหนึ่ง",
    },
  ],

  // ─── found_treasure — found an item at a location ──────────────────────
  found_treasure: [
    {
      text: "ลือกันที่ตลาดว่า{npc}พบ{item}อันล้ำค่าที่{location} กลับสำนักอย่างเงียบ ๆ",
      weight: 5,
      lifespan: 60,
      channel: "market",
      distorted: "ใครบางคนว่า{npc}ขุดได้{item}ที่{location} แต่บ้างก็ว่าเป็นของปลอมที่ทำขึ้นเพื่อหลอกศัตรู",
    },
    {
      text: "ข่าวจาก{location}ว่า{npc}แห่ง{sect}พบสมบัติล้ำค่าที่ผู้ใดมาก่อนก็คว้าไว้ไม่ได้",
      weight: 4,
      lifespan: 60,
      channel: "inn",
      fake: "ลือว่า{npc}พบ{item}ที่{location} ทว่าผู้ที่ตามไปดูกลับพบเพียงถ้ำว่างเปล่า",
    },
  ],

  // ─── travel — left for somewhere (LOW PRIORITY) ────────────────────────
  travel: [
    {
      text: "ใคร ๆ ว่า{npc}ออกเดินทางจาก{sect}ไปยัง{location}โดยไม่บอกใคร",
      weight: 3,
      lifespan: 30,
      channel: "inn",
    },
  ],

  // ─── secluded — entered seclusion ──────────────────────────────────────
  secluded: [
    {
      text: "ข่าวจาก{sect}บอกว่า{npc}เข้าฌานปิดประตูที่{location} ห้ามผู้ใดรบกวนสามปี",
      weight: 5,
      lifespan: 60,
      channel: "inn",
      distorted: "ลือว่า{npc}เข้าฌานก็จริง แต่ที่จริงแล้วท่านบาดเจ็บภายในหนัก ต้องรักษาตัวเงียบ ๆ",
    },
    {
      text: "นักท่องยุทธ์เล่าว่า{npc}สละโลกเข้าสมาธิที่{location} ไม่มีใครกล้าเดินผ่าน",
      weight: 4,
      lifespan: 60,
      channel: "inn",
    },
  ],

  // ─── marry — married another NPC ───────────────────────────────────────
  marry: [
    {
      text: "ลือกันทั่วยุทธจักรว่า{npc}กับ{npc2}แต่งงานกันที่{location} งานเลี้ยงกินเวลาสามวัน",
      weight: 5,
      lifespan: 60,
      channel: "inn",
      distorted: "ใคร ๆ ว่า{npc}กับ{npc2}แต่งงานกันแล้ว ทว่าบ้างก็ว่าเป็นแค่พิธีรับเป็นพี่น้องเท่านั้น",
    },
    {
      text: "ข่าวรักลือว่า{npc}แห่ง{sect}สมรสกับ{npc2} ผู้คนต่างยินดีปรีดา",
      weight: 4,
      lifespan: 60,
      channel: "inn",
    },
  ],

  // ─── betray_sect — defected from a sect (BIG NEWS) ─────────────────────
  betray_sect: [
    {
      text: "ลือสะท้านยุทธจักรว่า{npc}ทรยศสำนัก{sect} หนีออกมากลางคืนพร้อมคัมภีร์ลับ",
      weight: 9,
      lifespan: 120,
      channel: "inn",
      distorted: "ใคร ๆ ว่า{npc}ทรยศ{sect}ก็จริง แต่บ้างก็ว่าเป็นเพราะถูกใส่ร้าย ไม่ใช่ขโมยอะไร",
      fake: "ลือว่า{npc}ทรยศสำนัก{sect}แล้ว ทว่าวันถัดมามีผู้พบท่านนั่งสมาธิอยู่ที่{location}อย่างปกติ",
    },
    {
      text: "ข่าววงในจาก{sect}บอกว่า{npc}แปรพักตร์จากสำนักไปแล้ว มีใบประกาศจับตัวออกทั่วยุทธจักร",
      weight: 8,
      lifespan: 120,
      channel: "inn",
      distorted: "บ้างว่า{npc}ทรยศ{sect}ไปเข้าพรรคอธรรม บ้างว่าออกไปตั้งสำนักของตนเอง",
    },
  ],

  // ─── take_disciple — took on a new disciple ────────────────────────────
  take_disciple: [
    {
      text: "ข่าวจาก{sect}บอกว่า{npc}รับศิษย์คนใหม่เข้าสำนัก พิธีเงียบ ๆ ที่{location}",
      weight: 3,
      lifespan: 60,
      channel: "inn",
    },
    {
      text: "ใคร ๆ ว่า{npc}แห่ง{sect}รับเด็กกำพร้าเป็นศิษย์ก้นกุฏิ คาดว่าจะถ่ายทอดวิชา{art}ในอนาคต",
      weight: 3,
      lifespan: 60,
      channel: "inn",
    },
  ],

  // ─── defeated_by_player — was defeated by an unnamed challenger ────────
  defeated_by_player: [
    {
      text: "ลือว่า{npc}แห่งสำนัก{sect}พ่ายแพ้ในมือผู้ท้าทายไร้ชื่อที่{location}",
      weight: 6,
      lifespan: 60,
      channel: "inn",
      distorted: "ใครบางคนว่า{npc}แพ้นักดาบหนุ่ม บ้างก็ว่าแพ้นักพรตเฒ่า — ไม่มีใครรู้แน่ชัด",
      fake: "ข่าวลือว่า{npc}โดนล้มแล้ว ทว่าวันรุ่งขึ้นยังเห็นท่านสอนศิษย์ที่{location}",
    },
    {
      text: "นักท่องยุทธ์เล่ากันว่า{npc}โดนผู้แปลกหน้าเอาชนะที่{location} ไม่กล้าเอ่ยชื่อผู้ปราบ",
      weight: 5,
      lifespan: 60,
      channel: "wilderness",
    },
  ],
};

// Player-echo templates — keyed by hardcoded action id.
export const PLAYER_ECHO_TEMPLATES: Record<string, readonly RumorTemplate[]> = {
  // ─── duel_win_named — player won a duel against a named NPC ────────────
  duel_win_named: [
    {
      text: "ได้ยินว่า{archetype}บุก{location} เอาชนะ{npc}ในการประลองตัวต่อตัว",
      weight: 6,
      lifespan: 60,
      channel: "inn",
      distorted: "ลือว่า{archetype}ใช้ฝ่ามือเย็นปราบ{npc} แต่ใครเห็นวิชาที่ใช้ก็ไม่มี",
      fake: "ข่าวลือว่า{npc}ตายในมือ{archetype} — ทว่าเช้านี้ยังเห็นท่านที่{location}",
    },
    {
      text: "นักท่องยุทธ์เล่ากันว่า{archetype}ปะทะ{npc}ที่{location} สามสิบเพลงเอาชนะได้",
      weight: 5,
      lifespan: 60,
      channel: "inn",
      distorted: "ใคร ๆ ว่า{archetype}ชนะ{npc}ก็จริง แต่บ้างว่าเป็นเพราะ{npc}ป่วยอยู่ก่อน",
    },
  ],

  // ─── sect_join — player joined a sect ──────────────────────────────────
  sect_join: [
    {
      text: "ข่าวจากสำนัก{sect}บอกว่า{archetype}เข้าเป็นศิษย์ใหม่ พิธีเรียบง่ายแต่จริงใจ",
      weight: 5,
      lifespan: 60,
      channel: "inn",
      distorted: "ลือว่า{archetype}เข้าสำนัก{sect}เพราะหวังคัมภีร์ลับ ไม่ใช่เพราะศรัทธาจริง",
    },
    {
      text: "ใคร ๆ ว่า{archetype}ก้มกราบรับ{sect}เป็นสำนัก คาดว่าจะก้าวหน้าเร็วเพราะรากฐานแน่น",
      weight: 4,
      lifespan: 60,
      channel: "sect_internal",
    },
  ],

  // ─── sect_leave_or_betray — player left or betrayed ────────────────────
  sect_leave_or_betray: [
    {
      text: "ลือกันสนั่นว่า{archetype}แตกหักกับสำนัก{sect}แล้ว เดินออกจากภูเขาในยามค่ำ",
      weight: 7,
      lifespan: 120,
      channel: "inn",
      distorted: "ใคร ๆ ว่า{archetype}ออกจาก{sect}ก็จริง แต่บ้างว่าเป็นเพราะอาจารย์ไม่ยอมสอนวิชา{art}ให้",
      fake: "ลือว่า{archetype}ทรยศ{sect}แล้ว ทว่ามีคนเห็นท่านยังสวมเครื่องแบบศิษย์อยู่ที่{location}",
    },
    {
      text: "ข่าวจาก{sect}บอกว่า{archetype}แปรพักตร์ออกจากสำนัก ผู้ใหญ่ในสำนักโกรธจัด",
      weight: 6,
      lifespan: 120,
      channel: "sect_internal",
      distorted: "บ้างว่า{archetype}ออกจาก{sect}ด้วยใจสงบ บ้างว่าหนีในยามค่ำพร้อมคัมภีร์",
    },
  ],

  // ─── quest_major_complete — player finished a major quest ──────────────
  quest_major_complete: [
    {
      text: "นักท่องยุทธ์เล่ากันว่า{archetype}สำเร็จภารกิจใหญ่ที่{location} ผู้คนต่างขอบคุณ",
      weight: 6,
      lifespan: 60,
      channel: "inn",
      distorted: "ลือว่า{archetype}แก้เรื่องที่{location}ได้ก็จริง แต่บ้างว่าได้ค่าตอบแทนเป็นทอง บ้างว่าไม่รับสักแดง",
    },
    {
      text: "ข่าวลือว่า{archetype}เป็นผู้คลายปมร้ายที่{location} ชาวบ้านต่างจุดธูปบูชา",
      weight: 5,
      lifespan: 60,
      channel: "market",
      fake: "ลือว่า{archetype}สำเร็จภารกิจใหญ่ที่{location} แต่ความจริงเป็นเพียงเรื่องเล็ก ผู้คนเล่าจนใหญ่",
    },
  ],

  // ─── sect_rank_up — player climbed in sect rank ────────────────────────
  sect_rank_up: [
    {
      text: "ข่าวจากสำนัก{sect}บอกว่า{archetype}ขึ้นรับตำแหน่งใหม่ ลูกศิษย์ต่างก้มหัวคารวะ",
      weight: 5,
      lifespan: 60,
      channel: "inn",
      distorted: "ใคร ๆ ว่า{archetype}เลื่อนยศใน{sect}เร็วผิดปกติ บ้างว่าเป็นเพราะวิทยายุทธ์ บ้างว่าเส้นสาย",
    },
    {
      text: "ลือกันว่า{archetype}ก้าวขึ้นเป็นแกนหลักของสำนัก{sect} วิทยายุทธ์เพิ่มเร็วเกินกว่ารุ่นเดียวกัน",
      weight: 4,
      lifespan: 60,
      channel: "sect_internal",
    },
  ],
};

// Warning templates — keyed by free-form scheduled-event kind. Rumor
// engine picks one per warning generation. Truth always "true".
export const WARNING_TEMPLATES: Record<string, readonly RumorTemplate[]> = {
  // สงครามยุทธจักร / sect-gathering tournament
  tournament: [
    {
      text: "อีก {days} วันจะมี{event}ที่{location} ยอดยุทธ์จากทั่วยุทธจักรจะมาประลองกัน",
      weight: 9,
      lifespan: 30,
      channel: "inn",
    },
  ],

  // เทศกาลใหญ่
  festival: [
    {
      text: "อีก {days} วันจะมี{event}ที่{location} พ่อค้าและนักเดินทางต่างเตรียมเดินทางไปฉลอง",
      weight: 8,
      lifespan: 30,
      channel: "market",
    },
  ],

  // สำนัก gathering
  sect_gathering: [
    {
      text: "ข่าวจากวงในว่าอีก {days} วันสำนักใหญ่จะรวมตัวกันที่{location} เพื่อหารือ{event} เรื่องสำคัญของยุทธภพ",
      weight: 9,
      lifespan: 30,
      channel: "inn",
    },
  ],

  // โจรจะมาปล้นเมือง
  bandit_raid: [
    {
      text: "ลือกันสนั่นว่าอีก {days} วันโจรจะบุกปล้น{location} ชาวบ้านต่างเตรียมหลบหนี — {event}กำลังจะมา",
      weight: 10,
      lifespan: 30,
      channel: "inn",
    },
  ],

  // ปรากฏการณ์ฟ้า
  eclipse: [
    {
      text: "นักดูดวงเล่ากันว่าอีก {days} วันจะเกิด{event}ที่{location} ผู้รู้ว่าเป็นลางสำคัญของยุทธจักร",
      weight: 8,
      lifespan: 30,
      channel: "inn",
    },
  ],
};

export const DEFAULT_LIFESPAN_DAYS = 60;
export const BIG_NEWS_LIFESPAN_DAYS = 120;

// Helper: render a template by substituting tokens. Unknown tokens
// stay literal (warns to console in dev) so authoring typos surface.
export function renderTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (_, key: string) => {
    if (key in vars) return vars[key];
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[rumor] template token {${key}} unresolved`);
    }
    return `{${key}}`;
  });
}

// Marker — re-exported so the engine can union truth states without
// importing types.ts directly when only constants are needed.
export const RUMOR_TRUTH_KEYS: readonly RumorTruth[] = ["true", "distorted", "false"];
