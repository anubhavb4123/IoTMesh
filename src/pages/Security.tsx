import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  Send,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Shield,
} from "lucide-react";
import { database } from "@/lib/firebase";
import { ref, onValue, set, get } from "firebase/database";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { sounds } from "@/lib/sounds";
import { haptic } from "@/lib/haptic";

// ── Password type definitions ──
interface PasswordConfig {
  key: string;
  label: string;
  envKey: string;
  firebaseKey: string;
  icon: typeof Lock;
  description: string;
  color: string;
  glowColor: string;
}

const PASSWORD_CONFIGS: PasswordConfig[] = [
  {
    key: "guestPassword",
    label: "Guest Access Key",
    envKey: "VITE_GUEST_PASSWORD_New",
    firebaseKey: "guestPassword",
    icon: KeyRound,
    description: "Used by guests to access the dashboard",
    color: "from-white/30 to-white/10",
    glowColor: "rgba(255, 255, 255, 0.05)",
  },
  {
    key: "adminPassword",
    label: "Admin Passkey",
    envKey: "VITE_ADMIN_PASSWORD",
    firebaseKey: "adminPassword",
    icon: Shield,
    description: "Grants full admin privileges",
    color: "from-white/30 to-white/10",
    glowColor: "rgba(255, 255, 255, 0.05)",
  },
  {
    key: "armPassword",
    label: "Arm Password",
    envKey: "VITE_ARM_PASSWORD",
    firebaseKey: "armPassword",
    icon: ShieldCheck,
    description: "Required to arm the ignition system",
    color: "from-white/30 to-white/10",
    glowColor: "rgba(255, 255, 255, 0.05)",
  },
  {
    key: "securityPassword",
    label: "Security Password",
    envKey: "VITE_SECURITY_PASSWORD",
    firebaseKey: "securityPassword",
    icon: Lock,
    description: "Master security password",
    color: "from-white/30 to-white/10",
    glowColor: "rgba(255, 255, 255, 0.05)",
  },
];

// ── Get current password (Firebase override > env default) ──
function getEnvPassword(envKey: string): string {
  const envMap: Record<string, string> = {
    VITE_GUEST_PASSWORD_New: import.meta.env.VITE_GUEST_PASSWORD_New || "",
    VITE_ADMIN_PASSWORD: import.meta.env.VITE_ADMIN_PASSWORD || "",
    VITE_ARM_PASSWORD: import.meta.env.VITE_ARM_PASSWORD || "",
    VITE_SECURITY_PASSWORD: import.meta.env.VITE_SECURITY_PASSWORD || "",
  };
  return envMap[envKey] || "";
}

export default function Security() {
  const { role } = useAuth();
  const [firebasePasswords, setFirebasePasswords] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // ── OTP state ──
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpTarget, setOtpTarget] = useState<PasswordConfig | null>(null);
  const [otpValue, setOtpValue] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(0);

  // ── Reset password state (after OTP verified) ──
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetShowNew, setResetShowNew] = useState(false);

  // ── Listen to Firebase password overrides ──
  useEffect(() => {
    const unsub = onValue(ref(database, "security/passwords"), (snap) => {
      if (snap.exists()) {
        setFirebasePasswords(snap.val());
      } else {
        setFirebasePasswords({});
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // ── OTP countdown timer ──
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setInterval(() => {
      setOtpCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [otpCountdown]);

  // ── Get current password ──
  const getCurrentPassword = useCallback(
    (config: PasswordConfig): string => {
      return firebasePasswords[config.firebaseKey] || getEnvPassword(config.envKey);
    },
    [firebasePasswords]
  );

  // ── Request OTP via Firebase ──
  const requestOtp = async (config: PasswordConfig) => {
    setOtpTarget(config);
    setOtpDialogOpen(true);
    setOtpValue("");
    setOtpVerified(false);
    setOtpError("");
    setOtpSending(true);
    setResetNewPassword("");
    setResetConfirmPassword("");
    setResetShowNew(false);

    try {
      // Write OTP request to Firebase — backend will pick this up
      await set(ref(database, "security/otp"), {
        requested: true,
        targetKey: config.firebaseKey,
        timestamp: Date.now(),
      });

      sounds.alert();
      haptic.medium();
      toast.success("OTP request sent! Check admin Telegram.", {
        className: "toast-success",
      });
      setOtpCountdown(300); // 5 minutes
    } catch (e) {
      console.error("OTP request failed:", e);
      toast.error("Failed to request OTP");
      sounds.error();
      haptic.error();
    } finally {
      setOtpSending(false);
    }
  };

  // ── Verify OTP ──
  const verifyOtp = async () => {
    if (otpValue.length !== 6) {
      setOtpError("Please enter all 6 digits");
      sounds.wrongPass();
      haptic.wrong();
      return;
    }

    try {
      const snap = await get(ref(database, "security/otp"));
      if (!snap.exists()) {
        setOtpError("No OTP found. Please request a new code.");
        sounds.wrongPass();
        haptic.wrong();
        return;
      }

      const otpData = snap.val();

      // Check expiry
      if (otpData.expiresAt && Date.now() > otpData.expiresAt) {
        setOtpError("Code expired. Please request a new one.");
        sounds.wrongPass();
        haptic.wrong();
        return;
      }

      // Check code
      if (String(otpData.code) === otpValue) {
        setOtpVerified(true);
        setOtpError("");
        sounds.success();
        haptic.success();
        toast.success("Code verified! Set your new password.", {
          className: "toast-success",
        });

        // Clear the OTP from Firebase
        await set(ref(database, "security/otp"), null);
      } else {
        setOtpError("Incorrect code. Please try again.");
        sounds.wrongPass();
        haptic.wrong();
      }
    } catch (e) {
      console.error("OTP verification failed:", e);
      setOtpError("Verification failed. Please try again.");
      sounds.error();
      haptic.error();
    }
  };

  // ── Reset password (after OTP) ──
  const handleOtpReset = async () => {
    if (!otpTarget) return;
    if (!resetNewPassword.trim()) {
      toast.error("Enter a new password");
      sounds.error();
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      toast.error("Passwords don't match");
      sounds.wrongPass();
      haptic.wrong();
      return;
    }

    try {
      await set(
        ref(database, `security/passwords/${otpTarget.firebaseKey}`),
        resetNewPassword
      );
      sounds.complete();
      haptic.complete();
      toast.success(`${otpTarget.label} has been reset!`, {
        className: "toast-success",
      });
      setOtpDialogOpen(false);
    } catch (e) {
      console.error("Password reset failed:", e);
      toast.error("Failed to reset password");
      sounds.error();
      haptic.error();
    }
  };

  // ── Format OTP countdown ──
  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="sec-loading-spinner" />
        </div>
        <style>{securityStyles}</style>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6" style={{ animation: "secFadeIn 0.4s ease both" }}>
        {/* ── Header ── */}
        <div style={{ animation: "secFadeIn 0.4s ease both" }}>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white via-white to-neutral-400 bg-clip-text text-transparent flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-white" />
            Security
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage system passwords and access keys — Admin only
          </p>
        </div>

        {/* ── Info Banner ── */}
        <div
          className="sec-info-banner"
          style={{ animation: "secFadeIn 0.4s ease both", animationDelay: "0.05s" }}
        >
          <Shield className="h-5 w-5 text-white shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-white/80">
              <strong>Password changes take effect immediately.</strong> All users
              will need the new credentials on their next login. Use{" "}
              <span className="text-white font-medium">Forgot Password</span> to
              receive a 6-digit verification code on the admin Telegram.
            </p>
          </div>
        </div>

        {/* ── Password Cards Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {PASSWORD_CONFIGS.map((config, i) => (
            <PasswordCard
              key={config.key}
              config={config}
              currentPassword={getCurrentPassword(config)}
              delay={0.1 + i * 0.07}
              onForgotPassword={() => requestOtp(config)}
            />
          ))}
        </div>
      </div>

      {/* ── OTP Dialog ── */}
      <Dialog open={otpDialogOpen} onOpenChange={setOtpDialogOpen}>
        <DialogContent className="sec-otp-dialog">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Send className="h-5 w-5 text-white" />
              {otpVerified ? "Set New Password" : "Telegram Verification"}
            </DialogTitle>
            <DialogDescription className="text-white/50">
              {otpVerified
                ? `Enter a new ${otpTarget?.label ?? "password"}`
                : "Enter the 6-digit code sent to admin Telegram"}
            </DialogDescription>
          </DialogHeader>

          {!otpVerified ? (
            /* ── OTP Entry ── */
            <div className="space-y-5 py-2">
              {/* Target badge */}
              {otpTarget && (
                <div className="sec-otp-target-badge">
                  <otpTarget.icon className="h-4 w-4" />
                  <span>{otpTarget.label}</span>
                </div>
              )}

              {/* OTP Input */}
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otpValue}
                  onChange={setOtpValue}
                  containerClassName="gap-2"
                >
                  <InputOTPGroup className="gap-2">
                    <InputOTPSlot index={0} className="sec-otp-slot" />
                    <InputOTPSlot index={1} className="sec-otp-slot" />
                    <InputOTPSlot index={2} className="sec-otp-slot" />
                  </InputOTPGroup>
                  <InputOTPSeparator className="text-white/30" />
                  <InputOTPGroup className="gap-2">
                    <InputOTPSlot index={3} className="sec-otp-slot" />
                    <InputOTPSlot index={4} className="sec-otp-slot" />
                    <InputOTPSlot index={5} className="sec-otp-slot" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {/* Error */}
              {otpError && (
                <div className="sec-otp-error">
                  <XCircle className="h-4 w-4" />
                  {otpError}
                </div>
              )}

              {/* Countdown */}
              {otpCountdown > 0 && (
                <p className="text-center text-xs text-white/40">
                  Code expires in{" "}
                  <span className="text-primary font-mono font-semibold">
                    {formatCountdown(otpCountdown)}
                  </span>
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={verifyOtp}
                  className="flex-1 sec-btn-primary"
                  disabled={otpValue.length !== 6}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Verify Code
                </Button>
                <Button
                  variant="outline"
                  onClick={() => otpTarget && requestOtp(otpTarget)}
                  className="sec-btn-outline"
                  disabled={otpSending}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${otpSending ? "animate-spin" : ""}`}
                  />
                  Resend
                </Button>
              </div>
            </div>
          ) : (
            /* ── Reset Form (after OTP verified) ── */
            <div className="space-y-4 py-2">
              <div className="sec-otp-verified-badge">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Identity verified via Telegram</span>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-white/70 text-xs font-medium">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      type={resetShowNew ? "text" : "password"}
                      placeholder="Enter new password"
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      className="sec-input"
                    />
                    <button
                      type="button"
                      onClick={() => setResetShowNew(!resetShowNew)}
                      className="sec-eye-btn"
                    >
                      {resetShowNew ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-white/70 text-xs font-medium">
                    Confirm Password
                  </Label>
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    className="sec-input"
                  />
                </div>

                {resetNewPassword &&
                  resetConfirmPassword &&
                  resetNewPassword !== resetConfirmPassword && (
                    <p className="text-red-400 text-xs flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      Passwords don't match
                    </p>
                  )}
              </div>

              <Button
                onClick={handleOtpReset}
                className="w-full sec-btn-primary"
                disabled={
                  !resetNewPassword ||
                  resetNewPassword !== resetConfirmPassword
                }
              >
                <Lock className="h-4 w-4 mr-2" />
                Reset Password
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <style>{securityStyles}</style>
    </Layout>
  );
}

// ══════════════════════════════════════════════════════
//  Password Card Component
// ══════════════════════════════════════════════════════

interface PasswordCardProps {
  config: PasswordConfig;
  currentPassword: string;
  delay: number;
  onForgotPassword: () => void;
}

function PasswordCard({
  config,
  currentPassword,
  delay,
  onForgotPassword,
}: PasswordCardProps) {
  const [mode, setMode] = useState<"idle" | "change">("idle");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const Icon = config.icon;

  const handleChangePassword = async () => {
    if (oldPassword !== currentPassword) {
      toast.error("Old password is incorrect");
      sounds.wrongPass();
      haptic.wrong();
      return;
    }
    if (!newPassword.trim()) {
      toast.error("Enter a new password");
      sounds.error();
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      sounds.wrongPass();
      haptic.wrong();
      return;
    }
    if (newPassword === oldPassword) {
      toast.error("New password must be different");
      sounds.error();
      return;
    }

    setSaving(true);
    try {
      await set(
        ref(database, `security/passwords/${config.firebaseKey}`),
        newPassword
      );
      sounds.success();
      haptic.success();
      toast.success(`${config.label} updated successfully!`, {
        className: "toast-success",
      });
      setMode("idle");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e) {
      console.error("Password change failed:", e);
      toast.error("Failed to update password");
      sounds.error();
      haptic.error();
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setMode("idle");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowOld(false);
    setShowNew(false);
    sounds.click();
  };

  return (
    <Card
      className="sec-card"
      style={{
        animation: "secFadeIn 0.4s ease both",
        animationDelay: `${delay}s`,
        "--card-glow": config.glowColor,
      } as React.CSSProperties}
    >
      {/* Header */}
      <div className="sec-card-header">
        <div className="sec-card-icon-wrap">
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-base">{config.label}</h3>
          <p className="text-neutral-400 text-xs mt-0.5">{config.description}</p>
        </div>
        <Badge
          variant="outline"
          className="sec-badge"
        >
          Active
        </Badge>
      </div>

      {/* Content */}
      <div className="px-5 pb-5">
        {mode === "idle" ? (
          /* ── Idle state ── */
          <div className="space-y-3">
            {/* Current password (masked) */}
            <div className="sec-current-pass">
              <Lock className="h-3.5 w-3.5 text-white/30" />
              <span className="font-mono text-sm tracking-[0.2em] text-white/50">
                {"•".repeat(Math.max(currentPassword.length, 4))}
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setMode("change");
                  sounds.click();
                  haptic.light();
                }}
                className="flex-1 sec-btn-change"
              >
                <KeyRound className="h-4 w-4 mr-2" />
                Change Password
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  onForgotPassword();
                  sounds.click();
                  haptic.light();
                }}
                className="sec-btn-forgot"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          /* ── Change password form ── */
          <div
            className="space-y-3"
            style={{ animation: "secSlideUp 0.3s ease both" }}
          >
            {/* Old password */}
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs">Current Password</Label>
              <div className="relative">
                <Input
                  type={showOld ? "text" : "password"}
                  placeholder="Enter current password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="sec-input"
                />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="sec-eye-btn"
                >
                  {showOld ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* New password */}
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs">New Password</Label>
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="sec-input"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="sec-eye-btn"
                >
                  {showNew ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs">Confirm Password</Label>
              <Input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="sec-input"
              />
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-red-400 text-xs flex items-center gap-1 mt-1">
                  <XCircle className="h-3 w-3" />
                  Passwords don't match
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-1">
              <Button
                onClick={handleChangePassword}
                className="flex-1 sec-btn-primary"
                disabled={saving || !oldPassword || !newPassword || !confirmPassword}
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="sec-btn-spinner" />
                    Saving...
                  </span>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Update
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                className="sec-btn-outline"
                disabled={saving}
              >
                Cancel
              </Button>
            </div>

            {/* Forgot password link */}
            <button
              onClick={() => {
                handleCancel();
                onForgotPassword();
              }}
              className="sec-forgot-link"
            >
              <Send className="h-3 w-3" />
              Forgot password? Get code via Telegram
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}

// ══════════════════════════════════════════════════════
//  Styles
// ══════════════════════════════════════════════════════

const securityStyles = `
  /* ── Animations ── */
  @keyframes secFadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes secSlideUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes secSpin {
    to { transform: rotate(360deg); }
  }

  @keyframes secPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  /* ── Loading spinner ── */
  .sec-loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-top-color: hsl(var(--primary));
    border-radius: 50%;
    animation: secSpin 0.8s linear infinite;
  }

  /* ── Info Banner ── */
  .sec-info-banner {
    display: flex;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.06);
    backdrop-filter: blur(20px);
  }

  /* ── Password Card ── */
  .sec-card {
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.12) !important;
    background: #000000 !important;
    backdrop-filter: blur(20px);
    border-radius: 16px !important;
    transition: all 0.2s ease;
  }

  .sec-card:hover {
    border-color: rgba(255, 255, 255, 0.25) !important;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.8);
  }

  .sec-card-header {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    padding: 1.25rem 1.25rem 0.75rem;
  }

  .sec-card-icon-wrap {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #111111;
    border: 1px solid rgba(255, 255, 255, 0.12);
    flex-shrink: 0;
  }

  .sec-badge {
    font-size: 0.65rem !important;
    border-color: rgba(255, 255, 255, 0.15) !important;
    color: #ffffff !important;
    background: rgba(255, 255, 255, 0.06) !important;
    padding: 0.15rem 0.5rem !important;
    border-radius: 20px !important;
    font-family: monospace;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* ── Current password display ── */
  .sec-current-pass {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 0.875rem;
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  /* ── Buttons ── */
  .sec-btn-change {
    height: 40px !important;
    border-radius: 10px !important;
    font-size: 0.825rem !important;
    font-weight: 600 !important;
    background: rgba(255, 255, 255, 0.06) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    color: white !important;
    transition: all 0.3s ease !important;
  }

  .sec-btn-change:hover {
    background: rgba(255, 255, 255, 0.1) !important;
    border-color: rgba(255, 255, 255, 0.18) !important;
    transform: translateY(-1px);
  }

  .sec-btn-forgot {
    height: 40px !important;
    width: 40px !important;
    padding: 0 !important;
    border-radius: 10px !important;
    background: rgba(255, 255, 255, 0.03) !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    color: rgba(255, 255, 255, 0.5) !important;
    transition: all 0.3s ease !important;
    display: flex !important;
    align-items: center;
    justify-content: center;
  }

  .sec-btn-forgot:hover {
    background: hsl(var(--primary) / 0.1) !important;
    border-color: hsl(var(--primary) / 0.3) !important;
    color: hsl(var(--primary)) !important;
  }

  .sec-btn-primary {
    height: 42px !important;
    border-radius: 10px !important;
    font-weight: 600 !important;
    font-size: 0.85rem !important;
    box-shadow: 0 4px 16px hsl(var(--primary) / 0.2) !important;
    transition: all 0.3s ease !important;
  }

  .sec-btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 24px hsl(var(--primary) / 0.3) !important;
  }

  .sec-btn-outline {
    height: 42px !important;
    border-radius: 10px !important;
    font-weight: 500 !important;
    font-size: 0.85rem !important;
    background: rgba(255, 255, 255, 0.04) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    color: rgba(255, 255, 255, 0.7) !important;
    transition: all 0.3s ease !important;
  }

  .sec-btn-outline:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.08) !important;
    border-color: rgba(255, 255, 255, 0.18) !important;
  }

  .sec-btn-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-top-color: #fff;
    border-radius: 50%;
    animation: secSpin 0.7s linear infinite;
  }

  /* ── Input ── */
  .sec-input {
    height: 42px !important;
    border-radius: 10px !important;
    background: rgba(255, 255, 255, 0.04) !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    color: #fff !important;
    font-size: 0.875rem !important;
    padding: 0 2.5rem 0 0.875rem !important;
    transition: all 0.25s ease !important;
  }

  .sec-input::placeholder {
    color: rgba(255, 255, 255, 0.25) !important;
  }

  .sec-input:focus {
    border-color: hsl(var(--primary) / 0.5) !important;
    box-shadow: 0 0 0 3px hsl(var(--primary) / 0.1) !important;
    background: rgba(255, 255, 255, 0.06) !important;
    outline: none !important;
  }

  .sec-eye-btn {
    position: absolute;
    right: 0.625rem;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(255, 255, 255, 0.3);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    transition: color 0.2s;
  }

  .sec-eye-btn:hover {
    color: rgba(255, 255, 255, 0.6);
  }

  /* ── Forgot link ── */
  .sec-forgot-link {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    width: 100%;
    justify-content: center;
    padding: 0.375rem;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.35);
    background: none;
    border: none;
    cursor: pointer;
    transition: color 0.2s;
  }

  .sec-forgot-link:hover {
    color: hsl(var(--primary));
  }

  /* ── OTP Dialog ── */
  .sec-otp-dialog {
    background: rgba(10, 10, 15, 0.95) !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    backdrop-filter: blur(40px) !important;
    border-radius: 20px !important;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6) !important;
  }

  .sec-otp-target-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: center;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    background: hsl(var(--primary) / 0.08);
    border: 1px solid hsl(var(--primary) / 0.15);
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.825rem;
    font-weight: 500;
  }

  .sec-otp-slot {
    width: 48px !important;
    height: 56px !important;
    border-radius: 12px !important;
    background: rgba(255, 255, 255, 0.04) !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    color: #fff !important;
    font-size: 1.25rem !important;
    font-weight: 700 !important;
    font-family: "SF Mono", "Fira Code", monospace !important;
    transition: all 0.2s ease !important;
  }

  .sec-otp-slot[data-active] {
    border-color: hsl(var(--primary) / 0.5) !important;
    box-shadow: 0 0 0 3px hsl(var(--primary) / 0.15) !important;
    background: rgba(255, 255, 255, 0.06) !important;
  }

  .sec-otp-error {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    justify-content: center;
    color: #f87171;
    font-size: 0.8rem;
    animation: secSlideUp 0.3s ease both;
  }

  .sec-otp-verified-badge {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: center;
    padding: 0.625rem 1rem;
    border-radius: 10px;
    background: rgba(52, 211, 153, 0.08);
    border: 1px solid rgba(52, 211, 153, 0.2);
    color: rgba(52, 211, 153, 0.9);
    font-size: 0.825rem;
    font-weight: 500;
  }
`;
