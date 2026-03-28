import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { checkAuth } from "../lib/api";
import RagLogo from "../components/RagLogo";
import { s, c } from "../lib/styles";

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const user = await checkAuth();
        if (user) {
          navigate("/chat", { replace: true });
        } else {
          setErr("Authentication failed. Please try again.");
          setTimeout(() => navigate("/login", { replace: true }), 2000);
        }
      } catch (e) {
        setErr("Authentication failed. Please try again.");
        setTimeout(() => navigate("/login", { replace: true }), 2000);
      } finally {
        setLoading(false);
      }
    };
    handleCallback();
  }, [navigate]);

  return (
    <div style={s.page}>
      <div style={s.card}>
        <RagLogo size="md" />
        <div style={s.title}>{loading ? "Authenticating..." : "Authentication Failed"}</div>
        <div style={s.sub}>{loading ? "Please wait while we log you in." : err}</div>
        {!loading && (
          <button style={s.btn} onClick={() => navigate("/login", { replace: true })}>
            Back to Login
          </button>
        )}
      </div>
    </div>
  );
}
