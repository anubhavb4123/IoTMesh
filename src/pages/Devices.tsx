import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { DeviceControl } from "@/components/DeviceControl";
import { Card } from "@/components/ui/card";
import {
  Lightbulb,
  Fan,
  ToggleLeft,
  Tv,
  Zap,
  Lock,
  Activity,
  Sun,
  Refrigerator,
} from "lucide-react";
import { firebaseService } from "@/lib/firebase";
import { toast } from "sonner";
import { ControlData } from "@/lib/firebase";

export default function Devices() {
  const [controls, setControls] = useState<ControlData>({} as ControlData);

  useEffect(() => {
    const unsub = firebaseService.listenToControlStates(setControls);
    return () => unsub();
  }, []);
  const nightMode = !!controls.nightMode;
  const update = async (key: keyof ControlData, value: boolean) => {
    if (nightMode && (key === "lock" || key === "motion")) {
      toast.error("Security is locked in Night Mode");
      return;
    }
    await firebaseService.updateSwitchState(key, value);
  };
  const dayMode = !nightMode;
  const ALL_NON_SECURITY: (keyof ControlData)[] = [
    "room1Light", "room1Switch", "room1Fan",
    "room2Light", "room2Switch", "room2Fan",
    "room3Light", "room3Switch", "room3Fan",
    "lobbyFan", "lobbyLight", "lobbyTV", "refrigerator",
    "relay1", "relay2", "relay3", "relay4",
  ];
  const SECURITY_KEYS: (keyof ControlData)[] = [
    "lock",
    "motion",
  ];
  const allOffExceptSecurity = async () => {
    const updates: Partial<ControlData> = {};

    ALL_NON_SECURITY.forEach((k) => (updates[k] = false));

    await firebaseService.updateMultipleSwitches(updates);
    toast.success("All devices OFF (Security unchanged)");
  };
  const enableNightMode = async () => {
    const updates: Partial<ControlData> = {
      nightMode: true,
      lock: true,      
      motion: true,   
    };

    await firebaseService.updateMultipleSwitches(updates);
    toast.success("Night Mode Activated 🌙");
  };
  const disableNightMode = async () => {
    await firebaseService.updateMultipleSwitches({
      nightMode: false,
      lock: false,
      motion: false,
    });

    toast.success("Night Mode OFF → Day Mode Active ☀️");
  };
  const activateDayMode = async () => {
    if (nightMode) {
      toast.error("Disable Night Mode first");
      return;
    }

    // Nothing else needed
    toast.success("Day Mode Active ☀️");
  };
  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Device Control</h1>
        <Card className="border-border/40 bg-card/40 p-4 space-y-4">
          <h2 className="font-semibold text-lg">Shortcuts</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {/* 1️⃣ ALL OFF */}
            <DeviceControl
              title="All OFF"
              icon={Zap}
              isActive={false}
              onToggle={allOffExceptSecurity}
              type="button"
            />

            {/* 2️⃣ NIGHT MODE */}
            <DeviceControl
              title="Night Mode"
              icon={Lock}
              isActive={nightMode}
              onToggle={(v) => (v ? enableNightMode() : disableNightMode())}
            />

            {/* 3️⃣ DAY MODE */}
            <DeviceControl
              title="Day Mode"
              icon={Sun}
              isActive={dayMode}
              onToggle={activateDayMode}
              disabled={nightMode}
            />
          </div>
        </Card>
        {/* ROOMS */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {/* ROOM 1 */}
          <Card className="border-border/40 bg-card/40 p-4 space-y-3">
            <h2 className="font-semibold text-lg">Room 1</h2>
            <DeviceControl title="Light" icon={Lightbulb}
              isActive={controls.room1Light}
              onToggle={(v) => update("room1Light", v)}
            />
            <DeviceControl title="Switch" icon={ToggleLeft}
              isActive={controls.room1Switch}
              onToggle={(v) => update("room1Switch", v)}
            />
            <DeviceControl title="Fan" icon={Fan}
              isActive={controls.room1Fan}
              onToggle={(v) => update("room1Fan", v)}
            />
          </Card>

          {/* ROOM 2 */}
          <Card className="border-border/40 bg-card/40 p-4 space-y-3">
            <h2 className="font-semibold text-lg">Room 2</h2>
            <DeviceControl title="Light" icon={Lightbulb}
              isActive={controls.room2Light}
              onToggle={(v) => update("room2Light", v)}
            />
            <DeviceControl title="Switch" icon={ToggleLeft}
              isActive={controls.room2Switch}
              onToggle={(v) => update("room2Switch", v)}
            />
            <DeviceControl title="Fan" icon={Fan}
              isActive={controls.room2Fan}
              onToggle={(v) => update("room2Fan", v)}
            />
          </Card>

          {/* ROOM 3 */}
          <Card className="border-border/40 bg-card/40 p-4 space-y-3">
            <h2 className="font-semibold text-lg">Room 3</h2>
            <DeviceControl title="Light" icon={Lightbulb}
              isActive={controls.room3Light}
              onToggle={(v) => update("room3Light", v)}
            />
            <DeviceControl title="Switch" icon={ToggleLeft}
              isActive={controls.room3Switch}
              onToggle={(v) => update("room3Switch", v)}
            />
            <DeviceControl title="Fan" icon={Fan}
              isActive={controls.room3Fan}
              onToggle={(v) => update("room3Fan", v)}
            />
          </Card>
        </div>

        {/* ================= COMMON AREAS ================= */}
        <Card className="border-border/40 bg-card/40 p-4 space-y-4">
          <h2 className="font-semibold text-lg">Common Areas</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <DeviceControl title="Lobby Fan" icon={Fan}
              isActive={controls.lobbyFan}
              onToggle={(v) => update("lobbyFan", v)}
            />
            <DeviceControl title="Lobby Light" icon={Lightbulb}
              isActive={controls.lobbyLight}
              onToggle={(v) => update("lobbyLight", v)}
            />
            <DeviceControl title="TV" icon={Tv}
              isActive={controls.lobbyTV}
              onToggle={(v) => update("lobbyTV", v)}
            />
            <DeviceControl title="Refrigerator" icon={Refrigerator}
              isActive={controls.refrigerator}
              onToggle={(v) => update("refrigerator", v)}
            />
          </div>
        </Card>
        {/* ================= RELAYS ================= */}
        <Card className="border-border/40 bg-card/40 p-4 space-y-4">
          <h2 className="font-semibold text-lg">Relay Controls</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {(["relay1", "relay2", "relay3", "relay4"] as const).map((r) => (
              <DeviceControl
                key={r}
                title={r.toUpperCase()}
                icon={Zap}
                isActive={controls[r]}
                onToggle={(v) => update(r, v)}
              />
            ))}
          </div>
        </Card>
        {/* ================= SECURITY ================= */}
        <Card className="border-border/40 bg-card/40 p-4 space-y-4">
          <h2 className="font-semibold text-lg">Security</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <DeviceControl title="Door Lock" icon={Lock}
              isActive={controls.lock}
              onToggle={(v) => update("lock", v)}
            />
            <DeviceControl title="Motion Sensor" icon={Activity}
              isActive={controls.motion}
              onToggle={(v) => update("motion", v)}
            />
          </div>
        </Card>
      </div>
    </Layout>
  );
}