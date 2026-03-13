import { useEffect, useRef, useState } from "react";
import { Layout } from "@/components/Layout";
import { DeviceControl } from "@/components/DeviceControl";
import { Card } from "@/components/ui/card";
import { Lightbulb, Fan, ToggleLeft, Tv, Zap, Lock, Activity, Sun, Refrigerator, Wind } from "lucide-react";
import { firebaseService } from "@/lib/firebase";
import { toast } from "sonner";
import { ControlData } from "@/lib/firebase";
import { sounds } from "@/lib/sounds";
import { haptic } from "@/lib/haptic";

// ── Fan Speed Slider ──────────────────────────────────────────
// Defined at module level (NOT inside Devices) — required for hooks to work
interface FanSliderProps {
  fanOn: boolean;
  speed: number;                     // 0–100 synced from Firebase
  onSpeedChange: (v: number) => void; // called on pointer release only
}

function FanSlider({ fanOn, speed, onSpeedChange }: FanSliderProps) {
  // Local state for smooth dragging — Firebase only written on release
  const [local, setLocal] = useState(speed);
  const lastHapticStep = useRef(-1);
  const isDragging = useRef(false);

  // Sync from Firebase when not dragging
  useEffect(() => {
    if (!isDragging.current) setLocal(speed);
  }, [speed]);

  if (!fanOn) return null;

  const label =
    local === 0 ? "Off" :
      local <= 33 ? "Low" :
        local <= 66 ? "Medium" : "High";

  const labelColor =
    local === 0 ? "text-muted-foreground" :
      local <= 33 ? "text-blue-400" :
        local <= 66 ? "text-cyan-400" : "text-orange-400";

  const trackColor =
    local <= 33
      ? "linear-gradient(90deg, #3b82f6, #60a5fa)"
      : local <= 66
        ? "linear-gradient(90deg, #22d3ee, #67e8f9)"
        : "linear-gradient(90deg, #f97316, #fb923c)";

  const thumbColor =
    local <= 33 ? "#60a5fa" :
      local <= 66 ? "#22d3ee" : "#f97316";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setLocal(v);

    // Haptic tick every 10 units like physical detents
    const step = Math.floor(v / 10);
    if (step !== lastHapticStep.current) {
      haptic.tick();
      sounds.click();
      lastHapticStep.current = step;
    }
  };

  const handleRelease = () => {
    isDragging.current = false;
    onSpeedChange(local); // write to Firebase only on release
  };

  return (
    <div
      className="mt-2 px-1 space-y-1.5"
      style={{ animation: "fadeSlideIn 0.3s ease both" }}
    >
      {/* Label row */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Wind className="h-3 w-3" />
          <span>Speed</span>
        </div>
        <span className={`font-semibold tabular-nums ${labelColor}`}>
          {label} · {local}%
        </span>
      </div>

      {/* Slider track */}
      <div className="relative h-5 flex items-center">
        {/* Background track */}
        <div className="absolute w-full h-1.5 rounded-full bg-white/5 border border-white/10" />

        {/* Filled portion */}
        <div
          className="absolute left-0 h-1.5 rounded-full pointer-events-none transition-none"
          style={{ width: `${local}%`, background: trackColor }}
        />

        {/* Custom thumb */}
        <div
          className="absolute w-4 h-4 rounded-full border-2 border-background shadow-lg pointer-events-none transition-none"
          style={{
            left: `calc(${local}% - 8px)`,
            background: thumbColor,
            boxShadow: `0 0 6px ${thumbColor}88`,
          }}
        />

        {/* Native range — full area, invisible */}
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={local}
          onChange={handleChange}
          onMouseDown={() => { isDragging.current = true; }}
          onTouchStart={() => { isDragging.current = true; }}
          onMouseUp={handleRelease}
          onTouchEnd={handleRelease}
          className="absolute w-full opacity-0 cursor-pointer h-5"
          style={{ zIndex: 10 }}
        />
      </div>

      {/* Tick labels */}
      <div className="flex justify-between px-0.5">
        {["0", "25", "50", "75", "100"].map((t) => (
          <span key={t} className="text-[9px] text-muted-foreground/40">{t}</span>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function Devices() {
  const [controls, setControls] = useState<ControlData>({} as ControlData);

  useEffect(() => {
    const unsub = firebaseService.listenToControlStates(setControls);
    return () => unsub();
  }, []);

  const nightMode = !!controls.nightMode;
  const dayMode = !nightMode;

  const update = async (key: keyof ControlData, value: boolean) => {
    if (nightMode && (key === "lock" || key === "motion")) {
      sounds.error();
      haptic.error();
      toast.error("Security is locked in Night Mode");
      return;
    }
    await firebaseService.updateSwitchState(key, value);
  };

  const updateSpeed = (key: keyof ControlData, speed: number) => {
    firebaseService.updateFanSpeed(key, speed);
  };

  const ALL_NON_SECURITY: (keyof ControlData)[] = [
    "room1Light", "room1Switch", "room1Fan",
    "room2Light", "room2Switch", "room2Fan",
    "room3Light", "room3Switch", "room3Fan",
    "lobbyFan", "lobbyLight", "lobbyTV", "refrigerator",
    "relay1", "relay2", "relay3", "relay4",
  ];

  const allOffExceptSecurity = async () => {
    const updates = Object.fromEntries(ALL_NON_SECURITY.map((k) => [k, false]));
    await firebaseService.updateMultipleSwitches(updates as Partial<ControlData>);
    sounds.success();
    haptic.heavy();
    toast.success("All devices OFF (Security unchanged)");
  };

  const enableNightMode = async () => {
    await firebaseService.updateMultipleSwitches({ nightMode: true, lock: true, motion: true });
    sounds.success(); haptic.medium();
    toast.success("Night Mode Activated 🌙");
  };

  const disableNightMode = async () => {
    await firebaseService.updateMultipleSwitches({ nightMode: false, lock: false, motion: false });
    sounds.success(); haptic.medium();
    toast.success("Night Mode OFF → Day Mode Active ☀️");
  };

  const activateDayMode = async () => {
    if (nightMode) { toast.error("Disable Night Mode first"); return; }
    sounds.success(); haptic.medium();
    toast.success("Day Mode Active ☀️");
  };

  return (
    <Layout>
      <div className="space-y-6" style={{ animation: "fadeSlideIn 0.4s ease both" }}>

        <h1 className="text-3xl font-bold">Device Control</h1>

        {/* Shortcuts */}
        <Card
          className="border-border/40 bg-card/40 p-4 space-y-4"
          style={{ animation: "fadeSlideIn 0.4s ease both", animationDelay: "0.05s" }}
        >
          <h2 className="font-semibold text-lg">Shortcuts</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <DeviceControl title="All OFF" icon={Zap} isActive={false} onToggle={allOffExceptSecurity} type="button" />
            <DeviceControl title="Night Mode" icon={Lock} isActive={nightMode} onToggle={(v) => v ? enableNightMode() : disableNightMode()} />
            <DeviceControl title="Day Mode" icon={Sun} isActive={dayMode} onToggle={activateDayMode} disabled={nightMode} />
          </div>
        </Card>

        {/* Rooms */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {(["Room 1", "Room 2", "Room 3"] as const).map((room, i) => {
            const prefix = `room${i + 1}` as "room1" | "room2" | "room3";
            const fanKey = `${prefix}Fan` as keyof ControlData;
            const speedKey = `${prefix}FanSpeed` as keyof ControlData;
            const fanOn = !!(controls[fanKey]);
            const fanSpeed = (controls[speedKey] as number) ?? 50;

            return (
              <Card
                key={room}
                className="border-border/40 bg-card/40 p-4 space-y-3 hover:border-border/70 transition-all duration-300"
                style={{ animation: "fadeSlideIn 0.4s ease both", animationDelay: `${0.1 + i * 0.07}s` }}
              >
                <h2 className="font-semibold text-lg">{room}</h2>
                <DeviceControl title="Light" icon={Lightbulb} isActive={!!(controls[`${prefix}Light`])} onToggle={(v) => update(`${prefix}Light`, v)} />
                <DeviceControl title="Switch" icon={ToggleLeft} isActive={!!(controls[`${prefix}Switch`])} onToggle={(v) => update(`${prefix}Switch`, v)} />
                <DeviceControl title="Fan" icon={Fan} isActive={fanOn} onToggle={(v) => update(fanKey, v)} />
                <FanSlider fanOn={fanOn} speed={fanSpeed} onSpeedChange={(v) => updateSpeed(speedKey, v)} />
              </Card>
            );
          })}
        </div>

        {/* Common Areas */}
        <Card
          className="border-border/40 bg-card/40 p-4 space-y-4 hover:border-border/70 transition-all duration-300"
          style={{ animation: "fadeSlideIn 0.4s ease both", animationDelay: "0.31s" }}
        >
          <h2 className="font-semibold text-lg">Common Areas</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <DeviceControl title="Lobby Fan" icon={Fan} isActive={!!controls.lobbyFan} onToggle={(v) => update("lobbyFan", v)} />
              <FanSlider
                fanOn={!!controls.lobbyFan}
                speed={(controls.lobbyFanSpeed as number) ?? 50}
                onSpeedChange={(v) => updateSpeed("lobbyFanSpeed", v)}
              />
            </div>
            <DeviceControl title="Lobby Light" icon={Lightbulb} isActive={!!controls.lobbyLight} onToggle={(v) => update("lobbyLight", v)} />
            <DeviceControl title="TV" icon={Tv} isActive={!!controls.lobbyTV} onToggle={(v) => update("lobbyTV", v)} />
            <DeviceControl title="Refrigerator" icon={Refrigerator} isActive={!!controls.refrigerator} onToggle={(v) => update("refrigerator", v)} />
          </div>
        </Card>

        {/* ======Relays =====*/}
        <Card
          className="border-border/40 bg-card/40 p-4 space-y-4 hover:border-border/70 transition-all duration-300"
          style={{ animation: "fadeSlideIn 0.4s ease both", animationDelay: "0.38s" }}
        >
          <h2 className="font-semibold text-lg">Relay Controls</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {(["relay1", "relay2", "relay3", "relay4"] as const).map((r) => (
              <DeviceControl key={r} title={r.toUpperCase()} icon={Zap} isActive={!!controls[r]} onToggle={(v) => update(r, v)} />
            ))}
          </div>
        </Card>

        {/* Security */}
        <Card
          className="border-border/40 bg-card/40 p-4 space-y-4 hover:border-border/70 transition-all duration-300"
          style={{ animation: "fadeSlideIn 0.4s ease both", animationDelay: "0.45s" }}
        >
          <h2 className="font-semibold text-lg">Security</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <DeviceControl title="Door Lock" icon={Lock} isActive={!!controls.lock} onToggle={(v) => update("lock", v)} />
            <DeviceControl title="Motion Sensor" icon={Activity} isActive={!!controls.motion} onToggle={(v) => update("motion", v)} />
          </div>
        </Card>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Layout>
  );
}
