//! The server's token-signing key, made and kept by the server itself: one
//! Durable Object (`KEYS`, name `auth`) creates 32 random bytes the first
//! time it is asked and stores them, so the key needs no configuration and
//! survives every deploy. The Worker keeps a copy in memory per isolate.

use std::cell::RefCell;

use worker::*;

const KEY_NAME: &str = "auth";
const STORAGE_KEY: &str = "signing_key";

thread_local! {
    /// The key, once fetched (a Worker isolate runs one thread).
    static CACHED: RefCell<Option<Vec<u8>>> = const { RefCell::new(None) };
}

#[durable_object]
pub struct KeyObject {
    state: State,
}

fn to_hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{b:02x}")).collect()
}

fn from_hex(text: &str) -> Option<Vec<u8>> {
    let text = text.trim();
    if !text.len().is_multiple_of(2) {
        return None;
    }
    (0..text.len()).step_by(2).map(|i| u8::from_str_radix(&text[i..i + 2], 16).ok()).collect()
}

impl DurableObject for KeyObject {
    fn new(state: State, _env: Env) -> Self {
        Self { state }
    }

    /// The key as hex, made on the first request. One request at a time, so it is made once.
    async fn fetch(&self, _req: Request) -> Result<Response> {
        let storage = self.state.storage();
        if let Some(key) = storage.get::<String>(STORAGE_KEY).await? {
            return Response::ok(key);
        }
        let mut bytes = [0u8; 32];
        getrandom::getrandom(&mut bytes).map_err(|e| Error::RustError(e.to_string()))?;
        let key = to_hex(&bytes);
        storage.put(STORAGE_KEY, &key).await?;
        Response::ok(key)
    }
}

/// The signing key, or `auth_key_unavailable` when its Durable Object cannot be reached.
pub(crate) async fn signing_key(env: &Env) -> std::result::Result<Vec<u8>, &'static str> {
    if let Some(key) = CACHED.with(|cached| cached.borrow().clone()) {
        return Ok(key);
    }
    let fetched = async {
        let stub = env.durable_object("KEYS")?.id_from_name(KEY_NAME)?.get_stub()?;
        let mut response = stub.fetch_with_str("https://keys/signing").await?;
        response.text().await
    }
    .await
    .ok()
    .and_then(|text| from_hex(&text))
    .filter(|key| key.len() == 32)
    .ok_or("auth_key_unavailable")?;
    CACHED.with(|cached| *cached.borrow_mut() = Some(fetched.clone()));
    Ok(fetched)
}
