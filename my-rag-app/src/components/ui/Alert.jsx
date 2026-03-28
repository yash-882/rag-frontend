export default function Alert({ type, msg }) {
  if (!msg) return null;
  const base = {
    fontSize: 12,
    borderRadius: 8,
    padding: "8px 12px",
  };
  const styles = type === "err"
    ? { color: "#ff6b6b", background: "#2d1515", border: "0.5px solid #5c2020" }
    : { color: "#4ade80", background: "#152d1a", border: "0.5px solid #1e5c30" };
  return <div style={{ ...base, ...styles, marginBottom: 16 }}>{msg}</div>;
}
