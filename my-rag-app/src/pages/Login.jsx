import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost, setStoredUser } from "../lib/api";
import { BASE_URL } from "../lib/constants";
import RagLogo from "../components/RagLogo";
import Field from "../components/ui/Field";
import Alert from "../components/ui/Alert";
import { s, c } from "../lib/styles";

export default function Login({ onLoginSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr("");
    setLoading(true);
    try {
      const data = await apiPost("/login", { email, password });
      const user = data.data.user;
      setStoredUser(user);
      onLoginSuccess(user);
      navigate("/", { replace: true });
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <RagLogo size="md" />
        <div style={s.title}>Welcome Back</div>
        <div style={s.sub}>Sign in to your account</div>
        <Alert type="err" msg={err} />
        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
        <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 18 }}>
          <button style={s.link} onClick={() => navigate("/forgot")}>Forgot password?</button>
        </div>
        <button style={{ ...s.btn, opacity: loading ? 0.6 : 1 }} onClick={submit} disabled={loading}>
          {loading ? "Signing In..." : "Sign In"}
        </button>
        <div style={{ position: "relative", textAlign: "center", margin: "10px 0" }}>
          <div style={{ position: "absolute", top: "50%", left: 0, right: 0 }} />
          <span style={{ background: c.surface, padding: "0 12px", fontSize: 12, color: c.hint }}>or</span>
        </div>
        <button
          style={{ ...s.btn, background: "#000000", border: `0.5px solid ${c.border}`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          onClick={() => window.location.href = `${BASE_URL}/api/auth/google`}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          Continue with Google
        </button>
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: c.hint }}>
          No account? <button style={s.link} onClick={() => navigate("/signup")}>Create one</button>
        </div>
      </div>
    </div>
  );
}