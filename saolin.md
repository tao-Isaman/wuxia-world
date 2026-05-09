# Sect Authoring Sheet — เส้าหลิน (Shaolin)

Filled-in copy of `sect-template.md` capturing the **current in-game data** for วัดเส้าหลิน, plus suggested expansion slots where the template recommends more entries than the codebase currently has. Sources: `lib/game/data/skills.ts`, `lib/game/data/arts.ts`, `lib/world/data/npcs/sects-temples.ts`, `lib/world/data/quests/sects-temples.ts`, `lib/world/data/opponents.ts`, `lib/world/data/world-map.ts`, `lib/world/data/location-routes.ts`.

---

## 1 · Sect identity

| Field | Value |
|---|---|
| Thai name (canonical) | `เส้าหลิน` |
| One-line concept | "วัดพุทธบนเขาซงซาน · Tank หลัก · ชายล้วน · หมัด-เซน-อรหันต์" |
| Alignment | `orthodox` |
| Dominant philosophical axes | `yang` · `hard` · `external` (capstone arts touch `internal` for เซน finger / tendon-changing) |
| Signature weapon families | `fist` (primary) · `long` (ไม้พลอง/ไม้เท้า — secondary, ตามชุด T1 ใหม่) · `sword` (อรหันต์ดาบ + กระบี่วิธีเซน — tertiary) |
| Color / motif keyword | "ผ้ากาสาวพัสตร์ส้มอิฐ + ทองอักขระ · กระดิ่งทอง · กลีบดอกบัว" |

---

## 2 · Location on the world map

| Field | Value |
|---|---|
| Location id | `sect_shaolin` |
| Display name (Thai) | `วัดเส้าหลิน` |
| Description | "少林派 · เขาซงซาน · พลังกล้าแกร่ง · ชายล้วน" *(จาก `world-map.ts:111`)* |
| Anchor neighbors | `sect_songshan` *(เขาซงซาน — เส้นทางเดียวที่มีอยู่ในปัจจุบัน)* |
| Per-direction route labels | `sect_shaolin ⇄ sect_songshan` — `fromA: "เนินยอดเขา"` / `fromB: "เนินยอดเขา"` *(จาก `location-routes.ts:104`)* |

**Suggested expansion** (ยังไม่มีในโค้ด): เพิ่มเส้นทางลงสู่ `village_dengfeng` หรือ `city_luoyang` เพื่อให้วัดเข้าถึงได้จากเมืองโดยไม่ต้องผ่านยอดเขาเสมอ — สอดคล้องกับภูมิศาสตร์จริง (เติ้งเฟิง, มณฑลเหอหนาน).

---

## 3 · Move skills (วิชาฝีมือ)

### 3.1 ปัจจุบัน (4 skills ในโค้ด)

T0×1, T1×1, T2×2, T3×0, T4×0.

| # | id | Thai name | Tier | Weapon | Stats | bp / p / f / dm | dr | se | ee | Types | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `sf` | หมัดเส้าหลิน | 0 | fist | STR 5, VIT 5 | 42 / 0 / 20 / 1 | — | — | — | external, hard | "Phy + flat 20" — entry ทุกศิษย์ |
| 2 | `nd5` | หมัดอรหันต์ | 1 | fist | STR 6, VIT 7 | 50 / 0 / 10 / 1 | — | — | — | external, hard | **redesigned**: Phy external — ตัด `multi_debuff` ออก, สลับ stat → STR/VIT, เปลี่ยน type จาก `internal` → `external` |
| 3 | `ne1` | วิชากรงเล็บมังกร | 2 | fist | STR 8, VIT 7 | 75 / 25 / 0 / 1 | — | — | — | yang, hard | "Phy×125% หนักมาก" |
| 4 | `ne2` | ดาบอรหันต์เส้าหลิน | 2 | sword | STR 8, DEF 7 | 68 / 0 / 0 / 1 | — | `buff_def v:20 u:5` | `burn_hp_mp dmg:8% mp:8% u:5` ⚠ | external, hard | **redesigned**: คง `buff_def` + เพิ่ม "เผาไหม้" — DoT ทั้ง HP และ MP (ต้องเพิ่ม variant ใหม่ใน `lib/game/types.ts`, ดู §3.4) |

### 3.2 ที่เสนอเพิ่ม (จาก spec ผู้เขียน)

รวมหลังเพิ่ม: T0×2, T1×3, T2×3, T3×3, T4×2 — เกินเพดาน 5–8 ของเทมเพลต. แนะนำตัดบางตัวที่ซ้ำ flavor หรือยุบ T1 ไม้พลอง 2 ตัวให้เหลือตัวเดียว.

| # | Thai name | Tier | Weapon | Stat budget (~) | bp / p / f / dm (เป้าหมาย) | se | ee | Types | Intent |
|---|---|---|---|---|---|---|---|---|---|
| 5 | `หมัดยาวพุทธธรรม` | 0 | fist | STR 4, AGI 4 | 38 / 0 / 12 / 1 | — | — | external, yang | T0 ทางเลือก — เน้น reach + flat dmg เล็ก ผู้เริ่มต้นที่ไม่ใช่สาย VIT |
| 6 | `ไม้พลองพุทธธรรม` | 1 | long | STR 5, VIT 5, DEX 4 | 50 / 0 / 0 / 1 | `buff_def v:12 u:5` | — | external, hard | T1 staff สาย tank — ตี + ตั้งการ์ด **5 เทิร์น** |
| 7 | `ไม้พลองเส้าหลิน` | 1 | long | STR 6, AGI 6, DEX 3 | 55 / 10 / 0 / 1 | — | `debuff_atk v:-12 u:5` ⚠ | external, yang | T1 staff สาย control — ตีและทำให้ศัตรูโจมตีเบา **5 เทิร์น** (ต้องเพิ่ม `debuff_atk` variant — ดู §3.4) |
| 8 | `กระบี่วิธีเซน` | 2 | sword | POW 8, INT 9, DEX 5 | 78 / 20 / 0 / 1.15 | — | — | internal, soft | T2 sword ฝั่ง Int — ไม่มีบัฟ/ดีบัฟ แต่ damage สูงสุดในกลุ่ม T2 (ดั่งกระบี่นิ่งเข้าฝักก่อนตัดสินทุกอย่างในครั้งเดียว) |
| 9 | `ฝ่ามือโพธิสัตว์` | 3 | fist | STR 9, VIT 8, POW 5 | 78 / 20 / 0 / 1.1 | `buff_reflect v:30 u:5` | — | yang, hard | T3 tank-counter — ฝ่ามือเมตตา สะท้อนแรงร้าย **5 เทิร์น** |
| 10 | `ดัชนีเด็ดบุปผา` | 3 | fist | POW 8, INT 9, DEX 7 | 70 / 0 / 0 / 1.15 | `buff_eva v:15 u:5` | `debuff_acc v:-12 u:5` | internal, soft | T3 finger-strike Int — แม่นและลื่นไหล **5 เทิร์น** (拈花指 inspired) |
| 11 | `หมัดทลายผา` | 3 | fist | STR 10, VIT 7, POW 4 | 82 / 30 / 0 / 1 | — | `debuff_def v:-15 u:5` | yang, hard, external | T3 brute-force — ทุบหินทะลุเกราะ **5 เทิร์น** |
| 12 | `อรหันต์พันกร` | 4 | fist | STR 8, VIT 12, POW 5, DEX 5 | 88 / 25 / 0 / 1.2 | — | — | yang, hard, external | T4 capstone — **damage scales with caster VIT** (เพิ่ม `vitScale: 0.5` field — ทุก 1 VIT = +0.5 flat dmg, ดู §3.4). ตัด `stack_atk` ออก |
| 13 | `ไม้เท้าสัจธรรม` | 4 *(?)* | long | STR 7, POW 8, VIT 7, INT 5 | 95 / 25 / 0 / 1.2 | — | `stun u:5 ch:50%` ⚠ | balance, hard | T4 staff capstone — ตีหนัก + **โอกาสสตันศัตรู 5 เทิร์น** (ต้องเพิ่ม `stun` variant ใหม่ — ดู §3.4) |

> **หมายเหตุ tier discipline**: T3–T4 ขณะนี้ว่างเปล่าทั้งคู่ ลำดับความจำเป็น = T4 capstone (#12 หรือ #13) > T3 tank-counter (#9) > เติม T1 staff > ตัวอื่นเป็น flavor เสริม.
> **ขอยืนยันเพิ่ม** กับผู้เขียน: (a) tier ของ `ไม้เท้าสัจธรรม` (`t` ที่ค้างใน spec — เดาเป็น T4 capstone ฝั่ง long), (b) จะเก็บไม้พลองทั้ง 2 ตัวไหม หรือยุบเหลือ 1.

### 3.3 Tuning notes (จาก feedback ผู้เขียน รอบล่าสุด)

- ระยะเวลา **5 เทิร์น** = `u:5` ทั้งหมด **ทั่วทั้งเอกสาร** ทุก buff/debuff ทุก skill ทุก art (รวมถึง #4 `ne2` burn, #13 stun, และ arts ที่อยู่ในโค้ดอยู่แล้วใน §4.1) — global rule รอบล่าสุด.
- `nd5 หมัดอรหันต์` พลิกเป็นสาย external pure-Phy ไม่มี debuff (ดู §3.1).
- `ne2 ดาบอรหันต์เส้าหลิน` คง `buff_def` แต่เพิ่ม **เผาไหม้ HP+MP** เป็น DoT เข้าศัตรู.
- `กระบี่วิธีเซน` (#8) → ไม่มี se/ee, ผลักไปทาง pure-damage T2 ที่แรงสุดในกลุ่ม.
- `อรหันต์พันกร` (#12) → ไม่มี se ใดๆ, damage **คูณด้วย VIT** ของผู้ใช้ (เปลี่ยน archetype จาก stacking-glass เป็น tank-bruiser).
- `ไม้เท้าสัจธรรม` (#13) → ลบทั้ง se/ee, เปลี่ยนเป็น **stun chance** เพียวๆ.

### 3.4 Engine extensions ที่ต้องเพิ่มก่อน implement

วิชาที่แก้ใหม่บางตัว **เกินขอบเขต variant ที่มีอยู่ใน `lib/game/types.ts`** ต้องเพิ่ม dispatcher ใน `lib/game/effects.ts` ก่อน:

| Variant ใหม่ | ใช้ที่ | Spec คร่าวๆ |
|---|---|---|
| `burn_hp_mp` (ee) | #4 `ne2` | DoT ต่อเทิร์น: ลด HP `dmg%` + ลด MP `mp%` ของ max ตามจำนวนเทิร์น `u`. ผ่าน `tickEffects`. |
| `debuff_atk` (ee) | #7 ไม้พลองเส้าหลิน | ลด ATK% ของศัตรู (ทั้ง phy + int) เป็นเทิร์น. ใช้ใน `combinedStats` หรือ `calcSkillDamage`. *ทางเลือก*: ใช้ `buff_iatk_reduce` ที่มีอยู่แล้วถ้า scope เฉพาะ Int — แต่ตามคำขอ (ลดพลังโจมตี) ควรครอบคลุมทั้ง phy+int. |
| `vitScale` (skill field, ไม่ใช่ effect) | #12 อรหันต์พันกร | เพิ่ม field `vitScale?: number` ใน `Skill` type — ใน `calcSkillDamage` บวก `vitScale × dA.VIT` เข้า `skillEffect` flat. |
| `stun` (ee) | #13 ไม้เท้าสัจธรรม | flag ที่บล็อก action ของศัตรู `u` เทิร์น. ต้อง check ใน `getNextTurn` / `runAITurn` ก่อน roll. มี chance roll `ch%`. |

> ก่อนเริ่ม implement ในโค้ด แนะนำให้ผู้เขียน **review ตาราง 3.4 นี้** เพื่อยืนยันรูปแบบ variant + ผลข้างเคียงต่อ balance (เช่น 5-turn buff/debuff ส่วนใหญ่ยาวเกินค่าเฉลี่ย 2-turn ของระบบเดิม — อาจต้องลดค่า `v` ทดแทน).

---

## 4 · Inner arts (วิชาในกาย)

### 4.1 ปัจจุบัน (5 arts ในโค้ด)

T0×1, T1×1, T3×1, T4×2.

| # | id | Thai name | Tier | Stats | hL / mL | Active | Passive | Types | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `t0_lohan` | ลมปราณอรหันต์ | 0 | STR 6, VIT 4 | 20 / 10 | "หมัดอรหันต์" — `heal h:10 c:15 cd:3` | `hit_recv 25% → buff_def +10 u:5` ⚙ | yang, hard | foundation breath *(u:1 → u:5 ตาม global rule)* |
| 2 | `t1_goldenbell` | กระดิ่งทองพื้นฐาน | 1 | VIT 10, DEF 6, STR 4 | 30 / 10 | "เปลี่ยนตัวเป็นโลหะ" — `buff_reduce v:25 u:5 c:18 cd:3` ⚙ | `hit_recv 25% → buff_def +15 u:5` ⚙ | hard, external | tank intermediate *(u:2 → u:5 ทั้งคู่)* |
| 3 | `t3_onefinger` | เอกนิ้วเซน | 3 | POW 14, INT 14, DEX 12 | 25 / 35 | "นิ้วฟ้าผ่า" — `atk_int_pen m:1.5 pen:35 c:35 cd:4` | `use_int 100% → debuff_acc -12 u:5` ⚙ | internal | 一指禅 — burst Int *(u:3 → u:5)* |
| 4 | `tendon` | พลังเปลี่ยนเส้นเอ็น | 4 | STR 20, VIT 20, DEF 10 | 55 / 15 | "อุ้มแผ่นดิน" — `heal h:22 c:25 cd:3` | `hit_recv 25% → buff_def +20 u:5` ⚙ | yang, hard | 易筋经 — bruiser capstone *(u:2 → u:5)* |
| 5 | `diamond` | จินกังชี่ | 4 | VIT 25, DEF 15, STR 10 | 55 / 15 | "เกราะเพชร" — `buff_reduce v:30 u:5 c:20 cd:3` ⚙ | `hit_recv 20% → heal_pct 8` | yang, hard | 金刚气 — wall capstone *(u:3 → u:5)* |

### 4.2 ที่เสนอเพิ่ม (จาก spec ผู้เขียน)

รวมหลังเพิ่ม: T0×1, T1×1, **T2×1**, T3×1, **T4×3** — เกินคำแนะนำ 3–5 ของเทมเพลต (รวม 7) แต่ T4 ทั้ง 3 ตัวเล่นคนละ archetype (defense / heal / offense) จึงไม่ซ้ำ flavor.

| # | id (เสนอ) | Thai name | Tier | Stats | hL / mL | Active | Passive | Types | Notes |
|---|---|---|---|---|---|---|---|---|---|
| 6 | `t2_dharma` | ลมปราณพุทธธรรม | 2 | VIT 12, DEF 10, STR 8 | 35 / 15 | "ลมปราณคุ้มกาย" — `heal h:15 c:20 cd:3` (ฟื้น 15% HP) | `hit_recv 30% → buff_def +12 u:5` | yang, hard | T2 ที่ขาดอยู่ — combo ฟื้นเลือด + เสริมเกราะ **5 เทิร์น** ตอนถูกตี |
| 7 | `t4_demonsubduer` | ลมปราณอรหันต์ปราบมาร | 4 | STR 18, POW 14, VIT 10, DEX 8 | 35 / 35 | "หมัดปราบมาร" — `atk_phy_pen m:1.5 pen:30 c:30 cd:4` (Phy×1.5 ทะลุ PDef 30%) | `use_act 100% → stack_atk +8 mx:3 u:5` | yang, hard, external | T4 capstone สาย offense — ทุกครั้งที่ใช้ active สะสม ATK+8% **5 เทิร์น** (สูงสุด 3 ชั้น) |

### 4.3 Tuning notes (จาก spec ผู้เขียน)

- **Global 5-turn rule**: ทุก buff/debuff (`u:N`) ใน §4.1 + §4.2 ปรับเป็น `u:5` ทั้งหมด. รายการที่เปลี่ยน (มี ⚙ กำกับใน §4.1):
  - `t0_lohan` passive `buff_def`: u:1 → u:5
  - `t1_goldenbell` active `buff_reduce`: u:2 → u:5, passive `buff_def`: u:2 → u:5
  - `t3_onefinger` passive `debuff_acc`: u:3 → u:5
  - `tendon` passive `buff_def`: u:2 → u:5
  - `diamond` active `buff_reduce`: u:3 → u:5
  - `t2_dharma` (เสนอใหม่) passive `buff_def`: u:5
  - `t4_demonsubduer` (เสนอใหม่) passive `stack_atk`: u:5
- `t2_dharma ลมปราณพุทธธรรม` → active = heal HP, passive = buff_def trigger เมื่อถูกตี. (ใช้ variant เดิมทั้งคู่ ไม่ต้องแก้ engine)
- `t4_demonsubduer ลมปราณอรหันต์ปราบมาร` → active = หมัด Phy ทะลุ PDef, passive = stack_atk ทุกครั้งที่ใช้ active เพิ่มโบนัสพลังโจมตี (ทับทับเป็น 3 ชั้น). (ใช้ variant เดิมทั้งคู่ — `atk_phy_pen` มีอยู่ใน active list, `stack_atk` มีใน se)
- ทั้งสองไม่ต้องเพิ่ม engine variant ใหม่ — struct เดียวกับ `t1_goldenbell` (active+passive แยกกัน) ใส่เข้า `lib/game/data/arts.ts` ได้เลย

⚠ **Balance warning** (สำคัญ): การยืด duration จาก 1–3 → 5 เทิร์น มีผลรุนแรง:
- `tendon` + `diamond` ตอนนี้แทบ uptime DEF buff เต็มเวลา (CD:3, u:5) → tank รุ่นใหม่อยู่ยงเกินคาด
- `t1_goldenbell` `buff_reduce 25% u:5` หมายถึงลด dmg ครึ่งสนามรบ
- `t4_demonsubduer` `stack_atk +24% u:5` (3 ชั้น × 5 เทิร์น) → snowball offensive ที่ไม่หยุด
- ก่อน implement แนะนำ **ลดค่า v ลงประมาณ 40–60%** เพื่อชดเชย uptime ที่ยาวขึ้น (เช่น `buff_def +20 u:2` → `buff_def +10 u:5` พลังรวมใกล้เคียงเดิม)

---

## 5 · Sect-resident NPCs

**ปัจจุบันมี 2 NPCs** — ขั้นต่ำของเทมเพลต.

### 5.1 เจ้าอาวาสฮุยหยวน

| Field | Value |
|---|---|
| `id` | `sect_shaolin_abbot_huiyuan` |
| Thai name | `เจ้าอาวาสฮุยหยวน` |
| Description | "เจ้าอาวาสวัดเส้าหลิน วัยสูงอายุแต่ยังดูแข็งแกร่ง สายตาแหลมคม ผู้รักษากฎเหล็กของสำนัก" |
| Tier | 4 *(เป้าโจรกรรม / ลอบสังหารระดับสูง)* |
| Sparrable? | **no** *(ไม่มี `sparOpponentId`)* |
| `defenseTier` | 3 |
| `stealLoot` | herb ×4 · ginseng ×3 · paper ×4 · ink ×3 · jade ×1 |
| Hosts quests? | side ×4 *(`qst_shaolin_relic_theft`, `qst_shaolin_disciple_gone`, `qst_shaolin_proof_of_heart`, `qst_shaolin_wudang_joint`)* |
| Personality cue | "พูดสุภาพ กฎเหล็ก เน้นจิตใจมากกว่าฝีมือ" |

### 5.2 อาจารย์ฝาหมิง

| Field | Value |
|---|---|
| `id` | `sect_shaolin_elder_faming` |
| Thai name | `อาจารย์ฝาหมิง` |
| Description | "พระอาจารย์อาวุโสแห่งเส้าหลิน ผู้คุมการฝึกหัดของสาวก ท่าทางเข้มขรึมเงียบขรึม" |
| Tier | 3 |
| Sparrable? | **yes** — `spar_shaolin_faming` (ti 3, fist hard-external) |
| `sparFameReward` | 8 |
| `defenseTier` | *(ไม่ตั้งค่า — default)* |
| `stealLoot` | *(ไม่ตั้งค่า)* |
| Hosts quests? | side ×1 *(`qst_shaolin_iron_training`)* |
| Personality cue | "พูดน้อย เข้มขรึม สอนด้วยการลงมือทำ" |

### Suggested NPC #3 (เพื่อให้ถึง 3–4 ตามคำแนะนำ)

| Field | Suggestion |
|---|---|
| `id` | `sect_shaolin_disciple_xuanji` |
| Thai name | `ศิษย์เซวียนจี้` |
| Role | gatekeeper / errand-giver — รับคนใหม่, ส่งภารกิจซื้อสมุนไพร |
| Tier | 1 |
| Sparrable? | yes (`spar_shaolin_xuanji` — fist + `t0_lohan`) |
| `sparFameReward` | 4 |
| Hosts quests? | side ×1–2 (เช่น เก็บสมุนไพรในป่าซงซาน, ส่งจดหมายถึงอู่ตัง) |
| Personality cue | "อ่อนน้อม กระตือรือร้น เกรงใจรุ่นพี่" |

---

## 6 · Scattered / ranged NPCs

**ไม่มี** — เส้าหลินไม่มีสายลับ/ผู้ส่งสารนอกวัดในโค้ดปัจจุบัน. เหมาะกับ alignment `orthodox` ของวัดที่ไม่ส่งคนแฝงตัว.

---

## 7 · Quests

**ปัจจุบันมี 5 side + 0 bad** *(เป้าหมายของ bad-quest หลายตัวเล็งเส้าหลิน — ดู §7.6)*.

### 7.1 `qst_shaolin_relic_theft` (เริ่มต้น)
- **Giver**: เจ้าอาวาสฮุยหยวน
- **Brief**: ตามล่าผู้ขโมยพระบรมสารีริกธาตุของวัด
- **Stages**: ไปถึง `sect_shaolin` → ตามล่า → กลับมารายงาน *(ดู `quests/sects-temples.ts:14`)*
- **Rewards**: gold + wExp + relationship +15 (huiyuan)

### 7.2 `qst_shaolin_disciple_gone`
- **Giver**: เจ้าอาวาสฮุยหยวน · **Prereq**: `qst_shaolin_relic_theft` = done
- **Brief**: ศิษย์หายตัวไป — ต้องตามหาตัว
- **Rewards**: relationship +10

### 7.3 `qst_shaolin_proof_of_heart`
- **Giver**: เจ้าอาวาสฮุยหยวน · **Prereq**: `qst_shaolin_disciple_gone` = done
- **Brief**: บททดสอบจิตใจ — capstone ของเส้นเรื่องวัด
- **Rewards**: relationship +20 *(เปิดให้ `qst_shaolin_wudang_joint`)*

### 7.4 `qst_shaolin_iron_training`
- **Giver**: อาจารย์ฝาหมิง
- **Brief**: บททดสอบกายเหล็ก — ฝึกหนักกับอาจารย์
- **Rewards**: relationship +15 (faming)

### 7.5 `qst_shaolin_wudang_joint` (cross-sect)
- **Giver**: เจ้าอาวาสฮุยหยวน · **Prereq**: `qst_shaolin_proof_of_heart` = done
- **Brief**: ภารกิจร่วมกับอู่ตัง — สองสำนักจับมือกัน
- **Rewards**: relationship +25 (huiyuan), อาจมี `learnArt` / `learnSkill` ระดับสูง

### 7.6 Bad-quest targets ที่อ้างอิงเส้าหลิน (จาก `quests/evil.ts`)
- ลอบสังหาร `sect_shaolin_abbot_huiyuan` (line 210) — `assassinatedNpc`
- ลักพาตัว `sect_shaolin_elder_faming` (line 386) — `kidnappedNpc`
- ขโมยจาก `sect_shaolin_abbot_huiyuan` (line 589, 1323) — `stoleFromNpc`
- ลักพาตัวเจ้าอาวาส (line 1234) — `kidnappedNpc`

> เส้าหลินทำหน้าที่เป็น **เป้าหมายฝั่งดี** ของ bad-quest หลายตัว — สำนักเองไม่ออก `qe_*` (สอดคล้องกับ alignment).

### Suggested quest expansion (ถ้าจะเติม)
- **Side**: เก็บสมุนไพรหายากบนเขาซงซาน (ฝาหมิง สั่งให้ฝึก stamina + แวะที่ `forest_*`)
- **Side**: ปราบโจรปล้นวัด (`defeatedOpponent` กับ bandit T1–T2)
- **Side**: บูรณะหอพระไตรปิฎก — ตามหา `paper` + `ink` + `jade` มาส่ง

---

## 8 · Equipment line (optional)

ปัจจุบัน **ไม่มี** equipment เฉพาะของเส้าหลินในโค้ด.

### Suggested signature gear

| id | Slot | Tier | Stats | Weapon family | Sold at |
|---|---|---|---|---|---|
| `eq_t1_a_sl_kasaya` | A (armor) | 1 | VIT +6, DEF +4 | — | sect-hall เส้าหลิน |
| `eq_t2_w_sl_iron_staff` | W | 2 | STR +6, fist mastery +20 | fist | tailor/forge ที่เติ้งเฟิง |
| `eq_t3_c_sl_prayer_beads` | C (charm) | 3 | INT +8, POW +6 | — | quest reward (`qst_shaolin_proof_of_heart`) |
| `eq_t4_a_sl_diamond_robe` | A | 4 | VIT +14, DEF +12 | — | drop จาก spar T4 / quest capstone |

---

## 9 · Sect-hall offerings (optional)

**ปัจจุบัน**: เส้าหลินยังไม่มี hall เปิดสอนแบบจ่ายเงินเรียนได้ (ใช้ระบบ quest reward + drop manuals แทน — ดู `spar_shaolin_faming` drops มี `man_sf`, `man_nd5`, `man_ne1`, `man_t1_goldenbell`).

### Suggested hall (ถ้าจะเปิด)

| Type | Id | Tier | Price |
|---|---|---|---|
| Skill | `sf` (หมัดเส้าหลิน) | 0 | 200g |
| Skill | `nd5` (อรหันต์พันมือ) | 1 | 800g |
| Art | `t0_lohan` (ลมปราณอรหันต์) | 0 | 500g |
| Art | `t1_goldenbell` (กระดิ่งทอง) | 1 | 2000g |

T2+ ทุกตัว **ไม่ขาย** — บังคับให้ผู้เล่นไต่ relationship + ทำ quest chain ของฮุยหยวน/ฝาหมิงแทน. ให้ feel ของ "วัดที่หวงวิชา".

---

## 10 · Save migration

ไม่ต้องเพิ่มเวอร์ชัน — `validateAndRepair` จัดการ ref ที่หายเอง. (อ้างอิง `CLAUDE.md` §"Save format & migrations".)

---

## Summary of gaps vs. template

| Section | Current | Recommended | Gap |
|---|---|---|---|
| Move skills | 4 | 5–8 | spec ผู้เขียนเสนอเพิ่มอีก 9 ตัว (T0×1, T1×2, T2×1, T3×3, T4×2) — เกินเพดาน, ดู §3.2 |
| Inner arts | 5 | 3–5 | spec ผู้เขียนเสนอเพิ่ม 2 ตัว (T2×1 ปิดช่อง, T4×1 สาย offense) — รวมเป็น 7, ดู §4.2 |
| Sect NPCs | 2 | 2–4 | +1 (gatekeeper/disciple) |
| Spies | 0 | optional | — (เหมาะกับ alignment) |
| Side quests | 5 | — | ✅ พอดี |
| Bad quests | 0 (เป็นเป้า, ไม่ใช่ผู้ให้) | — | ✅ ตามดีไซน์ |
| Equipment line | 0 | optional | +3–4 ถ้าต้องการ signature gear |
| Sect-hall | 0 | optional | เปิด T0–T1 ได้ถ้าอยากให้ผู้เล่นซื้อเรียน |

> หมายเหตุ: ตัวเลข `bp / mg / hL+mL` ทั้งหมดในเอกสารนี้คัดมาจากโค้ดจริง ณ commit ปัจจุบัน (`6dc7a10`). ถ้าจะ rebalance ให้แก้ที่ `lib/game/data/skills.ts` + `lib/game/data/arts.ts` แล้วอัปเดตตารางนี้ตาม.
