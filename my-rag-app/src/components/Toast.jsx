import { useCallback, useEffect, useState } from "react";

const TOAST_META = {
  success: { bg: "#152d1a", border: "#1e5c30", text: "#4ade80", icon: (<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M3 8l3.5 3.5L13 4" strokeLinecap="round" strokeLinejoin="round"/></svg>) },
  error: { bg: "#2d1515", border: "#5c2020", text: "#ff6b6b", icon: (<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round"/></svg>) },
  info: { bg: "#1a2940", border: "#2a4a6b", text: "#3ea6ff", icon: (<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="8" cy="8" r="6"/><path d="M8 7v4M8 5.2v.5" strokeLinecap="round"/></svg>) },
  warn: { bg: "#2d2010", border: "#5c4010", text: "#fbbf24", icon: (<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M8 2L1.5 13.5h13L8 2z" strokeLinejoin="round"/><path d="M8 7v3M8 11.2v.4" strokeLinecap="round"/></svg>) },
};

let toastId = 0;

function ToastItem({ id, type, msg, onRemove }) {
  const [show, setShow] = useState(false);
  const [out, setOut] = useState(false);
  const meta = TOAST_META[type] || TOAST_META.info;

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 10);
    return () => clearTimeout(t);
  }, []);

  const dismiss = useCallback(() => {
    setOut(true);
    setTimeout(() => onRemove(id), 260);
  }, [id, onRemove]);

  useEffect(() => {
    const t = setTimeout(dismiss, 3600);
    return () => clearTimeout(t);
  }, [dismiss]);

  return (
    <div
      onClick={dismiss}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "9px 13px",
        borderRadius: 10,
        background: meta.bg,
        border: `0.5px solid ${meta.border}`,
        boxShadow: "0 6px 28px rgba(0,0,0,0.5)",
        cursor: "pointer",
        userSelect: "none",
        maxWidth: 300,
        minWidth: 180,
        opacity: show && !out ? 1 : 0,
        transform: show && !out ? "translateY(0) scale(1)" : "translateY(12px) scale(0.95)",
        transition: "opacity 0.22s ease, transform 0.22s cubic-bezier(0.34,1.4,0.64,1)",
        willChange: "transform, opacity",
        pointerEvents: "all",
      }}
    >
      <span style={{ color: meta.text, display: "flex", alignItems: "center", flexShrink: 0 }}>
        {meta.icon}
      </span>
      <span style={{ fontSize: 12.5, color: meta.text, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.45, flex: 1 }}>
        {msg}
      </span>
    </div>
  );
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      setToasts((prev) => [...prev, { id: ++toastId, ...e.detail }]);
    };
    window.addEventListener("app:toast", handler);
    return () => window.removeEventListener("app:toast", handler);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  if (!toasts.length) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: 22,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      gap: 7,
      alignItems: "center",
      pointerEvents: "none",
    }}>
      {toasts.map((toastItem) => (
        <ToastItem key={toastItem.id} {...toastItem} onRemove={removeToast} />
      ))}
    </div>
  );
}
