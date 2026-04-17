CREATE TABLE boards (
    id UUID PRIMARY KEY,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    pinned BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX boards_owner_idx ON boards (owner_id);

CREATE TYPE board_role AS ENUM ('owner', 'member');

CREATE TABLE board_members (
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role board_role NOT NULL DEFAULT 'member',
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (board_id, user_id)
);
CREATE INDEX board_members_user_idx ON board_members (user_id);

CREATE TABLE board_columns (
    id UUID PRIMARY KEY,
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX board_columns_board_idx ON board_columns (board_id, position);

CREATE TABLE board_cards (
    id UUID PRIMARY KEY,
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    column_id UUID NOT NULL REFERENCES board_columns(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    position INTEGER NOT NULL,
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX board_cards_column_idx ON board_cards (column_id, position);
CREATE INDEX board_cards_assignee_idx ON board_cards (assignee_id);
