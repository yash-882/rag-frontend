import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../lib/api";
import Field from "../components/ui/Field";
import Alert from "../components/ui/Alert";
import { s, c } from "../lib/styles";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState("init");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const [loading, setLoading] = useState(false);

  const initReset = async () => {
    setErr("");
    setOk("");
    setLoading(true);
    try {
      await apiPost("/forgot-password/init", { email });
      setOk("OTP sent. Check your inbox.");
      setStep("reset");
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  const completeReset = async () => {
    setErr("");
    setOk("");
    setLoading(true);
    try {
      await apiPost("/forgot-password/complete", { email, otp, newPassword });
      setOk("Password reset! Redirecting to sign in...");
      setTimeout(() => navigate("/login", { replace: true }), 1500);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.title}>Reset Password</div>
        <div style={s.sub}>{step === "init" ? "We'll send an OTP to your email" : "Enter the OTP and your new password"}</div>
        <Alert type="err" msg={err} />
        <Alert type="ok" msg={ok} />
        {step === "init" ? (
          <>
            <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
            <button style={{ ...s.btn, opacity: loading ? 0.6 : 1 }} onClick={initReset} disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </>
        ) : (
          <>
            <Field label="OTP Code" value={otp} onChange={setOtp} placeholder="123456" />
            <Field label="New Password" type="password" value={newPassword} onChange={setNewPassword} placeholder="••••••••" />
            <button style={{ ...s.btn, opacity: loading ? 0.6 : 1 }} onClick={completeReset} disabled={loading}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
            <button style={{ ...s.btn, ...s.ghost, marginTop: 8 }} onClick={() => setStep("init")}>Back</button>
          </>
        )}
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: c.hint }}>
          <button style={s.link} onClick={() => navigate("/login")}>Back to Sign In</button>
        </div>
      </div>
    </div>
  );
}
