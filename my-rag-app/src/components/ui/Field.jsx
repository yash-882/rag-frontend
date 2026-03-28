export default function Field({ label, type = "text", value, onChange, placeholder, disabled }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 500, color: "#aaaaaa", marginBottom: 6 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: "100%",
          border: "0.5px solid #3f3f3f",
          borderRadius: 8,
          padding: "9px 12px",
          fontSize: 13,
          fontFamily: "'DM Sans', sans-serif",
          background: "#272727",
          color: "#ffffff",
          boxSizing: "border-box",
          outline: "none",
          transition: "border-color 0.15s",
        }}
        onFocus={(e) => (e.target.style.borderColor = "#aaaaaa")}
        onBlur={(e) => (e.target.style.borderColor = "#3f3f3f")}
      />
    </div>
  );
}
