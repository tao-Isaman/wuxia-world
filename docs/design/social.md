# Friends, party, chat and mail — design

The game's first features between players. Until now players only saw each other walk ([online.md](../online.md)); nothing passed between them. This adds four things, all on the game server (none without one):

1. **Friends (สหาย):** add by request, accept or decline, remove, block; see who is online, as whom and where.
2. **Party (คณะ):** up to four players travel together; party chat; where each member is; a small bonus for fighting near a companion.
3. **Chat (สนทนา):** the map you stand on, your party, and whispers to one player.
4. **Mail (จดหมาย):** letters between players, with an optional parcel (gold or one stack of an item) the recipient takes when they choose. NPC letters change the same way: opening a letter no longer takes its gift; รับของ does.

## What other games do (research, 2026-10-12)

| Topic | Common practice | Taken here |
| --- | --- | --- |
| Mail expiry | WoW keeps mail 30 days, then returns it to the sender; system mail is discarded | 30 days; an unclaimed parcel goes back to its sender |
| Inbox size, spam | ESO caps the inbox at 72 and charges postage | 50 letters; 10 ตำลึง postage ("ค่าม้าเร็ว"); 10 letters an hour |
| Attachments | a separate "take" action, a claim that can happen once | รับของ, once, on the server |
| Losing items | log sender, recipient, contents and claim state for every parcel | every parcel is a server record with its state |
| Chat channels | world / zone / party / private, each a pub-sub channel | map (the room), party, whisper; no world channel yet |
| Chat abuse | server-side rate limits (e.g. 5 messages / 10 s), mutes, block lists | 5 / 10 s per channel, 120 characters, block list enforced by the server |
| Party | a leader who invites; leadership passes on when the leader leaves; XP shared only near the kill | leader invites, kicks, hands over; leaving passes the lead; the bonus only counts members on the same map |

Sources: [WoW mail](https://warcraft.wiki.gg/wiki/Mail), [ESO mail](https://en.uesp.net/wiki/Online:Mail), [Unity in-game mailbox](https://docs.unity.com/en-us/services/solutions/in-game-mailbox), [bugnet: mail bugs](https://bugnet.io/blog/bug-reporting-for-games-with-in-game-mail), [OneUptime: game chat channels](https://oneuptime.com/blog/post/2026-03-31-redis-how-to-build-a-game-chat-system-with-redis-pubsub/markdown), [OpenTogetherTube chat limits](https://www.mintlify.com/dyc3/opentogethertube/features/chat), [AccelByte: scaling game chat](https://accelbyte.io/blog/scaling-in-game-chat-for-online-games), [iRO party](https://irowiki.org/classic/Party), [Diablo II parties](https://classic.battle.net/diablo2exp/basics/parties.shtml).

## Who is who

- A player is their **account** (`username`, unique, lowercase): friends, parties, whispers and mail are between accounts. They show as the **hero name** of the character being played (or last played) with `@username` beside it.
- In a map room every player already carries `id` = username and `name` = hero name (`Presence`), so tapping another player on the map gives everything needed to add, invite, whisper or write.

## Server

### PlayerHub — one per account (TypeScript Durable Object, `2:hub:<username>`)

The account's social home:

| Kept | Limits |
| --- | --- |
| `friends` (username → since) | 100 |
| `requestsIn`, `requestsOut` | 30 each; a request to someone who already asked you makes you friends |
| `blocked` | 100; a blocked player's requests, whispers, invites and mail are refused, and they are dropped as a friend |
| `mail` (player letters) | 50; 30 days; read / claimed flags |
| `whispers` (backlog) | the last 50, for the panel after a reload |
| `status` | online (a connected socket), the hero name, body, map, last seen |
| `partyId` | one party at a time |

Every player has **one social socket** to their own hub (`/social/ws`, hibernating like the rooms). The hub pushes what happens to them: a whisper, a friend request or answer, new mail, a party invite, the party's state or chat. Hubs talk to each other and to parties over internal requests; nothing between players is client-to-client.

### PartyObject — one per party (`2:party:<id>`)

Up to **4** members, a leader, pending invites (they lapse after 2 minutes). Members' places come from their hubs' status. Every change is pushed to every member (their hub forwards it on their socket):

- the leader invites (a friend, or anyone they can name); the invited accepts or declines;
- anyone leaves; the leader kicks or hands the lead over; a leader who leaves passes it to the longest-standing member; a party of one dissolves;
- party chat goes to every member.

**Party bonus:** a checked battle (BattleObject) won while another online member stands on the same map pays **+10 % w-exp and move xp**. The server asks the hub for it at the verdict, so it cannot be claimed by the browser.

### Chat

| Channel | Path | Notes |
| --- | --- | --- |
| แผนที่ (map) | the map room's socket: `say` → `said` (protocol 2, `room.rs`) | everyone on the same map; the line also shows as a bubble over the speaker |
| คณะ (party) | `POST /party/chat` → PartyObject → members' hubs | |
| กระซิบ (whisper) | `POST /social/whisper` → the recipient's hub | stored (the last 50) so it can be read after a reload; refused if blocked |

All lines: 1–120 characters, control characters stripped, **5 lines per 10 s** per player and channel (`too_fast`). The browser also hides map lines from players it has blocked.

### Mail and parcels

A letter is `{ from, fromName, to, subject?, text (≤ 500), parcel?: { gold } | { itemId, count }, sentAt, read, claimed, returned? }`.

**Sending with a parcel must not copy anything.** Saves are written by the browser, so the server takes the parcel out of the sender's save itself:

1. The browser saves everything pending, then sends `POST /social/mail` with the letter and **its next save**: the current state minus the parcel and the 10-ตำลึง postage, built on the save's `rev`.
2. The sender's AccountObject checks that save as usual **and** that the parcel was really there: the last accepted save held it, and the new one holds at least that much less (gold: `new ≤ old − parcel − postage`; an item: `new ≤ old − count`). Both happen in one storage write (`save-debit`).
3. Only then is the letter delivered to the recipient's hub. If that fails (no such account, blocked, inbox full), the parcel comes back at once as a returned letter in the sender's own mailbox.

Parcels: gold up to 50,000, or one stack of an item that can be sold (no quest items, scrolls or keys).

**Taking a parcel (รับของ)** is one request: the hub marks it claimed (once, whichever character asks) and, for gold, grants it to that character's save allowance (the same `grant` a checked battle uses); the browser then adds it to the bag. Deleting a letter with an untaken parcel asks first; an expired letter returns its parcel to the sender.

### NPC letters

Opening a letter (`readLetter`) only marks it read. Its gift waits behind **รับของ** (`claimLetterGift`) and **รับทั้งหมด**; the list shows which letters still hold a gift. Deleting one with an untaken gift asks before throwing the gift away. This works with or without a server (NPC letters live in the save).

## Browser

| Piece | What |
| --- | --- |
| `lib/net/social.ts` | the social socket and the HTTP calls |
| `store/social-store.ts` | friends, requests, blocked, party, mail, chat lines (per channel), connection state |
| HUD **สหาย** tab | friends (online first: hero name, place, actions), requests, blocked; the party (members, places, invite, leave, kick, lead) |
| **จดหมาย** tab | two lists — จากผู้คน (NPC letters) and จากสหาย (player mail) — and เขียนจดหมาย (to, text, parcel) |
| chat box | bottom left, collapsible: แผนที่ / คณะ / กระซิบ tabs, Enter to talk; typing never moves the hero |
| player card | tap another player on the map: กระซิบ, เพิ่มสหาย, ชวนเข้าคณะ, ส่งจดหมาย, บล็อก |
| party frame | under the vitals: each member's hero name, place, online dot |
| map | chat bubbles over speakers; party members' name tags in another colour |

## Not in this round

- A world-wide chat channel (one more object every hub subscribes to).
- Trading face to face, or a market.
- Fighting together in one battle (battles stay one hero; the party gives the bonus).
- Reports to moderators; profanity filtering (blocking covers abuse between two players for now).
