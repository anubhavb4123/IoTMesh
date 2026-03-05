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
import { ref, push } from "firebase/database";
import { sounds } from "@/lib/sounds";

// PASSWORDS
const GUEST_PASSWORD = "1111";
const ADMIN_PASSWORD = "4123";

export default function Auth() {
  const navigate = useNavigate();
  const { setRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [step, setStep] = useState<"signin" | "admin_password">("signin");

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ── Auto redirect if already logged in ──
  useEffect(() => {
    const stored = localStorage.getItem("mock_user");
    if (stored) {
      const user = JSON.parse(stored);
      setRole(user.role);
    }
  }, []);

  // ── Audio enable on first interaction ──
  useEffect(() => {
    const enableAudio = async () => {
      if (audioRef.current) {
        audioRef.current.muted = false;
        audioRef.current.volume = 0.25;
        try { await audioRef.current.play(); }
        catch (err) { console.warn("Audio blocked until interaction"); }
      }
      window.removeEventListener("click", enableAudio);
      window.removeEventListener("touchstart", enableAudio);
    };
    window.addEventListener("click", enableAudio);
    window.addEventListener("touchstart", enableAudio);
    return () => {
      window.removeEventListener("click", enableAudio);
      window.removeEventListener("touchstart", enableAudio);
    };
  }, []);

  // ── Save login to Firebase ──
  const saveLoginToFirebase = (role: "guest" | "admin") => {
    push(ref(database, "home/users"), { name, role, timestamp: Date.now() });
  };

  // ── Sign out ──
  const signOut = async () => {
    localStorage.removeItem("mock_user");
    setRole(null);
  };

  // ── Step 1: verify guest password ──
  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      sounds.error();
      toast.error("Enter your name", { className: "toast-admin-warning" });
      return;
    }
    if (password !== GUEST_PASSWORD) {
      sounds.wrongPass();
      toast.error("Incorrect login password", { className: "toast-admin-warning" });
      return;
    }
    sounds.success();
    toast.success("Login password correct", { className: "toast-success" });
    setStep("admin_password");
  };

  // ── Admin login ──
  const handleAdminLogin = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      localStorage.setItem("mock_user", JSON.stringify({ name, role: "admin" }));
      setRole("admin");
      saveLoginToFirebase("admin");
      sounds.loginSuccess();
      toast.success("Logged in as Admin", { className: "toast-success" });
      navigate("/dashboard");
    } else {
      sounds.wrongPass();
      toast.error("Wrong admin password", { className: "toast-admin-warning" });
    }
  };

  // ── Guest login ──
  const handleGuestLogin = () => {
    localStorage.setItem("mock_user", JSON.stringify({ name, role: "guest" }));
    setRole("guest");
    saveLoginToFirebase("guest");
    sounds.loginSuccess();
    toast.success("Logged in as Guest", { className: "toast-success" });
    navigate("/dashboard");
  };

  return (
    <div className="relative min-h-screen overflow-hidden">

      {/* Background video */}
      <video autoPlay muted loop playsInline className="fixed inset-0 w-full h-full object-cover -z-20">
        <source src="/login-bg.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay */}
      <div className="fixed inset-0 bg-black/50 -z-10" />

      {/* Background music */}
      <audio ref={audioRef} loop muted>
        <source src="/login-music.mp3" type="audio/mpeg" />
      </audio>

      <div className="flex flex-col min-h-screen items-center justify-center p-4 relative z-10">

        {/* Explore button */}
        <div
          className="relative w-full max-w-md mb-6"
          style={{ animation: "fadeSlideIn 0.4s ease both", animationDelay: "0.1s" }}
        >
          <div className="animate-border rounded-lg p-[2px]">
            <button
              onClick={() => navigate("/iotmesh")}
              className="w-full rounded-lg bg-card/80 backdrop-blur px-4 py-2 text-white font-medium border border-white/30 hover:bg-white/10 transition-all duration-200 active:scale-95"
            >
              Explore <> I<span className="glow-o">O</span>TMesh </>
            </button>
          </div>
        </div>

        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br via-background to-glow-cyan/10 pointer-events-none" />

        {/* Login card */}
        <Card
          className="border-border/40 bg-card/40 border-white/50 shadow-lg w-full max-w-md"
          style={{ animation: "fadeSlideIn 0.4s ease both", animationDelay: "0.2s" }}
        >
          <CardHeader className="space-y-4 text-center">

            {/* Video logo */}
            <div
              className="mx-auto h-16 w-16 rounded-2xl overflow-hidden shadow-lg border border-white/20"
              style={{ animation: "fadeSlideIn 0.4s ease both", animationDelay: "0.3s" }}
            >
              <video autoPlay muted loop playsInline className="w-full h-full object-cover">
                <source src="/logo-video.mp4" type="video/mp4" />
              </video>
            </div>

            <div style={{ animation: "fadeSlideIn 0.4s ease both", animationDelay: "0.35s" }}>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary bg-clip-text text-transparent">
                {step === "signin" ? (
                  <>I<span className="glow-o">O</span>TMesh</>
                ) : (
                  "Admin Access"
                )}
              </CardTitle>
              <CardDescription>
                {step === "signin"
                  ? "Enter your name and login password"
                  : "Enter admin password or continue as guest"}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent style={{ animation: "fadeSlideIn 0.4s ease both", animationDelay: "0.4s" }}>
            {step === "signin" ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="transition-all duration-200 focus:scale-[1.01]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Login Password</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="transition-all duration-200 focus:scale-[1.01]"
                  />
                </div>
                <Button type="submit" className="w-full transition-transform duration-150 active:scale-95">
                  Next
                </Button>
              </form>
            ) : (
              <div
                className="space-y-4"
                style={{ animation: "fadeSlideIn 0.3s ease both" }}
              >
                <div className="space-y-2">
                  <Label>Admin Password (optional)</Label>
                  <Input
                    type="password"
                    placeholder="Enter admin password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="transition-all duration-200 focus:scale-[1.01]"
                  />
                </div>
                <div className="space-y-3">
                  <Button
                    onClick={handleAdminLogin}
                    className="w-full transition-transform duration-150 active:scale-95"
                  >
                    Login as Admin
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleGuestLogin}
                    className="w-full transition-transform duration-150 active:scale-95"
                  >
                    Login as Guest
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div
        className="fixed bottom-0 left-0 w-full z-20"
        style={{ animation: "fadeSlideIn 0.4s ease both", animationDelay: "0.5s" }}
      >
        <div className="text-center text-xs text-white/80 py-2 backdrop-blur-md">
          <span className="font-medium">IoTMesh</span> ·
          <span className="mx-1">v16.01.26 ZUX</span> ·
          <span>© {new Date().getFullYear()} IoTMesh. All rights reserved.</span>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
