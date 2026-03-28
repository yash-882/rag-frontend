import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch, apiPost, fetchWithRefresh, friendlyError, ApiError, setLoggingOut, setStoredUser, toast } from "../lib/api";
import { CONVO_API, CONTENT_API } from "../lib/constants";
import useIsMobile from "../hooks/useIsMobile";
import Sidebar from "../components/Sidebar";
import ChatView from "../components/ChatView";
import SettingsPanel from "../components/SettingsPanel";
import FileManagerPanel from "../components/FileManagerPanel";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import { c } from "../lib/styles";

function getConvoName(convo) {
  if (convo.title && convo.title.trim()) return convo.title;
  if (!convo.created_at) return "Conversation";
  const d = new Date(convo.created_at);
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export default function ChatPage({ authResult, onLogout }) {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const isMobile = useIsMobile(640);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [filesOpen, setFilesOpen] = useState(false);
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("user")));

  const [conversations, setConversations] = useState([]);
  const [convosLoading, setConvosLoading] = useState(true);
  const [convoPage, setConvoPage] = useState(1);
  const [hasMoreConvos, setHasMoreConvos] = useState(false);
  const [loadingMoreConvos, setLoadingMoreConvos] = useState(false);

  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  const [confirm, setConfirm] = useState(null);
  const CONVO_LIMIT = 12;

  useEffect(() => {
    const handleSessionExpired = () => {
      setStoredUser(null);
      onLogout();
      navigate("/login", { replace: true });
    };
    window.addEventListener("auth:sessionExpired", handleSessionExpired);
    return () => window.removeEventListener("auth:sessionExpired", handleSessionExpired);
  }, [navigate, onLogout]);

  useEffect(() => {
    const handler = () => setConfirm({ type: "logout" });
    window.addEventListener("app:logoutRequest", handler);
    return () => window.removeEventListener("app:logoutRequest", handler);
  }, []);

  useEffect(() => {
    const sync = () => setUser(JSON.parse(localStorage.getItem("user")));
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const loadConversations = useCallback(async (pg = 1, append = false) => {
    if (pg === 1) setConvosLoading(true);
    else setLoadingMoreConvos(true);
    try {
      const res = await apiFetch(`${CONVO_API}/list?page=${pg}&limit=${CONVO_LIMIT}`);
      const items = res.data?.conversations || [];
      setConversations((prev) => append ? [...prev, ...items] : items);
      setHasMoreConvos(items.length === CONVO_LIMIT);
      setConvoPage(pg);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setConvosLoading(false);
      setLoadingMoreConvos(false);
    }
  }, []);

  useEffect(() => { loadConversations(1); }, [loadConversations]);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [conversationId, isMobile]);

  const handleSidebarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";
    setUploadErr("");
    setUploadingPdf(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetchWithRefresh(`${CONTENT_API}/upload-file`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new ApiError(friendlyError(data.message, res.status), res.status);
      toast.success("PDF uploaded successfully");
    } catch (e) {
      setUploadErr(e.message);
      toast.error(e.message);
      setTimeout(() => setUploadErr(""), 4000);
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleNewChat = () => {
    navigate("/", { replace: true });
    if (isMobile) setSidebarOpen(false);
  };

  const handleSelectConvo = (id) => {
    navigate(`/c/${id}`);
    if (isMobile) setSidebarOpen(false);
  };

  const handleDeleteConvo = (convo) => setConfirm({ type: "deleteConvo", payload: convo });

  const executeDeleteConvo = async (id) => {
    try {
      await apiFetch(`${CONVO_API}/delete/${id}`, { method: "DELETE" });
      setConversations((prev) => prev.filter((cv) => cv.id !== id));
      if (conversationId === id) navigate("/", { replace: true });
      toast.success("Conversation deleted");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleConvoCreated = useCallback((newConvoId) => {
    loadConversations(1);
    navigate(`/c/${newConvoId}`, { replace: true });
  }, [loadConversations, navigate]);

  const executeLogout = async () => {
    setLoggingOut(true);
    onLogout();
    try { await apiPost("/logout", {}); } catch (_) {}
    setStoredUser(null);
    setLoggingOut(false);
    navigate("/login", { replace: true });
  };

  const handleConfirm = () => {
    if (confirm?.type === "deleteConvo") executeDeleteConvo(confirm.payload.id);
    else if (confirm?.type === "logout") executeLogout();
    setConfirm(null);
  };

  const sidebarProps = {
    user,
    conversations,
    convosLoading,
    hasMoreConvos,
    loadingMoreConvos,
    onLoadMoreConvos: () => loadConversations(convoPage + 1, true),
    activeConvoId: conversationId,
    onNewChat: handleNewChat,
    onSelectConvo: handleSelectConvo,
    onDeleteConvo: handleDeleteConvo,
    onSettings: () => setSettingsOpen(true),
    onClose: () => setSidebarOpen(false),
    isMobile,
    onUploadPdf: handleSidebarUpload,
    uploadingPdf,
    uploadErr,
  };

  const activeConvo = conversations.find((cv) => cv.id === conversationId);
  const activeConvoName = activeConvo ? getConvoName(activeConvo) : null;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", display: "flex", height: "100dvh", background: c.bg, overflow: "hidden" }}>
      {!isMobile && <Sidebar {...sidebarProps} />}

      {isMobile && sidebarOpen && (
        <>
          <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 99, background: "rgba(0,0,0,0.6)", animation: "fadeIn 0.2s ease" }} />
          <Sidebar {...sidebarProps} />
        </>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100dvh", overflow: "hidden" }}>
        <div style={{
          padding: isMobile ? "11px 14px" : "13px 20px",
          borderBottom: `0.5px solid ${c.borderFaint}`,
          background: c.surface,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", color: c.muted, padding: 2, display: "flex", alignItems: "center", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 4h12M2 8h12M2 12h12" strokeLinecap="round" /></svg>
              </button>
            )}
            <span style={{ fontSize: 13, fontWeight: 500, color: c.text, fontFamily: "'DM Mono', monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {activeConvoName || (conversationId ? "Chat" : "New Chat")}
            </span>
          </div>
          <span style={{ fontSize: 11, color: c.hint, background: c.elevated, border: `0.5px solid ${c.border}`, borderRadius: 20, padding: "2px 9px", whiteSpace: "nowrap", flexShrink: 0 }}>
            {conversations.length} convo{conversations.length !== 1 ? "s" : ""}
          </span>
        </div>

        <ChatView
          conversationId={conversationId}
          onConvoCreated={handleConvoCreated}
        />
      </div>

      {settingsOpen && (
        <SettingsPanel
          user={user}
          onClose={() => setSettingsOpen(false)}
          onUserUpdate={(updated) => { setUser(updated); setStoredUser(updated); }}
          onAccountDeleted={() => { onLogout(); setStoredUser(null); navigate("/login", { replace: true }); }}
          onOpenFiles={() => setFilesOpen(true)}
        />
      )}

      {filesOpen && <FileManagerPanel onClose={() => setFilesOpen(false)} />}

      {confirm && (
        <ConfirmDialog
          title={confirm.type === "deleteConvo" ? "Delete conversation?" : "Sign Out?"}
          message={confirm.type === "deleteConvo"
            ? "This will permanently delete the conversation and all its messages."
            : "You'll be signed out of your account."}
          confirmLabel={confirm.type === "deleteConvo" ? "Delete" : "Sign Out"}
          confirmStyle={confirm.type === "deleteConvo" ? "danger" : "accent"}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
