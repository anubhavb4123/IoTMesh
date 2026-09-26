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
            <div className="w-10 h-10 rounded-2xl bg-[#edece8] border border-black/[0.06] flex items-center justify-center text-red-600 shadow-inner">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#18191c] tracking-tight">Ignition Control Panel</h1>
              <p className="text-xs text-[#797a82] mt-0.5">High-voltage solid-state relay interlock</p>
            </div>
          </div>

          <span className={cn(
            "text-xs px-3 py-1 rounded-full font-mono font-bold",
            isAdmin ? "badge-running" : "badge-stopped"
          )}>
            {isAdmin ? "Admin Authorized" : "Restricted"}
          </span>
        </div>

        {/* ── Permission Alert ── */}
        {!isAdmin && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
            <span>This control panel is restricted to system administrators. Guest actuation is disabled.</span>
          </div>
        )}

        {/* ── Arm Status Bar ── */}
        {isAdmin && (
          <div className="clay-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className={cn(
                "w-2.5 h-2.5 rounded-full",
                armed ? "bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" : "bg-[#797a82]"
              )} />
              <span className="text-xs font-bold text-[#18191c]">
                {armed ? "Perimeter Safety Interlock: ARMED" : "Perimeter Safety Interlock: DISARMED"}
              </span>
            </div>

            {armed ? (
              <button
                onClick={handleDisarm}
                className="clay-btn text-xs font-bold text-red-600 border-red-200"
              >
                <Lock className="w-3.5 h-3.5 inline mr-1.5" /> Disarm
              </button>
            ) : (
              <button
                onClick={() => { sounds.modalOpen(); setShowArmModal(true); }}
                className="clay-btn-dark text-xs"
              >
                <KeyRound className="w-3.5 h-3.5 inline mr-1.5" /> Arm System
              </button>
            )}
          </div>
        )}

        {/* ── Main Control Card ── */}
        <div className="clay-card p-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-[#18191c]">5-Second Hold-to-Fire Actuator</h2>
            <p className="text-xs text-[#797a82]">
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
                "w-full h-20 rounded-2xl font-bold text-sm transition-all duration-150 relative overflow-hidden select-none flex items-center justify-center gap-2.5 border shadow-md",
                !isAdmin || !armed || active
                  ? "bg-[#edece8] border-black/[0.06] text-[#9b9a94] cursor-not-allowed shadow-none"
                  : holding
                  ? "bg-[#18191c] text-white border-red-500 scale-[0.99] shadow-xl"
                  : "bg-white text-[#18191c] border-black/[0.1] hover:border-black/[0.2] active:scale-[0.98]"
              )}
            >
              {/* Hold fill backdrop */}
              {holding && (
                <span
                  className="absolute inset-0 bg-red-600/30 origin-left"
                  style={{ transform: `scaleX(${progressPct / 100})`, transition: "transform 0.9s linear" }}
                />
              )}

              {/* Active ignition pulse */}
              {isActive && (
                <span className="absolute inset-0 bg-red-600/40 animate-pulse" />
              )}

              <span className="relative z-10 flex items-center gap-2">
                <Zap className={cn("w-4 h-4", holding || isActive ? "text-red-500 animate-bounce" : "text-[#797a82]")} />
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
                  "flex-1 h-1.5 rounded-full transition-all duration-300",
                  isActive
                    ? "bg-red-500 animate-pulse"
                    : progress >= step
                    ? "bg-red-500"
                    : holding
                    ? "bg-[#18191c]"
                    : armed
                    ? "bg-emerald-300"
                    : "bg-[#dedcd5]"
                )}
              />
            ))}
          </div>

          <p className="text-[11px] text-[#797a82] text-center">
            ⚠️ Triggers hardware high-voltage pulse. Releasing actuator button cancels sequence immediately.
          </p>
        </div>

      </div>

      {/* ── ARM PASSCODE MODAL ── */}
      {showArmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowArmModal(false); }}
        >
          <div className="w-full max-w-sm rounded-3xl bg-white border border-black/[0.08] p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#edece8] flex items-center justify-center text-[#18191c]">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#18191c]">Arm High-Voltage Ignition</h3>
              </div>
              <button onClick={() => setShowArmModal(false)} className="text-[#797a82] hover:text-[#18191c]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#797a82] leading-relaxed">
              Enter the master arming passcode to bypass safety interlocks and enable the 5-second ignition trigger.
            </p>

            <Input
              type="password"
              placeholder="Arming passcode"
              value={armInput}
              onChange={(e) => setArmInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleArmSubmit(); }}
              className="bg-[#edece8] border-black/[0.08] text-[#18191c] placeholder:text-[#9b9a94] rounded-xl"
              autoFocus
            />

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowArmModal(false)} className="clay-btn text-xs">
                Cancel
              </button>
              <button onClick={handleArmSubmit} className="clay-btn-dark text-xs">
                Verify & Arm
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
