//! Accounts and sessions: username + password, then a signed token.
//!
//! - Passwords are stored as PBKDF2-HMAC-SHA256 hashes with a random salt and
//!   the iteration count beside them (so it can be raised later).
//! - A session token is `base64url(claims JSON).base64url(HMAC-SHA256)`, signed
//!   with the server's secret (`AUTH_SECRET`). It carries the username and an
//!   expiry; the server keeps no session table.
//!
//! An account is event-sourced like a room: `register` decides an
//! [`AccountEvent::Registered`], and [`Account::from_events`] rebuilds it.

use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use base64::Engine;
use hmac::{Hmac, Mac};
use serde::{Deserialize, Serialize};
use sha2::Sha256;

type HmacSha256 = Hmac<Sha256>;

/// How long a login lasts.
pub const TOKEN_TTL_MS: f64 = 30.0 * 24.0 * 3600.0 * 1000.0;
pub const SALT_BYTES: usize = 16;
pub const MIN_PASSWORD: usize = 6;
pub const MAX_PASSWORD: usize = 72;

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum AuthError {
    BadUsername,
    BadPassword,
    Taken,
    NoAccount,
    WrongPassword,
    BadToken,
    Expired,
}

impl AuthError {
    /// The code the HTTP API answers with (`lib/net/auth.ts` reads it).
    pub fn code(&self) -> &'static str {
        match self {
            AuthError::BadUsername => "bad_username",
            AuthError::BadPassword => "bad_password",
            AuthError::Taken => "taken",
            AuthError::NoAccount | AuthError::WrongPassword => "wrong_login",
            AuthError::BadToken => "bad_token",
            AuthError::Expired => "expired",
        }
    }
    pub fn status(&self) -> u16 {
        match self {
            AuthError::BadUsername | AuthError::BadPassword => 400,
            AuthError::Taken => 409,
            AuthError::NoAccount | AuthError::WrongPassword | AuthError::BadToken | AuthError::Expired => 401,
        }
    }
}

/// Usernames are 3–20 of `a–z 0–9 _`, compared in lower case.
pub fn normalize_username(raw: &str) -> Result<String, AuthError> {
    let name = raw.trim().to_ascii_lowercase();
    let ok = (3..=20).contains(&name.len()) && name.bytes().all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'_');
    if ok { Ok(name) } else { Err(AuthError::BadUsername) }
}

pub fn check_password(password: &str) -> Result<(), AuthError> {
    let length = password.chars().count();
    if (MIN_PASSWORD..=MAX_PASSWORD).contains(&length) { Ok(()) } else { Err(AuthError::BadPassword) }
}

pub fn hash_password(password: &str, salt: &[u8], iterations: u32) -> Vec<u8> {
    let mut out = [0u8; 32];
    pbkdf2::pbkdf2_hmac::<Sha256>(password.as_bytes(), salt, iterations, &mut out);
    out.to_vec()
}

/// What happened to an account.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
#[serde(tag = "t", rename_all = "snake_case")]
pub enum AccountEvent {
    Registered { username: String, salt: String, hash: String, iterations: u32, at: f64 },
}

#[derive(Clone, Debug, PartialEq, Default)]
pub struct Account {
    pub username: Option<String>,
    salt: Vec<u8>,
    hash: Vec<u8>,
    iterations: u32,
    pub created_at: f64,
}

impl Account {
    pub fn from_events<'a>(events: impl IntoIterator<Item = &'a AccountEvent>) -> Self {
        let mut account = Account::default();
        for event in events {
            account.apply(event);
        }
        account
    }

    pub fn exists(&self) -> bool {
        self.username.is_some()
    }

    /// Register this (so far empty) account. `salt` comes from the caller's random source.
    pub fn register(&self, username: &str, password: &str, salt: &[u8], iterations: u32, now: f64) -> Result<AccountEvent, AuthError> {
        let username = normalize_username(username)?;
        check_password(password)?;
        if self.exists() {
            return Err(AuthError::Taken);
        }
        Ok(AccountEvent::Registered {
            username,
            salt: URL_SAFE_NO_PAD.encode(salt),
            hash: URL_SAFE_NO_PAD.encode(hash_password(password, salt, iterations)),
            iterations,
            at: now,
        })
    }

    pub fn apply(&mut self, event: &AccountEvent) {
        match event {
            AccountEvent::Registered { username, salt, hash, iterations, at } => {
                self.username = Some(username.clone());
                self.salt = URL_SAFE_NO_PAD.decode(salt).unwrap_or_default();
                self.hash = URL_SAFE_NO_PAD.decode(hash).unwrap_or_default();
                self.iterations = *iterations;
                self.created_at = *at;
            }
        }
    }

    /// Check a password (in constant time).
    pub fn login(&self, password: &str) -> Result<&str, AuthError> {
        let Some(username) = self.username.as_deref() else { return Err(AuthError::NoAccount) };
        let candidate = hash_password(password, &self.salt, self.iterations);
        if constant_time_eq(&candidate, &self.hash) { Ok(username) } else { Err(AuthError::WrongPassword) }
    }
}

fn constant_time_eq(a: &[u8], b: &[u8]) -> bool {
    a.len() == b.len() && a.iter().zip(b).fold(0u8, |acc, (x, y)| acc | (x ^ y)) == 0
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Claims {
    /// The username.
    pub sub: String,
    /// Expiry, ms since 1970.
    pub exp: f64,
}

pub fn sign_token(claims: &Claims, secret: &[u8]) -> String {
    let payload = URL_SAFE_NO_PAD.encode(serde_json::to_vec(claims).expect("claims serialize"));
    let mut mac = HmacSha256::new_from_slice(secret).expect("HMAC takes any key length");
    mac.update(payload.as_bytes());
    format!("{payload}.{}", URL_SAFE_NO_PAD.encode(mac.finalize().into_bytes()))
}

pub fn verify_token(token: &str, secret: &[u8], now: f64) -> Result<Claims, AuthError> {
    let (payload, signature) = token.split_once('.').ok_or(AuthError::BadToken)?;
    let signature = URL_SAFE_NO_PAD.decode(signature).map_err(|_| AuthError::BadToken)?;
    let mut mac = HmacSha256::new_from_slice(secret).expect("HMAC takes any key length");
    mac.update(payload.as_bytes());
    mac.verify_slice(&signature).map_err(|_| AuthError::BadToken)?;
    let bytes = URL_SAFE_NO_PAD.decode(payload).map_err(|_| AuthError::BadToken)?;
    let claims: Claims = serde_json::from_slice(&bytes).map_err(|_| AuthError::BadToken)?;
    if claims.exp <= now {
        return Err(AuthError::Expired);
    }
    normalize_username(&claims.sub).map_err(|_| AuthError::BadToken)?;
    Ok(claims)
}

#[cfg(test)]
mod tests {
    use super::*;

    const SECRET: &[u8] = b"test-secret";

    #[test]
    fn usernames_are_short_plain_and_lower_case() {
        assert_eq!(normalize_username("  Li_Mu99 ").unwrap(), "li_mu99");
        for bad in ["ab", "a b c", "ลี่มู่", "x".repeat(21).as_str(), "semi;colon"] {
            assert_eq!(normalize_username(bad), Err(AuthError::BadUsername), "{bad}");
        }
    }

    #[test]
    fn register_then_login() {
        let account = Account::default();
        let event = account.register("Ann", "secret1", b"0123456789abcdef", 1000, 5.0).unwrap();
        let account = Account::from_events([&event]);
        assert_eq!(account.username.as_deref(), Some("ann"));
        assert_eq!(account.login("secret1"), Ok("ann"));
        assert_eq!(account.login("secret2"), Err(AuthError::WrongPassword));
        // The stored event holds no password, only its salted hash.
        let json = serde_json::to_string(&event).unwrap();
        assert!(!json.contains("secret1"));
    }

    #[test]
    fn a_taken_name_or_a_weak_password_is_refused() {
        let event = Account::default().register("ann", "secret1", b"salt", 10, 0.0).unwrap();
        let account = Account::from_events([&event]);
        assert_eq!(account.register("ann", "another1", b"salt", 10, 1.0), Err(AuthError::Taken));
        assert_eq!(Account::default().register("bob", "12345", b"salt", 10, 0.0), Err(AuthError::BadPassword));
        assert_eq!(Account::default().login("x"), Err(AuthError::NoAccount));
    }

    #[test]
    fn the_same_password_hashes_differently_with_another_salt() {
        assert_ne!(hash_password("secret1", b"salt-one", 100), hash_password("secret1", b"salt-two", 100));
        assert_eq!(hash_password("secret1", b"salt-one", 100), hash_password("secret1", b"salt-one", 100));
    }

    #[test]
    fn tokens_are_signed_and_expire() {
        let token = sign_token(&Claims { sub: "ann".into(), exp: 1000.0 }, SECRET);
        assert_eq!(verify_token(&token, SECRET, 999.0).unwrap().sub, "ann");
        assert_eq!(verify_token(&token, SECRET, 1000.0), Err(AuthError::Expired));
        assert_eq!(verify_token(&token, b"other-secret", 0.0), Err(AuthError::BadToken));
        // A forged payload with the old signature fails.
        let (_, signature) = token.split_once('.').unwrap();
        let forged = format!("{}.{signature}", URL_SAFE_NO_PAD.encode(br#"{"sub":"bob","exp":1000}"#));
        assert_eq!(verify_token(&forged, SECRET, 0.0), Err(AuthError::BadToken));
        assert_eq!(verify_token("garbage", SECRET, 0.0), Err(AuthError::BadToken));
    }
}
