import { useEffect, useState } from "react";
import { DEFAULT_CONTROLS, firebaseService, getSwitchChannel, getSwitchTime, type ControlData, type SwitchSnapshots } from "@/lib/firebase";
import { getSwitchStatus, REPORT_STALE_MS, SWITCH_NODES } from "@/lib/switchControl";

const controlKeys = Object.keys(DEFAULT_CONTROLS) as (keyof ControlData)[];

export function useDeviceControls() {
  const [nodes, setNodes] = useState<SwitchSnapshots>({});
  const [now, setNow] = useState(getSwitchTime);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => firebaseService.listenToSwitchNodes(setNodes, (failure) => setError(failure.message)), []);
  useEffect(() => {
    const timer = setInterval(() => setNow(getSwitchTime()), 1000);
    return () => clearInterval(timer);
  }, []);

  const readChannel = (key: keyof ControlData) => {
    const { node, property, isSpeed } = getSwitchChannel(key);
    const data = nodes[node];
    const candidate = data?.reports?.[property];
    const report = candidate && typeof candidate === "object" && "value" in candidate && typeof candidate.value === "boolean"
      ? candidate : undefined;
    const ack = data?.reports?.[`${property}Ack`];
    const acknowledgment = ack && typeof ack === "object" && "commandId" in ack ? ack : undefined;
    return { data, property, isSpeed, report, acknowledgment };
  };

  const controlData = Object.fromEntries(controlKeys.map((key) => {
    const { report, isSpeed } = readChannel(key);
    return [key, isSpeed ? report?.speed : report?.value];
  })) as Partial<ControlData>;

  const status = (key: keyof ControlData, currentLabel?: string) => {
    const { data, property, report, acknowledgment } = readChannel(key);
    const heartbeat = data?.reports?.heartbeatAt;
    const offline = typeof heartbeat === "number" && now - heartbeat > REPORT_STALE_MS;
    if (!data && error) return { text: "Device reports unavailable", pending: false, known: false };
    return {
      ...getSwitchStatus(data?.commands?.[property], report, acknowledgment, offline, now, currentLabel),
      known: report !== undefined,
    };
  };

  return { controlData, status, loading: !error && Object.keys(nodes).length < SWITCH_NODES.length, error };
}
