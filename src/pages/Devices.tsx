import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { DeviceControl } from "@/components/DeviceControl";
import { Card } from "@/components/ui/card";
import { Lightbulb, Fan, ToggleLeft, Tv, Zap, Lock, Activity, Sun, Refrigerator } from "lucide-react";
import { firebaseService } from "@/lib/firebase";
import { toast } from "sonner";
import { ControlData } from "@/lib/firebase";
import { sounds } from "@/lib/sounds";
import { haptic } from "@/lib/haptic";

export default function Devices() {
  const [controls, setControls] = useState<ControlData>({} as ControlData);

  useEffect(() => {
    const unsub = firebaseService.listenToControlStates(setControls);
    return () => unsub();
  }, []);

  const nightMode = !!controls.nightMode;

  const update = async (key: keyof ControlData, value: boolean) => {
    if (nightMode && (key === "lock" || key === "motion")) {
      sounds.error();
      haptic.error();
      toast.error("Security is locked in Night Mode");
      return;
    }
    await firebaseService.updateSwitchState(key, value);
  };

  const dayMode = !nightMode;

  const ALL_NON_SECURITY: (keyof ControlData)[] = [
    "room1Light","room1Switch","room1Fan",
    "room2Light","room2Switch","room2Fan",
    "room3Light","room3Switch","room3Fan",
    "lobbyFan","lobbyLight","lobbyTV","refrigerator",
    "relay1","relay2","relay3","relay4",
  ];

  const allOffExceptSecurity = async () => {
    const updates: Partial<ControlData> = {};
    ALL_NON_SECURITY.forEach((k) => (updates[k] = false));
    await firebaseService.updateMultipleSwitches(updates);
    sounds.success();
    haptic.heavy();
    toast.success("All devices OFF (Security unchanged)");
  };

  const enableNightMode = async () => {
    await firebaseService.updateMultipleSwitches({ nightMode: true, lock: true, motion: true });
    toast.success("Night Mode Activated 🌙");
    sounds.success();
    haptic.medium();
  };

  const disableNightMode = async () => {
    await firebaseService.updateMultipleSwitches({ nightMode: false, lock: false, motion: false });
    toast.success("Night Mode OFF → Day Mode Active ☀️");
    sounds.success();
    haptic.medium();
  };

  const activateDayMode = async () => {
    if (nightMode) { toast.error("Disable Night Mode first"); return; }
    toast.success("Day Mode Active ☀️");
    sounds.success();
    haptic.medium();
  };

  return (
    <Layout>
      <div className="space-y-6" style={{ animation: "fadeSlideIn 0.4s ease both" }}>

        {/* Header */}
        <h1 className="text-3xl font-bold" style={{ animation: "fadeSlideIn 0.4s ease both" }}>
          Device Control
        </h1>

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
          {["Room 1", "Room 2", "Room 3"].map((room, i) => {
            const prefix = `room${i + 1}` as "room1" | "room2" | "room3";
            return (
              <Card
                key={room}
                className="border-border/40 bg-card/40 p-4 space-y-3 hover:border-border/70 transition-all duration-300"
                style={{ animation: "fadeSlideIn 0.4s ease both", animationDelay: `${0.1 + i * 0.07}s` }}
              >
                <h2 className="font-semibold text-lg">{room}</h2>
                <DeviceControl title="Light" icon={Lightbulb} isActive={controls[`${prefix}Light`]} onToggle={(v) => update(`${prefix}Light`, v)} />
                <DeviceControl title="Switch" icon={ToggleLeft} isActive={controls[`${prefix}Switch`]} onToggle={(v) => update(`${prefix}Switch`, v)} />
                <DeviceControl title="Fan" icon={Fan} isActive={controls[`${prefix}Fan`]} onToggle={(v) => update(`${prefix}Fan`, v)} />
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
            <DeviceControl title="Lobby Fan" icon={Fan} isActive={controls.lobbyFan} onToggle={(v) => update("lobbyFan", v)} />
            <DeviceControl title="Lobby Light" icon={Lightbulb} isActive={controls.lobbyLight} onToggle={(v) => update("lobbyLight", v)} />
            <DeviceControl title="TV" icon={Tv} isActive={controls.lobbyTV} onToggle={(v) => update("lobbyTV", v)} />
            <DeviceControl title="Refrigerator" icon={Refrigerator} isActive={controls.refrigerator} onToggle={(v) => update("refrigerator", v)} />
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
              <DeviceControl key={r} title={r.toUpperCase()} icon={Zap} isActive={controls[r]} onToggle={(v) => update(r, v)} />
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
            <DeviceControl title="Door Lock" icon={Lock} isActive={controls.lock} onToggle={(v) => update("lock", v)} />
            <DeviceControl title="Motion Sensor" icon={Activity} isActive={controls.motion} onToggle={(v) => update("motion", v)} />
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
