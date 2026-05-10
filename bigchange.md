Requirement: NPC Simulation + Rumor System
Project: กำลังภายใน — Battle Sim
Module: World Liveness Layer
Version: 0.1 (draft)
Date: 2026-05-10

1. Purpose & Goals
1.1 Why this module exists
ระบบนี้แก้ปัญหา 2 ข้อจาก game design audit:

MDA Narrative aesthetic อ่อน — โลกตอนนี้คือ static stage ที่รอผู้เล่น trigger ทุกอย่าง
Discovery aesthetic ตื้น — ผู้เล่นเจอแค่สิ่งที่ scene เปิดให้ ไม่มีความรู้สึก "ค้นพบ"

1.2 Design goals
ระบบต้องส่งมอบ 4 ความรู้สึกนี้ให้ผู้เล่น:

โลกมีชีวิต — มีเหตุการณ์เกิดขึ้นโดยไม่ต้องรอผู้เล่น
ทุกการเล่นต่างกัน — เพราะ NPC roll ต่างกันในแต่ละ playthrough
เวลามีน้ำหนัก — การปล่อยให้เวลาผ่านมีต้นทุน (อาจารย์ตาย, สมบัติถูกคนอื่นเอา)
Player echo — ผู้เล่นได้ยินคนพูดถึงตัวเองในโรงเตี๊ยม

1.3 Non-goals

ไม่ทำ Dwarf Fortress-level simulation
ไม่ทำ NPC ที่มี internal monologue / personality model
ไม่ทำ procedural quest generation (rumor ชี้ไป scripted content เท่านั้น)
ไม่ทำ NPC-NPC interaction ลึก (ชั้น 3 deferred)

1.4 Scope
In scope (v1):

NPC tick system สำหรับ named NPC 20-40 ตัว
NPC event 8-12 แบบที่ produce rumor
Rumor data + storage + expiration
Rumor source 4 ประเภท (NPC echo, player echo, lore, warning)
Rumor distribution by region + channel
UI integration ใน inn / market

Out of scope (deferred):

NPC-NPC duel resolver
NPC ขโมย player items
Faction split / sub-faction
Procedural NPC generation (named NPC ทั้งหมดเป็น hand-authored)


2. NPC Simulation System
2.1 NPC Categorization
แบ่ง NPC ใน npcStates[] เป็น 2 ประเภท:
Named NPC (simulated)

ปรมาจารย์สำนัก, ผู้นำ, คู่แข่งหลัก, ตัวละคร main quest
จำนวน 20-40 ตัว (ตัดสินใจตอน implementation จาก roster ปัจจุบัน)
มี extended state + tick

Generic NPC (static)

ชาวบ้าน, พ่อค้า, registrar, ศิษย์ทั่วไป
ไม่ tick ไม่ produce rumor
ใช้ data model เดิม

Selection criteria สำหรับ named NPC:

เป็นจุดหมายของ quest อย่างน้อย 1 quest
หรือ เป็น sect rank Elder ขึ้นไป
หรือ มี relationship gate ใน scene อย่างน้อย 1 จุด

2.2 Extended NPC State
ของใหม่ที่ต้องเพิ่มใน named NPC (เสริม relationship ที่มีอยู่):
FieldTypeค่าเริ่มต้นหมายเหตุpowernumber 0-100hand-authoredพลังยุทธ์ปัจจุบันagenumberhand-authoredอายุปี (เริ่ม 18-80)statusenum'alive'alive / dead / missing / secludedcurrentLocationLocationIdhand-authoredอยู่ที่ไหนตอนนี้homeLocationLocationIdhand-authoredบ้านเกิด/สำนักหลักsectSectId | nullhand-authoredสำนักปัจจุบันsectRanknumber 0-10hand-authored0 = ไม่สังกัด, 10 = ปรมาจารย์goalsNpcGoal[]hand-authoredเป้าหมายระยะยาวrivalsNpcId[]hand-authoredคู่แค้นalliesNpcId[]hand-authoredพันธมิตรlastTickDaynumber0วันที่ tick ล่าสุดeventHistoryNpcEventLog[][]log ย้อนหลัง 10 events ล่าสุด
2.3 NPC Goals
Goal คือสิ่งที่ขับเคลื่อน behavior ของ NPC ระหว่าง tick
Goal kinds (v1):
KindDataProgress conditionOn completemaster_artartIdtick roll +1-5%power +5-15, fire master_art eventclimb_secttargetRankrequires power ≥ thresholdsectRank++, fire sect_promotionavengetargetNpcIdtrigger duel เมื่อ power ใกล้กันresolve combat, fire death_combat หรือ duel_lossfind_treasureitemId, locationIdtick roll +randomgive item, fire found_treasureseek_wisdomlocationIdrequires travelfire secluded, status = secluded
Goal stack:

NPC มีได้ 1-3 goals พร้อมกัน
เรียงตาม priority
เมื่อ goal complete → roll new goal (50%) หรือเพิ่ม goal ใหม่จาก template

2.4 Tick System
Tick frequency: ทุก 7 วันใน world day
Trigger: ระหว่าง advanceTime(days) → ทุกครั้งที่ world.day % 7 === 0 ระหว่างนับวัน → tickAllNamedNpcs()
Per-NPC tick sequence:

Skip ถ้า status ≠ alive (dead/secluded/missing ไม่ tick)
Aging — ถ้า world.day % 365 === 0 → age++
Natural death roll — ถ้า age > 70 → roll 5% ตาย; age > 85 → roll 15%
Power growth — roll based on active goals (0-2 power per tick)
Goal progression — roll progress on each goal
Event roll — 8% chance fire random event จาก eligible events
Update lastTickDay

Throttle rule:

ถ้าผู้เล่น advanceTime มากกว่า 28 วัน (4 tick) ในครั้งเดียว → tick สูงสุด 4 รอบ ส่วนเกิน:

Aging ยังคำนวณ
Goal progress คำนวณแบบ batch (sum probability)
Event roll skip ส่วนเกิน
Log ว่า "เวลาผ่านไป X วันโดยไม่มีเหตุการณ์สำคัญ"



2.5 NPC Events Catalog
ทุก event เมื่อ fire ต้อง: (a) อัปเดต NPC state (b) push entry ลง eventHistory (c) generate rumor (ดู §3)
Event IDTriggerState changeRumor template countnpc_death_naturalage rollstatus = dead2npc_death_combatavenge goal + power matchstatus = dead, killer power +53npc_sect_promotionclimb_sect goal completesectRank++2npc_sect_demotionrare conflict rollsectRank--2npc_master_artmaster_art goal completepower +10, learn art2npc_found_treasurefind_treasure completegain item, power +53npc_travelrandomcurrentLocation = new1npc_secludedage + rollstatus = secluded2npc_marryrelationship spikebond with target NPC2npc_betray_sectrare roll (1%)sect = null, spawn hunter3npc_take_discipleage > 50 + sectRank ≥ 7spawn new low-power NPC2npc_defeated_by_playerscriptedpower -102
Eligibility: event มี prerequisites ที่ NPC ต้องผ่านก่อน fire (เช่น npc_marry ต้องมี NPC เป้าหมายที่ relationship ≥ 60)
2.6 NPC Pool Refill
Problem: ถ้า NPC ตายเรื่อย ๆ pool หด
Solution:

npc_take_disciple event → spawn new generic-template NPC ที่กลายเป็น named ในอนาคต
Initial low power (10-20)
Inherit sect ของอาจารย์
ใช้ name pool ที่ pre-authored (50-100 ชื่อ) ไม่ใช่ procedural


3. Rumor System
3.1 Rumor Data Model
FieldTypeRequiredหมายเหตุidstringyesunique, format rumor_<source>_<timestamp>textstringyesข้อความที่ NPC พูด รองรับ Thaisourceenumyesnpc_event / player_echo / lore / warningcreatedDaynumberyesworld day ที่สร้างexpiresDaynumberyescreatedDay + lifespan (default 60 วัน)truthenumyestrue / distorted / falseregionRegionId | 'global'yesrumor กระจายแค่ region นี้channelenumyesinn / market / sect_internal / wildernessaboutNpcId | LocationId | SectId | nullnoสำหรับ filter & deduprefersToEventRef | nullnolink ไป event ที่ generate rumor นี้leadsToLeadTarget | nullnoสำหรับ rumor type leadprerequisitesCondition[]noผู้เล่นต้องผ่านก่อนเห็น rumor นี้weightnumber 0-10yespriority ตอนเลือกแสดง
3.2 Rumor Sources
3.2.1 Source: NPC Event Echo
Trigger: ทุก NPC event ที่ fire ใน §2.5
Generation logic:

ดู event type
Pick template สุ่มจาก rumor template pool ของ event นั้น
Render template ด้วยข้อมูล NPC (ชื่อ, สำนัก, location)
Roll distortion: 15% chance truth = 'distorted', 5% chance truth = 'false'
Set region = location ที่ event เกิด, expand ไป global หาก event สำคัญ (death, sect promotion ระดับ Elder)
Set lifespan ตาม importance: ปกติ 60 วัน, event ใหญ่ 120 วัน

Distortion examples:

True: "X ชนะ Y ที่เขาฮั้วซาน"
Distorted: "X ชนะ Y ใช้ฝ่ามือเย็น" (ทั้งที่ใช้ดาบ)
False: "X ตายแล้ว" (ทั้งที่แค่บาดเจ็บ)

3.2.2 Source: Player Echo
Trigger: เมื่อผู้เล่นทำ action ใน list:

ชนะ duel กับ named NPC
เข้า/ออก/ทรยศสำนัก
complete major quest stage
ตาย boss
ขึ้น sect rank

Generation logic:

Get player archetype label จากระบบ reputation 4 แกน (เชื่อมกับ logic ที่ตกลงไว้: righteousness + evil + pride + humility + fame)
Pick template ที่ใช้ {archetype} placeholder
Render: "ได้ยินว่า{archetype}บุก{location} เอาชนะ{npcName}"
Higher distortion rate: 25% distorted, 10% false
Region = location ที่ทำ action, ยังไม่ global ในวันแรก
Spread mechanic: ทุก 7 วัน rumor expand ไป region ข้างเคียง 1 ระดับ (ดู §3.4)

Archetype label mapping (ตัวอย่าง):

ดี > 70, เลว < 30 → "ผู้กล้าแห่งเจียงหู"
เลว > 70, ดี < 30 → "จอมมาร"
ดี > 70, เลว > 70 → "บ้ายุทธ์จักรดีร้ายตามใจตน"
ยโส > 70, ถ่อม > 70 → "ผู้ล้ำลึกหยั่งไม่ถึง"
ถ่อม > 70, ดี > 50 → "นักพรตไร้นาม"
(อื่น ๆ ตามตารางที่ design ไว้)

3.2.3 Source: Static Lore
Generation: ไม่ trigger จาก event — เป็น pool คงที่ที่ rotate
Authoring requirements:

Hand-author 60-100 lore rumor
กระจายตาม region (10-15 ต่อ region สำคัญ)
Categories:

ตำนานสำนัก (20-30)
ประวัติศาสตร์ยุทธจักร (15-20)
ตำนานตัวละครเก่า (10-15)
เบาะแสสมบัติ/วิชาลับ (15-25 — กลุ่มนี้มี leadsTo)



Rotation:

Active pool 5 อันต่อ inn
หมุนทุก 14-30 วัน
Lore rumor ไม่หมดอายุ (expiresDay = ∞) แค่ rotate ออกจาก active

3.2.4 Source: Scheduled Event Warning
Trigger: Event ใน worldState.scheduledEvents ที่จะ fire ใน 30 วัน
Generation logic:

Scan scheduledEvents ทุกครั้งที่ tick
ถ้า triggerDay - world.day อยู่ใน [7, 30] → generate warning rumor (ถ้ายังไม่มี)
Template: "อีก {days} วันจะมี{event}ที่{location}"
Region = location ของ event, weight สูง (8-10)
expiresDay = triggerDay + 1 (หมดอายุหลัง event เกิด)
truth = always 'true'

Use case: Telegraph deadline ของ tournament, festival, sect gathering ให้ผู้เล่นรู้ทัน
3.3 Rumor Storage
worldState.rumorPool: Rumor[]
  - เก็บทุก rumor ที่ยังไม่ expire
  - Cap soft 200 อัน, hard 500 อัน
  - เกิน hard cap → ลบที่ expire เก่าสุด + weight ต่ำสุดก่อน

worldState.rumorArchive: RumorSummary[]
  - rumor ที่ expire แล้วแต่อาจถูกอ้างถึง
  - บีบเหลือ id + about + truth (~10% ของ rumor object)
  - เก็บ 1 ปี world time แล้วลบ
3.4 Rumor Distribution
Region propagation rules:
SourceInitial spreadExpansionNPC event echoevent location's region+1 region ทุก 14 วัน, max 3 regionsPlayer echoplayer current region+1 region ทุก 7 วัน, max 4 regionsLorehand-authored regionไม่ expandWarningevent location's regionglobal ทันทีถ้า event ใหญ่
Channel filter:
แต่ละ scene มี rumorChannels: Channel[] กำหนดว่ารับ rumor ประเภทไหน:

Inn → inn + market + wilderness (mix หลากหลาย)
Market → market + inn (commerce-focused)
Sect hall → sect_internal (เฉพาะ sect ตัวเอง)
Wilderness encounter → wilderness (limited)

3.5 Rumor Selection at Runtime
เมื่อผู้เล่น trigger "ฟังข่าว":

Filter rumorPool ตาม:

Not expired
region match (current location's region หรือ global)
channel match
prerequisites passed


Sort by:

weight desc
createdDay desc (ใหม่ก่อน) เป็น tiebreaker


Pick top 5
ถ้าผู้เล่นเคยเห็น rumor นี้แล้ว → de-prioritize (push ไปอันดับท้าย ๆ) แต่ไม่ตัดทิ้ง

3.6 Rumor Truth & Reward Guarantee
Critical rule: Rumor ที่ truth = 'false' และมี leadsTo ต้องให้ partial reward เมื่อผู้เล่นไปตรวจสอบ
Acceptable partial rewards:

เจอ NPC อื่นที่ให้ quest เล็ก
เจอ encounter ที่ unique
ได้ item รอง
Discover sub-location

ห้าม: ผู้เล่นไปแล้วไม่เจออะไรเลย → trust violation
3.7 Player Memory of Rumor
ระบบไม่เก็บว่าผู้เล่นได้ยิน rumor อันไหนเป็น flag ตายตัว แต่ใช้:
worldState.rumorSeenLog: { rumorId, dayHeard, location }[]
  - cap 50 entries
  - ใช้ de-prioritize ที่เห็นซ้ำ
  - ใช้ ตรวจสอบว่าผู้เล่นเคยรู้เรื่องนี้ก่อนไป location

4. UI Integration
4.1 New Scene Choices
Inn / โรงเตี๊ยม:
[ฟังข่าวลือในโรงเตี๊ยม] (เสีย 2 ชม., advanceTime 0 วัน)
→ แสดง rumor 3-5 อัน
→ ผู้เล่นเลือกฟัง 1 อันเพื่อรับ flag เต็ม (อันอื่นเป็น scrolling text)
Market / ตลาด:
[ฟังพ่อค้าคุยกัน] (เสีย 1 ชม.)
→ แสดง rumor 2-3 อัน เน้น commerce/treasure
Sect hall (ถ้าเป็นสมาชิก):
[ฟังข่าวภายในสำนัก]
→ แสดง rumor 2-3 อัน เน้น sect_internal
4.2 Passive Rumor Display
เมื่อผู้เล่นเข้าเมืองครั้งแรกในรอบ 7 วัน:

Auto-show 1 rumor ที่ weight สูงสุด
Format: "ขณะเดินเข้าเมือง ได้ยินคนพูดกันว่า: {rumor.text}"
ไม่กิน action

4.3 NPC Status in UI
หน้า NPC list / encyclopedia:

แสดง status ปัจจุบัน (alive / dead / missing / secluded)
แสดง location ปัจจุบัน
แสดง sect rank ปัจจุบัน
ถ้า status = dead → grey out + "เสียชีวิตแล้ว เมื่อ {day}"

4.4 Visual Treatment

Rumor text ใส่ใน blockquote style ด้วยสีคราม/ดำ คล้าย dialog
Distorted/false rumor ไม่บอกผู้เล่นว่าจริงหรือไม่ — แค่แสดงเป็น rumor ปกติ
Warning rumor ใช้ icon ⚠ นำหน้า (อันเดียวที่บ่งบอกว่า "เชื่อถือได้")


5. Content Authoring Requirements
5.1 Named NPC Roster
Deliverable: Spreadsheet หรือ TS data file ที่มี 20-40 named NPC พร้อม:

Initial state ทุก field ใน §2.2
Goals 1-2 อัน
Rivals/allies 0-3 รายการ

Existing NPC ใน npcStates ที่เข้าเกณฑ์ §2.1 ต้องเลื่อนเป็น named (audit roster)
5.2 Rumor Templates
Deliverable: Template file ต่อ event type
ปริมาณขั้นต่ำ:

NPC event templates: 8-12 events × 2-3 templates = 24-36 templates
Player echo templates: 8 actions × 2-3 templates = 16-24 templates
Lore rumors: 60-100 hand-authored
Warning templates: 5-8 templates

Template format:

รองรับ placeholder {npc}, {location}, {sect}, {art}, {archetype}, {days}
มี variation field สำหรับ distorted version (ถ้า rumor เป็น distortable)
มี Thai-natural phrasing — หลีกเลี่ยง direct translation

5.3 Distortion Variants
สำหรับ event สำคัญ (death, master_art, sect_promotion) — เขียน distorted version 1-2 แบบ
ตัวอย่าง:
event: npc_death_combat
true: "{killer}สังหาร{victim}ที่{location}"
distorted_1: "{victim}ถูกพบศพที่{location} ไม่รู้ฝีมือใคร"
distorted_2: "{killer}บาดเจ็บสาหัสจากการต่อสู้กับ{victim}" (สลับผลแพ้ชนะ)

6. Performance & Save
6.1 Performance Budget
OperationBudgetSingle NPC tick< 1msTick all 40 NPC< 50msRumor generation per event< 5msRumor selection at inn< 20msadvanceTime(28 days) worst case< 200ms
6.2 Save Size
ComponentEstimated sizeStrategyNamed NPC extended state40 × 0.5KB = 20KBinline ใน saveRumor pool active200 × 0.3KB = 60KBinlineRumor archive500 × 0.05KB = 25KBinline (compressed)Rumor seen log50 × 0.1KB = 5KBinlineTotal addition~110KBacceptable for localStorage
6.3 LocalStorage Quota

Existing save (estimate): ~200-500KB
After this module: ~310-610KB
localStorage typical quota: 5MB
Headroom: สบาย

ถ้าใกล้ limit ในอนาคต → archive rumor เก่ากว่า 90 วันเป็น summary string

7. Dependencies & Integration
7.1 Hard dependencies (มีแล้ว)

ระบบเวลา (world.day, advanceTime)
ระบบ reputation 4 แกน (righteousness, evil, pride, humility, fame)
npcStates[] data structure
worldState persistence
Scene engine + SceneEffect / Condition
Location + region taxonomy
Sect membership system

7.2 Soft dependencies

Archetype label system (ต้อง finalize ก่อน player echo template)
Scheduled events (ต้องมี for warning rumors)
Inn / market scenes (ต้อง add choice)

7.3 New SceneEffect
EffectPurposefirePlayerEcho(actionId)trigger rumor generation จาก player actionmarkRumorHeard(rumorId)log ว่าผู้เล่นได้ยิน rumorrevealNpcStatus(npcId)force update NPC status display
7.4 New Condition
ConditionPurposeheardRumor(rumorId)ใช้ใน scene ที่ต้องเช็คว่าผู้เล่นรู้ rumor นี้ก่อนheardRumorAbout(target)flexible versionnpcStatus(npcId, status)scene เปลี่ยนตามสถานะ NPC

8. Open Questions
ควรตอบก่อน implementation:

NPC tick timing — tick ตอน advanceTime หรือ tick async ตอน UI idle? (เลือก sync ดีกว่าสำหรับ determinism + save)
Rumor de-duplication — rumor 2 อันเรื่องเดียวกันแต่ต่าง template ให้แสดงทั้งคู่ หรือ collapse?
NPC ที่ตายแล้วใน main quest — quest ปรับให้รองรับ NPC dead status ยังไง?
Player echo trigger — ทุก action หรือเฉพาะ "consequential" action? threshold คืออะไร?
Save migration — save เดิมที่ไม่มี extended NPC state จะ migrate ยังไง? (เสนอ: lazy migration ตอน load, fill default)
Localization — ตอนนี้ Thai-only หรือเตรียม multi-lang? affect template structure
Rumor weight tuning — ค่า weight 0-10 ใครเป็นคน assign? (เสนอ: hard-code ใน template + boost จาก event importance)
Cross-NPC event causation — npc_death_combat ต้องมี killer NPC จริง ๆ หรือ string ก็พอ?


9. Acceptance Criteria
ระบบนี้ถือว่า "ใช้ได้" เมื่อ:

 ผู้เล่นเดินทางผ่าน 30 world days แล้วเห็น NPC event อย่างน้อย 3 events
 ผู้เล่นเข้า inn แล้วเห็น rumor อย่างน้อย 3 อันที่แตกต่างกัน
 ผู้เล่นทำ action ใหญ่ (ชนะ duel boss) แล้วได้ยิน player echo ใน inn ภายใน 14 วัน
 NPC ที่ตายไปแล้วไม่ trigger ใน scene ที่ต้องการตัวจริง (graceful fallback)
 ผู้เล่นไป location ตาม leadsTo rumor false → ได้ partial reward เสมอ
 ระบบรัน advanceTime(90) ภายใน 1 วินาที
 Save / load ผ่าน 5 cycles ไม่ corrupt
 Rumor pool ไม่เกิน hard cap หลังเล่น 365 world days
 Inn rumor distribution: > 50% เป็น dynamic (echo/warning), < 50% lore