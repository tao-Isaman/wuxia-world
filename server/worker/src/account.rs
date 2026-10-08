//! One Durable Object per username: the account's event log (only
//! `registered` so far), folded into an `Account` on each request. A Durable
//! Object runs one request at a time, so two sign-ups for the same name can
//! never both win.

use worker::*;
use wuxia_core::auth::{Account, AccountEvent, AuthError, SALT_BYTES};

use crate::{now_ms, AccountReply, Credentials};

const EVENTS_KEY: &str = "events";
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

impl DurableObject for AccountObject {
    fn new(state: State, env: Env) -> Self {
        Self { state, env }
    }

    async fn fetch(&self, mut req: Request) -> Result<Response> {
        let credentials: Credentials = req.json().await?;
        let storage = self.state.storage();
        let mut events: Vec<AccountEvent> = storage.get(EVENTS_KEY).await?.unwrap_or_default();
        let account = Account::from_events(&events);
        match req.path().as_str() {
            "/register" => {
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
            "/login" => match account.login(&credentials.password) {
                Ok(username) => reply(Some(username.to_string()), None, 200),
                Err(error) => failed(error),
            },
            _ => reply(None, Some("not_found"), 404),
        }
    }
}
