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
// {dest}       — a journey's destination
// {title}      — the person's rank title now ("ผู้อาวุโสหัวซาน")
// {tier}       — the person's standing by power ("ยอดฝีมือ")
export interface RumorTemplate {
  text: string;
  // 0-10. Boosted ×2 by the rumor engine for big news: event kind in
  // {death_combat, master_art, betray_sect}. (Its "actor sectRank ≤ 3" rule
  // never matches — the named roster uses 10 for the top rank.)
  weight: number;
  // Informational only: the engine ignores this and uses
  // DEFAULT_LIFESPAN_DAYS (20) or BIG_NEWS_LIFESPAN_DAYS (40) below.
  lifespan: number;
  channel: RumorChannel;
  // Optional distorted version of the same news (engine rolls 15%).
  distorted?: string;
  // Optional false version (engine rolls 5%).
  fake?: string;
  // Only for some events: a journey's purpose, whether the person has a
  // sect, whether an art is named.
  when?: { purpose?: string; sect?: boolean; art?: boolean };
}

// Event-echo templates — keyed by NpcEventKind. Liveness 2.0: every NPC
// event really happened, so its rumor tells it as it was (no false or
// distorted variants). `when` narrows a template to some events: the
// journey's purpose, or whether the person has a sect.
export const NPC_EVENT_TEMPLATES: Partial<Record<NpcEventKind, readonly RumorTemplate[]>> = {
  death_natural: [
    { text: "ได้ยินว่า{npc}แห่งสำนัก{sect}สิ้นบุญด้วยอาการสงบที่{location} ลูกศิษย์ไว้ทุกข์กันทั้งสำนัก", weight: 6, lifespan: 60, channel: "inn", when: { sect: true } },
    { text: "ข่าวจากสำนัก{sect}บอกว่าปรมาจารย์{npc}สิ้นอายุขัยแล้ว จอมยุทธ์ทั่วยุทธจักรพากันไปคารวะศพ", weight: 5, lifespan: 60, channel: "inn", when: { sect: true } },
    { text: "ได้ยินว่า{npc}ล้มป่วยและจากไปอย่างสงบที่{location} ยุทธจักรสูญเสียคนดีไปอีกคน", weight: 4, lifespan: 60, channel: "inn", when: { sect: false } },
  ],
  death_combat: [
    { text: "ลือกันสนั่นยุทธจักรว่า{npc2}สังหาร{npc}ที่{location} เลือดนองพื้น", weight: 9, lifespan: 120, channel: "inn" },
    { text: "นักท่องยุทธ์เล่ากันว่า{npc}กับ{npc2}ปะทะกันถึงตายที่{location} สุดท้าย{npc2}เป็นผู้รอดเพียงคนเดียว", weight: 8, lifespan: 120, channel: "inn" },
  ],
  killed_by_player: [
    { text: "ลือกันสนั่นว่า{npc}ถูกสังหารกลางวันแสก ๆ ที่{location} ทางการออกหมายจับคนร้ายทั่วแผ่นดิน", weight: 9, lifespan: 120, channel: "inn" },
  ],
  sect_promotion: [
    { text: "ข่าวจากสำนัก{sect}บอกว่า{npc}ได้เลื่อนขึ้นเป็น{title} เพราะฝีมือก้าวหน้าเร็ว", weight: 5, lifespan: 60, channel: "inn" },
    { text: "ศิษย์ในสำนักพูดกันว่า{npc}ได้รับแต่งตั้งเป็น{title}แล้ว", weight: 5, lifespan: 60, channel: "sect_internal" },
  ],
  sect_demotion: [
    { text: "ข่าววงในจากสำนัก{sect}บอกว่า{npc}ถูกลดตำแหน่งเพราะทำผิดวินัย", weight: 4, lifespan: 60, channel: "sect_internal" },
  ],
  master_art: [
    { text: "ลือสะท้านยุทธจักรว่า{npc}แห่ง{sect}สำเร็จวิชา{art}แล้วในที่สุด", weight: 9, lifespan: 120, channel: "inn", when: { art: true, sect: true } },
    { text: "ลือสะท้านยุทธจักรว่า{npc}ฝึกวิชา{art}สำเร็จแล้ว ทั้งที่ไม่มีสำนักใดสั่งสอน", weight: 8, lifespan: 120, channel: "inn", when: { art: true, sect: false } },
    { text: "ผู้คนเล่าขานว่า{npc}ฝึกวิชาทะลวงขั้นใหม่ ฝีมือตอนนี้นับเป็น{tier}ของยุทธจักร", weight: 7, lifespan: 90, channel: "inn", when: { art: false } },
  ],
  found_treasure: [
    { text: "ลือกันที่ตลาดว่า{npc}พบ{item}อันล้ำค่าที่{location}", weight: 5, lifespan: 60, channel: "market" },
    { text: "ข่าวจาก{location}ว่า{npc}ค้นเจอ{item}ในที่ที่ผู้คนมองข้ามมานาน", weight: 4, lifespan: 60, channel: "inn" },
  ],
  travel: [
    { text: "ใคร ๆ ว่า{npc}ออกเดินทางไปยัง{location}", weight: 3, lifespan: 30, channel: "inn" },
  ],
  journey: [
    { text: "เห็น{npc}ออกจาก{location} บอกว่าจะไปขอเข้าเป็นศิษย์สำนัก{sect}", weight: 5, lifespan: 30, channel: "inn", when: { purpose: "join" } },
    { text: "เห็น{npc}ออกจาก{location} มุ่งหน้าไปสำนัก{sect}เพื่อขอเข้าสังกัดใหม่", weight: 6, lifespan: 30, channel: "inn", when: { purpose: "defect" } },
    { text: "ลือกันว่า{npc}ออกตามหา{npc2} ประกาศว่าครั้งนี้ต้องตัดสินกันให้รู้แล้วรู้รอด", weight: 7, lifespan: 30, channel: "inn", when: { purpose: "duel" } },
    { text: "ได้ยินว่า{npc}ได้แผนที่เก่ามา แล้วรีบออกเดินทางไป{dest}อย่างเงียบ ๆ", weight: 5, lifespan: 30, channel: "market", when: { purpose: "treasure" } },
    { text: "พ่อค้าเล่าว่าเห็น{npc}ที่{location} กำลังจะเดินทางต่อไป{dest}", weight: 3, lifespan: 21, channel: "inn", when: { purpose: "wander" } },
  ],
  join_sect: [
    { text: "ข่าวจาก{location}ว่า{npc}ได้รับเข้าเป็นศิษย์สำนัก{sect}แล้ว", weight: 5, lifespan: 45, channel: "inn" },
    { text: "สำนักรับศิษย์ใหม่ชื่อ{npc} ผู้อาวุโสว่ารากฐานใช้ได้", weight: 4, lifespan: 45, channel: "sect_internal" },
  ],
  secluded: [
    { text: "ข่าวจาก{sect}บอกว่า{npc}เข้าปิดด่านฝึกวิชาที่{location} ห้ามผู้ใดรบกวนหลายเดือน", weight: 5, lifespan: 60, channel: "inn", when: { sect: true } },
    { text: "นักท่องยุทธ์เล่าว่า{npc}ปลีกตัวไปฝึกวิชาอย่างเงียบ ๆ ไม่ยอมพบผู้ใด", weight: 4, lifespan: 60, channel: "inn", when: { sect: false } },
  ],
  leave_seclusion: [
    { text: "ลือกันว่า{npc}ออกจากการปิดด่านแล้ว ฝีมือก้าวหน้าจนศิษย์ในสำนักตกตะลึง", weight: 6, lifespan: 45, channel: "inn" },
  ],
  marry: [
    { text: "ลือกันทั่วยุทธจักรว่า{npc}กับ{npc2}แต่งงานกันที่{location} งานเลี้ยงกินเวลาสามวัน", weight: 5, lifespan: 60, channel: "inn" },
  ],
  betray_sect: [
    { text: "ลือสะท้านยุทธจักรว่า{npc}ทรยศสำนัก{sect} หนีลงเขาไปกลางดึก", weight: 9, lifespan: 120, channel: "inn" },
    { text: "ข่าววงในบอกว่า{npc}แปรพักตร์จากสำนัก{sect}ไปแล้ว เจ้าสำนักโกรธจนสั่งตามตัว", weight: 8, lifespan: 120, channel: "sect_internal" },
  ],
  take_disciple: [
    { text: "ข่าวจาก{sect}บอกว่า{npc}รับ{npc2}เป็นศิษย์คนใหม่ พิธีเงียบ ๆ ที่{location}", weight: 4, lifespan: 60, channel: "inn" },
    { text: "ในสำนักพูดกันว่า{npc}รับ{npc2}เป็นศิษย์ก้นกุฏิ หวังให้สืบทอดวิชา", weight: 4, lifespan: 60, channel: "sect_internal" },
  ],
  new_chief: [
    { text: "ข่าวใหญ่จากสำนัก{sect} — {npc}ขึ้นนั่งตำแหน่งเจ้าสำนักคนใหม่แล้ว", weight: 9, lifespan: 90, channel: "inn" },
    { text: "ศิษย์ทั้งสำนักคารวะ{npc}ในฐานะเจ้าสำนักคนใหม่ ใครจะขึ้นเขามาต้องผ่านท่านก่อน", weight: 7, lifespan: 90, channel: "sect_internal" },
  ],
  duel: [
    { text: "ลือกันว่า{npc}ประลองกับ{npc2}ที่{location} {npc2}พ่ายแพ้บาดเจ็บต้องพักรักษาตัว", weight: 6, lifespan: 45, channel: "inn" },
    { text: "คนที่เห็นเล่าว่า{npc}เอาชนะ{npc2}ได้ในไม่กี่สิบกระบวนท่าที่{location}", weight: 5, lifespan: 45, channel: "wilderness" },
  ],
  newcomer: [
    { text: "ที่{location}มีจอมยุทธ์หน้าใหม่ชื่อ{npc}ปรากฏตัว ยังไม่มีใครรู้ว่ามาจากไหน", weight: 4, lifespan: 30, channel: "inn" },
  ],
  defeated_by_player: [
    { text: "ลือว่า{npc}แห่งสำนัก{sect}พ่ายแพ้ในมือผู้ท้าทายไร้ชื่อที่{location}", weight: 6, lifespan: 60, channel: "inn" },
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
    },
    {
      text: "นักท่องยุทธ์เล่ากันว่า{archetype}ปะทะ{npc}ที่{location} สามสิบเพลงเอาชนะได้",
      weight: 5,
      lifespan: 60,
      channel: "inn",
      distorted: "ใคร ๆ ว่า{archetype}ชนะ{npc}ก็จริง แต่บ้างว่าเป็นเพราะ{npc}ป่วยอยู่ก่อน",
    },
  ],

  // ─── kill_npc — the hero killed someone in an open fight ────────────────
  kill_npc: [
    {
      text: "ข่าวสะพัดว่า{archetype}ลงมือสังหาร{npc}ที่{location} ทางการติดประกาศจับทั่วทุกเมือง",
      weight: 9,
      lifespan: 120,
      channel: "inn",
    },
    {
      text: "ใคร ๆ ต่างหลีกทางให้{archetype} — ผู้ที่สังหาร{npc}ได้ด้วยมือเปล่าที่{location}",
      weight: 8,
      lifespan: 120,
      channel: "wilderness",
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

export const DEFAULT_LIFESPAN_DAYS = 20;
export const BIG_NEWS_LIFESPAN_DAYS = 40;

// Helper: render a template by substituting tokens. Unknown tokens
// stay literal (warns to console in dev) so authoring typos surface.
export function renderTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (_, key: string) => {
    if (key in vars) return vars[key];
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[rumor] template token {${key}} unresolved`);
    }
    return `{${key}}`;
  })
    // "สำนัก{sect}" with a sect already called สำนัก… / พรรค…
    .replace(/สำนักสำนัก/g, "สำนัก")
    .replace(/สำนักพรรค/g, "พรรค")
    .replace(/วิชาวิชา/g, "วิชา");
}

// Marker — re-exported so the engine can union truth states without
// importing types.ts directly when only constants are needed.
export const RUMOR_TRUTH_KEYS: readonly RumorTruth[] = ["true", "distorted", "false"];
