//! A room: everyone standing on one map (a location or road id), in an
//! event-sourced shape.
//!
//! - A **command** is what a player asks for (`join`, `move`, `leave`).
//! - [`Room::decide`] checks it against the current state and answers with the
//!   **events** it causes, or a [`Rejection`]. It never changes the state.
//! - [`Room::apply`] folds one event into the state. It never fails.
//!
//! The Durable Object (`worker/src/room.rs`) only runs `decide`, numbers the
//! events, `apply`s them and broadcasts them; every client applies the same
//! events to its own copy (`lib/net/presence.ts`). Because the state is only
//! ever changed by events, a snapshot plus the events after its `seq` always
//! rebuild the same room.

use std::collections::BTreeMap;

use crate::protocol::{Dir8, ErrorCode, LeaveReason, Presence, RoomEvent, BODIES};

/// Map size in the runtime's units (`lib/stage/world-runtime.ts`, 960 × 640).
pub const MAP_WIDTH: f32 = 960.0;
pub const MAP_HEIGHT: f32 = 640.0;
/// The hero's walking speed in map units per second (the runtime's `SPEED`).
pub const WALK_SPEED: f32 = 150.0;
/// Network jitter allowance: a move may cover this much more than walking allows…
pub const SPEED_SLACK: f32 = 1.6;
/// …plus this many units (a late packet, a frame of lag).
pub const JUMP_SLACK: f32 = 48.0;
/// The most people one map holds.
pub const MAX_PLAYERS: usize = 64;
/// The longest hero name, in characters.
pub const MAX_NAME_CHARS: usize = 24;

#[derive(Clone, Debug, PartialEq)]
pub enum Command {
    Join { id: String, name: String, body: String, x: f32, y: f32, dir: Dir8 },
    Move { id: String, x: f32, y: f32, dir: Dir8, moving: bool },
    Leave { id: String, reason: LeaveReason },
}

#[derive(Clone, Debug, PartialEq)]
pub struct Rejection {
    pub code: ErrorCode,
    pub message: String,
}

impl Rejection {
    fn new(code: ErrorCode, message: impl Into<String>) -> Self {
        Rejection { code, message: message.into() }
    }
}

#[derive(Clone, Debug, Default, PartialEq)]
pub struct Room {
    players: BTreeMap<String, Presence>,
}

impl Room {
    /// A room rebuilt from what each connection remembers (after the server slept).
    pub fn from_players(players: impl IntoIterator<Item = Presence>) -> Self {
        Room { players: players.into_iter().map(|p| (p.id.clone(), p)).collect() }
    }

    pub fn player(&self, id: &str) -> Option<&Presence> {
        self.players.get(id)
    }

    pub fn len(&self) -> usize {
        self.players.len()
    }

    pub fn is_empty(&self) -> bool {
        self.players.is_empty()
    }

    /// Everyone in the room, ordered by id.
    pub fn snapshot(&self) -> Vec<Presence> {
        self.players.values().cloned().collect()
    }

    /// What a command causes, at server time `now` (ms). Pure.
    pub fn decide(&self, command: &Command, now: f64) -> Result<Vec<RoomEvent>, Rejection> {
        match command {
            Command::Join { id, name, body, x, y, dir } => {
                let name = clean_name(name)?;
                if !BODIES.contains(&body.as_str()) {
                    return Err(Rejection::new(ErrorCode::BadProfile, format!("unknown body `{body}`")));
                }
                let mut events = Vec::new();
                if self.players.contains_key(id) {
                    // The same account again (a second tab, a reconnect): the older socket goes.
                    events.push(RoomEvent::Left { id: id.clone(), reason: LeaveReason::Replaced });
                } else if self.players.len() >= MAX_PLAYERS {
                    return Err(Rejection::new(ErrorCode::RoomFull, "this map is full"));
                }
                let (x, y) = clamp_to_map(*x, *y);
                events.push(RoomEvent::Joined {
                    player: Presence { id: id.clone(), name, body: body.clone(), x, y, dir: *dir, moving: false, at: now },
                });
                Ok(events)
            }
            Command::Move { id, x, y, dir, moving } => {
                let Some(player) = self.players.get(id) else {
                    return Err(Rejection::new(ErrorCode::NotJoined, "say hello first"));
                };
                let (x, y) = clamp_to_map(*x, *y);
                if x == player.x && y == player.y && *dir == player.dir && *moving == player.moving {
                    return Ok(Vec::new());
                }
                let seconds = ((now - player.at) / 1000.0).max(0.0) as f32;
                let allowed = WALK_SPEED * SPEED_SLACK * seconds + JUMP_SLACK;
                let distance = (x - player.x).hypot(y - player.y);
                if distance > allowed {
                    return Err(Rejection::new(
                        ErrorCode::TooFast,
                        format!("moved {distance:.0} units in {seconds:.2}s (at most {allowed:.0})"),
                    ));
                }
                Ok(vec![RoomEvent::Moved { id: id.clone(), x, y, dir: *dir, moving: *moving, at: now }])
            }
            Command::Leave { id, reason } => Ok(if self.players.contains_key(id) {
                vec![RoomEvent::Left { id: id.clone(), reason: *reason }]
            } else {
                Vec::new()
            }),
        }
    }

    /// Fold one event into the room.
    pub fn apply(&mut self, event: &RoomEvent) {
        match event {
            RoomEvent::Joined { player } => {
                self.players.insert(player.id.clone(), player.clone());
            }
            RoomEvent::Moved { id, x, y, dir, moving, at } => {
                if let Some(player) = self.players.get_mut(id) {
                    player.x = *x;
                    player.y = *y;
                    player.dir = *dir;
                    player.moving = *moving;
                    player.at = *at;
                }
            }
            RoomEvent::Left { id, .. } => {
                self.players.remove(id);
            }
        }
    }
}

fn clean_name(name: &str) -> Result<String, Rejection> {
    let name = name.trim();
    let count = name.chars().count();
    if count == 0 || count > MAX_NAME_CHARS || name.chars().any(char::is_control) {
        return Err(Rejection::new(
            ErrorCode::BadProfile,
            format!("a hero name is 1–{MAX_NAME_CHARS} printable characters"),
        ));
    }
    Ok(name.to_string())
}

fn clamp_to_map(x: f32, y: f32) -> (f32, f32) {
    let round = |v: f32| (v * 10.0).round() / 10.0;
    let x = if x.is_finite() { x } else { MAP_WIDTH / 2.0 };
    let y = if y.is_finite() { y } else { MAP_HEIGHT / 2.0 };
    (round(x.clamp(0.0, MAP_WIDTH)), round(y.clamp(0.0, MAP_HEIGHT)))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn join(id: &str, x: f32, y: f32) -> Command {
        Command::Join { id: id.into(), name: format!("hero {id}"), body: "m1".into(), x, y, dir: Dir8::S }
    }
    fn mv(id: &str, x: f32, y: f32) -> Command {
        Command::Move { id: id.into(), x, y, dir: Dir8::E, moving: true }
    }
    /// decide, then apply: the way the server runs a command.
    fn run(room: &mut Room, command: Command, now: f64) -> Result<Vec<RoomEvent>, Rejection> {
        let events = room.decide(&command, now)?;
        for event in &events {
            room.apply(event);
        }
        Ok(events)
    }

    #[test]
    fn a_join_is_one_joined_event_and_the_snapshot_shows_them() {
        let mut room = Room::default();
        let events = run(&mut room, join("ann", 100.0, 200.0), 1000.0).unwrap();
        assert_eq!(events.len(), 1);
        assert!(matches!(&events[0], RoomEvent::Joined { player } if player.id == "ann" && player.x == 100.0));
        assert_eq!(room.snapshot().len(), 1);
    }

    #[test]
    fn decide_never_changes_the_room() {
        let mut room = Room::default();
        run(&mut room, join("ann", 100.0, 200.0), 0.0).unwrap();
        let before = room.clone();
        room.decide(&mv("ann", 110.0, 200.0), 500.0).unwrap();
        room.decide(&join("bob", 1.0, 1.0), 500.0).unwrap();
        assert_eq!(room, before);
    }

    #[test]
    fn walking_moves_at_walking_speed_and_teleports_are_refused() {
        let mut room = Room::default();
        run(&mut room, join("ann", 100.0, 200.0), 0.0).unwrap();
        // Half a second at 150 u/s is 75 units: fine.
        assert_eq!(run(&mut room, mv("ann", 175.0, 200.0), 500.0).unwrap().len(), 1);
        assert_eq!(room.player("ann").unwrap().x, 175.0);
        // Across the map in a tenth of a second: refused, nothing changes.
        let refused = run(&mut room, mv("ann", 900.0, 600.0), 600.0).unwrap_err();
        assert_eq!(refused.code, ErrorCode::TooFast);
        assert_eq!(room.player("ann").unwrap().x, 175.0);
    }

    #[test]
    fn a_move_that_changes_nothing_is_no_event() {
        let mut room = Room::default();
        run(&mut room, join("ann", 100.0, 200.0), 0.0).unwrap();
        run(&mut room, mv("ann", 110.0, 200.0), 100.0).unwrap();
        assert!(run(&mut room, mv("ann", 110.0, 200.0), 200.0).unwrap().is_empty());
    }

    #[test]
    fn moves_need_a_join_and_stay_on_the_map() {
        let mut room = Room::default();
        assert_eq!(room.decide(&mv("ghost", 1.0, 1.0), 0.0).unwrap_err().code, ErrorCode::NotJoined);
        run(&mut room, join("ann", 5000.0, -40.0), 0.0).unwrap();
        let ann = room.player("ann").unwrap();
        assert_eq!((ann.x, ann.y), (MAP_WIDTH, 0.0));
        run(&mut room, join("bob", f32::NAN, 10.0), 0.0).unwrap();
        assert_eq!(room.player("bob").unwrap().x, MAP_WIDTH / 2.0);
    }

    #[test]
    fn joining_twice_replaces_the_older_presence() {
        let mut room = Room::default();
        run(&mut room, join("ann", 100.0, 200.0), 0.0).unwrap();
        let events = run(&mut room, join("ann", 300.0, 300.0), 50.0).unwrap();
        assert_eq!(events[0], RoomEvent::Left { id: "ann".into(), reason: LeaveReason::Replaced });
        assert!(matches!(&events[1], RoomEvent::Joined { .. }));
        assert_eq!(room.len(), 1);
        assert_eq!(room.player("ann").unwrap().x, 300.0);
    }

    #[test]
    fn profiles_are_checked() {
        let room = Room::default();
        let bad_body = Command::Join { id: "a".into(), name: "ok".into(), body: "dragon".into(), x: 0.0, y: 0.0, dir: Dir8::S };
        assert_eq!(room.decide(&bad_body, 0.0).unwrap_err().code, ErrorCode::BadProfile);
        let long = Command::Join { id: "a".into(), name: "ก".repeat(25), body: "f1".into(), x: 0.0, y: 0.0, dir: Dir8::S };
        assert_eq!(room.decide(&long, 0.0).unwrap_err().code, ErrorCode::BadProfile);
        let thai = Command::Join { id: "a".into(), name: "  หลี่มู่ไป๋  ".into(), body: "f1".into(), x: 0.0, y: 0.0, dir: Dir8::S };
        assert!(matches!(&room.decide(&thai, 0.0).unwrap()[0], RoomEvent::Joined { player } if player.name == "หลี่มู่ไป๋"));
    }

    #[test]
    fn a_full_room_turns_newcomers_away() {
        let mut room = Room::default();
        for i in 0..MAX_PLAYERS {
            run(&mut room, join(&format!("p{i}"), 10.0, 10.0), 0.0).unwrap();
        }
        assert_eq!(room.decide(&join("late", 1.0, 1.0), 0.0).unwrap_err().code, ErrorCode::RoomFull);
        // Someone already inside may still rejoin.
        assert!(room.decide(&join("p0", 1.0, 1.0), 0.0).is_ok());
    }

    #[test]
    fn leaving_removes_them_once() {
        let mut room = Room::default();
        run(&mut room, join("ann", 100.0, 200.0), 0.0).unwrap();
        assert_eq!(run(&mut room, Command::Leave { id: "ann".into(), reason: LeaveReason::Closed }, 10.0).unwrap().len(), 1);
        assert!(room.is_empty());
        assert!(run(&mut room, Command::Leave { id: "ann".into(), reason: LeaveReason::Closed }, 20.0).unwrap().is_empty());
    }

    #[test]
    fn a_snapshot_plus_later_events_rebuilds_the_same_room() {
        let mut live = Room::default();
        let mut log = Vec::new();
        log.extend(run(&mut live, join("ann", 100.0, 200.0), 0.0).unwrap());
        log.extend(run(&mut live, join("bob", 400.0, 300.0), 10.0).unwrap());
        let snapshot = live.snapshot();
        let mut later = Vec::new();
        later.extend(run(&mut live, mv("ann", 140.0, 210.0), 400.0).unwrap());
        later.extend(run(&mut live, Command::Leave { id: "bob".into(), reason: LeaveReason::Closed }, 500.0).unwrap());
        let mut replay = Room::from_players(snapshot);
        for event in &later {
            replay.apply(event);
        }
        assert_eq!(replay, live);
        // And the whole log from empty gives the same room too.
        let mut from_zero = Room::default();
        for event in log.iter().chain(&later) {
            from_zero.apply(event);
        }
        assert_eq!(from_zero, live);
    }
}
