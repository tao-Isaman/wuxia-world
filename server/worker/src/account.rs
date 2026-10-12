//! One Durable Object per username: the account's event log (only
//! `registered` so far), its characters and their saves. A Durable Object runs
//! one request at a time, so two sign-ups for the same name can never both
//! win, and two saves of one character never race.
//!
//! Storage keys: `events` (the account), `roster` (its characters,
//! `wuxia_core::save::Roster`), `save:<id>` (a character's last accepted save,
//! raw JSON `{ version, state }`). The worker (`lib.rs`) checks the session
//! token before it calls any path but `/register` and `/login`. `/grant`
//! (BattleObject: a checked win's gold; PlayerHub: a mail parcel's gold),
//! `/save-debit` (PlayerHub: the save that pays for a parcel) and `/exists`
//! are called only by the TypeScript half, never routed from outside.

use serde::Deserialize;
use serde_json::{json, Value};
use worker::*;
use wuxia_core::auth::{Account, AccountEvent, AuthError, SALT_BYTES};
use wuxia_core::save::{accept, check_debit, check_save, Character, Debit, Roster, SaveError, SaveUpload};

use crate::{now_ms, AccountReply, Credentials};

const EVENTS_KEY: &str = "events";
const ROSTER_KEY: &str = "roster";
/// PBKDF2 rounds for new accounts (env `PBKDF2_ITERATIONS`); stored per account.
const DEFAULT_ITERATIONS: u32 = 10_000;

#[durable_object]
pub struct AccountObject {
    state: State,
    env: Env,
}

fn reply(username: Option<String>, error: Option<&str>, status: u16) -> Result<Response> {
    Ok(Response::from_json(&AccountReply { username, error: error.map(str::to_string) })?.with_status(status))
}

fn failed(error: AuthError) -> Result<Response> {
    reply(None, Some(error.code()), error.status())
}

fn refused(error: SaveError) -> Result<Response> {
    Ok(Response::from_json(&json!({ "error": error.code(), "detail": error.detail() }))?.with_status(error.status()))
}

fn json_text(text: String) -> Result<Response> {
    let headers = Headers::new();
    let _ = headers.set("content-type", "application/json");
    Ok(Response::ok(text)?.with_headers(headers))
}

/// What the client sees of a character (no allowance bookkeeping).
fn view(c: &Character) -> Value {
    json!({ "id": c.id, "name": c.name, "gender": c.gender, "body": c.body, "created": c.created,
        "updated": c.updated, "rev": c.rev, "summary": c.summary })
}

/// Write two keys in one storage call, so they change together. (A plain JS
/// object: `put_multiple` on a serde map would hand storage a JS `Map`, which
/// it reads as an object with no keys and silently stores nothing.)
async fn put_two(storage: &Storage, a: (&str, wasm_bindgen::JsValue), b: (&str, wasm_bindgen::JsValue)) -> Result<()> {
    let object = js_sys::Object::new();
    for (key, value) in [a, b] {
        js_sys::Reflect::set(&object, &wasm_bindgen::JsValue::from_str(key), &value)?;
    }
    storage.put_multiple_raw(object).await
}

/// The roster as storage keeps it (what `storage.get::<Roster>` reads back).
fn roster_value(roster: &Roster) -> Result<wasm_bindgen::JsValue> {
    Ok(serde_wasm_bindgen::to_value(roster)?)
}

fn new_id() -> Result<String> {
    let mut bytes = [0u8; 8];
    getrandom::getrandom(&mut bytes).map_err(|e| Error::RustError(e.to_string()))?;
    Ok(bytes.iter().map(|b| format!("{b:02x}")).collect())
}

#[derive(Deserialize)]
struct NewCharacter {
    name: String,
    gender: String,
}

#[derive(Deserialize)]
struct Grant {
    gold: f64,
}

/// A save that pays for a parcel (`/save-debit`): the save, and what leaves the bag.
#[derive(Deserialize)]
struct DebitUpload {
    #[serde(flatten)]
    upload: SaveUpload,
    debit: Debit,
}

impl AccountObject {
    async fn roster(&self) -> Result<Roster> {
        Ok(self.state.storage().get(ROSTER_KEY).await?.unwrap_or_default())
    }

    async fn auth(&self, mut req: Request, action: &str) -> Result<Response> {
        let credentials: Credentials = req.json().await?;
        let storage = self.state.storage();
        let mut events: Vec<AccountEvent> = storage.get(EVENTS_KEY).await?.unwrap_or_default();
        let account = Account::from_events(&events);
        match action {
            "register" => {
                let mut salt = [0u8; SALT_BYTES];
                getrandom::getrandom(&mut salt).map_err(|e| Error::RustError(e.to_string()))?;
                let iterations = self
                    .env
                    .var("PBKDF2_ITERATIONS")
                    .ok()
                    .and_then(|v| v.to_string().parse().ok())
                    .unwrap_or(DEFAULT_ITERATIONS);
                match account.register(&credentials.username, &credentials.password, &salt, iterations, now_ms()) {
                    Ok(event) => {
                        events.push(event);
                        storage.put(EVENTS_KEY, &events).await?;
                        reply(Account::from_events(&events).username, None, 200)
                    }
                    Err(error) => failed(error),
                }
            }
            _ => match account.login(&credentials.password) {
                Ok(username) => reply(Some(username.to_string()), None, 200),
                Err(error) => failed(error),
            },
        }
    }

    async fn list(&self) -> Result<Response> {
        let roster = self.roster().await?;
        Response::from_json(&json!({ "characters": roster.characters.iter().map(view).collect::<Vec<_>>() }))
    }

    async fn create(&self, mut req: Request) -> Result<Response> {
        let Ok(body) = req.json::<NewCharacter>().await else { return refused(SaveError::BadName) };
        let mut roster = self.roster().await?;
        let character = match roster.create(new_id()?, &body.name, &body.gender, now_ms()) {
            Ok(c) => view(c),
            Err(error) => return refused(error),
        };
        self.state.storage().put(ROSTER_KEY, &roster).await?;
        Response::from_json(&character)
    }

    async fn delete(&self, id: &str) -> Result<Response> {
        let mut roster = self.roster().await?;
        if let Err(error) = roster.delete(id) {
            return refused(error);
        }
        let storage = self.state.storage();
        storage.put(ROSTER_KEY, &roster).await?;
        storage.delete(&format!("save:{id}")).await?;
        Response::from_json(&json!({ "deleted": id }))
    }

    async fn load(&self, id: &str) -> Result<Response> {
        let roster = self.roster().await?;
        let Some(character) = roster.get(id) else { return refused(SaveError::NoCharacter) };
        let raw: Option<String> = self.state.storage().get(&format!("save:{id}")).await?;
        json_text(format!(r#"{{"rev":{},"save":{}}}"#, character.rev, raw.as_deref().unwrap_or("null")))
    }

    async fn store(&self, mut req: Request, id: &str) -> Result<Response> {
        let text = req.text().await?;
        if text.len() > wuxia_core::save::MAX_SAVE_BYTES {
            return refused(SaveError::TooLarge);
        }
        let Ok(upload) = serde_json::from_str::<SaveUpload>(&text) else { return refused(SaveError::BadSave("json")) };
        self.keep(id, upload, None, text.len()).await
    }

    /// A save that pays for a mail parcel (internal: the TypeScript half's
    /// PlayerHub). Kept only if the last accepted save held the parcel and this
    /// one shows it gone (`check_debit`), so a parcel cannot be sent and kept.
    async fn store_debit(&self, mut req: Request, id: &str) -> Result<Response> {
        let text = req.text().await?;
        if text.len() > wuxia_core::save::MAX_SAVE_BYTES + 10_000 {
            return refused(SaveError::TooLarge);
        }
        let Ok(body) = serde_json::from_str::<DebitUpload>(&text) else { return refused(SaveError::BadSave("json")) };
        self.keep(id, body.upload, Some(body.debit), text.len()).await
    }

    async fn keep(&self, id: &str, upload: SaveUpload, debit: Option<Debit>, bytes: usize) -> Result<Response> {
        let mut roster = self.roster().await?;
        let Some(character) = roster.get_mut(id) else { return refused(SaveError::NoCharacter) };
        let now = now_ms();
        let accepted = match check_save(character, &upload, bytes, now) {
            Ok(accepted) => accepted,
            Err(error) => return refused(error),
        };
        let key = format!("save:{id}");
        if let Some(debit) = &debit {
            let raw: Option<String> = self.state.storage().get(&key).await?;
            let before = raw.and_then(|text| serde_json::from_str::<Value>(&text).ok()).and_then(|v| v.get("state").cloned()).unwrap_or(Value::Null);
            if let Err(error) = check_debit(&before, &upload.state, debit) {
                return refused(error);
            }
        }
        accept(character, accepted, upload.version, now);
        let saved = serde_json::to_string(&json!({ "version": upload.version, "state": upload.state }))?;
        let answer = json!({ "rev": character.rev, "summary": character.summary });
        // One write: the save and the roster that numbers it move together.
        put_two(&self.state.storage(), (ROSTER_KEY, roster_value(&roster)?), (&key, wasm_bindgen::JsValue::from_str(&saved))).await?;
        Response::from_json(&answer)
    }

    /// Whether this account exists (internal: mail and friend requests check the name).
    async fn exists(&self) -> Result<Response> {
        let events: Vec<AccountEvent> = self.state.storage().get(EVENTS_KEY).await?.unwrap_or_default();
        Response::from_json(&json!({ "exists": !events.is_empty() }))
    }

    /// Gold a checked battle paid this character: the next saves may show it.
    async fn grant(&self, mut req: Request, id: &str) -> Result<Response> {
        let Ok(grant) = req.json::<Grant>().await else { return refused(SaveError::BadSave("grant")) };
        let mut roster = self.roster().await?;
        let Some(character) = roster.get_mut(id) else { return refused(SaveError::NoCharacter) };
        wuxia_core::save::grant_gold(character, grant.gold);
        let granted = character.granted;
        self.state.storage().put(ROSTER_KEY, &roster).await?;
        Response::from_json(&json!({ "granted": granted }))
    }
}

impl DurableObject for AccountObject {
    fn new(state: State, env: Env) -> Self {
        Self { state, env }
    }

    async fn fetch(&self, req: Request) -> Result<Response> {
        let path = req.path();
        let segments: Vec<String> = path.trim_matches('/').split('/').map(str::to_string).collect();
        let parts: Vec<&str> = segments.iter().map(String::as_str).collect();
        match (req.method(), parts.as_slice()) {
            (Method::Post, ["register"]) => self.auth(req, "register").await,
            (Method::Post, ["login"]) => self.auth(req, "login").await,
            (Method::Get, ["characters"]) => self.list().await,
            (Method::Post, ["characters"]) => self.create(req).await,
            (Method::Delete, ["characters", id]) => self.delete(id).await,
            (Method::Get, ["characters", id, "save"]) => self.load(id).await,
            (Method::Put, ["characters", id, "save"]) => self.store(req, id).await,
            (Method::Post, ["characters", id, "grant"]) => self.grant(req, id).await,
            (Method::Post, ["characters", id, "save-debit"]) => self.store_debit(req, id).await,
            (Method::Get, ["exists"]) => self.exists().await,
            _ => reply(None, Some("not_found"), 404),
        }
    }
}
