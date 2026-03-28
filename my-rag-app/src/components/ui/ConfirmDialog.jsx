export default function ConfirmDialog({ title, message, confirmLabel = "Confirm", confirmStyle = "danger", onConfirm, onCancel }) {
  const buttonStyles = {
    width: "100%",
    padding: "10px 16px",
    borderRadius: 8,
    border: "none",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 200,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      background: "rgba(0,0,0,0.7)",
    }}>
      <div style={{
        background: "#212121",
        border: "0.5px solid #3f3f3f",
        borderRadius: 14,
        padding: "24px 24px 20px",
        width: "100%",
        maxWidth: 360,
      }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#ffffff", marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 13, color: "#aaaaaa", marginBottom: 20, lineHeight: 1.6 }}>{message}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel} style={{ ...buttonStyles, background: "transparent", border: "0.5px solid #3f3f3f", color: "#ffffff", flex: 1 }}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              ...buttonStyles,
              flex: 1,
              background: confirmStyle === "danger" ? "#c0392b" : "#5eaff5",
              color: "#ffffff",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
