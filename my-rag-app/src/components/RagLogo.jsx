export default function RagLogo({ size = "md" }) {
  const sizes = {
    sm: { container: 36, icon: 18, text: 13, gap: 8 },
    md: { container: 48, icon: 24, text: 16, gap: 10 },
    lg: { container: 64, icon: 32, text: 22, gap: 14 },
  };
  const sz = sizes[size] || sizes.md;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: sz.gap,
      marginBottom: 24,
      justifyContent: "center",
    }}>
      <div style={{
        width: sz.container,
        height: sz.container,
        borderRadius: 12,
        background: "linear-gradient(135deg, #1a3a5c 0%, #0d1f33 100%)",
        border: "0.5px solid #2a4a6b",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: "0 0 20px rgba(62,166,255,0.15), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}>
        <svg width={sz.icon} height={sz.icon} viewBox="0 0 24 24" fill="none">
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
          fontSize: sz.text,
          fontWeight: 700,
          color: "#ffffff",
          letterSpacing: "-0.02em",
          lineHeight: 1,
        }}>
          RAG<span style={{ color: "#5eaff5" }}>Chat</span>
        </div>
        <div style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: sz.text * 0.6,
          color: "#aeaeae",
          marginTop: 3,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}>
          Document Intelligence
        </div>
      </div>
    </div>
  );
}
