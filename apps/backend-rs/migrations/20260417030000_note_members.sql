CREATE TYPE note_role AS ENUM ('owner', 'editor', 'viewer');

CREATE TABLE note_members (
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role note_role NOT NULL DEFAULT 'editor',
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (note_id, user_id)
);
CREATE INDEX note_members_user_idx ON note_members (user_id);

INSERT INTO note_members (note_id, user_id, role)
SELECT id, owner_id, 'owner'::note_role FROM notes
ON CONFLICT DO NOTHING;

INSERT INTO note_members (note_id, user_id, role)
SELECT n.id, u, 'editor'::note_role
FROM notes n, unnest(n.shared_with) AS u
ON CONFLICT DO NOTHING;

ALTER TABLE notes DROP COLUMN shared_with;
DROP INDEX IF EXISTS notes_shared_gin_idx;

CREATE INDEX users_email_lower_idx ON users (LOWER(email));
