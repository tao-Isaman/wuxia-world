//! One Durable Object per map: the realtime room.
//!
//! Sockets use the hibernation API: the object may be evicted from memory
//! while sockets stay open. So the durable truth of who stands where is each
//! socket's **attachment** (its player's `Presence`); the in-memory [`Room`]
//! is a cache rebuilt from the attachments after a wake-up, and `seq` restarts
//! under a fresh `epoch` (clients then resync from a snapshot).
//!
//! Every message runs the same loop: parse → `Room::decide` → number the
//! events → `Room::apply` + update attachments → broadcast.

use std::cell::RefCell;

use serde::{Deserialize, Serialize};
use worker::*;
use wuxia_core::protocol::{ClientMsg, ErrorCode, LeaveReason, Presence, RoomEvent, ServerMsg, PROTOCOL_VERSION};
use wuxia_core::room::{Command, Rejection, Room};

use crate::{api_error, now_ms};

/// What a socket remembers across hibernation.
#[derive(Clone, Debug, Serialize, Deserialize)]
struct Conn {
    user: String,
    room: String,
    /// Set once `hello` was accepted; cleared when replaced by a newer socket.
    joined: Option<Presence>,
}

struct Live {
    epoch: String,
    seq: u64,
    /// `None` until rebuilt from the sockets' attachments.
    room: Option<Room>,
}

#[durable_object]
pub struct RoomObject {
    state: State,
    #[allow(dead_code)]
    env: Env,
    live: RefCell<Live>,
}

fn epoch() -> String {
    let mut bytes = [0u8; 6];
    let _ = getrandom::getrandom(&mut bytes);
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

fn conn_of(ws: &WebSocket) -> Option<Conn> {
    ws.deserialize_attachment::<Conn>().ok().flatten()
}

fn send(ws: &WebSocket, message: &ServerMsg) {
    let _ = ws.send_with_str(message.to_json());
}

fn reject(ws: &WebSocket, rejection: Rejection) {
    send(ws, &ServerMsg::Error { code: rejection.code, message: rejection.message });
}

impl RoomObject {
    /// Run `f` on the room, rebuilding it from the attachments first if needed.
    fn with_room<T>(&self, f: impl FnOnce(&mut Live) -> T) -> T {
        let mut live = self.live.borrow_mut();
        if live.room.is_none() {
            let sockets = self.state.get_websockets();
            live.room = Some(Room::from_players(sockets.iter().filter_map(conn_of).filter_map(|conn| conn.joined)));
        }
        f(&mut live)
    }

    /// decide → number → apply → remember → broadcast. Returns the events' last `seq`.
    fn run(&self, command: Command, origin: &WebSocket) -> std::result::Result<Vec<RoomEvent>, Rejection> {
        let now = now_ms();
        let (events, numbered) = self.with_room(|live| {
            let room = live.room.as_mut().expect("rebuilt");
            let events = room.decide(&command, now)?;
            let mut numbered = Vec::with_capacity(events.len());
            for event in &events {
                room.apply(event);
                live.seq += 1;
                numbered.push(ServerMsg::Event { seq: live.seq, ev: event.clone() });
            }
            Ok::<_, Rejection>((events, numbered))
        })?;
        // Keep each socket's attachment in step with the events.
        for event in &events {
            match event {
                RoomEvent::Joined { player } => {
                    if let Some(mut conn) = conn_of(origin) {
                        conn.joined = Some(player.clone());
                        let _ = origin.serialize_attachment(&conn);
                    }
                }
                RoomEvent::Moved { .. } => {
                    if let Some(mut conn) = conn_of(origin) {
                        let id = conn.user.clone();
                        conn.joined = self.with_room(|live| live.room.as_ref().and_then(|r| r.player(&id).cloned()));
                        let _ = origin.serialize_attachment(&conn);
                    }
                }
                RoomEvent::Left { id, reason: LeaveReason::Replaced } => {
                    // The older socket of this account: forget it first, so its close changes nothing.
                    for ws in self.state.get_websockets() {
                        if same_socket(&ws, origin) {
                            continue;
                        }
                        if let Some(mut conn) = conn_of(&ws) {
                            if conn.user == *id && conn.joined.is_some() {
                                conn.joined = None;
                                let _ = ws.serialize_attachment(&conn);
                                send(&ws, &ServerMsg::Error { code: ErrorCode::Replaced, message: "signed in somewhere else".into() });
                                let _ = ws.close(Some(4001), Some("replaced"));
                            }
                        }
                    }
                }
                RoomEvent::Left { .. } => {}
            }
        }
        // Everyone joined hears every event, in order (the joiner gets a welcome instead).
        let joining = matches!(command, Command::Join { .. });
        for ws in self.state.get_websockets() {
            let Some(conn) = conn_of(&ws) else { continue };
            if conn.joined.is_none() || (joining && same_socket(&ws, origin)) {
                continue;
            }
            for message in &numbered {
                send(&ws, message);
            }
        }
        Ok(events)
    }

    fn welcome(&self, ws: &WebSocket, conn: &Conn) {
        let message = self.with_room(|live| ServerMsg::Welcome {
            you: conn.user.clone(),
            room: conn.room.clone(),
            epoch: live.epoch.clone(),
            seq: live.seq,
            players: live.room.as_ref().map(Room::snapshot).unwrap_or_default(),
        });
        send(ws, &message);
    }

    fn leave(&self, ws: &WebSocket) {
        let Some(conn) = conn_of(ws) else { return };
        if conn.joined.is_none() {
            return;
        }
        let mut cleared = conn.clone();
        cleared.joined = None;
        let _ = ws.serialize_attachment(&cleared);
        let _ = self.run(Command::Leave { id: conn.user, reason: LeaveReason::Closed }, ws);
    }
}

/// Two handles to the same socket (attachments compare by value, sockets by identity).
fn same_socket(a: &WebSocket, b: &WebSocket) -> bool {
    let a: &wasm_bindgen::JsValue = a.as_ref();
    let b: &wasm_bindgen::JsValue = b.as_ref();
    a == b
}

impl DurableObject for RoomObject {
    fn new(state: State, env: Env) -> Self {
        Self { state, env, live: RefCell::new(Live { epoch: epoch(), seq: 0, room: None }) }
    }

    async fn fetch(&self, req: Request) -> Result<Response> {
        let url = req.url()?;
        let param = |name: &str| url.query_pairs().find(|(k, _)| k == name).map(|(_, v)| v.into_owned());
        let (Some(room), Some(user)) = (param("room"), param("user")) else {
            return api_error("bad_request", 400);
        };
        let pair = WebSocketPair::new()?;
        let server = pair.server;
        self.state.accept_web_socket(&server);
        server.serialize_attachment(&Conn { user, room, joined: None })?;
        Response::from_websocket(pair.client)
    }

    async fn websocket_message(&self, ws: WebSocket, message: WebSocketIncomingMessage) -> Result<()> {
        let WebSocketIncomingMessage::String(text) = message else {
            reject(&ws, Rejection { code: ErrorCode::BadMessage, message: "text frames only".into() });
            return Ok(());
        };
        let Some(conn) = conn_of(&ws) else { return Ok(()) };
        let message = match ClientMsg::parse(&text) {
            Ok(message) => message,
            Err(error) => {
                send(&ws, &error);
                return Ok(());
            }
        };
        match message {
            ClientMsg::Hello { v, name, body, x, y, dir } => {
                if v != PROTOCOL_VERSION {
                    reject(&ws, Rejection { code: ErrorCode::BadVersion, message: format!("server speaks protocol {PROTOCOL_VERSION}") });
                    let _ = ws.close(Some(4002), Some("bad version"));
                    return Ok(());
                }
                if conn.joined.is_some() {
                    reject(&ws, Rejection { code: ErrorCode::AlreadyJoined, message: "already in this room".into() });
                    return Ok(());
                }
                match self.run(Command::Join { id: conn.user.clone(), name, body, x, y, dir }, &ws) {
                    Ok(_) => self.welcome(&ws, &conn),
                    Err(rejection) => reject(&ws, rejection),
                }
            }
            ClientMsg::Move { x, y, dir, moving } => {
                if conn.joined.is_none() {
                    reject(&ws, Rejection { code: ErrorCode::NotJoined, message: "say hello first".into() });
                    return Ok(());
                }
                if let Err(rejection) = self.run(Command::Move { id: conn.user.clone(), x, y, dir, moving }, &ws) {
                    reject(&ws, rejection);
                }
            }
            ClientMsg::Sync => self.welcome(&ws, &conn),
            ClientMsg::Ping { at } => send(&ws, &ServerMsg::Pong { at, server: now_ms() }),
        }
        Ok(())
    }

    async fn websocket_close(&self, ws: WebSocket, _code: usize, _reason: String, _was_clean: bool) -> Result<()> {
        self.leave(&ws);
        Ok(())
    }

    async fn websocket_error(&self, ws: WebSocket, _error: Error) -> Result<()> {
        self.leave(&ws);
        Ok(())
    }
}
