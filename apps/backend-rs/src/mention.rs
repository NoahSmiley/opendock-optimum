//! Extract mention references from note content (server side).
//!
//! The Tauri editor inserts mentions as
//! `<span class="mention" contenteditable="false" data-kind="note|card" data-id="<uuid>">…</span>`.
//! We scan the raw HTML with a simple regex — the pill shape is tightly
//! controlled on the client and we don't need a full HTML parser.

use crate::dto::entity_link::{EntityKind, EntityRef};
use regex::Regex;
use std::sync::OnceLock;
use uuid::Uuid;

static TAG_RE: OnceLock<Regex> = OnceLock::new();
static KIND_RE: OnceLock<Regex> = OnceLock::new();
static ID_RE: OnceLock<Regex> = OnceLock::new();

fn tag_re() -> &'static Regex {
    TAG_RE.get_or_init(|| Regex::new(r#"(?i)<span\b[^>]*class=["'][^"']*\bmention\b[^"']*["'][^>]*>"#).expect("mention tag regex"))
}
fn kind_re() -> &'static Regex {
    KIND_RE.get_or_init(|| Regex::new(r#"(?i)\bdata-kind=["'](note|card)["']"#).expect("mention kind regex"))
}
fn id_re() -> &'static Regex {
    ID_RE.get_or_init(|| Regex::new(r#"(?i)\bdata-id=["']([0-9a-f-]{36})["']"#).expect("mention id regex"))
}

pub fn extract(html: &str) -> Vec<EntityRef> {
    let mut out: Vec<EntityRef> = Vec::new();
    for cap in tag_re().captures_iter(html) {
        let tag = cap.get(0).unwrap().as_str();
        let Some(kind) = kind_re().captures(tag).and_then(|c| c.get(1)).map(|m| m.as_str().to_ascii_lowercase()) else { continue };
        let Some(id_str) = id_re().captures(tag).and_then(|c| c.get(1)).map(|m| m.as_str().to_string()) else { continue };
        let Ok(id) = Uuid::parse_str(&id_str) else { continue };
        let kind = if kind == "note" { EntityKind::Note } else { EntityKind::Card };
        let r = EntityRef { kind, id };
        if !out.iter().any(|x| x.kind == r.kind && x.id == r.id) { out.push(r); }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn extracts_one() {
        let html = r#"Hello <span class="mention" contenteditable="false" data-kind="card" data-id="89956047-21d0-47fe-b6c3-a28e661173b2">@Alpha</span> world"#;
        let out = extract(html);
        assert_eq!(out.len(), 1);
        assert_eq!(out[0].kind, EntityKind::Card);
    }

    #[test]
    fn dedupes_duplicates() {
        let id = "89956047-21d0-47fe-b6c3-a28e661173b2";
        let html = format!(r#"<span class="mention" data-kind="card" data-id="{id}">a</span> <span class="mention" data-kind="card" data-id="{id}">b</span>"#);
        assert_eq!(extract(&html).len(), 1);
    }

    #[test]
    fn ignores_non_mention_spans() {
        let html = r#"<span class="other" data-kind="card" data-id="89956047-21d0-47fe-b6c3-a28e661173b2">x</span>"#;
        assert!(extract(html).is_empty());
    }
}
