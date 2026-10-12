//! The wire protocol between the game (`lib/net/protocol.ts`) and the server.
//!
//! Everything a socket carries is one JSON object tagged by `t`. The client
//! sends **commands** (what a player wants); the server answers with **events**
//! (what happened), each numbered by the room's sequence (`seq`) so a client
//! can tell when it missed one and ask for a fresh snapshot (`sync`).
//! Field names are short and camelCase-free on purpose: the TypeScript mirror
//! uses the same spelling.

use serde::{Deserialize, Serialize};

/// Bumped when a message changes shape; the client sends it in `hello`.
pub const PROTOCOL_VERSION: u32 = 3;

/// The eight headings of the painted walk sheets (`lib/characters/walk8.ts`).
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize, Default)]
pub enum Dir8 {
    N,
    NE,
    E,
    SE,
    #[default]
    S,
    SW,
    W,
    NW,
}

/// The heroes a player may walk as (`PLAYER_BODIES`).
pub const BODIES: [&str; 2] = ["m1", "f1"];

/// A player as everyone in the room sees them.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Presence {
    /// The account's username (unique).
    pub id: String,
    /// The hero's name, shown over their head.
    pub name: String,
    /// The hero's body sheet: `m1` or `f1`.
    pub body: String,
    pub x: f32,
    pub y: f32,
    pub dir: Dir8,
    pub moving: bool,
    /// Server time (ms) of the last accepted update.
    pub at: f64,
    /// The outfit worn (protocol 3; `lib/world/data/outfits.ts`).
    #[serde(default = "default_outfit")]
    pub outfit: String,
    /// The equipment id of the weapon carried on the body, if shown.
    #[serde(default)]
    pub weapon: Option<String>,
}

/// The outfit of a player who never said otherwise.
pub fn default_outfit() -> String {
    "default".into()
}

/// Client → server.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(tag = "t", rename_all = "snake_case")]
pub enum ClientMsg {
    /// The first message on a socket: who walks in, and where.
    Hello {
        v: u32,
        name: String,
        body: String,
        x: f32,
        y: f32,
        dir: Dir8,
        #[serde(default = "default_outfit")]
        outfit: String,
        #[serde(default)]
        weapon: Option<String>,
    },
    /// The hero's position and heading (sent ~10 times a second while walking).
    Move { x: f32, y: f32, dir: Dir8, moving: bool },
    /// Ask for the room's current snapshot (after a gap in `seq`).
    Sync,
    /// Keep-alive; answered with `pong`.
    Ping { at: f64 },
    /// A line of map chat, for everyone on this map (protocol 2).
    Say { text: String },
    /// The player's look changed: the outfit worn, the weapon carried (protocol 3).
    Look { outfit: String, weapon: Option<String> },
}

/// Something that happened in a room. Applied in `seq` order by every client.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(tag = "t", rename_all = "snake_case")]
pub enum RoomEvent {
    Joined { player: Presence },
    Moved { id: String, x: f32, y: f32, dir: Dir8, moving: bool, at: f64 },
    Left { id: String, reason: LeaveReason },
    /// A player said something on this map (`name` as they stand there).
    Said { id: String, name: String, text: String, at: f64 },
    /// A player changed their look.
    Looked { id: String, outfit: String, weapon: Option<String>, at: f64 },
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum LeaveReason {
    /// The socket closed (left the map, closed the tab, lost the connection).
    Closed,
    /// The same account joined again elsewhere; the older socket is dropped.
    Replaced,
}

/// Server → client.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(tag = "t", rename_all = "snake_case")]
pub enum ServerMsg {
    /// The answer to `hello` (and `sync`): the room as it stands at `seq`.
    Welcome {
        you: String,
        room: String,
        /// Changes when the room's server instance restarts: `seq` starts over.
        epoch: String,
        seq: u64,
        players: Vec<Presence>,
    },
    /// One event, in order.
    Event { seq: u64, ev: RoomEvent },
    Pong { at: f64, server: f64 },
    /// A command was refused (the socket stays open unless the code says so).
    Error { code: ErrorCode, message: String },
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ErrorCode {
    BadMessage,
    BadVersion,
    NotJoined,
    AlreadyJoined,
    BadProfile,
    TooFast,
    RoomFull,
    Replaced,
    /// A chat line that is empty, too long or unprintable.
    BadText,
}

impl ClientMsg {
    pub fn parse(text: &str) -> Result<ClientMsg, ServerMsg> {
        serde_json::from_str(text).map_err(|error| ServerMsg::Error {
            code: ErrorCode::BadMessage,
            message: format!("unreadable message: {error}"),
        })
    }
}

impl ServerMsg {
    pub fn to_json(&self) -> String {
        serde_json::to_string(self).expect("server messages always serialize")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn messages_use_the_wire_spelling() {
        let hello = ClientMsg::parse(r#"{"t":"hello","v":1,"name":"ลี่","body":"f1","x":10,"y":20,"dir":"NE"}"#).unwrap();
        assert_eq!(
            hello,
            ClientMsg::Hello { v: 1, name: "ลี่".into(), body: "f1".into(), x: 10.0, y: 20.0, dir: Dir8::NE, outfit: "default".into(), weapon: None },
            "an older hello wears the default look"
        );
        let dressed = ClientMsg::parse(r#"{"t":"hello","v":3,"name":"ลี่","body":"f1","x":1,"y":2,"dir":"S","outfit":"sect_emei","weapon":"eq_t1_w_long"}"#).unwrap();
        assert!(matches!(dressed, ClientMsg::Hello { outfit, weapon: Some(w), .. } if outfit == "sect_emei" && w == "eq_t1_w_long"));
        assert_eq!(
            ClientMsg::parse(r#"{"t":"look","outfit":"tailor_ink","weapon":null}"#).unwrap(),
            ClientMsg::Look { outfit: "tailor_ink".into(), weapon: None }
        );
        let looked = ServerMsg::Event { seq: 5, ev: RoomEvent::Looked { id: "a".into(), outfit: "x".into(), weapon: Some("W1".into()), at: 1.0 } };
        assert_eq!(looked.to_json(), r#"{"t":"event","seq":5,"ev":{"t":"looked","id":"a","outfit":"x","weapon":"W1","at":1.0}}"#);
        assert_eq!(ClientMsg::parse(r#"{"t":"sync"}"#).unwrap(), ClientMsg::Sync);
        let event = ServerMsg::Event { seq: 3, ev: RoomEvent::Left { id: "a".into(), reason: LeaveReason::Replaced } };
        assert_eq!(event.to_json(), r#"{"t":"event","seq":3,"ev":{"t":"left","id":"a","reason":"replaced"}}"#);
        assert_eq!(ClientMsg::parse(r#"{"t":"say","text":"สวัสดี"}"#).unwrap(), ClientMsg::Say { text: "สวัสดี".into() });
        let said = ServerMsg::Event { seq: 4, ev: RoomEvent::Said { id: "a".into(), name: "ลี่".into(), text: "hi".into(), at: 5.0 } };
        assert_eq!(said.to_json(), r#"{"t":"event","seq":4,"ev":{"t":"said","id":"a","name":"ลี่","text":"hi","at":5.0}}"#);
    }

    #[test]
    fn unreadable_messages_become_bad_message_errors() {
        match ClientMsg::parse("{\"t\":\"fly\"}") {
            Err(ServerMsg::Error { code: ErrorCode::BadMessage, .. }) => {}
            other => panic!("expected bad_message, got {other:?}"),
        }
    }
}
