import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { firebaseService } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { Layout } from "@/components/Layout";
import { ShieldAlert, Zap, AlertTriangle, Lock, LockOpen, KeyRound, X } from "lucide-react";
import { toast } from "sonner";
import { sounds } from "@/lib/sounds";
import { haptic } from "@/lib/haptic";

// ── Arm password — change this to whatever you want ──
const ARM_PASSWORD = import.meta.env.VITE_ARM_PASSWORD;

export default function IgnitionControl() {
  const { role } = useAuth();

  // ── Arm state ──
  const [armed,        setArmed]        = useState(false);
  const [showArmModal, setShowArmModal] = useState(false);
  const [armInput,     setArmInput]     = useState("");
  const [armError,     setArmError]     = useState(false);

  // ── Ignition state ──
  const [holding,   setHolding]   = useState(false);
  const [progress,  setProgress]  = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [active,    setActive]    = useState(false);

  const holdTimer      = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setTimeout>  | null>(null);

  useEffect(() => {
    return () => {
      if (holdTimer.current)      clearInterval(holdTimer.current);
      if (countdownTimer.current) clearTimeout(countdownTimer.current);
    };
  }, []);

  // ── Arm password submit 
  const handleArmSubmit = () => {
    if (armInput === ARM_PASSWORD) {
      setArmed(true);
      setShowArmModal(false);
      setArmInput("");
      setArmError(false);
      sounds.arm();
      haptic.armed();
      toast.success("System Armed 🔓", { description: "Ignition sequence is now unlocked." });
    } else {
      setArmError(true);
      setArmInput("");
      sounds.wrongPass();
      haptic.wrong();
      toast.error("Wrong arm password", { className: "toast-admin-warning" });
    }
  };

  const handleDisarm = () => {
    setArmed(false);
    stopHold();
    sounds.disarm();
    haptic.disarmed();
    toast.success("System Disarmed 🔒");
  };

  // ── Hold start ──
  const startHold = () => {
    if (role !== "admin" || !armed || active) return;
    if (holdTimer.current) return;

    setHolding(true);
    setProgress(0);

    let count = 0;
    holdTimer.current = setInterval(() => {
      count += 1;
      setProgress(count);
      sounds.holdTick();
      haptic.tick();
      if (count >= 5) {
        clearInterval(holdTimer.current!);
        holdTimer.current = null;
        setHolding(false);
        setProgress(0);
        sounds.holdComplete();
        haptic.heavy();
        beginIgnitionSequence();
      }
    }, 1000);
  };

  // ── Hold cancel ──
  const stopHold = () => {
    if (!holdTimer.current) return;
    clearInterval(holdTimer.current);
    holdTimer.current = null;
    setHolding(false);
    setProgress(0);
  };

  // ── Ignition sequence ──
  const beginIgnitionSequence = () => {
    setActive(true);
    sounds.ignitionFire();
    haptic.fire();
    firebaseService.triggerIgnition()
      .then(() => console.log("[Ignition] Firebase ignition=1 ✅"))
      .catch((e) => console.error("[Ignition] Firebase write failed:", e));

    const tick = (remaining: number) => {
      setCountdown(remaining);
      if (remaining > 0) { sounds.countdownBeep(remaining); haptic.countdown(remaining); }
      if (remaining === 0) {
        firebaseService.resetIgnition()
          .then(() => console.log("[Ignition] Firebase ignition=0 ✅"))
          .catch((e) => console.error("[Ignition] Firebase reset failed:", e));
        setCountdown(null);
        setActive(false);
        sounds.complete();
        haptic.complete();
        toast.success("Ignition complete");
        return;
      }
      countdownTimer.current = setTimeout(() => tick(remaining - 1), 1000);
    };
    tick(3);
  };

  const isAdmin      = role === "admin";
  const isActive     = countdown !== null;
  const progressPct  = (progress / 5) * 100;
  const countdownPct = countdown !== null ? (countdown / 3) * 100 : 0;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 px-4 py-6" style={{ animation: "fadeSlideIn 0.4s ease both" }}>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <Zap className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-red-400 leading-tight">Ignition Control</h1>
            <p className="text-xs text-muted-foreground mt-0.5">High-voltage system — restricted access</p>
          </div>
        </div>

        {/* Non-admin warning */}
        {!isAdmin && (
          <div className="flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-3">
            <ShieldAlert className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
            <p className="text-sm text-yellow-300">You don't have permission to use this panel. Contact an admin for access.</p>
          </div>
        )}

        {/* Active ignition banner */}
        {isActive && (
          <div className="flex items-center gap-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3">
            <Zap className="w-4 h-4 text-red-400 shrink-0 animate-pulse" />
            <p className="text-sm text-red-300 font-semibold tracking-wide">
              🔥 Ignition ACTIVE — Firebase resets in{" "}
              <span className="text-red-200 text-base font-bold">{countdown}s</span>
            </p>
          </div>
        )}

        {/* Arm status banner */}
        {isAdmin && !isActive && (
          <div className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 transition-all duration-300 ${
            armed
              ? "border-green-500/40 bg-green-500/10"
              : "border-border/40 bg-card/40"
          }`}>
            <div className="flex items-center gap-2">
              {armed
                ? <LockOpen className="w-4 h-4 text-green-400 shrink-0" />
                : <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
              }
              <p className={`text-sm font-semibold ${armed ? "text-green-300" : "text-muted-foreground"}`}>
                {armed ? "System ARMED — ready to fire" : "System DISARMED — arm to enable ignition"}
              </p>
            </div>
            {armed ? (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDisarm}
                className="text-xs border-red-500/40 text-red-400 hover:bg-red-500/10 shrink-0"
              >
                <Lock className="w-3 h-3 mr-1" /> Disarm
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => { sounds.modalOpen(); setShowArmModal(true); }}
                className="text-xs bg-green-600 hover:bg-green-700 text-white shrink-0 transition-transform active:scale-95"
              >
                <KeyRound className="w-3 h-3 mr-1" /> Arm System
              </Button>
            )}
          </div>
        )}

        {/* Main Card */}
        <Card className="border-red-500/30 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-red-400 flex items-center gap-2 text-base">
                <AlertTriangle className="w-4 h-4" />
                Ignition System
              </CardTitle>
              <div className="flex items-center gap-2">
                {/* Armed indicator */}
                {isAdmin && (
                  <span className={`text-xs px-2 py-1 rounded-full font-medium border ${
                    armed
                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                      : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                  }`}>
                    {armed ? "🟢 Armed" : "🔴 Disarmed"}
                  </span>
                )}
                <span className={`text-xs px-2 py-1 rounded-full font-medium border ${
                  isAdmin
                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}>
                  {isAdmin ? "Admin" : "No Access"}
                </span>
              </div>
            </div>
            <CardDescription className="text-xs leading-relaxed">
              {armed
                ? <>System armed. Hold for <strong className="text-foreground">5 seconds</strong> to trigger ignition sequence.</>
                : <>Arm the system first, then hold for <strong className="text-foreground">5 seconds</strong> to ignite. <strong className="text-foreground">Admin access required.</strong></>
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">

            {/* Ignition Button */}
            <Button
              onMouseDown={startHold}
              onMouseUp={stopHold}
              onMouseLeave={stopHold}
              onTouchStart={startHold}
              onTouchEnd={stopHold}
              className={`
                w-full h-16 text-base font-semibold tracking-wide relative overflow-hidden
                transition-all duration-200 select-none border text-white
                ${!isAdmin || !armed || active
                  ? "bg-muted text-muted-foreground border-border cursor-not-allowed opacity-60"
                  : holding
                  ? "bg-red-700 border-red-400 shadow-lg shadow-red-900/40 scale-[0.99]"
                  : "bg-red-600 hover:bg-red-700 border-red-500/50 shadow-md shadow-red-900/30"
                }
              `}
            >
              {/* Hold fill */}
              {holding && (
                <span
                  className="absolute inset-0 bg-red-400/20 origin-left"
                  style={{ transform: `scaleX(${progressPct / 100})`, transition: "transform 0.9s linear" }}
                />
              )}
              {/* Countdown fill */}
              {isActive && (
                <span
                  className="absolute inset-0 bg-red-500/30 origin-left"
                  style={{ transform: `scaleX(${countdownPct / 100})`, transition: "transform 0.9s linear" }}
                />
              )}

              <span className="relative z-10 flex items-center justify-center gap-2">
                <Zap className={`w-4 h-4 ${holding || isActive ? "animate-bounce" : ""}`} />
                {!isAdmin
                  ? "Admin Only"
                  : !armed
                  ? "🔒 Arm System First"
                  : isActive
                  ? `🔥 Ignition Active — ${countdown}s`
                  : holding
                  ? `Hold... ${progress} / 5`
                  : "Hold 5s to Ignite"}
              </span>
            </Button>

            {/* Hold progress bar */}
            {holding && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Charging ignition...</span>
                  <span>{progressPct.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/10">
                  <div
                    className="bg-gradient-to-r from-red-600 to-red-400 h-full rounded-full"
                    style={{ width: `${progressPct}%`, transition: "width 0.9s linear" }}
                  />
                </div>
                <p className="text-xs text-red-400/70 text-center">Release to cancel</p>
              </div>
            )}

            {/* Countdown progress bar */}
            {isActive && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="text-red-400 font-medium animate-pulse">🔥 Firebase: ignition = 1</span>
                  <span>{countdown}s remaining</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-red-500/30">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-red-500 h-full rounded-full"
                    style={{ width: `${countdownPct}%`, transition: "width 0.9s linear" }}
                  />
                </div>
              </div>
            )}

            {/* Step dots */}
            <div className="flex items-center gap-2 pt-1">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
                    isActive
                      ? "bg-red-500 animate-pulse"
                      : progress >= step
                      ? "bg-red-500"
                      : holding
                      ? "bg-white/10 animate-pulse"
                      : armed
                      ? "bg-green-500/30"
                      : "bg-white/5"
                  }`}
                />
              ))}
            </div>

          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground/50 text-center">
          ⚠️ This action triggers a physical ignition sequence. Use with caution.
        </p>
      </div>

      {/* ── ARM PASSWORD MODAL ── */}
      {showArmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          style={{ animation: "fadeSlideIn 0.2s ease both" }}
          onClick={(e) => { if (e.target === e.currentTarget) { sounds.modalClose(); setShowArmModal(false); setArmInput(""); setArmError(false); } }}
        >
          <div className="w-full max-w-sm mx-4 bg-card border border-border/60 rounded-xl shadow-2xl p-6 space-y-5">

            {/* Modal header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                  <KeyRound className="w-4 h-4 text-green-400" />
                </div>
                <h2 className="text-base font-semibold">Arm Ignition System</h2>
              </div>
              <button
                onClick={() => { sounds.modalClose(); setShowArmModal(false); setArmInput(""); setArmError(false); }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Enter the arm password to unlock the ignition sequence. This will enable the 5-second hold trigger.
            </p>

            {/* Password input */}
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Enter arm password"
                value={armInput}
                onChange={(e) => { setArmInput(e.target.value); setArmError(false); }}
                onKeyDown={(e) => e.key === "Enter" && handleArmSubmit()}
                autoFocus
                className={`transition-all duration-200 ${
                  armError
                    ? "border-red-500/60 focus:border-red-500 bg-red-500/5"
                    : "border-border/60 focus:border-green-500/60"
                }`}
              />
              {armError && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> Incorrect arm password
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 text-sm"
                onClick={() => { sounds.modalClose(); setShowArmModal(false); setArmInput(""); setArmError(false); }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 text-sm bg-green-600 hover:bg-green-700 text-white transition-transform active:scale-95"
                onClick={handleArmSubmit}
              >
                <LockOpen className="w-3.5 h-3.5 mr-1.5" /> Arm System
              </Button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Layout>
  );
}
