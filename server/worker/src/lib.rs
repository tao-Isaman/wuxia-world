//! The wuxia game server on Cloudflare Workers (docs/online.md).
//!
//! HTTP:
//! - `GET  /health`                      → `{ ok, protocol }`
//! - `POST /auth/register` `{ username, password }` → `{ username, token }`
//! - `POST /auth/login`    `{ username, password }` → `{ username, token }`
//! - `GET  /rooms/<room>/ws?token=…`     → a WebSocket into that map's room
//!
//! Durable Objects: [`account::AccountObject`] (one per username) keeps the
//! account's event log; [`room::RoomObject`] (one per map id) runs the
//! realtime room. The game logic itself lives in `wuxia-core`.

use serde::{Deserialize, Serialize};
use worker::*;
use wuxia_core::auth::{normalize_username, sign_token, verify_token, AuthError, Claims, TOKEN_TTL_MS};
use wuxia_core::protocol::PROTOCOL_VERSION;

mod account;
mod room;

pub use account::AccountObject;
pub use room::RoomObject;

/// Room ids are the game's location and road ids (`city_capital`, `route_a__to__b`).
fn valid_room(id: &str) -> bool {
    (1..=96).contains(&id.len()) && id.bytes().all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'_')
}

pub(crate) fn now_ms() -> f64 {
    Date::now().as_millis() as f64
}

/// The token-signing secret, or the error code that says what is wrong with
/// it (`auth_secret_missing`, `auth_secret_short`) — `/health` reports it too.
fn secret(env: &Env) -> std::result::Result<Vec<u8>, &'static str> {
    let value = env
        .secret("AUTH_SECRET")
        .map(|s| s.to_string())
        .or_else(|_| env.var("AUTH_SECRET").map(|v| v.to_string()))
        .map_err(|_| "auth_secret_missing")?;
    if value.trim().len() < 16 {
        return Err("auth_secret_short");
    }
    Ok(value.into_bytes())
}

fn cors_headers() -> Headers {
    let headers = Headers::new();
    let _ = headers.set("Access-Control-Allow-Origin", "*");
    let _ = headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    let _ = headers.set("Access-Control-Allow-Headers", "content-type");
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
    /// `ready`, or why sign-in cannot work yet (`auth_secret_missing` / `auth_secret_short`).
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
    let key = match secret(env) {
        Ok(key) => key,
        Err(code) => return api_error(code, 500),
    };
    let expires = now_ms() + TOKEN_TTL_MS;
    let token = sign_token(&Claims { sub: username.clone(), exp: expires }, &key);
    json(&Session { username, token, expires }, 200)
}

/// Check the token, then hand the WebSocket upgrade to the room's Durable Object.
async fn join_room(req: Request, env: &Env, room: &str) -> Result<Response> {
    if !valid_room(room) {
        return api_error("bad_room", 400);
    }
    if req.headers().get("Upgrade")?.map(|v| v.to_ascii_lowercase()) != Some("websocket".into()) {
        return api_error("expected_websocket", 426);
    }
    let url = req.url()?;
    let token = url.query_pairs().find(|(k, _)| k == "token").map(|(_, v)| v.into_owned()).unwrap_or_default();
    let key = match secret(env) {
        Ok(key) => key,
        Err(code) => return api_error(code, 500),
    };
    let claims = match verify_token(&token, &key, now_ms()) {
        Ok(claims) => claims,
        Err(error) => return auth_error(error),
    };
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
        (Method::Get, ["health"]) | (Method::Get, [""]) => json(&Health { ok: true, protocol: PROTOCOL_VERSION, auth: secret(&env).map(|_| "ready").unwrap_or_else(|code| code) }, 200),
        (Method::Post, ["auth", "register"]) => auth(req, &env, "register").await,
        (Method::Post, ["auth", "login"]) => auth(req, &env, "login").await,
        (Method::Get, ["rooms", room, "ws"]) => {
            let room = room.to_string();
            join_room(req, &env, &room).await
        }
        _ => api_error("not_found", 404),
    }
}
