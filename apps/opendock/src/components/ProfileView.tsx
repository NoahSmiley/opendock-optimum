import { useState } from "react";
import { useAuth } from "@/stores/auth";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export function ProfileView() {
  const displayName = useAuth((s) => s.data.display_name);
  const email = useAuth((s) => s.data.email);
  const logout = useAuth((s) => s.logout);
  const label = displayName || email || "You";
  const initial = label.charAt(0).toUpperCase() || "?";
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="editor-area">
      <div className="editor-top">
        <span className="editor-top-title">Profile</span>
      </div>
      <div className="profile-body">
        <div className="profile-card">
          <div className="profile-avatar">{initial}</div>
          <div className="profile-name">{displayName || "Unnamed"}</div>
          {email && <div className="profile-email">{email}</div>}
        </div>
        <div className="profile-section">
          <div className="profile-row">
            <div>
              <div className="profile-row-label">Account</div>
              <div className="profile-row-meta">Managed via athion.me</div>
            </div>
          </div>
          <button className="profile-row profile-row-btn profile-row-danger" onClick={() => setConfirming(true)}>
            <div>
              <div className="profile-row-label">Sign out</div>
              <div className="profile-row-meta">You'll need to sign in again.</div>
            </div>
            <span className="profile-row-arrow">↪</span>
          </button>
        </div>
      </div>
      {confirming && <ConfirmDialog title="Sign out?" message="You'll need to sign in again to access your notes and boards."
        confirmLabel="Sign out" danger onConfirm={() => { logout(); setConfirming(false); }} onCancel={() => setConfirming(false)} />}
    </div>
  );
}
