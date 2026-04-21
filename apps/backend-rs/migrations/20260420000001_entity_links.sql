CREATE TYPE entity_kind AS ENUM ('note', 'card');

CREATE TABLE entity_links (
    id         UUID PRIMARY KEY,
    a_kind     entity_kind NOT NULL,
    a_id       UUID        NOT NULL,
    b_kind     entity_kind NOT NULL,
    b_id       UUID        NOT NULL,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    source     TEXT NOT NULL DEFAULT 'manual',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK ((a_kind::text, a_id) < (b_kind::text, b_id)),
    UNIQUE (a_kind, a_id, b_kind, b_id)
);

CREATE INDEX entity_links_a_idx ON entity_links (a_kind, a_id);
CREATE INDEX entity_links_b_idx ON entity_links (b_kind, b_id);
