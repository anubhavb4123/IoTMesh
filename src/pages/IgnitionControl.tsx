import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { firebaseService } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldAlert, Zap, Lock, LockOpen, KeyRound, X, AlertTriangle, Flame } from "lucide-react";
import { toast } from "sonner";
import { sounds } from "@/lib/sounds";
import { haptic } from "@/lib/haptic";
import { cn } from "@/lib/utils";

const ARM_PASSWORD = import.meta.env.VITE_ARM_PASSWORD;

export default function IgnitionControl() {
  const { role } = useAuth();

  const [armed, setArmed] = useState(false);
  const [showArmModal, setShowArmModal] = useState(false);
  const [armInput, setArmInput] = useState("");
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [active, setActive] = useState(false);

  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (holdTimer.current) clearInterval(holdTimer.current);
      if (countdownTimer.current) clearTimeout(countdownTimer.current);
    };
  }, []);

  const handleArmSubmit = () => {
    if (armInput === ARM_PASSWORD) {
      setArmed(true);
      setShowArmModal(false);
      setArmInput("");
      sounds.arm();
      haptic.armed();
      toast.success("System Armed 🔓", { description: "High-voltage ignition sequence unlocked." });
    } else {
      setArmInput("");
      sounds.wrongPass();
      haptic.wrong();
      toast.error("Invalid Arming Passcode");
    }
  };

  const handleDisarm = () => {
    setArmed(false);
    stopHold();
    sounds.disarm();
    haptic.disarmed();
    toast.success("System Disarmed 🔒");
  };

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

  const stopHold = () => {
    if (!holdTimer.current) return;
    clearInterval(holdTimer.current);
    holdTimer.current = null;
    setHolding(false);
    setProgress(0);
  };

  const beginIgnitionSequence = () => {
    setActive(true);
    sounds.ignitionFire();
    haptic.fire();
    firebaseService.triggerIgnition()
      .then(() => console.log("[Ignition] Firebase ignition=1 ✅"))
      .catch((e) => console.error("[Ignition] Firebase write failed:", e));

    const tick = (remaining: number) => {
      setCountdown(remaining);
      if (remaining > 0) {
        sounds.countdownBeep(remaining);
        haptic.countdown(remaining);
      }
      if (remaining === 0) {
        firebaseService.resetIgnition()
          .then(() => console.log("[Ignition] Firebase ignition=0 ✅"))
          .catch((e) => console.error("[Ignition] Firebase reset failed:", e));
        setCountdown(null);
        setActive(false);
        sounds.complete();
        haptic.complete();
        toast.success("Ignition cycle complete");
        return;
      }
      countdownTimer.current = setTimeout(() => tick(remaining - 1), 1000);
    };
    tick(3);
  };

  const isAdmin = role === "admin";
  const isActive = countdown !== null;
  const progressPct = (progress / 5) * 100;

  return (
    <Layout>
      <div className="max-w-xl mx-auto space-y-6 pb-12 pt-4">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-red-400 shadow-sm">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white tracking-tight">Ignition Control Panel</h1>
              <p className="text-xs text-zinc-400 mt-0.5">High-voltage solid-state relay interlock</p>
            </div>
          </div>

          <span className={cn(
            "text-xs px-2.5 py-1 rounded-full font-mono border font-medium",
            isAdmin ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
          )}>
            {isAdmin ? "Admin Authorized" : "Restricted"}
          </span>
        </div>

        {/* ── Permission Alert ── */}
        {!isAdmin && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>This control panel is restricted to system administrators. Guest actuation is disabled.</span>
          </div>
        )}

        {/* ── Arm Status Bar ── */}
        {isAdmin && (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80">
            <div className="flex items-center gap-2.5">
              <div className={cn(
                "w-2 h-2 rounded-full",
                armed ? "bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-zinc-600"
              )} />
              <span className="text-xs font-semibold text-zinc-200">
                {armed ? "Perimeter Safety Interlock: ARMED" : "Perimeter Safety Interlock: DISARMED"}
              </span>
            </div>

            {armed ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisarm}
                className="border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs"
              >
                <Lock className="w-3.5 h-3.5 mr-1.5" /> Disarm
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => { sounds.modalOpen(); setShowArmModal(true); }}
                className="bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-medium"
              >
                <KeyRound className="w-3.5 h-3.5 mr-1.5" /> Arm System
              </Button>
            )}
          </div>
        )}

        {/* ── Main Control Card ── */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-white">5-Second Hold-to-Fire Actuator</h2>
            <p className="text-xs text-zinc-400">
              Hold the actuator continuously for 5 seconds to charge capacitors and trigger the pulse.
            </p>
          </div>

          {/* Large Hold Actuator Button */}
          <div className="relative">
            <button
              disabled={!isAdmin || !armed || active}
              onMouseDown={startHold}
              onMouseUp={stopHold}
              onMouseLeave={stopHold}
              onTouchStart={startHold}
              onTouchEnd={stopHold}
              className={cn(
                "w-full h-20 rounded-2xl font-semibold text-sm transition-all duration-150 relative overflow-hidden select-none flex items-center justify-center gap-2.5 border",
                !isAdmin || !armed || active
                  ? "bg-zinc-900/60 border-zinc-800 text-zinc-600 cursor-not-allowed"
                  : holding
                  ? "bg-zinc-900 text-white border-red-500/80 scale-[0.99] shadow-lg"
                  : "bg-zinc-950 text-white border-zinc-700 hover:border-zinc-500 active:scale-[0.98]"
              )}
            >
              {/* Hold fill backdrop */}
              {holding && (
                <span
                  className="absolute inset-0 bg-red-500/20 origin-left"
                  style={{ transform: `scaleX(${progressPct / 100})`, transition: "transform 0.9s linear" }}
                />
              )}

              {/* Active ignition pulse */}
              {isActive && (
                <span className="absolute inset-0 bg-red-600/30 animate-pulse" />
              )}

              <span className="relative z-10 flex items-center gap-2">
                <Zap className={cn("w-4 h-4", holding || isActive ? "text-red-400 animate-bounce" : "text-zinc-400")} />
                {!isAdmin
                  ? "Admin Authorization Required"
                  : !armed
                  ? "System Disarmed — Arm to Unlock"
                  : isActive
                  ? `🔥 FIRING IGNITION (${countdown}s)`
                  : holding
                  ? `Charging Interlock... ${progress}/5s`
                  : "Press & Hold 5s to Fire"}
              </span>
            </button>
          </div>

          {/* Progress Step Dots */}
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((step) => (
              <div
                key={step}
                className={cn(
                  "flex-1 h-1 rounded-full transition-all duration-300",
                  isActive
                    ? "bg-red-500 animate-pulse"
                    : progress >= step
                    ? "bg-red-500"
                    : holding
                    ? "bg-zinc-700"
                    : armed
                    ? "bg-emerald-500/30"
                    : "bg-zinc-800"
                )}
              />
            ))}
          </div>

          <p className="text-[11px] text-zinc-500 text-center">
            ⚠️ Triggers hardware high-voltage pulse. Releasing button cancels sequence immediately.
          </p>
        </div>

      </div>

      {/* ── ARM PASSCODE MODAL ── */}
      {showArmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowArmModal(false); }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-zinc-950 border border-zinc-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-white">Arm High-Voltage Ignition</h3>
              </div>
              <button onClick={() => setShowArmModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Enter the master arming passcode to bypass safety locks and enable the 5-second ignition trigger.
            </p>

            <Input
              type="password"
              placeholder="Arming passcode"
              value={armInput}
              onChange={(e) => setArmInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleArmSubmit(); }}
              className="bg-zinc-900/60 border-zinc-800 text-white placeholder:text-zinc-600 rounded-xl"
              autoFocus
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowArmModal(false)} className="text-zinc-400 hover:text-white">
                Cancel
              </Button>
              <Button size="sm" onClick={handleArmSubmit} className="bg-white text-zinc-950 hover:bg-zinc-200 font-medium">
                Verify & Arm
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
