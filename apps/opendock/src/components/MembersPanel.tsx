import { useCallback, useEffect, useRef, useState } from "react";
import type { NoteMember, UserSummary } from "@/types";
import { addNoteMember, fetchNoteMembers, removeNoteMember } from "@/api/members";
import { searchUsers } from "@/api/users";

interface MembersPanelProps { noteId: string; ownerId: string; currentUserId: string | null | undefined; onClose: () => void }

export function MembersPanel({ noteId, ownerId, currentUserId, onClose }: MembersPanelProps) {
  const [members, setMembers] = useState<NoteMember[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  const isOwner = currentUserId === ownerId;

  const load = useCallback(async () => {
    try { setMembers(await fetchNoteMembers(noteId)); } catch (e) { setError(String(e)); }
  }, [noteId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const q = query.trim();
    if (q.length < 2) { setResults([]); return; }
    timer.current = window.setTimeout(async () => {
      try { setResults(await searchUsers(q)); } catch { /* silent */ }
    }, 250);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [query]);

  const add = async (email: string) => {
    try { await addNoteMember(noteId, email); setQuery(""); setResults([]); await load(); }
    catch (e) { setError(String(e)); }
  };

  const remove = async (userId: string) => {
    try { await removeNoteMember(noteId, userId); await load(); } catch (e) { setError(String(e)); }
  };

  return (
    <div className="members-panel">
      <div className="members-header"><h3>Sharing</h3><button onClick={onClose}>×</button></div>
      {isOwner && (
        <div className="members-add">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Add by email" autoCapitalize="off" autoCorrect="off" />
          {results.map((u) => (
            <button key={u.id} className="members-result" onClick={() => add(u.email)}>
              <span className="members-name">{u.display_name || u.email}</span>
              {u.display_name && <span className="members-email">{u.email}</span>}
            </button>
          ))}
        </div>
      )}
      <div className="members-list">
        {members.map((m) => (
          <div key={m.user_id} className="members-row">
            <div><div className="members-name">{m.display_name || m.email}</div><div className="members-meta">{m.email} · {m.role}</div></div>
            {isOwner && m.user_id !== ownerId && <button onClick={() => remove(m.user_id)}>×</button>}
          </div>
        ))}
      </div>
      {error && <div className="members-error">{error}</div>}
    </div>
  );
}
