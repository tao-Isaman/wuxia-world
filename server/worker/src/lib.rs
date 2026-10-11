//! The wuxia game server on Cloudflare Workers (docs/online.md).
//!
//! HTTP:
//! - `GET  /health`                      → `{ ok, protocol }`
//! - `POST /auth/register` `{ username, password }` → `{ username, token }`
//! - `POST /auth/login`    `{ username, password }` → `{ username, token }`
//! - `GET  /auth/me?token=…`            → `{ username, expires }`, or 401 for a token that no longer works
//! - `GET  /rooms/<room>/ws?token=…`     → a WebSocket into that map's room
//!
//! Characters and saves (`Authorization: Bearer <token>`; docs/online.md):
//! - `GET    /characters`                 → `{ characters }`
//! - `POST   /characters` `{ name, gender }` → the new character
//! - `DELETE /characters/<id>`           → `{ deleted }`
//! - `GET    /characters/<id>/save`      → `{ rev, save }` (`save` is `null` before the first)
//! - `PUT    /characters/<id>/save` `{ rev, version, state }` → `{ rev, summary }`, checked by `wuxia_core::save`
//! - `GET    /world` · `PUT /world` `{ world }` → the account's shared world (`{ rev, world }` · `{ rev }`)
//!
//! Durable Objects: [`account::AccountObject`] (one per username) keeps the
//! account's event log; [`room::RoomObject`] (one per map id) runs the
//! realtime room; [`keys::KeyObject`] makes and keeps the token-signing key
//! (no secret to configure). The game logic itself lives in `wuxia-core`.

use serde::{Deserialize, Serialize};
use worker::*;
use wuxia_core::auth::{normalize_username, sign_token, verify_token, AuthError, Claims, TOKEN_TTL_MS};
use wuxia_core::protocol::PROTOCOL_VERSION;

mod account;
mod keys;
mod room;

pub use account::AccountObject;
pub use keys::KeyObject;
pub use room::RoomObject;
use keys::signing_key;

/// Room ids are the game's location and road ids (`city_capital`, `route_a__to__b`).
fn valid_room(id: &str) -> bool {
    (1..=96).contains(&id.len()) && id.bytes().all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'_')
}

pub(crate) fn now_ms() -> f64 {
    Date::now().as_millis() as f64
}

fn cors_headers() -> Headers {
    let headers = Headers::new();
    let _ = headers.set("Access-Control-Allow-Origin", "*");
    let _ = headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    let _ = headers.set("Access-Control-Allow-Headers", "content-type, authorization");
    let _ = headers.set("Access-Control-Max-Age", "86400");
    headers
}

fn json<T: Serialize>(value: &T, status: u16) -> Result<Response> {
    let response = Response::from_json(value)?.with_status(status);
    let headers = cors_headers();
    let _ = headers.set("content-type", "application/json");
    Ok(response.with_headers(headers))
}

#[derive(Serialize)]
struct ApiError<'a> {
    error: &'a str,
}

pub(crate) fn api_error(code: &str, status: u16) -> Result<Response> {
    json(&ApiError { error: code }, status)
}

fn auth_error(error: AuthError) -> Result<Response> {
    api_error(error.code(), error.status())
}

#[derive(Deserialize, Serialize)]
pub(crate) struct Credentials {
    pub username: String,
    pub password: String,
}

#[derive(Deserialize, Serialize)]
pub(crate) struct AccountReply {
    pub username: Option<String>,
    pub error: Option<String>,
}

#[derive(Serialize)]
struct Session {
    username: String,
    token: String,
    expires: f64,
}

#[derive(Serialize)]
struct Health {
    ok: bool,
    protocol: u32,
    /// `ready`, or `auth_key_unavailable` when the signing key cannot be read.
    auth: &'static str,
}

/// Register or log in through the account's Durable Object, then sign a session.
async fn auth(mut req: Request, env: &Env, action: &str) -> Result<Response> {
    let Ok(credentials) = req.json::<Credentials>().await else {
        return api_error("bad_request", 400);
    };
    let username = match normalize_username(&credentials.username) {
        Ok(name) => name,
        Err(error) => return auth_error(error),
    };
    let stub = env.durable_object("ACCOUNTS")?.id_from_name(&username)?.get_stub()?;
    let mut init = RequestInit::new();
    init.with_method(Method::Post)
        .with_body(Some(serde_json::to_string(&Credentials { username: username.clone(), password: credentials.password })?.into()));
    let mut reply = stub.fetch_with_request(Request::new_with_init(&format!("https://account/{action}"), &init)?).await?;
    let status = reply.status_code();
    let body: AccountReply = reply.json().await?;
    if status != 200 {
        return api_error(body.error.as_deref().unwrap_or("server_error"), status);
    }
    let key = match signing_key(env).await {
        Ok(key) => key,
        Err(code) => return api_error(code, 500),
    };
    let expires = now_ms() + TOKEN_TTL_MS;
    let token = sign_token(&Claims { sub: username.clone(), exp: expires }, &key);
    json(&Session { username, token, expires }, 200)
}

#[derive(Serialize)]
struct Me {
    username: String,
    expires: f64,
}

/// The token's account, so a client can drop a saved token the server no longer accepts.
async fn me(req: Request, env: &Env) -> Result<Response> {
    let url = req.url()?;
    let token = url.query_pairs().find(|(k, _)| k == "token").map(|(_, v)| v.into_owned()).unwrap_or_default();
    let key = match signing_key(env).await {
        Ok(key) => key,
        Err(code) => return api_error(code, 500),
    };
    match verify_token(&token, &key, now_ms()) {
        Ok(claims) => json(&Me { username: claims.sub, expires: claims.exp }, 200),
        Err(error) => auth_error(error),
    }
}

/// The session token: `Authorization: Bearer <token>`, else `?token=`.
fn token_of(req: &Request) -> String {
    if let Ok(Some(header)) = req.headers().get("Authorization") {
        if let Some(token) = header.strip_prefix("Bearer ") {
            return token.trim().to_string();
        }
    }
    req.url().ok().and_then(|url| url.query_pairs().find(|(k, _)| k == "token").map(|(_, v)| v.into_owned())).unwrap_or_default()
}

/// A characters / saves / world call: check the token, then hand the request
/// to the account's Durable Object and answer with its reply (plus CORS).
async fn account_call(mut req: Request, env: &Env, path: &str) -> Result<Response> {
    let key = match signing_key(env).await {
        Ok(key) => key,
        Err(code) => return api_error(code, 500),
    };
    let claims = match verify_token(&token_of(&req), &key, now_ms()) {
        Ok(claims) => claims,
        Err(error) => return auth_error(error),
    };
    let mut init = RequestInit::new();
    init.with_method(req.method());
    if matches!(req.method(), Method::Post | Method::Put) {
        init.with_body(Some(req.text().await?.into()));
    }
    let stub = env.durable_object("ACCOUNTS")?.id_from_name(&claims.sub)?.get_stub()?;
    let mut reply = stub.fetch_with_request(Request::new_with_init(&format!("https://account{path}"), &init)?).await?;
    let status = reply.status_code();
    let text = reply.text().await?;
    let headers = cors_headers();
    let _ = headers.set("content-type", "application/json");
    Ok(Response::ok(text)?.with_status(status).with_headers(headers))
}

/// Check the token, then hand the WebSocket upgrade to the room's Durable Object.
async fn join_room(req: Request, env: &Env, room: &str) -> Result<Response> {
    if !valid_room(room) {
        return api_error("bad_room", 400);
    }
    let url = req.url()?;
    let token = url.query_pairs().find(|(k, _)| k == "token").map(|(_, v)| v.into_owned()).unwrap_or_default();
    let key = match signing_key(env).await {
        Ok(key) => key,
        Err(code) => return api_error(code, 500),
    };
    let claims = match verify_token(&token, &key, now_ms()) {
        Ok(claims) => claims,
        Err(error) => return auth_error(error),
    };
    if req.headers().get("Upgrade")?.map(|v| v.to_ascii_lowercase()) != Some("websocket".into()) {
        return api_error("expected_websocket", 426);
    }
    let mut init = RequestInit::new();
    init.with_method(Method::Get).with_headers(req.headers().clone());
    let forward = Request::new_with_init(&format!("https://room/ws?room={room}&user={}", claims.sub), &init)?;
    env.durable_object("ROOMS")?.id_from_name(room)?.get_stub()?.fetch_with_request(forward).await
}

#[event(fetch)]
async fn fetch(req: Request, env: Env, _ctx: Context) -> Result<Response> {
    let path = req.path();
    let segments: Vec<&str> = path.trim_matches('/').split('/').collect();
    match (req.method(), segments.as_slice()) {
        (Method::Options, _) => Ok(Response::empty()?.with_status(204).with_headers(cors_headers())),
        (Method::Get, ["health"]) | (Method::Get, [""]) => json(&Health { ok: true, protocol: PROTOCOL_VERSION, auth: signing_key(&env).await.map(|_| "ready").unwrap_or_else(|code| code) }, 200),
        (Method::Post, ["auth", "register"]) => auth(req, &env, "register").await,
        (Method::Post, ["auth", "login"]) => auth(req, &env, "login").await,
        (Method::Get, ["auth", "me"]) => me(req, &env).await,
        (Method::Get, ["characters"]) | (Method::Post, ["characters"]) | (Method::Get, ["world"]) | (Method::Put, ["world"]) => {
            account_call(req, &env, &path).await
        }
        (Method::Delete, ["characters", _]) | (Method::Get, ["characters", _, "save"]) | (Method::Put, ["characters", _, "save"]) => {
            account_call(req, &env, &path).await
        }
        (Method::Get, ["rooms", room, "ws"]) => {
            let room = room.to_string();
            join_room(req, &env, &room).await
        }
        _ => api_error("not_found", 404),
    }
}
