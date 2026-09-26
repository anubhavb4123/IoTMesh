import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/Layout";
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

interface PasswordConfig {
  key: string;
  label: string;
  envKey: string;
  firebaseKey: string;
  icon: typeof Lock;
  description: string;
}

const PASSWORD_CONFIGS: PasswordConfig[] = [
  {
    key: "guestPassword",
    label: "Guest Access Key",
    envKey: "VITE_GUEST_PASSWORD_New",
    firebaseKey: "guestPassword",
    icon: KeyRound,
    description: "Used by guests to access the dashboard",
  },
  {
    key: "adminPassword",
    label: "Admin Passkey",
    envKey: "VITE_ADMIN_PASSWORD",
    firebaseKey: "adminPassword",
    icon: Shield,
    description: "Grants full administrative privileges",
  },
  {
    key: "armPassword",
    label: "Arm Passcode",
    envKey: "VITE_ARM_PASSWORD",
    firebaseKey: "armPassword",
    icon: ShieldCheck,
    description: "Required to arm the high-voltage ignition system",
  },
  {
    key: "securityPassword",
    label: "Security Master Password",
    envKey: "VITE_SECURITY_PASSWORD",
    firebaseKey: "securityPassword",
    icon: Lock,
    description: "Master security lock override code",
  },
];

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

  // OTP state
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpTarget, setOtpTarget] = useState<PasswordConfig | null>(null);
  const [otpValue, setOtpValue] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Reset password state
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetShowNew, setResetShowNew] = useState(false);

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

  const getCurrentPassword = useCallback(
    (config: PasswordConfig): string => {
      return firebasePasswords[config.firebaseKey] || getEnvPassword(config.envKey);
    },
    [firebasePasswords]
  );

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
      await set(ref(database, "security/otp"), {
        requested: true,
        targetKey: config.firebaseKey,
        timestamp: Date.now(),
      });

      sounds.alert();
      haptic.medium();
      toast.success("OTP request sent! Check admin Telegram.");
      setOtpCountdown(300);
    } catch (e) {
      console.error("OTP request failed:", e);
      toast.error("Failed to request OTP");
      sounds.error();
      haptic.error();
    } finally {
      setOtpSending(false);
    }
  };

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
      if (otpData.expiresAt && Date.now() > otpData.expiresAt) {
        setOtpError("Code expired. Please request a new one.");
        sounds.wrongPass();
        haptic.wrong();
        return;
      }

      if (String(otpData.code) === otpValue) {
        setOtpVerified(true);
        setOtpError("");
        sounds.success();
        haptic.success();
        toast.success("Code verified! Set your new password.");
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
      toast.success(`${otpTarget.label} has been reset!`);
      setOtpDialogOpen(false);
    } catch (e) {
      console.error("Password reset failed:", e);
      toast.error("Failed to reset password");
      sounds.error();
      haptic.error();
    }
  };

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <Layout>
      <div className="space-y-6 pb-12 max-w-[1440px] mx-auto">
        
        {/* ── Header ── */}
        <div className="pt-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#18191c]">
            Security & Access Management
          </h1>
          <p className="text-xs text-[#797a82] mt-0.5">
            Configure system authentication passkeys and Telegram 2FA verification — Admin Only
          </p>
        </div>

        {/* ── Info Banner ── */}
        <div className="clay-card p-4 flex items-start gap-3 bg-white/90">
          <Shield className="h-5 w-5 text-[#18191c] shrink-0 mt-0.5" />
          <p className="text-xs text-[#55565d] leading-relaxed">
            <strong>Password changes take effect immediately across all sessions.</strong> All users will need the updated credentials on their next authorization. Use <strong>Forgot Password</strong> to dispatch a 6-digit OTP code to the linked Telegram channel.
          </p>
        </div>

        {/* ── Password Cards Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PASSWORD_CONFIGS.map((config) => (
            <PasswordCard
              key={config.key}
              config={config}
              currentPassword={getCurrentPassword(config)}
              onForgotPassword={() => requestOtp(config)}
            />
          ))}
        </div>
      </div>

      {/* ── OTP Dialog ── */}
      <Dialog open={otpDialogOpen} onOpenChange={setOtpDialogOpen}>
        <DialogContent className="max-w-md bg-white border border-black/[0.08] rounded-3xl p-6 space-y-4 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#18191c] font-bold text-base">
              <Send className="h-5 w-5 text-[#18191c]" />
              {otpVerified ? "Set New Password" : "Telegram OTP Verification"}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#797a82]">
              {otpVerified
                ? `Enter a new ${otpTarget?.label ?? "password"}`
                : "Enter the 6-digit verification code sent to admin Telegram"}
            </DialogDescription>
          </DialogHeader>

          {!otpVerified ? (
            <div className="space-y-5 py-2">
              {otpTarget && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#edece8] text-xs font-bold text-[#18191c]">
                  <otpTarget.icon className="h-3.5 w-3.5" />
                  <span>{otpTarget.label}</span>
                </div>
              )}

              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otpValue}
                  onChange={setOtpValue}
                  containerClassName="gap-2"
                >
                  <InputOTPGroup className="gap-2">
                    <InputOTPSlot index={0} className="w-10 h-12 rounded-xl bg-[#edece8] border-black/[0.1] text-base font-bold text-[#18191c]" />
                    <InputOTPSlot index={1} className="w-10 h-12 rounded-xl bg-[#edece8] border-black/[0.1] text-base font-bold text-[#18191c]" />
                    <InputOTPSlot index={2} className="w-10 h-12 rounded-xl bg-[#edece8] border-black/[0.1] text-base font-bold text-[#18191c]" />
                  </InputOTPGroup>
                  <InputOTPSeparator className="text-[#9b9a94]" />
                  <InputOTPGroup className="gap-2">
                    <InputOTPSlot index={3} className="w-10 h-12 rounded-xl bg-[#edece8] border-black/[0.1] text-base font-bold text-[#18191c]" />
                    <InputOTPSlot index={4} className="w-10 h-12 rounded-xl bg-[#edece8] border-black/[0.1] text-base font-bold text-[#18191c]" />
                    <InputOTPSlot index={5} className="w-10 h-12 rounded-xl bg-[#edece8] border-black/[0.1] text-base font-bold text-[#18191c]" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {otpError && (
                <p className="text-center text-xs font-bold text-red-600 flex items-center justify-center gap-1">
                  <XCircle className="h-3.5 w-3.5" />
                  {otpError}
                </p>
              )}

              {otpCountdown > 0 && (
                <p className="text-center text-xs text-[#797a82] font-mono">
                  Code expires in <span className="text-[#18191c] font-bold">{formatCountdown(otpCountdown)}</span>
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={verifyOtp}
                  disabled={otpValue.length !== 6}
                  className="flex-1 clay-btn-dark text-xs disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 inline mr-1.5" /> Verify Code
                </button>
                <button
                  onClick={() => otpTarget && requestOtp(otpTarget)}
                  disabled={otpSending}
                  className="clay-btn text-xs"
                >
                  <RefreshCw className={`h-3.5 w-3.5 inline mr-1.5 ${otpSending ? "animate-spin" : ""}`} /> Resend
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-emerald-50 text-emerald-700 text-xs font-bold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Identity verified via Telegram 2FA</span>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#55565d]">New Password</Label>
                  <div className="relative">
                    <Input
                      type={resetShowNew ? "text" : "password"}
                      placeholder="Enter new password"
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      className="bg-[#edece8] border-black/[0.08] text-xs font-bold text-[#18191c] rounded-xl pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setResetShowNew(!resetShowNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#797a82]"
                    >
                      {resetShowNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#55565d]">Confirm Password</Label>
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    className="bg-[#edece8] border-black/[0.08] text-xs font-bold text-[#18191c] rounded-xl"
                  />
                </div>
              </div>

              <button
                onClick={handleOtpReset}
                disabled={!resetNewPassword || resetNewPassword !== resetConfirmPassword}
                className="w-full clay-btn-dark text-xs disabled:opacity-50"
              >
                <Lock className="h-3.5 w-3.5 inline mr-1.5" /> Save Password
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

function PasswordCard({
  config,
  currentPassword,
  onForgotPassword,
}: {
  config: PasswordConfig;
  currentPassword: string;
  onForgotPassword: () => void;
}) {
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
      toast.success(`${config.label} updated successfully!`);
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

  return (
    <div className="clay-card p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#edece8] flex items-center justify-center text-[#18191c] shadow-inner">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-[#18191c]">{config.label}</h3>
            <p className="text-[11px] text-[#797a82]">{config.description}</p>
          </div>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono badge-running">
          Active
        </span>
      </div>

      {mode === "idle" ? (
        <div className="space-y-3 pt-1">
          <div className="p-3 rounded-2xl bg-[#edece8] border border-black/[0.05] flex items-center gap-2 shadow-inner">
            <Lock className="h-3.5 w-3.5 text-[#797a82]" />
            <span className="font-mono text-sm tracking-[0.2em] font-bold text-[#55565d]">
              {"•".repeat(Math.max(currentPassword.length, 6))}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setMode("change");
                sounds.click();
                haptic.light();
              }}
              className="flex-1 clay-btn-dark text-xs"
            >
              <KeyRound className="h-3.5 w-3.5 inline mr-1.5" /> Change Password
            </button>
            <button
              onClick={() => {
                onForgotPassword();
                sounds.click();
                haptic.light();
              }}
              className="clay-btn text-xs"
              title="Reset via Telegram OTP"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          <div className="space-y-1">
            <Label className="text-xs font-bold text-[#55565d]">Current Password</Label>
            <div className="relative">
              <Input
                type={showOld ? "text" : "password"}
                placeholder="Enter current password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="bg-[#edece8] border-black/[0.08] text-xs font-bold text-[#18191c] rounded-xl pr-10"
              />
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#797a82]"
              >
                {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-[#55565d]">New Password</Label>
            <div className="relative">
              <Input
                type={showNew ? "text" : "password"}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-[#edece8] border-black/[0.08] text-xs font-bold text-[#18191c] rounded-xl pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#797a82]"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-bold text-[#55565d]">Confirm Password</Label>
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-[#edece8] border-black/[0.08] text-xs font-bold text-[#18191c] rounded-xl"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleChangePassword}
              disabled={saving || !oldPassword || !newPassword || !confirmPassword}
              className="flex-1 clay-btn-dark text-xs disabled:opacity-50"
            >
              {saving ? "Updating..." : "Update Password"}
            </button>
            <button
              onClick={() => setMode("idle")}
              className="clay-btn text-xs"
            >
              Cancel
            </button>
          </div>

          <button
            onClick={() => {
              setMode("idle");
              onForgotPassword();
            }}
            className="text-[11px] font-bold text-[#18191c] hover:underline flex items-center gap-1 mt-1"
          >
            <Send className="h-3 w-3" /> Forgot password? Get code via Telegram
          </button>
        </div>
      )}
    </div>
  );
}
