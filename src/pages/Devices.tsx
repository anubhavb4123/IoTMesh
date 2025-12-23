import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { DeviceControl } from "@/components/DeviceControl";
import { Lightbulb, Fan, Zap, Lock } from "lucide-react";
import { firebaseService } from "@/lib/firebase";
import { toast } from "sonner";

export default function Devices() {
  const [controls, setControls] = useState({
    light: false,
    fan: false,
    relay1: false,
    relay2: false,
    relay3: false,
    relay4: false,
    lock: false,
  });

  // Load real-time Firebase device states
  useEffect(() => {
    const unsubscribe = firebaseService.listenToControlStates((data) => {
      setControls({
        light: data.light ?? false,
        fan: data.fan ?? false,
        relay1: data.relay1 ?? false,
        relay2: data.relay2 ?? false,
        relay3: data.relay3 ?? false,
        relay4: data.relay4 ?? false,
        lock: data.lock ?? false,
      });
    });

    return () => unsubscribe();
  }, []);

  // Write updates to Firebase
  const updateDevice = async (device: string, state: boolean) => {
    try {
      await firebaseService.updateSwitchState(device, state);
      toast.success(`${device} turned ${state ? "ON" : "OFF"}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update device");
    }
  };

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold">Device Control</h1>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <DeviceControl
            title="Main Light"
            icon={Lightbulb}
            isActive={controls.light}
            onToggle={(v) => updateDevice("light", v)}
          />

          <DeviceControl
            title="Ceiling Fan"
            icon={Fan}
            isActive={controls.fan}
            onToggle={(v) => updateDevice("fan", v)}
          />
        </div>

        <h2 className="text-xl font-semibold">Relay Controls</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {["relay1", "relay2", "relay3", "relay4"].map((r) => (
            <DeviceControl
              key={r}
              title={r.toUpperCase()}
              icon={Zap}
              isActive={controls[r]}
              onToggle={(v) => updateDevice(r, v)}
              type="button"
            />
          ))}
        </div>

        <h2 className="text-xl font-semibold">Security</h2>
        <DeviceControl
          title="Door Lock"
          icon={Lock}
          isActive={controls.lock}
          onToggle={(v) => updateDevice("lock", v)}
        />
      </div>
    </Layout>
  );
}