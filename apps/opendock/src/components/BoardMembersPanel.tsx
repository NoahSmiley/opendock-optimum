import { useEffect, useRef, useState } from "react";
import type { BoardMember, UserSummary } from "@/types";
import { useBoards } from "@/stores/boards";
import { searchUsers } from "@/api/users";

interface Props { ownerId: string; currentUserId: string | null | undefined; onClose: () => void }

export function BoardMembersPanel({ ownerId, currentUserId, onClose }: Props) {
  const members = useBoards((s) => s.detail?.members ?? []) as BoardMember[];
  const addMember = useBoards((s) => s.addMember);
  const removeMember = useBoards((s) => s.removeMember);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSummary[]>([]);
  const [searched, setSearched] = useState(false);
  const timer = useRef<number | null>(null);
  const isOwner = currentUserId === ownerId;
  const memberIds = new Set(members.map((m) => m.user_id));
  const filteredResults = results.filter((u) => !memberIds.has(u.id));
  const looksLikeEmail = query.includes("@") && query.includes(".");
  const showInviteHint = searched && filteredResults.length === 0 && looksLikeEmail;

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const q = query.trim();
    if (q.length < 2) { setResults([]); setSearched(false); return; }
    timer.current = window.setTimeout(async () => {
      try { setResults(await searchUsers(q)); setSearched(true); } catch { /* silent */ }
    }, 250);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const add = async (email: string) => {
    const ok = await addMember(email);
    if (ok) { setQuery(""); setResults([]); setSearched(false); }
  };

  return (
    <div className="members-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="members-panel" onClick={(e) => e.stopPropagation()}>
      <div className="members-header"><h3>Board members</h3><button className="members-close" onClick={onClose} aria-label="Close">×</button></div>
      {isOwner && (
        <div className="members-add">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Add by email" autoCapitalize="off" autoCorrect="off" />
          {filteredResults.map((u) => (
            <button key={u.id} className="members-result" onClick={() => add(u.email)}>
              <span className="members-name">{u.display_name || u.email}</span>
              {u.display_name && <span className="members-email">{u.email}</span>}
            </button>
          ))}
          {showInviteHint && <div className="members-hint">No match. They need to sign in at athion.me first, then try again.</div>}
        </div>
      )}
      <div className="members-list">
        {members.map((m) => (
          <div key={m.user_id} className="members-row">
            <div><div className="members-name">{m.display_name || m.email}</div><div className="members-meta">{m.email} · {m.role}</div></div>
            {isOwner && m.user_id !== ownerId && <button onClick={() => removeMember(m.user_id)}>×</button>}
          </div>
        ))}
      </div>
    </div>
    </div>
  );
}
