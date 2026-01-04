import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
Card,
CardContent,
CardDescription,
CardHeader,
CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { database } from "@/lib/firebase";
import { ref, push } from "firebase/database";
import Footer from "@/components/Footer";
import InfoDialog from "@/components/InfoDialog";
// ================= PASSWORDS =================
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

// 🎵 AUDIO REF
const audioRef = useRef<HTMLAudioElement | null>(null);

// ================= AUTO REDIRECT =================
useEffect(() => {
const stored = localStorage.getItem("mock_user");
if (stored) {
const user = JSON.parse(stored);
setRole(user.role);
}
}, []);

// ================= AUDIO ENABLE (FIRST CLICK) ================
useEffect(() => {
const enableAudio = async () => {
  if (audioRef.current) {
    audioRef.current.muted = false;
    audioRef.current.volume = 0.25;
    try {
      await audioRef.current.play();
    } catch (err) {
      console.warn("Audio blocked until interaction");
    }
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

// ================= SAVE LOGIN TO FIREBASE =================
const saveLoginToFirebase = (role: "guest" | "admin") => {
const usersRef = ref(database, "home/users");

push(usersRef, {
  name,
  role,
  timestamp: Date.now(),
});
};

// ================= SIGN OUT FUNCTION =================
const signOut = async () => {
  localStorage.removeItem("mock_user");
  setRole(null);
};

// ================= STEP 1 : GUEST PASSWORD =================
const handleSignIn = (e: React.FormEvent) => {
e.preventDefault();
if (!name.trim()) {
  toast.error("Enter your name", {
    className: "toast-admin-warning",
  });
  return;
}
if (password !== GUEST_PASSWORD) {
  toast.error("Incorrect login password", {
    className: "toast-admin-warning",
  });
  return;
}

  toast.success("Login password correct", {
    className: "toast-success",
  });
  setStep("admin_password");
};

// ================= ADMIN LOGIN =================
const handleAdminLogin = () => {
if (adminPassword === ADMIN_PASSWORD) {
  localStorage.setItem(
    "mock_user",
    JSON.stringify({ name, role: "admin" })
  );
  setRole("admin");
  saveLoginToFirebase("admin");
  toast.success("Logged in as Admin", {
    className: "toast-success",
  });
  navigate("/dashboard");
} else {
  toast.error("Wrong admin password", {
    className: "toast-admin-warning",
  });
}
};

// ================= GUEST LOGIN =================
const handleGuestLogin = () => {
localStorage.setItem(
  "mock_user",
  JSON.stringify({ name, role: "guest" })
);
setRole("guest");
saveLoginToFirebase("guest");
toast.success("Logged in as Guest", {
  className: "toast-success",
});
navigate("/dashboard");
};
return (

<div className="relative min-h-screen overflow-hidden">
  {/* 🎥 BACKGROUND VIDEO */}
  <video
    autoPlay
    muted
    loop
    playsInline
    className="fixed inset-0 w-full h-full object-cover -z-20"
  >
    <source src="/login-bg.mp4" type="video/mp4" />
  </video>
  {/* 🌑 DARK OVERLAY */}
  <div className="fixed inset-0 bg-black/70 -z-10" />
  {/* 🔐 EXISTING CONTENT (UNCHANGED) */}
 <div className="flex flex-col min-h-screen items-center justify-center p-4 relative z-10">
    <InfoDialog />
    {/* Background gradient */}
    <div className="absolute inset-0 bg-gradient-to-br via-background to-glow-cyan/10 pointer-events-none" />
    {/* 🎵 Background Music */}
    <audio ref={audioRef} loop muted>
      <source src="/login-music.mp3" type="audio/mpeg" />
    </audio>

    <Card className="border-border/50 bg-card/50 border-white/50 shadow-lg w-full max-w-md">
      <CardHeader className="space-y-4 text-center">
        {/* 🎥 Video Logo */}
        <div className="mx-auto h-16 w-16 rounded-2xl overflow-hidden shadow-lg border border-white/20">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/logo-video.mp4" type="video/mp4" />
          </video>
        </div>
        <div>
          <CardTitle className="text-2xl bg-gradient-to-r from-primary to-glow-cyan bg-clip-text text-transparent">
            {step === "signin" ? "IOTMesh" : "Admin Access"}
          </CardTitle>
          <CardDescription>
            {step === "signin"
              ? "Enter your name and login password"
              : "Enter admin password or continue as guest"}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {step === "signin" ? (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Login Password</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full">
              Next
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Admin Password (optional)</Label>
              <Input
                type="password"
                placeholder="Enter admin password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <Button onClick={handleAdminLogin} className="w-full">
                Login as Admin
              </Button>
              <Button
                variant="outline"
                onClick={handleGuestLogin}
                className="w-full"
              >
                Login as Guest
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  </div>
</div>
);
}