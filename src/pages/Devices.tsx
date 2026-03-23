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
interface FanSliderProps {
  fanOn: boolean;
  speed: number;                      // 0–5
  onSpeedChange: (v: number) => void;
}

const SPEED_LABELS = ["Off", "Low", "2", "Mid", "4", "High"] as const;
const SPEED_COLORS = ["#555", "#38bdf8", "#22d3ee", "#06b6d4", "#f97316", "#ef4444"] as const;
const SPEED_GLOW   = ["transparent", "#38bdf855", "#22d3ee55", "#06b6d455", "#f9731655", "#ef444455"] as const;

function FanSlider({ fanOn, speed, onSpeedChange }: FanSliderProps) {
  const [local, setLocal]   = useState(speed);
  const isDragging          = useRef(false);
  const lastStep            = useRef(-1);

  useEffect(() => {
    if (!isDragging.current) setLocal(speed);
  }, [speed]);

  const pct        = (local / 5) * 100;
  const color      = SPEED_COLORS[local] ?? SPEED_COLORS[0];
  const glow       = SPEED_GLOW[local]   ?? "transparent";
  const label      = SPEED_LABELS[local] ?? "Off";
  const isOff      = local === 0 || !fanOn;
  const spinSpeed  = local === 0 ? "0s" : local <= 2 ? "1.2s" : local <= 4 ? "0.5s" : "0.2s";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!fanOn) return;
    const v = Number(e.target.value);
    setLocal(v);
    if (v !== lastStep.current) {
      haptic.tick();
      sounds.click();
      lastStep.current = v;
    }
  };

  const handleRelease = () => {
    isDragging.current = false;
    onSpeedChange(local);
  };

  return (
    <div
      className="rounded-xl border px-3 pt-2.5 pb-3 mt-1 space-y-3 transition-all duration-300"
      style={{
        borderColor: fanOn && local > 0 ? `${color}55` : "rgba(255,255,255,0.08)",
        background: "transparent",
      }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Animated fan icon */}
          <div
            className="relative flex items-center justify-center w-7 h-7 rounded-lg"
            style={{
              background: fanOn && local > 0 ? `${color}22` : "rgba(255,255,255,0.05)",
              border: `1px solid ${fanOn && local > 0 ? color + "44" : "rgba(255,255,255,0.08)"}`,
            }}
          >
            <Fan
              className="h-3.5 w-3.5 transition-colors duration-300"
              style={{
                color: fanOn && local > 0 ? color : "#555",
                animation: fanOn && local > 0 ? `spin ${spinSpeed} linear infinite` : "none",
              }}
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground tracking-wide">Fan Speed</span>
        </div>

        {/* Speed badge */}
        <div
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold tracking-wider transition-all duration-300"
          style={{
            background: isOff ? "rgba(255,255,255,0.05)" : `${color}22`,
            color:       isOff ? "#555" : color,
            border:      `1px solid ${isOff ? "rgba(255,255,255,0.08)" : color + "44"}`,
            boxShadow:   isOff ? "none" : `0 0 8px ${glow}`,
          }}
        >
          <span>{fanOn ? label : "Fan Off"}</span>
          {fanOn && local > 0 && (
            <span className="opacity-60 font-normal">{local}/5</span>
          )}
        </div>
      </div>

      {/* Step dots + slider */}
      <div className="space-y-2">
        {/* Step dots */}
        <div className="flex justify-between px-0.5">
          {[0, 1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              disabled={!fanOn}
              onClick={() => {
                if (!fanOn) return;
                setLocal(s);
                haptic.tick();
                sounds.click();
                onSpeedChange(s);
              }}
              className="flex flex-col items-center gap-1 group"
            >
              <div
                className="w-2 h-2 rounded-full transition-all duration-200"
                style={{
                  background: fanOn && s <= local && local > 0
                    ? color
                    : s === local && local === 0
                    ? "rgba(255,255,255,0.25)"
                    : "rgba(255,255,255,0.1)",
                  boxShadow: fanOn && s === local && local > 0
                    ? `0 0 6px ${color}`
                    : "none",
                  transform: s === local ? "scale(1.4)" : "scale(1)",
                }}
              />
              <span
                className="text-[9px] tabular-nums transition-colors duration-200"
                style={{ color: fanOn && s <= local && local > 0 ? color : "rgba(255,255,255,0.2)" }}
              >
                {s}
              </span>
            </button>
          ))}
        </div>

        {/* Slider track */}
        <div className="relative h-4 flex items-center mx-0.5">
          {/* Base track */}
          <div className="absolute w-full h-1 rounded-full bg-white/5 border border-white/8" />

          {/* Filled track */}
          <div
            className="absolute left-0 h-1 rounded-full transition-all duration-150"
            style={{
              width: `${pct}%`,
              background: isOff
                ? "rgba(255,255,255,0.08)"
                : `linear-gradient(90deg, ${color}88, ${color})`,
              boxShadow: "none",
            }}
          />

          {/* Thumb */}
          <div
            className="absolute w-4 h-4 rounded-full border-2 pointer-events-none transition-all duration-150"
            style={{
              left: `calc(${pct}% - 8px)`,
              background: isOff ? "#2a2a2a" : color,
              borderColor: isOff ? "#444" : color,
              boxShadow: "none",
            }}
          />

          {/* Native invisible input */}
          <input
            type="range"
            min={0} max={5} step={1}
            value={local}
            disabled={!fanOn}
            onChange={handleChange}
            onMouseDown={() => { if (fanOn) isDragging.current = true; }}
            onTouchStart={() => { if (fanOn) isDragging.current = true; }}
            onMouseUp={handleRelease}
            onTouchEnd={handleRelease}
            className="absolute w-full opacity-0 h-4"
            style={{ cursor: fanOn ? "pointer" : "not-allowed", zIndex: 10 }}
          />
        </div>
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
            const fanSpeed = (controls[speedKey] as number) ?? 0;

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
                speed={(controls.lobbyFanSpeed as number) ?? 0}
                onSpeedChange={(v) => updateSpeed("lobbyFanSpeed", v)}
              />
            </div>
            <DeviceControl title="Lobby Light" icon={Lightbulb} isActive={!!controls.lobbyLight} onToggle={(v) => update("lobbyLight", v)} />
            <DeviceControl title="TV" icon={Tv} isActive={!!controls.lobbyTV} onToggle={(v) => update("lobbyTV", v)} />
            <DeviceControl title="Refrigerator" icon={Refrigerator} isActive={!!controls.refrigerator} onToggle={(v) => update("refrigerator", v)} />
          </div>
        </Card>

        {/* Relays */}
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
