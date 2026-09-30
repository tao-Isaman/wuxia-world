# Sect Authoring Sheet — เส้าหลิน (Shaolin)

> **Status (2026-09-30):** a worked example of [sect-template.md](sect-template.md), filled in **from the code as it is now**.
>
> - An earlier version of this sheet (commit `6dc7a10`) proposed nine skills, two arts, a third NPC and four engine features (`burn_hp_mp`, `debuff_atk`, `vitScale`, `stun`). All of them were built, and the numbers below are the built values.
> - Data lives in:
>   - skills and arts: `lib/game/data/skills.ts`, `lib/game/data/arts.ts`;
>   - NPCs, quests, scenes: `lib/world/data/npcs/sects/shaolin.ts`, `quests/sects/shaolin.ts`, `scenes-content/sects/shaolin.ts`;
>   - the rank ladder: `lib/world/data/sect-memberships.ts`;
>   - spar builds: `lib/world/data/opponents.ts`.
> - Every sect's current data: [reference/sects.md](../reference/sects.md).

---

## 1 · Sect identity

| Field | Value |
|---|---|
| Thai name (canonical) | `เส้าหลิน` |
| `SectId` | `shaolin` |
| One-line concept | "วัดพุทธบนเขาซงซาน · Tank หลัก · ชายล้วน · หมัด-เซน-อรหันต์" |
| Alignment | `orthodox` |
| Dominant axes | `yang` · `hard` · `external` (สายเซนแตะ `internal` / `soft`) |
| Signature weapon families | `fist` (หลัก) · `long` (ไม้พลอง / ไม้เท้า) · `sword` (ดาบอรหันต์, กระบี่วิธีเซน) |
| Motif | "ผ้ากาสาวพัสตร์ส้มอิฐ + ทองอักขระ · กระดิ่งทอง · กลีบดอกบัว" |

---

## 2 · Location on the world map

| Field | Value |
|---|---|
| Location id | `sect_shaolin` (array `SECTS` ใน `world-map.ts`) |
| Display name | `วัดเส้าหลิน` |
| Description | "少林派 · เขาซงซาน · Tank หลัก · ชายล้วน" |
| Region | `south` (`regions.ts`) — คุกที่ใกล้ที่สุดคือต้าหลี่ |
| Roads | `sect_shaolin ⇄ sect_songshan` — `fromA / fromB: "เนินยอดเขา"` (ถนนเส้นเดียว) |
| Categories | sect + mountain → ฝึกฝนได้, โบนัส balance / hard |
| Painting | auto layout, `/maps/sect_shaolin.webp` |

**ช่องว่าง:** มีถนนเส้นเดียวผ่านเขาซงซาน ถ้าจะเพิ่มทางลงเมืองต้องเพิ่ม `LocationRoute` ใหม่

---

## 3 · Move skills (วิชาฝีมือ) — 13 วิชา

T0×2, T1×3, T2×3, T3×3, T4×2 · ระยะเวลา buff / debuff ทุกตัวเป็น 5 เทิร์น (`u:5`) ยกเว้น stun (3)

| id | ชื่อ | Tier | อาวุธ | ประเภท | Stats | bp / p / f / dm | อื่น ๆ | se | ee | Types |
|---|---|---|---|---|---|---|---|---|---|---|
| `sf` | หมัดเส้าหลิน | 0 | fist | phy | STR 5, VIT 5 | 42 / 0 / 20 / 1 | — | — | — | external, hard |
| `sl_long_dharma` | หมัดยาวพุทธธรรม | 0 | fist | phy | STR 6, AGI 4 | 38 / 0 / 12 / 1 | ระยะ 1–2 ช่อง | — | — | external, yang |
| `nd5` | หมัดอรหันต์ | 1 | fist | phy | STR 6, VIT 9 | 50 / 0 / 10 / 1 | `hits: 3` | — | — | external, hard |
| `sl_staff_dharma` | ไม้พลองพุทธธรรม | 1 | long | phy | STR 6, VIT 5, DEX 4 | 50 / 0 / 0 / 1 | — | `buff_def +12` | — | external, hard |
| `sl_staff_shaolin` | ไม้พลองเส้าหลิน | 1 | long | phy | STR 6, AGI 6, DEX 3 | 55 / 10 / 0 / 1 | — | — | `debuff_atk −12` | external, yang |
| `ne1` | วิชากรงเล็บมังกร | 2 | fist | phy | STR 9, VIT 8, DEX 3 | 75 / 25 / 0 / 1 | — | — | — | yang, hard |
| `ne2` | ดาบอรหันต์เส้าหลิน | 2 | sword | phy | STR 9, DEF 8, DEX 3 | 68 / 0 / 0 / 1 | — | `buff_def +20` | `burn_hp_mp` 8 % HP + 8 % MP | external, hard |
| `sl_zen_sword` | กระบี่วิธีเซน | 2 | sword | int | POW 8, INT 7, DEX 5 | 78 / 20 / 0 / 1.15 | — | — | — | internal, soft |
| `sl_bodhi_palm` | ฝ่ามือโพธิสัตว์ | 3 | fist | phy | STR 10, VIT 9, POW 5, DEX 1 | 78 / 20 / 0 / 1.1 | — | `buff_reflect 30` | — | yang, hard |
| `sl_petal_finger` | ดัชนีเด็ดบุปผา | 3 | fist | int | POW 8, INT 9, DEX 7, AGI 1 | 70 / 0 / 0 / 1.15 | `hits: 2` | `buff_eva +15` | `debuff_acc −12` | internal, soft |
| `sl_rock_punch` | หมัดทลายผา | 3 | fist | phy | STR 12, VIT 8, POW 4, DEX 1 | 82 / 30 / 0 / 1 | — | — | `debuff_def −15` | yang, hard, external |
| `sl_thousand_arms` | อรหันต์พันกร | 4 | fist | phy | STR 8, VIT 12, POW 5, DEX 5 | 88 / 25 / 0 / 1.2 | `hits: 5`, `vitScale: 0.5` | — | — | yang, hard, external |
| `sl_truth_staff` | ไม้เท้าสัจธรรม | 4 | long | phy | STR 8, POW 9, VIT 7, INT 5, DEX 1 | 95 / 25 / 0 / 1.2 | — | — | `stun` 3 เทิร์น (100 %) | balance, hard |

ผลรวม stat ต่อ tier ตรงงบ 10 / 15 / 20 / 25 / 30 ทุกตัว · mg = 20 / 40 / 60 / 80 / 100

---

## 4 · Inner arts (วิชาในกาย) — 7 วิชา

T0×1, T1×1, T2×1, T3×1, T4×3

| id | ชื่อ | Tier | Stats (lv 10) | hL / mL | Active | Passive | Types |
|---|---|---|---|---|---|---|---|
| `t0_lohan` | ลมปราณอรหันต์ | 0 | STR 6, VIT 4 | 20 / 10 | `heal` 10 % HP · MP 15 · CD 3 | ถูกตี 25 % → DEF +10 (5 เทิร์น) | yang, hard |
| `t1_goldenbell` | กระดิ่งทองพื้นฐาน | 1 | VIT 10, DEF 6, STR 4 | 30 / 10 | "เปลี่ยนตัวเป็นโลหะ" `buff_reduce` 25 % 5 เทิร์น · MP 18 · CD 3 | ถูกตี 25 % → DEF +15 | hard, external |
| `t2_dharma` | ลมปราณพุทธธรรม | 2 | VIT 12, DEF 10, STR 8 | 35 / 15 | "ลมปราณคุ้มกาย" `heal` 15 % · MP 20 · CD 3 | ถูกตี 30 % → DEF +12 | yang, hard |
| `t3_onefinger` | เอกนิ้วเซน | 3 | POW 14, INT 14, DEX 12 | 25 / 35 | "นิ้วฟ้าผ่า" `atk_int_pen` ×1.5 ทะลุ 35 % · MP 35 · CD 4 | ใช้วิชา int 100 % → ศัตรู Acc −12 | internal |
| `tendon` | พลังเปลี่ยนเส้นเอ็น | 4 | STR 20, VIT 20, DEF 10 | 55 / 15 | "อุ้มแผ่นดิน" `heal` 22 % · MP 25 · CD 3 | ถูกตี 25 % → DEF +20 | yang, hard |
| `diamond` | จินกังชี่ | 4 | VIT 25, DEF 15, STR 10 | 55 / 15 | "เกราะเพชร" `buff_reduce` 30 % 5 เทิร์น · MP 20 · CD 3 | ถูกตี 20 % → ฟื้น 8 % HP | yang, hard |
| `t4_demonsubduer` | ลมปราณอรหันต์ปราบมาร | 4 | STR 18, POW 14, VIT 10, DEX 8 | 35 / 35 | "หมัดปราบมาร" `atk_phy_pen` ×1.5 ทะลุ 30 % · MP 30 · CD 4 | ใช้ active 100 % → ATK +8 % (ซ้อนได้ 3 ชั้น) | yang, hard, external |

---

## 5 · Membership (สมาชิกภาพ)

| Field | Value |
|---|---|
| Registrar | `sect_shaolin_abbot_huiyuan` (เจ้าอาวาสฮุยหยวน) |
| Ladder | 9 → 1 · quest cooldown 30 วัน |
| Rank-up cost (แต้มสำนัก) | 8:100 · 7:200 · 6:350 · 5:500 · 4:700 · 3:1000 · 2:1400 · 1:2000 (รวม 6250) |
| Join gate (intro quest) | ชาย · evil ≤ 10 · ยังไม่อยู่สำนักใด |
| Intro task | `qst_shaolin_disciple_intro`: สมุนไพรหายาก 10 · โสม 10 · เม็ดบัว 10 → รางวัล `joinSect` + 20 แต้ม |
| Hunter (เมื่อทรยศ) | `hunter_shaolin` นักล่าเส้าหลิน (T4) |
| Redemption | `qst_shaolin_redemption`: ชนะหัวหน้าโจร 5 · โสม 5 → `resignSect` |

รางวัลตามขั้น (ถ้ามีตัวเดียวได้เลยอัตโนมัติ ถ้ามีหลายตัวต้องเลือกหนึ่ง):

| ขั้น | วิชาฝีมือ | วิชาในกาย |
|---|---|---|
| 9 (เข้าสำนัก) | เลือก 1: `nd5`, `sl_staff_dharma`, `sl_staff_shaolin` | `t0_lohan` |
| 8 | เลือก 1: `ne1`, `ne2`, `sl_zen_sword` | — |
| 7 | — | `t1_goldenbell` |
| 6 | — | `t2_dharma` |
| 5 | เลือก 1: `sl_bodhi_palm`, `sl_petal_finger`, `sl_rock_punch` | — |
| 4 | — | `t3_onefinger` |
| 3 | เลือก 1: `sl_thousand_arms`, `sl_truth_staff` | — |
| 2 | — | เลือก 1: `tendon`, `diamond`, `t4_demonsubduer` |

`sf` ได้จากภารกิจ `qst_shaolin_proof_of_heart` หรือคัมภีร์ `man_sf` ส่วน `sl_long_dharma` ผู้เล่นยังเรียนไม่ได้ (มีแต่ในร่างของคู่ประลอง)

---

## 6 · Sect-resident NPCs — 8 คน

| id | ชื่อ | บทบาท | ประลอง (tier / fame) | defenseTier | ของที่ขโมยได้ | ให้ภารกิจ |
|---|---|---|---|---|---|---|
| `sect_shaolin_abbot_huiyuan` | เจ้าอาวาสฮุยหยวน | เจ้าสำนัก, ผู้รับสมัคร, 1 ใน 20 NPC ที่จำลองชีวิต | `spar_shaolin_abbot_huiyuan` T4 / 18 | 4 | herb 4, ginseng 5, paper 3, ink 3, jade 4, ancient_coin 3, wood_sacred 2, mithril_ore 1 | 13 |
| `sect_shaolin_vice_abbot_luohan` | รองเจ้าอาวาสลั่วฮั่น | รองเจ้าสำนัก (จำลองชีวิต) | `spar_shaolin_luohan` T4 / 14 | 4 | ginseng 5, jade 4, ancient_coin 2, wood_sacred 2, mithril_ore 1 | — |
| `sect_shaolin_dharma_guardian_huimiao` | หลวงพี่ใหญ่ฮุยเหมียว | ผู้พิทักษ์พระธรรม | `spar_shaolin_huimiao` T4 / 14 | 4 | ginseng 4, jade 3, ancient_coin 2, wood_sacred 1 | — |
| `sect_shaolin_zen_master_xianren` | หลวงพ่อเซียนเหริน | อาจารย์สายเซน | `spar_shaolin_xianren` T4 / 12 | 4 | ginseng 4, paper 3, ink 3, jade 2, ancient_coin 1 | — |
| `sect_shaolin_staff_master_juti` | หลวงพ่อจูตี้ | ปรมาจารย์พลอง | `spar_shaolin_juti` T4 / 12 | 4 | wood_hard 5, iron_ore 3, jade 2, ancient_coin 1 | — |
| `sect_shaolin_elder_faming` | อาจารย์ฝาหมิง | อาจารย์คุมการฝึก | `spar_shaolin_faming` T3 / 8 | — | — | 1 (`qst_shaolin_iron_training`) |
| `sect_shaolin_head_disciple_yuanquan` | หัวหน้าศิษย์หยวนเฉวียน | หัวหน้าศิษย์ | `spar_shaolin_yuanquan` T3 / 8 | 2 | herb 4, paper 3, ink 3, ginseng 1 | — |
| `sect_shaolin_disciple_xuanji` | ศิษย์เซวียนจี้ | ศิษย์เฝ้าประตู | `spar_shaolin_xuanji` T1 / 4 | — | — | — |

มีบทสนทนา (💬) เฉพาะฮุยหยวนกับฝาหมิง

คู่ประลองดรอปคัมภีร์ของสำนัก: `man_sf`, `man_nd5`, `man_ne1`, `man_t0_lohan`, `man_t1_goldenbell`. สามตัว (`spar_shaolin_xianren`, `spar_shaolin_abbot_huiyuan`, `spar_shaolin_luohan`) ยังดรอป `man_ne2` ซึ่ง**ไม่มีอยู่ในตารางไอเท็ม** (ดู [HANDOFF.md](../../HANDOFF.md#known-issues))

---

## 7 · Scattered / ranged NPCs

ไม่มี — เส้าหลินไม่มีสายลับนอกวัด (เข้ากับ alignment `orthodox`)

---

## 8 · Quests — 14 ภารกิจ (side ทั้งหมด)

| id | ชื่อ | ผู้ให้ | ประเภท | เงื่อนไขรับ | ขั้นตอน | รางวัลเด่น |
|---|---|---|---|---|---|---|
| `qst_shaolin_disciple_intro` | ขอเข้าเป็นศิษย์เส้าหลิน | ฮุยหยวน | intro | ชาย, evil ≤ 10, ไม่มีสำนัก | สมุนไพรหายาก / โสม / เม็ดบัว ×10 → กลับ | `joinSect`, 20 แต้ม |
| `qst_shaolin_sect_patrol` | ตรวจตราเขตวัด | ฮุยหยวน | ประจำสำนัก | สมาชิก | ชนะโจรเร่ร่อน 2 → รายงาน | 150 ทอง, 50 แต้ม |
| `qst_shaolin_sect_herb_run` | ส่งสมุนไพรให้วัด | ฮุยหยวน | ประจำสำนัก | สมาชิก | สมุนไพร 5 → ส่ง | 100 ทอง, 60 แต้ม |
| `qst_shaolin_sect_protect_village` | ปกป้องชาวบ้านจากโจร | ฮุยหยวน | ประจำสำนัก | สมาชิก | ชนะโจรป่า 3 → ข้าวหมูแดง 5 → รายงาน | 150 ทอง, 65 แต้ม |
| `qst_shaolin_sect_sutra_paper` | กระดาษคัดลอกพระสูตร | ฮุยหยวน | ประจำสำนัก | สมาชิก | กระดาษสา 6 → รายงาน | 110 ทอง, 50 แต้ม |
| `qst_shaolin_sect_meditation` | ปฏิบัติธรรมที่ถ้ำลึก | ฮุยหยวน | ประจำสำนัก | ขั้น ≤ 7 | เนื้อย่าง 3 → รายงาน | 80 แต้ม |
| `qst_shaolin_art_zen_finger` | ตำราเอกนิ้วเซน | ฮุยหยวน | วิชา (ครั้งเดียว) | ขั้น ≤ 5 | ชนะหัวหน้าโจร 2 → สมุนไพร 8 → กลับ | `learnArt t3_onefinger` lv 3, 100 แต้ม |
| `qst_shaolin_art_legendary` | ตำราพลังเปลี่ยนเส้นเอ็น | ฮุยหยวน | วิชา (ครั้งเดียว) | ขั้น ≤ 2 | ชนะหัวหน้าโจร 3 → humility ≥ 30 → กลับ | `learnArt tendon` lv 5, 200 แต้ม |
| `qst_shaolin_redemption` | ไถ่บาปต่อเส้าหลิน | ฮุยหยวน | ไถ่บาป | ทรยศเส้าหลิน | ชนะหัวหน้าโจร 5 → โสม 5 → กลับ | `resignSect` |
| `qst_shaolin_relic_theft` | พระธาตุสูญหาย | ฮุยหยวน | เรื่องราว | — | ไปถึงวัด → 🔍 ตามรอย → ชนะหัวหน้าโจร → กลับ | 500 ทอง, good +5 |
| `qst_shaolin_disciple_gone` | ลูกศิษย์สาบสูญ | ฮุยหยวน | เรื่องราว | relic_theft เสร็จ | 🔍 ค้นหาในเมือง → ชนะลูกศิษย์สำนัก → พากลับ | 300 ทอง |
| `qst_shaolin_proof_of_heart` | บทพิสูจน์แห่งจิตใจ | ฮุยหยวน | เรื่องราว | disciple_gone เสร็จ, good ≥ 5 | เข้าบททดสอบ → จบบททดสอบ (บทสนทนา) | `learnSkill sf` |
| `qst_shaolin_wudang_joint` | ความลับใต้ผืนดิน | ฮุยหยวน | ร่วมกับอู่ตัง | proof_of_heart + `qst_wudang_mountain_seal` เสร็จ | ค้นพบ → เข้าถ้ำ → ชนะจอมยุทธมาร → เปิดเผยความจริง | 1500 ทอง, fame +10, `learnArt t3_yinyang` |
| `qst_shaolin_iron_training` | วัตถุดิบฝึกเหล็ก | ฝาหมิง | เรื่องราว | — | แร่เทพ 1 → ส่ง | 800 ทอง, `learnArt t1_goldenbell` |

ภารกิจที่มี `sectId` (7 ตัว) รับจากเมนูสำนักและส่งจากเมนูเดียวกัน ส่วนที่เหลือรับจากการ์ดของ NPC

ภารกิจชั่ว (จาก `quests/evil.ts`) ที่มีเป้าหมายเป็นคนของเส้าหลิน:

| Quest | เป้าหมาย | การกระทำ |
|---|---|---|
| `qe_zhizhu_assassinate_master` | เจ้าอาวาสฮุยหยวน | ลอบสังหาร |
| `qe_chuangwang_kidnap_novice` | อาจารย์ฝาหมิง | ลักพาตัว |
| `qe_shenlong_collect_tribute` | เจ้าอาวาสฮุยหยวน | ขโมย |
| `qe_xueyu_sect_initiation` | เจ้าอาวาสฮุยหยวน | ลักพาตัว |
| `qe_xueyu_steal_sutra` | เจ้าอาวาสฮุยหยวน | ขโมย |

---

## 9 · Equipment line

ยังไม่มีอุปกรณ์เฉพาะของเส้าหลิน (ยังไม่มีสำนักใดมี) ถ้าจะเพิ่มให้ทำตาม [sect-template.md §9](sect-template.md#9--equipment-line-optional)

---

## 10 · Sect-hall offerings

ไม่มีหอเรียนในวัด — ผู้เล่นเรียนวิชาตามขั้น (§5) หรือจากคัมภีร์ที่คู่ประลองดรอป หอเรียนในเมืองขายเฉพาะวิชายุทธจักร tier 0–1

---

## 11 · Save migration

ไม่ต้องเพิ่มเวอร์ชันเซฟ — เนื้อหาใหม่เพิ่มในตารางได้เลย และ `validateAndRepair` ตัด id ที่หายไปออกเองตอนโหลด

---

## Summary

| Section | ตอนนี้ | หมายเหตุ |
|---|---|---|
| Move skills | 13 (T0 2 · T1 3 · T2 3 · T3 3 · T4 2) | `sl_long_dharma` ยังเรียนไม่ได้ |
| Inner arts | 7 (T0–T3 อย่างละ 1 · T4 3) | |
| Rank ladder | 9 → 1, รวม 6250 แต้ม | |
| NPCs | 8 (ประลองได้ทั้งหมด, คุยได้ 2) | |
| Quests | 14 (intro 1 · ประจำ 5 · วิชา 2 · ไถ่บาป 1 · เรื่องราว 5) | |
| Evil quests ที่เล็งเส้าหลิน | 5 | |
| Roads | 1 (ผ่าน `sect_songshan`) | |
| Equipment / hall | ไม่มี | |
| ข้อมูลเสีย | คู่ประลอง 3 ตัวดรอป `man_ne2` ที่ไม่มีอยู่ | |
