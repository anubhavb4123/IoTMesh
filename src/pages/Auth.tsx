import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { database } from "@/lib/firebase";
import { ref, push, onValue } from "firebase/database";
import { sounds } from "@/lib/sounds";
import { haptic } from "@/lib/haptic";
import AuthBackground from "@/components/AuthBackground";

// ── Credentials from environment (defaults) ──
const ENV_GUEST_PASSWORD = import.meta.env.VITE_GUEST_PASSWORD;
const ENV_GUEST_PASSWORD_New = import.meta.env.VITE_GUEST_PASSWORD_New;
const ENV_ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

export default function Auth() {
  const navigate = useNavigate();
  const { setRole } = useAuth();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [step, setStep] = useState<"signin" | "admin_password">("signin");
  const [isLoading, setIsLoading] = useState(false);

  // ── Runtime password overrides from Firebase ──
  const [fbPasswords, setFbPasswords] = useState<Record<string, string>>({});

  // Derived passwords: Firebase override > env default
  const GUEST_PASSWORD = ENV_GUEST_PASSWORD;
  const GUEST_PASSWORD_New = fbPasswords.guestPassword || ENV_GUEST_PASSWORD_New;
  const ADMIN_PASSWORD = fbPasswords.adminPassword || ENV_ADMIN_PASSWORD;

  // ── Listen to Firebase password overrides ──
  useEffect(() => {
    const unsub = onValue(ref(database, "security/passwords"), (snap) => {
      if (snap.exists()) {
        setFbPasswords(snap.val());
      }
    });
    return () => unsub();
  }, []);

  // ── Auto redirect if already logged in ──
  useEffect(() => {
    const stored = localStorage.getItem("mock_user");
    if (stored) {
      const user = JSON.parse(stored);
      setRole(user.role);
    }
  }, []);

  // Save login to Firebase
  const saveLoginToFirebase = (role: "guest" | "admin") => {
    push(ref(database, "home/users"), { name, role, timestamp: Date.now() });
  };

  // Step 1: Verify access key
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      sounds.error();
      haptic.warning();
      toast.error("Please enter your name", { className: "toast-admin-warning" });
      return;
    }

    setIsLoading(true);
    // Brief delay for polished feel
    await new Promise((r) => setTimeout(r, 600));

    if (password === GUEST_PASSWORD) {
      sounds.wrongPass();
      haptic.error();
      toast.error("System Update: Password has been changed. Please use the latest access key.", { className: "toast-admin-warning" });
      setIsLoading(false);
      return;
    }

    if (password === GUEST_PASSWORD_New) {
      sounds.success();
      haptic.success();
      toast.success("Access key verified", { className: "toast-success" });
      setIsLoading(false);
      setStep("admin_password");
      return;
    }

    sounds.wrongPass();
    haptic.error();
    toast.error("Incorrect access key", { className: "toast-admin-warning" });
    setIsLoading(false);
  };

  // ── Admin login ──
  const handleAdminLogin = async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 400));

    if (adminPassword === ADMIN_PASSWORD) {
      localStorage.setItem("mock_user", JSON.stringify({ name, role: "admin" }));
      setRole("admin");
      saveLoginToFirebase("admin");
      sounds.loginSuccess();
      haptic.success();
      toast.success("Welcome, Administrator", { className: "toast-success" });
      navigate("/dashboard");
    } else {
      sounds.wrongPass();
      haptic.error();
      toast.error("Invalid admin passkey", { className: "toast-admin-warning" });
    }
    setIsLoading(false);
  };

  // Guest login
  const handleGuestLogin = async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    localStorage.setItem("mock_user", JSON.stringify({ name, role: "guest" }));
    setRole("guest");
    saveLoginToFirebase("guest");
    sounds.loginSuccess();
    haptic.success();
    toast.success("Welcome, Guest", { className: "toast-success" });
    navigate("/dashboard");
  };

  return (
    <div className="auth-page">
      {/* ── Animated background ── */}
      <AuthBackground />

      {/* ── Overlays ── */}
      <div className="auth-overlay" />
      <div className="auth-noise" />

      {/* ── Main content ── */}
      <div className="auth-container">

        {/* Explore IoTMesh button */}
        <div className="auth-explore-wrapper" style={{ animationDelay: "0.1s" }}>
          <button
            onClick={() => navigate("/iotmesh")}
            className="auth-explore-btn group"
          >
            <span className="auth-explore-text">
              Explore{" "}
              <span className="auth-brand-text">
                I<span className="auth-brand-accent">o</span>TMesh
              </span>
            </span>
            <svg className="auth-explore-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>

        {/* ── Login card ── */}
        <Card className="auth-card" style={{ animationDelay: "0.2s" }}>
          {/* Top highlight line */}
          <div className="auth-card-highlight" />

          <CardHeader className="auth-card-header">
            {/* Logo */}
            <div className="auth-logo" style={{ animationDelay: "0.35s" }}>
              <video autoPlay muted loop playsInline className="auth-logo-video">
                <source src="/logo-video.mp4" type="video/mp4" />
              </video>
            </div>

            {/* Title & Description */}
            <div className="auth-title-group" style={{ animationDelay: "0.45s" }}>
              <CardTitle className="auth-title">
                {step === "signin" ? (
                  <>Welcome to <span className="auth-title-accent">IoTMesh</span></>
                ) : (
                  <>Choose <span className="auth-title-accent">Access Level</span></>
                )}
              </CardTitle>
              <CardDescription className="auth-description">
                {step === "signin"
                  ? "Sign in with your credentials to access the control panel"
                  : "Enter admin passkey or continue with guest privileges"}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="auth-card-content" style={{ animationDelay: "0.55s" }}>
            {step === "signin" ? (
              <form onSubmit={handleSignIn} className="auth-form">
                <div className="auth-field">
                  <Label className="auth-label">
                    <svg className="auth-label-icon" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                    </svg>
                    Full Name
                  </Label>
                  <Input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="auth-input"
                    autoComplete="name"
                    disabled={isLoading}
                  />
                </div>

                <div className="auth-field">
                  <Label className="auth-label">
                    <svg className="auth-label-icon" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Access Key
                  </Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="auth-input auth-input-mono"
                    autoComplete="current-password"
                    disabled={isLoading}
                  />
                </div>

                <Button
                  type="submit"
                  className="auth-btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="auth-loading">
                      <span className="auth-spinner" />
                      Verifying...
                    </span>
                  ) : (
                    "Authenticate"
                  )}
                </Button>
              </form>
            ) : (
              <div className="auth-form auth-step2">
                {/* Greeting pill */}
                <div className="auth-greeting">
                  <span className="auth-greeting-dot" />
                  <span>Authenticated as <strong>{name}</strong></span>
                </div>

                <div className="auth-field">
                  <Label className="auth-label">
                    <svg className="auth-label-icon" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5C17.944 5.327 18 5.66 18 6v6c0 3.313-3.582 6.426-8 8-4.418-1.574-8-4.687-8-8V6c0-.34.056-.673.166-1.001z" clipRule="evenodd" />
                    </svg>
                    Admin Passkey
                    <span className="auth-label-optional">optional</span>
                  </Label>
                  <Input
                    type="password"
                    placeholder="Enter admin passkey"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="auth-input auth-input-mono"
                    autoComplete="off"
                    disabled={isLoading}
                  />
                </div>

                <div className="auth-actions">
                  <Button
                    onClick={handleAdminLogin}
                    className="auth-btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="auth-loading">
                        <span className="auth-spinner" />
                        Authenticating...
                      </span>
                    ) : (
                      <>
                        <svg className="auth-btn-icon" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5C17.944 5.327 18 5.66 18 6v6c0 3.313-3.582 6.426-8 8-4.418-1.574-8-4.687-8-8V6c0-.34.056-.673.166-1.001z" clipRule="evenodd" />
                        </svg>
                        Login as Administrator
                      </>
                    )}
                  </Button>
                  <div className="auth-divider">
                    <span className="auth-divider-line" />
                    <span className="auth-divider-text">or</span>
                    <span className="auth-divider-line" />
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleGuestLogin}
                    className="auth-btn-outline"
                    disabled={isLoading}
                  >
                    <svg className="auth-btn-icon" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                    </svg>
                    Continue as Guest
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Back button on step 2 */}
        {step === "admin_password" && (
          <button
            onClick={() => { setStep("signin"); setAdminPassword(""); }}
            className="auth-back-btn"
            style={{ animationDelay: "0.65s" }}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="auth-back-icon">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to sign in
          </button>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="auth-footer" style={{ animationDelay: "0.7s" }}>
        <span>IoTMesh</span>
        <span className="auth-footer-sep">•</span>
        <span>v24.03.26</span>
        <span className="auth-footer-sep">•</span>
        <span>© {new Date().getFullYear()} All rights reserved</span>
      </div>

      {/* ── Styles ── */}
      <style>{`
        /* ── Layout ── */
        .auth-page {
          position: relative;
          min-height: 100vh;
          min-height: 100dvh;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #000000;
        }

        .auth-overlay {
          position: fixed;
          inset: 0;
          z-index: -1;
          background: linear-gradient(
            180deg,
            rgba(0, 0, 0, 0.30) 0%,
            rgba(0, 0, 0, 0.45) 50%,
            rgba(0, 0, 0, 0.55) 100%
          );
        }

        .auth-noise {
          position: fixed;
          inset: 0;
          z-index: -1;
          opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          pointer-events: none;
        }

        .auth-container {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          max-width: 420px;
          padding: 1rem;
        }

        /* ── Explore button ── */
        .auth-explore-wrapper {
          width: 100%;
          margin-bottom: 1.75rem;
          animation: authSlideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .auth-explore-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          color: rgba(255, 255, 255, 0.8);
          font-weight: 500;
          font-size: 0.925rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .auth-explore-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.15);
          color: #fff;
          transform: translateY(-1px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .auth-explore-btn:active {
          transform: scale(0.98);
        }

        .auth-explore-text {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .auth-brand-text {
          font-weight: 700;
          letter-spacing: 0.03em;
        }

        .auth-brand-accent {
          color: hsl(var(--primary));
          text-shadow: 0 0 12px hsl(var(--primary) / 0.4);
        }

        .auth-explore-arrow {
          width: 16px;
          height: 16px;
          opacity: 0.5;
          transition: all 0.3s ease;
        }

        .auth-explore-btn:hover .auth-explore-arrow {
          opacity: 0.9;
          transform: translateX(3px);
        }

        /* ── Card ── */
        .auth-card {
          width: 100%;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          background: rgba(10, 10, 15, 0.6) !important;
          backdrop-filter: blur(40px) saturate(1.4);
          -webkit-backdrop-filter: blur(40px) saturate(1.4);
          box-shadow:
            0 24px 80px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.03) inset;
          border-radius: 20px !important;
          overflow: hidden;
          position: relative;
          animation: authSlideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .auth-card-highlight {
          position: absolute;
          top: 0;
          left: 10%;
          right: 10%;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.15),
            transparent
          );
        }

        /* ── Card Header ── */
        .auth-card-header {
          text-align: center;
          padding: 2rem 2rem 0.5rem !important;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.25rem !important;
        }

        .auth-logo {
          width: 68px;
          height: 68px;
          border-radius: 18px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow:
            0 8px 32px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.05) inset;
          animation: authScaleIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .auth-logo-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .auth-title-group {
          animation: authSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .auth-title {
          font-size: 1.625rem !important;
          font-weight: 700 !important;
          color: #fff !important;
          letter-spacing: -0.02em;
          line-height: 1.3;
          background: none !important;
          -webkit-text-fill-color: unset !important;
        }

        .auth-title-accent {
          color: hsl(var(--primary));
        }

        .auth-description {
          color: rgba(255, 255, 255, 0.5) !important;
          font-size: 0.875rem !important;
          margin-top: 0.375rem;
          line-height: 1.5;
        }

        /* ── Card Content ── */
        .auth-card-content {
          padding: 1rem 2rem 2rem !important;
          animation: authSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        /* ── Form ── */
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .auth-step2 {
          animation: authSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .auth-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .auth-label {
          display: flex !important;
          align-items: center;
          gap: 0.4rem;
          color: rgba(255, 255, 255, 0.7) !important;
          font-size: 0.8125rem !important;
          font-weight: 500 !important;
          letter-spacing: 0.02em;
          padding-left: 0.125rem;
        }

        .auth-label-icon {
          width: 14px;
          height: 14px;
          opacity: 0.5;
        }

        .auth-label-optional {
          margin-left: auto;
          font-size: 0.7rem;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.3);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .auth-input {
          height: 48px !important;
          border-radius: 12px !important;
          background: rgba(255, 255, 255, 0.04) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          color: #fff !important;
          font-size: 0.925rem !important;
          padding: 0 1rem !important;
          transition: all 0.25s ease !important;
        }

        .auth-input::placeholder {
          color: rgba(255, 255, 255, 0.25) !important;
        }

        .auth-input:focus {
          border-color: hsl(var(--primary) / 0.5) !important;
          box-shadow: 0 0 0 3px hsl(var(--primary) / 0.1),
                      0 0 20px hsl(var(--primary) / 0.05) !important;
          background: rgba(255, 255, 255, 0.06) !important;
          outline: none !important;
        }

        .auth-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .auth-input-mono {
          font-family: "SF Mono", "Fira Code", "Cascadia Code", monospace !important;
          letter-spacing: 0.15em !important;
        }

        /* ── Greeting pill ── */
        .auth-greeting {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          border-radius: 10px;
          background: hsl(var(--primary) / 0.08);
          border: 1px solid hsl(var(--primary) / 0.15);
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.825rem;
        }

        .auth-greeting-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: hsl(var(--primary));
          box-shadow: 0 0 8px hsl(var(--primary) / 0.6);
          animation: authPulse 2s ease-in-out infinite;
        }

        /* ── Buttons ── */
        .auth-btn-primary {
          width: 100%;
          height: 48px !important;
          border-radius: 12px !important;
          font-weight: 600 !important;
          font-size: 0.925rem !important;
          letter-spacing: 0.01em;
          transition: all 0.3s ease !important;
          box-shadow: 0 4px 20px hsl(var(--primary) / 0.25) !important;
        }

        .auth-btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 32px hsl(var(--primary) / 0.35) !important;
        }

        .auth-btn-primary:active:not(:disabled) {
          transform: scale(0.98);
        }

        .auth-btn-outline {
          width: 100%;
          height: 48px !important;
          border-radius: 12px !important;
          font-weight: 500 !important;
          font-size: 0.925rem !important;
          background: rgba(255, 255, 255, 0.04) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          color: rgba(255, 255, 255, 0.85) !important;
          transition: all 0.3s ease !important;
        }

        .auth-btn-outline:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.08) !important;
          border-color: rgba(255, 255, 255, 0.18) !important;
          color: #fff !important;
          transform: translateY(-1px);
        }

        .auth-btn-outline:active:not(:disabled) {
          transform: scale(0.98);
        }

        .auth-btn-icon {
          width: 16px;
          height: 16px;
          margin-right: 0.375rem;
          opacity: 0.7;
        }

        /* ── Divider ── */
        .auth-divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.25rem 0;
        }

        .auth-divider-line {
          flex: 1;
          height: 1px;
          background: rgba(255, 255, 255, 0.06);
        }

        .auth-divider-text {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.3);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 500;
        }

        .auth-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        /* ── Loading ── */
        .auth-loading {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .auth-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-top-color: #fff;
          border-radius: 50%;
          animation: authSpin 0.7s linear infinite;
        }

        /* ── Back button ── */
        .auth-back-btn {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          margin-top: 1.25rem;
          padding: 0.5rem 0.75rem;
          border: none;
          background: none;
          color: rgba(255, 255, 255, 0.45);
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.25s ease;
          border-radius: 8px;
          animation: authSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .auth-back-btn:hover {
          color: rgba(255, 255, 255, 0.8);
          background: rgba(255, 255, 255, 0.05);
        }

        .auth-back-icon {
          width: 14px;
          height: 14px;
        }

        /* ── Footer ── */
        .auth-footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 20;
          text-align: center;
          padding: 1rem;
          font-size: 0.6875rem;
          color: rgba(255, 255, 255, 0.3);
          font-weight: 500;
          letter-spacing: 0.04em;
          pointer-events: none;
          animation: authSlideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .auth-footer-sep {
          margin: 0 0.5rem;
          opacity: 0.5;
        }

        /* ── Animations ── */
        @keyframes authSlideUp {
          from {
            opacity: 0;
            transform: translateY(24px);
            filter: blur(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        @keyframes authScaleIn {
          from {
            opacity: 0;
            transform: scale(0.85);
            filter: blur(6px);
          }
          to {
            opacity: 1;
            transform: scale(1);
            filter: blur(0);
          }
        }

        @keyframes authSpin {
          to { transform: rotate(360deg); }
        }

        @keyframes authPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        /* ── Mobile adjustments ── */
        @media (max-width: 480px) {
          .auth-container {
            padding: 0.75rem;
          }
          .auth-card-header {
            padding: 1.5rem 1.5rem 0.5rem !important;
          }
          .auth-card-content {
            padding: 0.75rem 1.5rem 1.5rem !important;
          }
          .auth-title {
            font-size: 1.375rem !important;
          }
        }
      `}</style>
    </div>
  );
}
