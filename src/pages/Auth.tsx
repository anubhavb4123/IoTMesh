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
import InfoDialog from "@/components/InfoDialog";

// ================= CONSTANTS =================
const DEMO_OTP = "4567";
const ADMIN_PASSWORD = "4123";

export default function Auth() {
  const navigate = useNavigate();
  const { setRole } = useAuth();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const [step, setStep] = useState<
    "details" | "otp" | "admin_password"
  >("details");

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // ================= AUTO REDIRECT =================
  useEffect(() => {
    const stored = localStorage.getItem("mock_user");
    if (stored) {
      const user = JSON.parse(stored);
      setRole(user.role);
      navigate("/dashboard");
    }
  }, []);
// ================= STOP MUSIC =================
  const stopMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // ================= AUDIO ENABLE =================
  useEffect(() => {
    const enableAudio = async () => {
      if (audioRef.current) {
        audioRef.current.muted = false;
        audioRef.current.volume = 0.25;
        try {
          await audioRef.current.play();
        } catch {}
      }
      window.removeEventListener("click", enableAudio);
    };
    window.addEventListener("click", enableAudio);
    return () => window.removeEventListener("click", enableAudio);
  }, []);

  // ================= SAVE LOGIN =================
  const saveLoginToFirebase = (role: "guest" | "admin") => {
    push(ref(database, "home/users"), {
      name,
      phone,
      role,
      timestamp: Date.now(),
    });
  };

  // ================= STEP 1 =================
  const handleSendOtp = () => {
    if (!name.trim()) return toast.error("Enter your name");
    if (phone.length < 10) return toast.error("Enter valid phone number");

    toast.success(`OTP sent to +91${phone}`);
    setStep("otp");
    stopMusic();
  };

  // ================= STEP 2 =================
  const handleVerifyOtp = () => {
    if (otp !== DEMO_OTP) {
      toast.error("Wrong OTP");
      return;
    }
    toast.success("OTP verified");
    setStep("admin_password");
  };

  // ================= ADMIN =================
  const handleAdminLogin = () => {
    if (adminPassword !== ADMIN_PASSWORD)
      return toast.error("Wrong admin password");

    localStorage.setItem(
      "mock_user",
      JSON.stringify({ name, role: "admin" })
    );
    setRole("admin");
    saveLoginToFirebase("admin");
    navigate("/dashboard");
  };

  // ================= GUEST =================
  const handleGuestLogin = () => {
    localStorage.setItem(
      "mock_user",
      JSON.stringify({ name, role: "guest" })
    );
    setRole("guest");
    saveLoginToFirebase("guest");
    navigate("/dashboard");
  };

  return (
    <div className="relative min-h-screen overflow-hidden">

      {/* 🎥 BACKGROUND VIDEO */}
      <video autoPlay muted loop playsInline
        className="fixed inset-0 w-full h-full object-cover -z-20">
        <source src="/login-bg.mp4" type="video/mp4" />
      </video>

      {/* 🎥 STEP-2 VIDEO (ONLY FOR ADMIN / GUEST SELECTION) */}
      {step === "otp" && (
        <div className="w-50 h-32 rounded-xl overflow-hidden border border-white/20 shadow-md fixed middle-0 left-1/2 -translate-x-1/2 top-20">
          <video
            autoPlay 
            loop
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/step2-video.mp4" type="video/mp4" />
          </video>
        </div>
      )}

      <div className="fixed inset-0 bg-black/70 -z-10" />

      <div className="flex min-h-screen items-center justify-center p-4 z-10">
        <InfoDialog />

        <audio ref={audioRef} loop muted>
          <source src="/login-music.mp3" type="audio/mpeg" />
        </audio>

        <Card className="w-full max-w-md bg-card/50 border-white/20">
          <CardHeader className="text-center space-y-3">
            <CardTitle className="text-2xl text-cyan-400">
              Account Verification
            </CardTitle>
            <CardDescription>
              {step === "details" && "Enter your details"}
              {step === "otp" && `We have just sent the otp: 4567 to your phone number +91${phone}`}
              {step === "admin_password" && "Choose role"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">

            {step === "details" && (
              <>
                <Input placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)} />
                <Input placeholder="Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)} />
                <Button onClick={handleSendOtp} className="w-full">
                  Send OTP
                </Button>
              </>
            )}

            {step === "otp" && (
              <>
                <Input placeholder="Please enter the otp to access your account:"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)} />
                <Button onClick={handleVerifyOtp} className="w-full">
                  Verify OTP
                </Button>
              </>
            )}

            {step === "admin_password" && (
              <>
                <Input
                  type="password"
                  placeholder="Admin password (optional)"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
                <Button onClick={handleAdminLogin} className="w-full">
                  Login as Admin
                </Button>
                <Button variant="outline" onClick={handleGuestLogin}
                  className="w-full">
                  Continue as Guest
                </Button>
              </>
            )}

          </CardContent>
        </Card>
      </div>
    </div>
  );
}