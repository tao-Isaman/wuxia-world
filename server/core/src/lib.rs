//! The pure core of the wuxia game server: no I/O, no clock, no randomness —
//! the Cloudflare Worker (`../worker`) supplies those. Everything here is
//! tested natively with `cargo test -p wuxia-core`.
//!
//! The design is event-based: commands are checked by `decide`, which returns
//! events; state changes only by `apply`ing events ([`room`], [`auth`]).

pub mod auth;
pub mod protocol;
pub mod room;
