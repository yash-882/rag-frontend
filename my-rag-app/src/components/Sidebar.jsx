import { useRef } from "react";
import { SettingsIcon } from "lucide-react";
import { c } from "../lib/styles";
import { ChatBubbleIcon, FilesIcon, PlusIcon, TrashIcon, UploadIcon, CloseIcon } from "./icons/Icons";

export default function Sidebar({
  user,
  conversations,
  convosLoading,
  hasMoreConvos,
  loadingMoreConvos,
  onLoadMoreConvos,
  activeConvoId,
  onNewChat,
  onSelectConvo,
  onDeleteConvo,
  onSettings,
  onClose,
  isMobile,
  onUploadPdf,
  uploadingPdf,
  uploadErr,
}) {
  const fileInputRef = useRef(null);
  const initials = user?.name ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";
  const formatConvoTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  const getConvoName = (convo) => {
  if (!convo.created_at) return "Conversation";
  const d = new Date(convo.created_at);
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

  return (
    <div style={{
      width: isMobile ? "80%" : 240,
      maxWidth: isMobile ? 300 : "none",
      borderRight: isMobile ? "none" : `0.5px solid ${c.border}`,
      display: "flex",
      flexDirection: "column",
      background: c.surface,
      flexShrink: 0,
      height: "100%",
      ...(isMobile ? { position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 100, boxShadow: "4px 0 24px rgba(0,0,0,0.5)" } : {}),
    }}>
      <div style={{ padding: "16px 16px 12px", borderBottom: `0.5px solid ${c.borderFaint}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 900, color: c.text, fontFamily: "'DM Mono', monospace" }}>RAG Chat</div>
          <div style={{ fontSize: 11, color: c.hint, marginTop: 2 }}>Hi, {user?.name || "there"}</div>
        </div>
        {isMobile && (
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: c.hint, padding: 4 }}>
            <CloseIcon />
          </button>
        )}
      </div>

      <div style={{ padding: "10px 8px 4px", display: "flex", gap: 6 }}>
        <button
          onClick={onNewChat}
          style={{
            flex: 1,
            padding: "8px 10px",
            borderRadius: 8,
            border: `0.5px solid ${c.border}`,
            background: "transparent",
            color: c.muted,
            fontSize: 12,
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = c.elevated; e.currentTarget.style.color = c.text; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = c.muted; }}
        >
          <PlusIcon /> New Chat
        </button>
        <button
          onClick={() => fileInputRef.current.click()}
          disabled={uploadingPdf}
          style={{
            flex: 1,
            padding: "8px 10px",
            borderRadius: 8,
            border: `0.5px solid ${c.accentBorder}`,
            background: uploadingPdf ? c.accentDim : c.accent,
            color: uploadingPdf ? c.accent : "#0f0f0f",
            fontSize: 12,
            fontWeight: 600,
            cursor: uploadingPdf ? "not-allowed" : "pointer",
            fontFamily: "'DM Sans', sans-serif",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            opacity: uploadingPdf ? 0.7 : 1,
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => { if (!uploadingPdf) e.currentTarget.style.opacity = "0.85"; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = uploadingPdf ? "0.7" : "1"; }}
        >
          <UploadIcon /> {uploadingPdf ? "Uploading..." : "Upload PDF"}
        </button>
        <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={onUploadPdf} />
      </div>

      {uploadErr && (
        <div style={{ margin: "0 8px 4px", padding: "7px 10px", borderRadius: 7, background: c.errBg, border: `0.5px solid ${c.errBorder}`, fontSize: 11, color: c.errText }}>
          {uploadErr}
        </div>
      )}

      <div style={{ padding: "8px 16px 4px" }}>
        <span style={{ fontSize: 11, fontWeight: 500, color: c.hint, textTransform: "uppercase", letterSpacing: "0.05em" }}>Conversations</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px" }}>
        {convosLoading ? (
          <div style={{ padding: "16px 8px", display: "flex", gap: 5, alignItems: "center" }}>
            {[0, 160, 320].map((delay, i) => (
              <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: c.hint, display: "inline-block", animation: "dotPulse 1.2s ease-in-out infinite", animationDelay: `${delay}ms` }} />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div style={{ padding: "16px 8px", fontSize: 12, color: c.hint }}>No conversations yet</div>
        ) : (
          <>
            {conversations.map((convo) => {
              const isActive = convo.id === activeConvoId;
              return (
                <div key={convo.id} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 8px",
                  borderRadius: 8,
                  marginBottom: 2,
                  background: isActive ? c.accentDim : "transparent",
                  border: `0.5px solid ${isActive ? c.accentBorder : "transparent"}`,
                  transition: "background 0.15s",
                  cursor: "pointer",
                }}
                  onClick={() => onSelectConvo(convo.id)}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = c.elevated; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ color: isActive ? c.accent : c.hint, flexShrink: 0 }}><ChatBubbleIcon /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: isActive ? c.accent : c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {getConvoName(convo) || "Conversation"}
                      
                      </div>
                    <div style={{ fontSize: 10, color: c.hint, marginTop: 1 }}>{formatConvoTime(convo.created_at)}</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteConvo(convo); }}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "rgb(160,43,32)", padding: 4, borderRadius: 4, flexShrink: 0 }}
                  >
                    <TrashIcon />
                  </button>
                </div>
              );
            })}
            {hasMoreConvos && (
              <button
                onClick={onLoadMoreConvos}
                disabled={loadingMoreConvos}
                style={{
                  width: "100%",
                  marginTop: 4,
                  padding: "7px",
                  borderRadius: 7,
                  border: `0.5px solid ${c.borderFaint}`,
                  background: "transparent",
                  color: loadingMoreConvos ? c.hint : c.muted,
                  fontSize: 11,
                  cursor: loadingMoreConvos ? "not-allowed" : "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {loadingMoreConvos ? "Loading..." : "Load More"}
              </button>
            )}
          </>
        )}
      </div>

      {user && (
        <div style={{ margin: "8px 8px 0", padding: "10px 12px", borderRadius: 10, background: c.elevated, border: `0.5px solid ${c.borderFaint}`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: c.accentDim, border: `0.5px solid ${c.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, color: c.accent, fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
            <div style={{ fontSize: 10, color: c.hint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>{user.email}</div>
          </div>
          <button onClick={onSettings}
            style={{ background: "none", border: "none", cursor: "pointer", color: c.hint, padding: 4, borderRadius: 6, display: "flex", alignItems: "center", flexShrink: 0, transition: "color 0.15s" }}
            onMouseEnter={(e) => e.currentTarget.style.color = c.text}
            onMouseLeave={(e) => e.currentTarget.style.color = c.hint}
          >
            <SettingsIcon size={15} />
          </button>
        </div>
      )}

      <div style={{ padding: "4px 8px 12px" }}>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("app:logoutRequest"))}
          style={{
            width: "100%",
            padding: "8px 12px",
            border: `0.5px solid ${c.border}`,
            borderRadius: 8,
            fontSize: 12,
            color: "rgb(234,60,44)",
            background: "transparent",
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
