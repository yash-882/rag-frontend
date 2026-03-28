import { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { checkAuth } from "./lib/api";
import ToastContainer from "./components/Toast";
import AppStartupLoader from "./components/AppStartupLoader";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import OAuthCallback from "./pages/OAuthCallback";
import ChatPage from "./pages/ChatPage";

function PublicRoute({ children, authResult }) {
  if (authResult) return <Navigate to="/" replace />;
  return children;
}

function ProtectedRoute({ children, authResult }) {
  if (authResult === false) return <Navigate to="/login" replace />;
  return children;
}

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500&display=swap');
  @keyframes dotPulse {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
    40% { transform: scale(1); opacity: 1; }
  }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
  @keyframes spin { to { transform: rotate(360deg); } }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  ::placeholder { color: #555 !important; }
  input, textarea { color-scheme: dark; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: #3f3f3f; border-radius: 4px; }
`;

export default function App() {
  const [appReady, setAppReady] = useState(false);
  const [authResult, setAuthResult] = useState(null);

  useEffect(() => {
    checkAuth().then((result) => setAuthResult(result === false ? false : result));
  }, []);

  const handleLoginSuccess = useCallback((user) => {
    setAuthResult(user);
  }, []);

  const handleLogout = useCallback(() => {
    setAuthResult(false);
  }, []);

  return (
    <>
      <style>{globalStyles}</style>
      <ToastContainer />
      {!appReady && (
        <AppStartupLoader
          waitFor={checkAuth()}
          onReady={() => setAppReady(true)}
        />
      )}
      <div style={{ visibility: appReady ? "visible" : "hidden" }}>
        {authResult !== null && (
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<PublicRoute authResult={authResult}><Login onLoginSuccess={handleLoginSuccess} /></PublicRoute>} />
              <Route path="/signup" element={<PublicRoute authResult={authResult}><SignUp /></PublicRoute>} />
              <Route path="/forgot" element={<PublicRoute authResult={authResult}><ForgotPassword /></PublicRoute>} />
              <Route path="/oauth-callback" element={<OAuthCallback />} />
              <Route path="/" element={<ProtectedRoute authResult={authResult}><ChatPage authResult={authResult} onLogout={handleLogout} /></ProtectedRoute>} />
              <Route path="/c/:conversationId" element={<ProtectedRoute authResult={authResult}><ChatPage authResult={authResult} onLogout={handleLogout} /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        )}
      </div>
    </>
  );
}
