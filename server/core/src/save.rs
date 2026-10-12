//! Characters and their saves (docs/online.md#characters-and-saves).
//!
//! An account holds up to [`MAX_CHARACTERS`] characters ([`Roster`]). Each
//! character's save is the game's own save JSON (`{ version, state }`, the
//! player part of `store/world-store.ts`); the server keeps the last one it
//! accepted and checks every new one with [`check_save`] before storing it:
//!
//! - the upload must build on the save the server holds (`rev`), so two tabs
//!   or devices cannot overwrite each other;
//! - not more often than [`MIN_SAVE_INTERVAL_MS`];
//! - its version never goes back, its hero is this character, and its numbers
//!   stay inside the game's limits (levels 1–10, stats, stacks, gold);
//! - gold cannot rise faster than a refilling allowance ([`GOLD_BUDGET_CAP`],
//!   [`GOLD_BUDGET_PER_MIN`]): far above what play earns, far below an edit.
//!
//! Pure like the rest of the core: the worker supplies the clock, ids and
//! storage.

use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

pub const MAX_CHARACTERS: usize = 4;
pub const MAX_NAME_CHARS: usize = 24;
/// A save's JSON, in bytes (a late-game save is well under 200 KB).
pub const MAX_SAVE_BYTES: usize = 1_000_000;
/// The first save format kept on the server (the world clock's, v27).
pub const MIN_SAVE_VERSION: u64 = 27;
pub const MAX_SAVE_VERSION: u64 = 1_000;
pub const MIN_SAVE_INTERVAL_MS: f64 = 1_000.0;
pub const MAX_GOLD: f64 = 99_999_999.0;
/// Gold a character may gain at once, and how fast the allowance refills.
pub const GOLD_BUDGET_CAP: f64 = 100_000.0;
pub const GOLD_BUDGET_PER_MIN: f64 = 3_000.0;
/// Unspent server grants a character may hold (far above any battle's purse).
pub const MAX_GRANTED: f64 = 10_000_000.0;
pub const MAX_LEVEL: f64 = 10.0;
pub const MAX_STAT: f64 = 9_999.0;
pub const MAX_STACK: f64 = 9_999.0;
pub const MAX_ITEM_KINDS: usize = 5_000;
pub const MAX_POINTS: f64 = 1_000_000.0;
pub const MAX_WEXP: f64 = 1_000_000_000_000.0;

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum SaveError {
    BadName,
    NameTaken,
    TooMany,
    NoCharacter,
    TooLarge,
    BadSave(&'static str),
    BadVersion,
    NameMismatch,
    Stale,
    TooFast,
    GoldTooFast,
    /// The save that pays for a parcel does not show it leaving (or it was never there).
    NotEnough,
}

impl SaveError {
    /// The code the HTTP API answers with (`lib/net/client.ts` reads it).
    pub fn code(&self) -> &'static str {
        match self {
            SaveError::BadName => "bad_name",
            SaveError::NameTaken => "name_taken",
            SaveError::TooMany => "too_many",
            SaveError::NoCharacter => "no_character",
            SaveError::TooLarge => "too_large",
            SaveError::BadSave(_) => "bad_save",
            SaveError::BadVersion => "bad_version",
            SaveError::NameMismatch => "name_mismatch",
            SaveError::Stale => "stale",
            SaveError::TooFast => "too_fast",
            SaveError::GoldTooFast => "gold_too_fast",
            SaveError::NotEnough => "not_enough",
        }
    }
    pub fn status(&self) -> u16 {
        match self {
            SaveError::BadName | SaveError::BadVersion => 400,
            SaveError::NoCharacter => 404,
            SaveError::NameTaken | SaveError::TooMany | SaveError::Stale => 409,
            SaveError::TooLarge => 413,
            SaveError::BadSave(_) | SaveError::NameMismatch | SaveError::GoldTooFast | SaveError::NotEnough => 422,
            SaveError::TooFast => 429,
        }
    }
    /// Which check failed, for the error body (`bad_save` names its field).
    pub fn detail(&self) -> Option<&'static str> {
        match self {
            SaveError::BadSave(field) => Some(field),
            _ => None,
        }
    }
}

/// What the character list shows, read from the last accepted save.
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct SaveSummary {
    pub day: i64,
    pub gold: i64,
    /// The place the hero was last at (`lastLocationId`).
    pub location: Option<String>,
    /// The sect the hero is an active member of, with their rank.
    pub sect: Option<String>,
    pub rank: Option<i64>,
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct Character {
    pub id: String,
    pub name: String,
    /// `male` | `female`; the body follows (`m1` | `f1`).
    pub gender: String,
    pub body: String,
    pub created: f64,
    pub updated: f64,
    /// From the last accepted save; `None` until the first.
    pub summary: Option<SaveSummary>,
    /// The last accepted save's number (0: none yet).
    pub rev: u64,
    pub version: u64,
    #[serde(default)]
    pub gold_budget: f64,
    #[serde(default)]
    pub budget_at: f64,
    #[serde(default)]
    pub saved_at: f64,
    /// Gold the server paid this character (checked battles) that no save
    /// has shown yet: a save may rise by this much beyond the allowance.
    #[serde(default)]
    pub granted: f64,
}

/// An account's characters.
#[derive(Clone, Debug, Default, PartialEq, Serialize, Deserialize)]
pub struct Roster {
    pub characters: Vec<Character>,
}

/// A character's name: 1–24 characters, no control characters, trimmed.
pub fn normalize_name(raw: &str) -> Result<String, SaveError> {
    let name = raw.trim().to_string();
    let count = name.chars().count();
    if count == 0 || count > MAX_NAME_CHARS || name.chars().any(char::is_control) {
        return Err(SaveError::BadName);
    }
    Ok(name)
}

impl Roster {
    pub fn get(&self, id: &str) -> Option<&Character> {
        self.characters.iter().find(|c| c.id == id)
    }

    pub fn get_mut(&mut self, id: &str) -> Option<&mut Character> {
        self.characters.iter_mut().find(|c| c.id == id)
    }

    /// A new character with no save yet (the game starts it on first entry).
    pub fn create(&mut self, id: String, name: &str, gender: &str, now: f64) -> Result<&Character, SaveError> {
        let name = normalize_name(name)?;
        let body = match gender {
            "male" => "m1",
            "female" => "f1",
            _ => return Err(SaveError::BadName),
        };
        if self.characters.len() >= MAX_CHARACTERS {
            return Err(SaveError::TooMany);
        }
        if self.characters.iter().any(|c| c.name == name) {
            return Err(SaveError::NameTaken);
        }
        self.characters.push(Character {
            id,
            name,
            gender: gender.to_string(),
            body: body.to_string(),
            created: now,
            updated: now,
            summary: None,
            rev: 0,
            version: 0,
            gold_budget: GOLD_BUDGET_CAP,
            budget_at: now,
            granted: 0.0,
            saved_at: 0.0,
        });
        Ok(self.characters.last().unwrap())
    }

    pub fn delete(&mut self, id: &str) -> Result<Character, SaveError> {
        let index = self.characters.iter().position(|c| c.id == id).ok_or(SaveError::NoCharacter)?;
        Ok(self.characters.remove(index))
    }
}

/// A save upload: the game's save JSON plus the `rev` it builds on.
#[derive(Clone, Debug, Deserialize)]
pub struct SaveUpload {
    pub rev: u64,
    pub version: u64,
    pub state: Value,
}

/// What an accepted save changes on its character.
#[derive(Clone, Debug, PartialEq)]
pub struct Accepted {
    pub rev: u64,
    pub summary: SaveSummary,
    pub gold_budget: f64,
    /// What is left of the server's grants after this save.
    pub granted: f64,
}

fn number(state: &Map<String, Value>, field: &'static str, min: f64, max: f64) -> Result<f64, SaveError> {
    let value = state.get(field).and_then(Value::as_f64).ok_or(SaveError::BadSave(field))?;
    if value.is_finite() && value >= min && value <= max { Ok(value) } else { Err(SaveError::BadSave(field)) }
}

/// Every value of an optional `{ key: number }` map lies in `min..=max`.
fn number_map(owner: &Map<String, Value>, field: &'static str, min: f64, max: f64, max_len: usize) -> Result<(), SaveError> {
    let Some(value) = owner.get(field) else { return Ok(()) };
    if value.is_null() {
        return Ok(());
    }
    let map = value.as_object().ok_or(SaveError::BadSave(field))?;
    if map.len() > max_len {
        return Err(SaveError::BadSave(field));
    }
    for entry in map.values() {
        let n = entry.as_f64().ok_or(SaveError::BadSave(field))?;
        if !(n.is_finite() && n >= min && n <= max) {
            return Err(SaveError::BadSave(field));
        }
    }
    Ok(())
}

/// The active sect and rank: the first membership whose status is `active`.
fn active_sect(state: &Map<String, Value>) -> (Option<String>, Option<i64>) {
    let Some(map) = state.get("sectMembership").and_then(Value::as_object) else { return (None, None) };
    for (sect, entry) in map {
        if entry.get("status").and_then(Value::as_str) == Some("active") {
            return (Some(sect.clone()), entry.get("rank").and_then(Value::as_i64));
        }
    }
    (None, None)
}

/// Check a save upload against the character's last accepted save at `now`
/// (ms). `bytes` is the upload's size. On success the caller stores the save
/// and applies [`Accepted`] with [`accept`].
pub fn check_save(character: &Character, upload: &SaveUpload, bytes: usize, now: f64) -> Result<Accepted, SaveError> {
    if bytes > MAX_SAVE_BYTES {
        return Err(SaveError::TooLarge);
    }
    if upload.rev != character.rev {
        return Err(SaveError::Stale);
    }
    if character.rev > 0 && now - character.saved_at < MIN_SAVE_INTERVAL_MS {
        return Err(SaveError::TooFast);
    }
    if upload.version < MIN_SAVE_VERSION || upload.version > MAX_SAVE_VERSION || upload.version < character.version {
        return Err(SaveError::BadVersion);
    }
    let state = upload.state.as_object().ok_or(SaveError::BadSave("state"))?;
    if state.get("hasGame").and_then(Value::as_bool) != Some(true) {
        return Err(SaveError::BadSave("hasGame"));
    }
    let build = state.get("playerBuild").and_then(Value::as_object).ok_or(SaveError::BadSave("playerBuild"))?;
    if build.get("name").and_then(Value::as_str).map(str::trim) != Some(character.name.as_str()) {
        return Err(SaveError::NameMismatch);
    }
    let stats = build.get("stats").and_then(Value::as_object).ok_or(SaveError::BadSave("stats"))?;
    for value in stats.values() {
        let n = value.as_f64().ok_or(SaveError::BadSave("stats"))?;
        if !(n.is_finite() && (0.0..=MAX_STAT).contains(&n)) {
            return Err(SaveError::BadSave("stats"));
        }
    }
    if let Some(level) = build.get("artLevel") {
        let n = level.as_f64().ok_or(SaveError::BadSave("artLevel"))?;
        if !(1.0..=MAX_LEVEL).contains(&n) {
            return Err(SaveError::BadSave("artLevel"));
        }
    }
    number_map(build, "skillLevels", 1.0, MAX_LEVEL, MAX_ITEM_KINDS)?;
    number_map(build, "artLevels", 1.0, MAX_LEVEL, MAX_ITEM_KINDS)?;
    number_map(state, "inventory", 0.0, MAX_STACK, MAX_ITEM_KINDS)?;
    number_map(state, "inventoryEquipment", 0.0, MAX_STACK, MAX_ITEM_KINDS)?;
    let gold = number(state, "gold", 0.0, MAX_GOLD)?;
    number(state, "meridianPoints", 0.0, MAX_POINTS)?;
    number(state, "wExp", 0.0, MAX_WEXP)?;
    let day = number(state, "day", -1_000_000.0, 1_000_000_000.0)?;

    // Gold may rise by what the server paid (checked battles) plus an
    // allowance that refills over time (everything the browser still pays).
    let refill = ((now - character.budget_at).max(0.0) / 60_000.0) * GOLD_BUDGET_PER_MIN;
    let budget = (character.gold_budget + refill).min(GOLD_BUDGET_CAP);
    let before = character.summary.as_ref().map(|s| s.gold as f64).unwrap_or(0.0);
    let gain = (gold - before).max(0.0);
    let from_grants = gain.min(character.granted);
    let rest = gain - from_grants;
    if rest > budget {
        return Err(SaveError::GoldTooFast);
    }
    let (sect, rank) = active_sect(state);
    Ok(Accepted {
        rev: character.rev + 1,
        summary: SaveSummary {
            day: day as i64,
            gold: gold as i64,
            location: state.get("lastLocationId").and_then(Value::as_str).map(str::to_string),
            sect,
            rank,
        },
        gold_budget: budget - rest,
        granted: character.granted - from_grants,
    })
}

/// Apply an accepted save to its character.
pub fn accept(character: &mut Character, accepted: Accepted, version: u64, now: f64) {
    character.rev = accepted.rev;
    character.summary = Some(accepted.summary);
    character.gold_budget = accepted.gold_budget;
    character.granted = accepted.granted;
    character.budget_at = now;
    character.saved_at = now;
    character.updated = now;
    character.version = version;
}

/// What a save pays out of the hero's bag (a parcel sent by mail, and its
/// postage): gold, and at most one stack of one item.
#[derive(Clone, Debug, Default, PartialEq, Serialize, Deserialize)]
pub struct Debit {
    #[serde(default)]
    pub gold: f64,
    #[serde(default, rename = "itemId")]
    pub item_id: Option<String>,
    #[serde(default)]
    pub count: f64,
}

/// The largest parcel of gold one letter may carry.
pub const MAX_PARCEL_GOLD: f64 = 50_000.0;

fn gold_of(state: &Value) -> f64 {
    state.get("gold").and_then(Value::as_f64).unwrap_or(0.0)
}

fn held(state: &Value, item: &str) -> f64 {
    state.get("inventory").and_then(|inv| inv.get(item)).and_then(Value::as_f64).unwrap_or(0.0)
}

/// A save that pays `debit`: the last accepted save (`before`) held it, and the
/// new one (`after`) holds at least that much less — so a parcel can never be
/// sent and kept. Checked together with [`check_save`].
pub fn check_debit(before: &Value, after: &Value, debit: &Debit) -> Result<(), SaveError> {
    if !(debit.gold.is_finite() && (0.0..=MAX_PARCEL_GOLD + 1_000.0).contains(&debit.gold)) {
        return Err(SaveError::BadSave("debit"));
    }
    if gold_of(before) < debit.gold || gold_of(after) > gold_of(before) - debit.gold {
        return Err(SaveError::NotEnough);
    }
    if let Some(item) = &debit.item_id {
        if !(debit.count.is_finite() && debit.count >= 1.0 && debit.count <= MAX_STACK) {
            return Err(SaveError::BadSave("debit"));
        }
        if held(before, item) < debit.count || held(after, item) > held(before, item) - debit.count {
            return Err(SaveError::NotEnough);
        }
    }
    Ok(())
}

/// Gold the server paid a character (a checked battle's spoils), for its next saves.
pub fn grant_gold(character: &mut Character, gold: f64) {
    if gold.is_finite() && gold > 0.0 {
        character.granted = (character.granted + gold).min(MAX_GRANTED);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    const T0: f64 = 1_000_000.0;

    fn roster_with_hero() -> Roster {
        let mut roster = Roster::default();
        roster.create("c1".into(), "หลี่ฉางเฟิง", "male", T0).unwrap();
        roster
    }

    fn state(gold: f64) -> Value {
        json!({
            "hasGame": true,
            "day": 90,
            "gold": gold,
            "wExp": 0,
            "meridianPoints": 3,
            "lastLocationId": "city_capital",
            "inventory": { "herb_common": 4 },
            "inventoryEquipment": {},
            "sectMembership": { "shaolin": { "status": "active", "rank": 9 } },
            "playerBuild": { "name": "หลี่ฉางเฟิง", "artLevel": 1, "stats": { "STR": 12, "AGI": 8 },
                "skillLevels": { "basic_punch": 3 }, "artLevels": {} }
        })
    }

    fn upload(rev: u64, gold: f64) -> SaveUpload {
        SaveUpload { rev, version: 27, state: state(gold) }
    }

    #[test]
    fn roster_creates_up_to_the_limit_with_unique_names() {
        let mut roster = Roster::default();
        assert_eq!(roster.create("a".into(), "  ", "male", T0), Err(SaveError::BadName));
        assert_eq!(roster.create("a".into(), "x", "other", T0), Err(SaveError::BadName));
        assert_eq!(roster.create("a".into(), &"ก".repeat(25), "male", T0), Err(SaveError::BadName));
        let first = roster.create("a".into(), "  เหมย  ", "female", T0).unwrap();
        assert_eq!((first.name.as_str(), first.body.as_str(), first.rev), ("เหมย", "f1", 0));
        assert_eq!(roster.create("b".into(), "เหมย", "male", T0), Err(SaveError::NameTaken));
        for (i, name) in ["ข", "ค", "ง"].iter().enumerate() {
            roster.create(format!("id{i}"), name, "male", T0).unwrap();
        }
        assert_eq!(roster.create("z".into(), "จ", "male", T0), Err(SaveError::TooMany));
        assert_eq!(roster.delete("a").unwrap().name, "เหมย");
        assert_eq!(roster.delete("a"), Err(SaveError::NoCharacter));
        assert!(roster.create("z".into(), "จ", "male", T0).is_ok());
    }

    #[test]
    fn a_good_save_is_accepted_and_summarised() {
        let mut roster = roster_with_hero();
        let hero = roster.get_mut("c1").unwrap();
        let accepted = check_save(hero, &upload(0, 50.0), 2_000, T0 + 5_000.0).unwrap();
        assert_eq!(accepted.rev, 1);
        assert_eq!(accepted.summary, SaveSummary { day: 90, gold: 50, location: Some("city_capital".into()), sect: Some("shaolin".into()), rank: Some(9) });
        accept(hero, accepted, 27, T0 + 5_000.0);
        assert_eq!((hero.rev, hero.version), (1, 27));
        // The next one builds on rev 1.
        assert!(check_save(hero, &upload(1, 60.0), 2_000, T0 + 7_000.0).is_ok());
    }

    #[test]
    fn stale_fast_large_and_old_saves_are_refused() {
        let mut roster = roster_with_hero();
        let hero = roster.get_mut("c1").unwrap();
        assert_eq!(check_save(hero, &upload(3, 0.0), 10, T0), Err(SaveError::Stale));
        assert_eq!(check_save(hero, &upload(0, 0.0), MAX_SAVE_BYTES + 1, T0), Err(SaveError::TooLarge));
        let mut old = upload(0, 0.0);
        old.version = 26;
        assert_eq!(check_save(hero, &old, 10, T0), Err(SaveError::BadVersion));
        let accepted = check_save(hero, &upload(0, 0.0), 10, T0).unwrap();
        accept(hero, accepted, 27, T0);
        assert_eq!(check_save(hero, &upload(1, 0.0), 10, T0 + 500.0), Err(SaveError::TooFast));
    }

    #[test]
    fn the_hero_and_its_numbers_must_be_the_games() {
        let roster = roster_with_hero();
        let hero = roster.get("c1").unwrap();
        let with = |edit: &dyn Fn(&mut Value)| {
            let mut up = upload(0, 0.0);
            edit(&mut up.state);
            check_save(hero, &up, 10, T0)
        };
        assert_eq!(with(&|s| s["playerBuild"]["name"] = json!("คนอื่น")), Err(SaveError::NameMismatch));
        assert_eq!(with(&|s| s["hasGame"] = json!(false)), Err(SaveError::BadSave("hasGame")));
        assert_eq!(with(&|s| s["playerBuild"]["skillLevels"]["basic_punch"] = json!(11)), Err(SaveError::BadSave("skillLevels")));
        assert_eq!(with(&|s| s["playerBuild"]["artLevel"] = json!(0)), Err(SaveError::BadSave("artLevel")));
        assert_eq!(with(&|s| s["playerBuild"]["stats"]["STR"] = json!(1e6)), Err(SaveError::BadSave("stats")));
        assert_eq!(with(&|s| s["inventory"]["herb_common"] = json!(-1)), Err(SaveError::BadSave("inventory")));
        assert_eq!(with(&|s| s["gold"] = json!("lots")), Err(SaveError::BadSave("gold")));
        assert_eq!(with(&|s| s["gold"] = json!(MAX_GOLD + 1.0)), Err(SaveError::BadSave("gold")));
    }

    #[test]
    fn gold_rises_only_as_fast_as_the_allowance() {
        let mut roster = roster_with_hero();
        let hero = roster.get_mut("c1").unwrap();
        // A whole allowance at once is fine, a coin more is not.
        assert_eq!(check_save(hero, &upload(0, GOLD_BUDGET_CAP + 1.0), 10, T0), Err(SaveError::GoldTooFast));
        let accepted = check_save(hero, &upload(0, GOLD_BUDGET_CAP), 10, T0).unwrap();
        assert_eq!(accepted.gold_budget, 0.0);
        accept(hero, accepted, 27, T0);
        // Spent: a minute later only one minute's refill is there.
        assert_eq!(check_save(hero, &upload(1, GOLD_BUDGET_CAP + GOLD_BUDGET_PER_MIN + 1.0), 10, T0 + 60_000.0), Err(SaveError::GoldTooFast));
        let accepted = check_save(hero, &upload(1, GOLD_BUDGET_CAP + GOLD_BUDGET_PER_MIN), 10, T0 + 60_000.0).unwrap();
        accept(hero, accepted, 27, T0 + 60_000.0);
        // Spending gold is always fine.
        assert!(check_save(hero, &upload(2, 10.0), 10, T0 + 62_000.0).is_ok());
    }

    #[test]
    fn server_grants_raise_what_a_save_may_show() {
        let mut roster = roster_with_hero();
        let hero = roster.get_mut("c1").unwrap();
        let accepted = check_save(hero, &upload(0, GOLD_BUDGET_CAP), 10, T0).unwrap();
        accept(hero, accepted, 27, T0);
        // The allowance is spent; a checked battle pays 500.
        assert_eq!(check_save(hero, &upload(1, GOLD_BUDGET_CAP + 500.0), 10, T0 + 2_000.0), Err(SaveError::GoldTooFast));
        grant_gold(hero, 500.0);
        grant_gold(hero, -5.0);
        grant_gold(hero, f64::NAN);
        assert_eq!(hero.granted, 500.0);
        let accepted = check_save(hero, &upload(1, GOLD_BUDGET_CAP + 500.0), 10, T0 + 2_000.0).unwrap();
        assert_eq!(accepted.granted, 0.0);
        accept(hero, accepted, 27, T0 + 2_000.0);
        // A grant not yet shown waits for the save that shows it.
        grant_gold(hero, 300.0);
        let accepted = check_save(hero, &upload(2, GOLD_BUDGET_CAP + 500.0), 10, T0 + 4_000.0).unwrap();
        assert_eq!(accepted.granted, 300.0);
        accept(hero, accepted, 27, T0 + 4_000.0);
        assert!(check_save(hero, &upload(3, GOLD_BUDGET_CAP + 800.0), 10, T0 + 6_000.0).is_ok());
    }

    #[test]
    fn a_parcel_must_leave_the_bag() {
        let before = json!({ "gold": 500, "inventory": { "herb_common": 4 } });
        let paid = Debit { gold: 110.0, item_id: Some("herb_common".into()), count: 3.0 };
        assert!(check_debit(&before, &json!({ "gold": 390, "inventory": { "herb_common": 1 } }), &paid).is_ok());
        assert!(check_debit(&before, &json!({ "gold": 10, "inventory": {} }), &paid).is_ok(), "less is fine");
        // Kept the gold, or the herbs.
        assert_eq!(check_debit(&before, &json!({ "gold": 500, "inventory": { "herb_common": 1 } }), &paid), Err(SaveError::NotEnough));
        assert_eq!(check_debit(&before, &json!({ "gold": 390, "inventory": { "herb_common": 4 } }), &paid), Err(SaveError::NotEnough));
        // Never had it.
        let rich = Debit { gold: 600.0, ..Debit::default() };
        assert_eq!(check_debit(&before, &json!({ "gold": 0 }), &rich), Err(SaveError::NotEnough));
        let missing = Debit { gold: 0.0, item_id: Some("pearl".into()), count: 1.0 };
        assert_eq!(check_debit(&before, &json!({ "gold": 500 }), &missing), Err(SaveError::NotEnough));
        // Nonsense.
        assert_eq!(check_debit(&before, &before, &Debit { gold: -5.0, ..Debit::default() }), Err(SaveError::BadSave("debit")));
        assert_eq!(check_debit(&before, &before, &Debit { gold: 0.0, item_id: Some("x".into()), count: 0.0 }), Err(SaveError::BadSave("debit")));
    }
}
