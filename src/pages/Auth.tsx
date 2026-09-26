import { useState, useEffect } from "react";
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
import { Cpu, Lock, KeyRound, Shield, ArrowRight, User, Sparkles } from "lucide-react";

const ENV_GUEST_PASSWORD = import.meta.env.VITE_GUEST_PASSWORD;
const ENV_GUEST_PASSWORD_New = import.meta.env.VITE_GUEST_PASSWORD_New;
const ENV_ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

export default function Auth() {
  const navigate = useNavigate();
  const { setRole, login } = useAuth();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [step, setStep] = useState<"signin" | "admin_password">("signin");
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [isCheckingAuth, setIsCheckingAuth] = useState(() => {
    try {
      const stored = localStorage.getItem("mock_user");
      if (stored) {
        const u = JSON.parse(stored);
        return !!(u && u.name);
      }
    } catch {
      localStorage.removeItem("mock_user");
    }
    return false;
  });

  const [fbPasswords, setFbPasswords] = useState<Record<string, string>>({});

  const GUEST_PASSWORD = ENV_GUEST_PASSWORD;
  const GUEST_PASSWORD_New = fbPasswords.guestPassword || ENV_GUEST_PASSWORD_New;
  const ADMIN_PASSWORD = fbPasswords.adminPassword || ENV_ADMIN_PASSWORD;

  useEffect(() => {
    const unsub = onValue(ref(database, "security/passwords"), (snap) => {
      if (snap.exists()) {
        setFbPasswords(snap.val());
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("mock_user");
    if (stored) {
      try {
        const user = JSON.parse(stored);
        if (user && user.name) {
          setRole(user.role || "guest");
          navigate("/dashboard", { replace: true });
          return;
        }
      } catch {
        localStorage.removeItem("mock_user");
      }
    }
    setIsCheckingAuth(false);
  }, [navigate, setRole]);

  const saveLoginToFirebase = (role: "guest" | "admin") => {
    push(ref(database, "home/users"), { name, role, timestamp: Date.now() });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      sounds.error();
      haptic.warning();
      toast.error("Please enter your name");
      return;
    }

    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 400));

    if (password === GUEST_PASSWORD) {
      sounds.wrongPass();
      haptic.error();
      toast.error("System Update: Password has been rotated. Please use the latest access key.");
      setIsLoading(false);
      return;
    }

    if (password === GUEST_PASSWORD_New) {
      sounds.success();
      haptic.success();
      toast.success("Access key verified");
      setIsLoading(false);
      setStep("admin_password");
      return;
    }

    sounds.wrongPass();
    haptic.error();
    toast.error("Incorrect access key");
    setIsLoading(false);
  };

  const handleAdminLogin = async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 400));

    if (adminPassword === ADMIN_PASSWORD) {
      login(name, "admin", rememberMe);
      saveLoginToFirebase("admin");
      sounds.loginSuccess();
      haptic.success();
      toast.success("Welcome, Administrator");
      navigate("/dashboard", { replace: true });
    } else {
      sounds.wrongPass();
      haptic.error();
      toast.error("Invalid admin passkey");
    }
    setIsLoading(false);
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    login(name, "guest", rememberMe);
    saveLoginToFirebase("guest");
    sounds.loginSuccess();
    haptic.success();
    toast.success("Welcome, Guest");
    navigate("/dashboard", { replace: true });
  };

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#edece8] text-[#18191c]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#18191c]/20 border-t-[#18191c] rounded-full animate-spin" />
          <p className="text-xs font-mono font-bold tracking-wider text-[#797a82]">Restoring IoTMesh Session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#edece8] px-4 py-8 relative">
      
      {/* Container */}
      <div className="w-full max-w-[420px] space-y-4">
        
        {/* Explore Pill Button */}
        <div className="flex justify-center">
          <button
            onClick={() => navigate("/iotmesh")}
            className="clay-pill-bar px-4 py-2 flex items-center gap-2 text-xs font-bold text-[#55565d] hover:text-[#18191c] hover:bg-white/80 transition-all shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#18191c]" />
            <span>Explore IoTMesh Architecture</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-60" />
          </button>
        </div>

        {/* Auth Card */}
        <div className="clay-card p-8 space-y-6 shadow-xl border border-black/[0.08]">
          
          {/* Logo & Title */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#18191c] text-white flex items-center justify-center shadow-lg">
              <Cpu className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-[#18191c]">
                {step === "signin" ? "Welcome to IoTMesh" : "Select Access Tier"}
              </h2>
              <p className="text-xs text-[#797a82] mt-1">
                {step === "signin"
                  ? "Enter your credentials to enter the IoT command center"
                  : "Authenticate as administrator or continue with guest role"}
              </p>
            </div>
          </div>

          {step === "signin" ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#55565d] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Full Name
                </Label>
                <Input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-[#edece8] border-black/[0.08] text-xs font-bold text-[#18191c] placeholder:text-[#9b9a94] rounded-xl h-11"
                  autoComplete="name"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#55565d] flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" /> Access Key
                </Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#edece8] border-black/[0.08] text-xs font-mono font-bold text-[#18191c] placeholder:text-[#9b9a94] rounded-xl h-11"
                  autoComplete="current-password"
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center gap-2 py-1 select-none">
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-black/[0.2] bg-[#edece8] accent-[#18191c] cursor-pointer"
                />
                <label htmlFor="remember-me" className="text-xs text-[#797a82] hover:text-[#18191c] font-medium cursor-pointer">
                  Remember this device (stay signed in)
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full clay-btn-dark h-11 text-xs font-bold shadow-md disabled:opacity-50"
              >
                {isLoading ? "Verifying..." : "Authenticate Session"}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs font-bold text-emerald-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Verified as <strong>{name}</strong></span>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#55565d] flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Admin Passkey <span className="text-[10px] text-[#9b9a94] font-normal">(optional)</span>
                </Label>
                <Input
                  type="password"
                  placeholder="Enter administrator passkey"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="bg-[#edece8] border-black/[0.08] text-xs font-mono font-bold text-[#18191c] placeholder:text-[#9b9a94] rounded-xl h-11"
                  autoComplete="off"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2.5 pt-2">
                <button
                  onClick={handleAdminLogin}
                  disabled={isLoading}
                  className="w-full clay-btn-dark h-11 text-xs font-bold shadow-md flex items-center justify-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>Login as Administrator</span>
                </button>

                <div className="flex items-center gap-3 py-1">
                  <div className="flex-1 h-px bg-black/[0.08]" />
                  <span className="text-[10px] uppercase font-bold text-[#9b9a94] font-mono">or</span>
                  <div className="flex-1 h-px bg-black/[0.08]" />
                </div>

                <button
                  onClick={handleGuestLogin}
                  disabled={isLoading}
                  className="w-full clay-btn h-11 text-xs font-bold flex items-center justify-center gap-2 bg-white"
                >
                  <User className="w-4 h-4" />
                  <span>Continue as Guest</span>
                </button>
              </div>

              <button
                onClick={() => { setStep("signin"); setAdminPassword(""); }}
                className="w-full text-center text-xs font-bold text-[#797a82] hover:text-[#18191c] pt-1"
              >
                ← Back to credentials
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-[#797a82] font-mono">
          IoTMesh Pro Suite · v18.4 · © {new Date().getFullYear()}
        </p>

      </div>
    </div>
  );
}
