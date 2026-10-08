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
pub const PROTOCOL_VERSION: u32 = 1;

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
}

/// Client → server.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(tag = "t", rename_all = "snake_case")]
pub enum ClientMsg {
    /// The first message on a socket: who walks in, and where.
    Hello { v: u32, name: String, body: String, x: f32, y: f32, dir: Dir8 },
    /// The hero's position and heading (sent ~10 times a second while walking).
    Move { x: f32, y: f32, dir: Dir8, moving: bool },
    /// Ask for the room's current snapshot (after a gap in `seq`).
    Sync,
    /// Keep-alive; answered with `pong`.
    Ping { at: f64 },
}

/// Something that happened in a room. Applied in `seq` order by every client.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(tag = "t", rename_all = "snake_case")]
pub enum RoomEvent {
    Joined { player: Presence },
    Moved { id: String, x: f32, y: f32, dir: Dir8, moving: bool, at: f64 },
    Left { id: String, reason: LeaveReason },
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
        assert_eq!(hello, ClientMsg::Hello { v: 1, name: "ลี่".into(), body: "f1".into(), x: 10.0, y: 20.0, dir: Dir8::NE });
        assert_eq!(ClientMsg::parse(r#"{"t":"sync"}"#).unwrap(), ClientMsg::Sync);
        let event = ServerMsg::Event { seq: 3, ev: RoomEvent::Left { id: "a".into(), reason: LeaveReason::Replaced } };
        assert_eq!(event.to_json(), r#"{"t":"event","seq":3,"ev":{"t":"left","id":"a","reason":"replaced"}}"#);
    }

    #[test]
    fn unreadable_messages_become_bad_message_errors() {
        match ClientMsg::parse("{\"t\":\"fly\"}") {
            Err(ServerMsg::Error { code: ErrorCode::BadMessage, .. }) => {}
            other => panic!("expected bad_message, got {other:?}"),
        }
    }
}
