import { useEffect, useState } from "react";
import { c } from "../lib/styles";

export default function AppStartupLoader({ onReady, waitFor }) {
  const [phase, setPhase] = useState("logo");
  const [dots, setDots] = useState("");
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("message"), 600);
    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function waitForServer() {
      try {
        await waitFor;
      } catch (_) {}
      if (!cancelled) {
        setFadeOut(true);
        setTimeout(() => onReady(), 500);
      }
    }
    waitForServer();
    return () => { cancelled = true; };
  }, [onReady, waitFor]);

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 10000,
      background: c.bg,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 0,
      opacity: fadeOut ? 0 : 1,
      transition: "opacity 0.5s ease",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        opacity: phase === "logo" ? 0 : 1,
        transform: phase === "logo" ? "translateY(8px)" : "translateY(0)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
        marginBottom: 40,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "center" }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: "linear-gradient(135deg, #1a3a5c 0%, #0d1f33 100%)",
            border: `0.5px solid ${c.accentBorder}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 40px rgba(62,166,255,0.2), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <rect x="5" y="4" width="11" height="14" rx="2" fill="none" stroke="#3ea6ff" strokeWidth="1.3" opacity="0.4" />
              <rect x="7" y="2" width="11" height="14" rx="2" fill="none" stroke="#3ea6ff" strokeWidth="1.3" opacity="0.7" />
              <path d="M10 7h5M10 10h5M10 13h3" stroke="#3ea6ff" strokeWidth="1.2" strokeLinecap="round" opacity="0.9" />
              <circle cx="17" cy="17" r="3.5" fill="none" stroke="#3ea6ff" strokeWidth="1.4" />
              <path d="M19.5 19.5l2 2" stroke="#3ea6ff" strokeWidth="1.4" strokeLinecap="round" />
              <circle cx="17" cy="17" r="1" fill="#3ea6ff" opacity="0.8" />
            </svg>
          </div>
          <div>
            <div style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 28,
              fontWeight: 700,
              color: c.text,
              letterSpacing: "-0.02em",
              lineHeight: 1,
            }}>
              RAG<span style={{ color: c.accent }}>Chat</span>
            </div>
            <div style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 11,
              color: c.hint,
              marginTop: 4,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}>
              Document Intelligence
            </div>
          </div>
        </div>
      </div>

      <div style={{
        opacity: phase === "message" ? 1 : 0,
        transform: phase === "message" ? "translateY(0)" : "translateY(6px)",
        transition: "opacity 0.4s ease 0.1s, transform 0.4s ease 0.1s",
        textAlign: "center",
      }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            border: `2px solid ${c.borderFaint}`,
            borderTopColor: c.accent,
            animation: "spin 0.9s linear infinite",
          }} />
        </div>
        <div style={{
          fontSize: 14,
          fontWeight: 500,
          color: c.text,
          marginBottom: 8,
          fontFamily: "'DM Mono', monospace",
        }}>
          Starting up{dots}
        </div>
        <div style={{
          fontSize: 12,
          color: c.hint,
          lineHeight: 1.6,
          maxWidth: 260,
        }}>
          Waking the server — this may take a moment on the first load.
        </div>
      </div>
    </div>
  );
}
