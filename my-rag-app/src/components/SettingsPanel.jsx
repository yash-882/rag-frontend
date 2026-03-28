import { useEffect, useState } from "react";
import { apiFetch, ApiError, toast, setStoredUser } from "../lib/api";
import { USER_API, AUTH_API } from "../lib/constants";
import ConfirmDialog from "./ui/ConfirmDialog";
import Field from "./ui/Field";
import Alert from "./ui/Alert";
import { c, s } from "../lib/styles";
import { BackIcon, FilesIcon, InfoIcon, KeyIcon, UserIcon, DangerIcon, CloseIcon } from "./icons/Icons";

export default function SettingsPanel({ user, onClose, onUserUpdate, onAccountDeleted, onOpenFiles }) {
  const [section, setSection] = useState(null);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [newName, setNewName] = useState(user?.name || "");
  const [deletePw, setDeletePw] = useState("");
  const [accountInfo, setAccountInfo] = useState(null);
  const [accountInfoLoading, setAccountInfoLoading] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const resetFeedback = () => {
    setErr("");
    setOk("");
  };

  const goTo = (sec) => {
    resetFeedback();
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    setNewName(user?.name || "");
    setDeletePw("");
    setSection(sec);
    if (sec === "account") {
      setAccountInfo(null);
      setAccountInfoLoading(true);
      apiFetch(`${USER_API}/me`)
        .then((data) => { if (data?.data?.user) setAccountInfo(data.data.user); })
        .catch((e) => setErr(e.message))
        .finally(() => setAccountInfoLoading(false));
    }
  };

  const handleChangePassword = async () => {
    resetFeedback();
    if (!currentPw || !newPw || !confirmPw) return setErr("All fields are required.");
    if (newPw !== confirmPw) return setErr("New passwords do not match.");
    if (newPw.length < 6) return setErr("New password must be at least 6 characters.");
    setLoading(true);
    try {
      await apiFetch(`${AUTH_API}/change-password`, { method: "POST", body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }) });
      setOk("Password changed successfully.");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeName = async () => {
    resetFeedback();
    if (!newName.trim()) return setErr("Name cannot be empty.");
    if (newName.trim() === user?.name) return setErr("That's already your current name.");
    setLoading(true);
    try {
      const data = await apiFetch(`${USER_API}/update-me`, { method: "PATCH", body: JSON.stringify({ name: newName.trim() }) });
      const updated = data?.user || { ...user, name: newName.trim() };
      setStoredUser(updated);
      onUserUpdate(updated);
      setOk("Name updated successfully.");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    resetFeedback();
    if (!deletePw) return setErr("Password is required to delete your account.");
    setConfirm({ action: "delete" });
  };

  const executeDeleteAccount = async () => {
    setConfirm(null);
    setLoading(true);
    try {
      await apiFetch(`${USER_API}/delete-me`, { method: "DELETE", body: JSON.stringify({ password: deletePw }) });
      setStoredUser(null);
      onAccountDeleted();
    } catch (e) {
      setLoading(false);
      setErr(e.message);
    }
  };

  const formatMemberSince = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const initials = user?.name ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 150, background: "rgba(0,0,0,0.65)", animation: "fadeIn 0.15s ease" }} onClick={onClose} />
      <div style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 160,
        width: "min(420px, calc(100vw - 32px))",
        maxHeight: "90vh",
        overflowY: "auto",
        background: c.surface,
        border: `0.5px solid ${c.border}`,
        borderRadius: 16,
        animation: "fadeUp 0.2s ease",
        boxSizing: "border-box",
      }}>
        <div style={{
          padding: "16px 20px",
          borderBottom: `0.5px solid ${c.borderFaint}`,
          display: "flex",
          alignItems: "center",
          gap: 10,
          position: "sticky",
          top: 0,
          background: c.surface,
          zIndex: 1,
        }}>
          {section && (
            <button onClick={() => goTo(null)} style={{ background: "none", border: "none", cursor: "pointer", color: c.hint, padding: 4, display: "flex", alignItems: "center" }}>
              <BackIcon />
            </button>
          )}
          <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: c.text, fontFamily: "'DM Mono', monospace" }}>
            {section === "password" ? "Change Password"
              : section === "name" ? "Change Name"
              : section === "delete" ? "Delete Account"
              : section === "account" ? "Account Info"
              : "Settings"}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: c.hint, padding: 4, display: "flex", alignItems: "center" }}>
            <CloseIcon />
          </button>
        </div>

        <div style={{ padding: "20px" }}>
          {!section && (
            <>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 16px",
                background: c.elevated,
                border: `0.5px solid ${c.borderFaint}`,
                borderRadius: 10,
                marginBottom: 20,
              }}>
                <div style={{
                  width: 42,
                  height: 42,
                  borderRadius: "50%",
                  background: c.accentDim,
                  border: `0.5px solid ${c.accentBorder}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 600,
                  color: c.accent,
                  fontFamily: "'DM Mono', monospace",
                  flexShrink: 0,
                }}>{initials}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</div>
                  <div style={{ fontSize: 11, color: c.hint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.email}</div>
                </div>
              </div>
              <button
                onClick={() => { onClose(); onOpenFiles(); }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 10,
                  marginBottom: 6,
                  background: "transparent",
                  border: `0.5px solid ${c.borderFaint}`,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s, border-color 0.15s",
                  fontFamily: "'DM Sans', sans-serif",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = c.elevated; e.currentTarget.style.borderColor = c.border; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = c.borderFaint; }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 8, background: c.accentDim, border: `0.5px solid ${c.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", color: c.accent, flexShrink: 0 }}>
                  <FilesIcon />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: c.text }}>Manage PDFs</div>
                  <div style={{ fontSize: 11, color: c.hint, marginTop: 1 }}>View and delete your PDF files</div>
                </div>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke={c.hint} strokeWidth="1.6"><path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              {[
                { key: "account", icon: <InfoIcon />, title: "Account Info", desc: "View your account details" },
                { key: "name", icon: <UserIcon />, title: "Change Name", desc: "Update your display name" },
                { key: "password", icon: <KeyIcon />, title: "Change Password", desc: "Update your account password" },
              ].map((item) => (
                <button key={item.key} onClick={() => goTo(item.key)} style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 10,
                  marginBottom: 6,
                  background: "transparent",
                  border: `0.5px solid ${c.borderFaint}`,
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "background 0.15s, border-color 0.15s",
                  fontFamily: "'DM Sans', sans-serif",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = c.elevated; e.currentTarget.style.borderColor = c.border; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = c.borderFaint; }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: c.accentDim, border: `0.5px solid ${c.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", color: c.accent, flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: c.text }}>{item.title}</div>
                    <div style={{ fontSize: 11, color: c.hint, marginTop: 1 }}>{item.desc}</div>
                  </div>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke={c.hint} strokeWidth="1.6"><path d="M6 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              ))}
              <div style={{ marginTop: 20, padding: "14px", background: c.errBg, border: `0.5px solid ${c.errBorder}`, borderRadius: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <DangerIcon />
                  <span style={{ fontSize: 12, fontWeight: 600, color: c.errText }}>Danger Zone</span>
                </div>
                <p style={{ fontSize: 12, color: c.muted, marginBottom: 12, lineHeight: 1.5 }}>
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button onClick={() => goTo("delete")} style={{ ...s.btn, background: "transparent", border: `0.5px solid ${c.errBorder}`, color: c.errText, fontSize: 12 }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#3d1515"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >Delete My Account</button>
              </div>
            </>
          )}

          {section === "account" && (
            <>
              <Alert type="err" msg={err} />
              {accountInfoLoading ? (
                <div style={{ display: "flex", gap: 5, alignItems: "center", padding: "16px 0" }}>
                  {[0, 160, 320].map((delay, i) => (
                    <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: c.hint, display: "inline-block", animation: "dotPulse 1.2s ease-in-out infinite", animationDelay: `${delay}ms` }} />
                  ))}
                </div>
              ) : accountInfo ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                    <div style={{ width: 64, height: 64, borderRadius: "50%", background: c.accentDim, border: `0.5px solid ${c.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 600, color: c.accent, fontFamily: "'DM Mono', monospace" }}>
                      {accountInfo.name ? accountInfo.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?"}
                    </div>
                  </div>
                  {[
                    { label: "Name", value: accountInfo.name },
                    { label: "Email", value: accountInfo.email },
                    { label: "Member Since", value: formatMemberSince(accountInfo.created_at) },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ padding: "12px 14px", background: c.elevated, border: `0.5px solid ${c.borderFaint}`, borderRadius: 10 }}>
                      <div style={{ fontSize: 11, color: c.hint, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                      <div style={{ fontSize: 13, color: c.text, fontWeight: 500, wordBreak: "break-all" }}>{value || "—"}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          )}

          {section === "password" && (
            <>
              <Alert type="err" msg={err} />
              <Alert type="ok" msg={ok} />
              <Field label="Current Password" type="password" value={currentPw} onChange={setCurrentPw} placeholder="••••••••" disabled={loading} />
              <Field label="New Password" type="password" value={newPw} onChange={setNewPw} placeholder="••••••••" disabled={loading} />
              <Field label="Confirm New Password" type="password" value={confirmPw} onChange={setConfirmPw} placeholder="••••••••" disabled={loading} />
              <button onClick={handleChangePassword} disabled={loading} style={{ ...s.btn, opacity: loading ? 0.6 : 1 }}>
                {loading ? "Changing..." : "Change Password"}
              </button>
            </>
          )}

          {section === "name" && (
            <>
              <Alert type="err" msg={err} />
              <Alert type="ok" msg={ok} />
              <Field label="New Name" value={newName} onChange={setNewName} placeholder="Your name" disabled={loading} />
              <button onClick={handleChangeName} disabled={loading} style={{ ...s.btn, opacity: loading ? 0.6 : 1 }}>
                {loading ? "Updating..." : "Update Name"}
              </button>
            </>
          )}

          {section === "delete" && (
            <>
              <div style={{ padding: "12px 14px", borderRadius: 8, background: c.errBg, border: `0.5px solid ${c.errBorder}`, marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: c.errText, marginBottom: 4 }}>⚠ This action is permanent</div>
                <div style={{ fontSize: 12, color: c.muted, lineHeight: 1.5 }}>All your PDFs, embeddings, and account data will be permanently deleted.</div>
              </div>
              <Alert type="err" msg={err} />
              <Field label="Enter your password to confirm" type="password" value={deletePw} onChange={setDeletePw} placeholder="••••••••" disabled={loading} />
              <button onClick={handleDeleteAccount} disabled={loading} style={{ ...s.btn, background: "#c0392b", color: "#fff", opacity: loading ? 0.6 : 1 }}>
                {loading ? "Deleting..." : "Delete My Account Forever"}
              </button>
            </>
          )}
        </div>
      </div>

      {confirm && (
        <ConfirmDialog
          title="Delete Account?"
          message="This is permanent. All your PDFs, chat history, and account data will be deleted."
          confirmLabel="Delete Forever"
          confirmStyle="danger"
          onConfirm={executeDeleteAccount}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}
