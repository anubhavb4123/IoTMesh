import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { DeviceControl } from "@/components/DeviceControl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Lightbulb, Fan, ToggleLeft, Tv, Zap, Lock, LockOpen,
  Activity, Sun, Moon, Refrigerator, KeyRound, X, Power
} from "lucide-react";
import { firebaseService, ControlData, NodeStatusData } from "@/lib/firebase";
import { toast } from "sonner";
import { sounds } from "@/lib/sounds";
import { haptic } from "@/lib/haptic";
import { useAuth } from "@/contexts/AuthContext";
import { cn, parseNodeTimestampToMs, formatNodeLastSeen } from "@/lib/utils";

const SECURITY_PASSWORD = import.meta.env.VITE_SECURITY_PASSWORD;

// ── Minimalist Segmented Fan Speed Selector ────────────────────
interface FanSegmentedControlProps {
  fanOn: boolean;
  speed: number; // 0–3
  onSelect: (value: number) => void;
}

function FanSegmentedControl({ fanOn, speed, onSelect }: FanSegmentedControlProps) {
  const steps = [
    { label: "Off", value: 0 },
    { label: "1 · Low", value: 1 },
    { label: "2 · Med", value: 2 },
    { label: "3 · High", value: 3 },
  ];

  return (
    <div className="p-1 rounded-xl bg-black border border-white/10 flex items-center gap-1">
      {steps.map((step) => {
        const isSelected = !fanOn
          ? step.value === 0
          : (speed === 0 ? step.value === 1 : speed === step.value);

        return (
          <button
            key={step.value}
            onClick={() => {
              haptic.tick();
              sounds.click();
              onSelect(step.value);
            }}
            className={cn(
              "flex-1 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 text-center select-none cursor-pointer",
              isSelected
                ? "bg-white text-black font-bold shadow-sm"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900"
            )}
          >
            {step.label}
          </button>
        );
      })}
    </div>
  );
}

// ── ESP Node Status Component ─────────────────────────────────
interface NodeStatusPanelProps {
  title: string;
  status: NodeStatusData | null;
}

function NodeStatusPanel({ title, status }: NodeStatusPanelProps) {
  const [online, setOnline] = useState<boolean>(false);
  const [ageText, setAgeText] = useState<string>("—");

  useEffect(() => {
    const tick = () => {
      const ts = status?.serverTimestamp ?? status?.lastSeenEpoch ?? status?.timestamp ?? status?.lastSeen;
      const ms = parseNodeTimestampToMs(ts);
      if (!ms) {
        setOnline(false);
        setAgeText("—");
        return;
      }
      const diff = Date.now() - ms;
      // Under 1 min (<= 60,000 ms) = Online, more than 1 min = Offline
      const isOnline = diff >= -5000 && diff <= 60_000;
      setOnline(isOnline);

      const s = Math.max(0, Math.floor(diff / 1000));
      setAgeText(s < 60 ? `${s}s ago` : s < 3600 ? `${Math.floor(s / 60)}m ago` : `${Math.floor(s / 3600)}h ago`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [status?.serverTimestamp, status?.lastSeen, status?.lastSeenEpoch, status?.timestamp]);

  return (
    <div className="rounded-xl border border-white/8 bg-neutral-950 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono">
          {title}
        </span>
        <span className={cn(
          "flex items-center gap-1.5 text-[10px] font-semibold font-mono px-2 py-0.5 rounded-full transition-colors",
          online
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            : "bg-red-500/10 text-red-400 border border-red-500/20"
        )}>
          <span className={cn(
            "w-1.5 h-1.5 rounded-full",
            online ? "bg-emerald-500 animate-pulse" : "bg-red-500"
          )} />
          {status == null ? "Offline" : online ? "Online" : "Offline"}
          {status != null && ageText !== "—" && (
            <span className="text-neutral-500 text-[9px]">· {ageText}</span>
          )}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {[
          { label: "IP",        value: status?.ip ?? "—" },
          { label: "RSSI",      value: status?.rssi != null ? `${status.rssi} dBm` : "—" },
          { label: "Uptime",    value: status?.uptime != null
              ? status.uptime < 60
                ? `${status.uptime}s`
                : status.uptime < 3600
                ? `${Math.floor(status.uptime / 60)}m ${status.uptime % 60}s`
                : `${Math.floor(status.uptime / 3600)}h ${Math.floor((status.uptime % 3600) / 60)}m`
              : "—" },
          { label: "Free Heap", value: status?.freeHeap != null ? `${(status.freeHeap / 1024).toFixed(1)} KB` : "—" },
          { label: "Chip Temp", value: status?.chipTempC != null ? `${status.chipTempC.toFixed(1)} °C` : "—" },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between gap-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 font-mono whitespace-nowrap">{label}</span>
            <span className="text-[10px] font-mono text-neutral-300 truncate text-right">{value}</span>
          </div>
        ))}
      </div>

      {/* Dedicated Full-Width Last Seen Row (never truncated) */}
      <div className="pt-2 mt-0.5 border-t border-white/10 flex items-center justify-between gap-2">
        <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 font-mono whitespace-nowrap">
          Last Seen
        </span>
        <span
          className="text-[10px] font-mono text-neutral-200 text-right font-medium"
          title={String(status?.lastSeen ?? "")}
        >
          {formatNodeLastSeen(status?.serverTimestamp ?? status?.lastSeenEpoch ?? status?.timestamp ?? status?.lastSeen)}
        </span>
      </div>
    </div>
  );
}

export default function Devices() {
  const [controls, setControls] = useState<ControlData>({} as ControlData);
  const { role } = useAuth();
  const [roomStatuses, setRoomStatuses] = useState<{
    room1: NodeStatusData | null;
    room2: NodeStatusData | null;
    room3: NodeStatusData | null;
    common: NodeStatusData | null;
  }>({
    room1: null,
    room2: null,
    room3: null,
    common: null,
  });

  // Listen to all room and common area node statuses from Firebase RTDB
  useEffect(() => {
    const unsub1 = firebaseService.listenToRoom1Status((data) =>
      setRoomStatuses((prev) => ({ ...prev, room1: data }))
    );
    const unsub2 = firebaseService.listenToRoom2Status((data) =>
      setRoomStatuses((prev) => ({ ...prev, room2: data }))
    );
    const unsub3 = firebaseService.listenToRoom3Status((data) =>
      setRoomStatuses((prev) => ({ ...prev, room3: data }))
    );
    const unsubCommon = firebaseService.listenToCommonAreaStatus((data) =>
      setRoomStatuses((prev) => ({ ...prev, common: data }))
    );

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsubCommon();
    };
  }, []);

  // Security password modal state (guests only)
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [securityInput, setSecurityInput] = useState("");
  const [pendingLockValue, setPendingLockValue] = useState<boolean>(false);

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
      toast.error("Perimeter Locked", { description: "Security controls cannot be modified in Night Mode." });
      return;
    }
    await firebaseService.updateSwitchState(key, value);
  };

  const handleLockToggle = (value: boolean) => {
    if (nightMode) {
      sounds.error();
      haptic.error();
      toast.error("Perimeter Locked", { description: "Security controls cannot be modified in Night Mode." });
      return;
    }
    if (role === "admin") {
      update("lock", value);
      return;
    }
    // Guest → require master passkey
    setPendingLockValue(value);
    setShowSecurityModal(true);
    setSecurityInput("");
  };

  const handleSecuritySubmit = () => {
    if (securityInput === SECURITY_PASSWORD) {
      setShowSecurityModal(false);
      setSecurityInput("");
      sounds.success();
      haptic.success();
      toast.success(pendingLockValue ? "Door Locked 🔒" : "Door Unlocked 🔓");
      firebaseService.updateSwitchState("lock", pendingLockValue);
    } else {
      setSecurityInput("");
      sounds.wrongPass();
      haptic.error();
      toast.error("Incorrect security password");
    }
  };

  const closeSecurityModal = () => {
    setShowSecurityModal(false);
    setSecurityInput("");
  };

  const handleFanChange = async (fanKey: keyof ControlData, speedKey: keyof ControlData, stepValue: number) => {
    if (stepValue === 0) {
      await firebaseService.updateMultipleSwitches({
        [fanKey]: false,
        [speedKey]: 0,
      });
    } else {
      await firebaseService.updateMultipleSwitches({
        [fanKey]: true,
        [speedKey]: stepValue,
      });
    }
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
    toast.success("All appliances turned OFF (Security intact)");
  };

  const enableNightMode = async () => {
    await firebaseService.updateMultipleSwitches({ nightMode: true, lock: true, motion: true });
    sounds.success();
    haptic.medium();
    toast.success("Night Mode Active 🌙", { description: "Perimeter locked and motion detection armed." });
  };

  const disableNightMode = async () => {
    await firebaseService.updateMultipleSwitches({ nightMode: false, lock: false, motion: false });
    sounds.success();
    haptic.medium();
    toast.success("Day Mode Active ☀️", { description: "Night mode disarmed." });
  };

  const activateDayMode = async () => {
    if (nightMode) {
      toast.error("Disable Night Mode first");
      return;
    }
    sounds.success();
    haptic.medium();
    toast.success("Day Mode Active ☀️");
  };

  return (
    <Layout>
      <div className="space-y-8 pb-12 max-w-7xl">

        {/* ── Header & Scene Shortcuts ── */}
        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Device Control</h1>
            <p className="text-xs text-neutral-400 mt-0.5">Manage room appliances, relays, and perimeter locks</p>
          </div>

          {/* Quick Scene Pill Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={allOffExceptSecurity}
              className="flex items-center justify-center gap-2.5 p-3.5 rounded-2xl bg-black border border-white/12 text-neutral-200 hover:text-white hover:border-white/30 hover:bg-neutral-950 transition-all font-semibold text-xs tile-btn shadow-sm"
            >
              <Power className="w-4 h-4 text-neutral-400" />
              <span>Turn All Off</span>
            </button>

            <button
              onClick={() => nightMode ? disableNightMode() : enableNightMode()}
              className={cn(
                "flex items-center justify-center gap-2.5 p-3.5 rounded-2xl border font-bold text-xs tile-btn transition-all shadow-sm",
                nightMode
                  ? "bg-white text-black border-white shadow-md"
                  : "bg-black border-white/12 text-neutral-200 hover:text-white hover:border-white/30 hover:bg-neutral-950"
              )}
            >
              <Moon className={cn("w-4 h-4", nightMode ? "text-black" : "text-neutral-400")} />
              <span>{nightMode ? "Night Mode (Active)" : "Activate Night Mode"}</span>
            </button>

            <button
              onClick={activateDayMode}
              disabled={nightMode}
              className={cn(
                "flex items-center justify-center gap-2.5 p-3.5 rounded-2xl border font-semibold text-xs tile-btn transition-all shadow-sm",
                dayMode && !nightMode
                  ? "bg-black border-white/12 text-neutral-200 hover:text-white hover:border-white/30"
                  : "bg-neutral-950/40 border-white/5 text-neutral-600 cursor-not-allowed"
              )}
            >
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Day Mode</span>
            </button>
          </div>
        </div>

        {/* ── Rooms (Room 1, 2, 3) ── */}
        <div className="grid gap-6 lg:grid-cols-3">
          {(["Room 1", "Room 2", "Room 3"] as const).map((room, i) => {
            const prefix = `room${i + 1}` as "room1" | "room2" | "room3";
            const fanKey = `${prefix}Fan` as keyof ControlData;
            const speedKey = `${prefix}FanSpeed` as keyof ControlData;
            const fanOn = !!(controls[fanKey]);
            const fanSpeed = (controls[speedKey] as number) ?? 0;

            return (
              <div key={room} className="rounded-2xl border border-white/12 bg-black p-4 space-y-3.5 shadow-sm">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-white font-mono">{room}</h2>
                  <span className="text-[11px] text-neutral-400 font-medium font-mono">3 Devices</span>
                </div>

                {/* ESP32 Status Panel for each Room */}
                <NodeStatusPanel
                  title={`ESP32 · ${room}`}
                  status={roomStatuses[prefix]}
                />

                <div className="space-y-2.5">
                  <DeviceControl
                    title="Ceiling Light"
                    icon={Lightbulb}
                    isActive={!!(controls[`${prefix}Light`])}
                    onToggle={(v) => update(`${prefix}Light`, v)}
                  />
                  <DeviceControl
                    title="Wall Switch"
                    icon={ToggleLeft}
                    isActive={!!(controls[`${prefix}Switch`])}
                    onToggle={(v) => update(`${prefix}Switch`, v)}
                  />
                  
                  {/* Fan Tile + Integrated Speed Selector */}
                  <div className="space-y-2 p-3.5 rounded-2xl bg-neutral-950 border border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                        fanOn ? "bg-white text-black" : "bg-neutral-900 text-neutral-400"
                      )}>
                        <Fan className={cn("w-4 h-4", fanOn && "animate-spin [animation-duration:1.5s]")} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">Ceiling Fan</p>
                        <p className="text-[10px] text-neutral-400">{fanOn ? `Speed ${fanSpeed || 1}` : "Turned Off"}</p>
                      </div>
                    </div>

                    <FanSegmentedControl
                      fanOn={fanOn}
                      speed={fanSpeed}
                      onSelect={(val) => handleFanChange(fanKey, speedKey, val)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Common Areas ── */}
        <div className="rounded-2xl border border-white/12 bg-black p-4 space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white font-mono">Common Areas</h2>
            <span className="text-[11px] text-neutral-400 font-medium font-mono">Lobby & Appliances</span>
          </div>

          {/* ESP32 Status Panel for Common Area */}
          <NodeStatusPanel
            title="ESP32 · Common Area"
            status={roomStatuses.common}
          />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <DeviceControl
              title="Lobby Light"
              icon={Lightbulb}
              isActive={!!controls.lobbyLight}
              onToggle={(v) => update("lobbyLight", v)}
            />
            <DeviceControl
              title="Living Room TV"
              icon={Tv}
              isActive={!!controls.lobbyTV}
              onToggle={(v) => update("lobbyTV", v)}
            />
            <DeviceControl
              title="Refrigerator"
              icon={Refrigerator}
              isActive={!!controls.refrigerator}
              onToggle={(v) => update("refrigerator", v)}
            />

            {/* Lobby Fan with inline selector */}
            <div className="p-3.5 rounded-2xl bg-neutral-950 border border-white/10 space-y-2">
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                  controls.lobbyFan ? "bg-white text-black" : "bg-neutral-900 text-neutral-400"
                )}>
                  <Fan className={cn("w-4 h-4", controls.lobbyFan && "animate-spin [animation-duration:1.5s]")} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Lobby Fan</p>
                  <p className="text-[10px] text-neutral-400">{controls.lobbyFan ? `Speed ${(controls.lobbyFanSpeed as number) || 1}` : "Turned Off"}</p>
                </div>
              </div>
              <FanSegmentedControl
                fanOn={!!controls.lobbyFan}
                speed={(controls.lobbyFanSpeed as number) ?? 0}
                onSelect={(val) => handleFanChange("lobbyFan", "lobbyFanSpeed", val)}
              />
            </div>
          </div>
        </div>

        {/* ── Relay Controls Bank ── */}
        <div className="rounded-2xl border border-white/12 bg-black p-4 space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white font-mono">4-Channel Relay Bank</h2>
            <span className="text-[11px] font-mono text-neutral-400">Optocoupled Relays</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(["relay1", "relay2", "relay3", "relay4"] as const).map((r, idx) => (
              <DeviceControl
                key={r}
                title={`Relay Channel ${idx + 1}`}
                subtitle={controls[r] ? "Energized" : "De-energized"}
                icon={Zap}
                isActive={!!controls[r]}
                onToggle={(v) => update(r, v)}
              />
            ))}
          </div>
        </div>

        {/* ── Perimeter Security & Door Lock ── */}
        <div className="rounded-2xl border border-white/12 bg-black p-4 space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white font-mono">Perimeter Security</h2>
            <span className="text-[11px] font-medium text-emerald-400 font-mono">Active Defense</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <DeviceControl
              title="Main Door Lock"
              subtitle={controls.lock ? "Locked 🔒" : "Unlocked 🔓"}
              icon={controls.lock ? Lock : LockOpen}
              isActive={!!controls.lock}
              onToggle={handleLockToggle}
            />
            <DeviceControl
              title="PIR Motion Alarm"
              subtitle={controls.motion ? "Armed 🛡️" : "Disarmed"}
              icon={Activity}
              isActive={!!controls.motion}
              onToggle={(v) => update("motion", v)}
            />
          </div>
        </div>

      </div>

      {/* ── SECURITY PASSWORD MODAL (Guest Lock Interlock) ── */}
      {showSecurityModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeSecurityModal(); }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-black border border-white/15 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-white/10 flex items-center justify-center text-white">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">
                  {pendingLockValue ? "Lock Door" : "Unlock Door"}
                </h3>
              </div>
              <button onClick={closeSecurityModal} className="text-neutral-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              Guest authorization required. Please enter the master security password to toggle the door lock.
            </p>

            <Input
              type="password"
              placeholder="Security password"
              value={securityInput}
              onChange={(e) => setSecurityInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSecuritySubmit(); }}
              className="bg-neutral-950 border-white/15 text-white placeholder:text-neutral-600 rounded-xl"
              autoFocus
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={closeSecurityModal} className="text-neutral-400 hover:text-white">
                Cancel
              </Button>
              <Button size="sm" onClick={handleSecuritySubmit} className="bg-white text-black hover:bg-neutral-200 font-bold">
                Verify & Actuate
              </Button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
