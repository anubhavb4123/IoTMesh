export const COMMAND_TTL_MS = 15_000;
export const REPORT_STALE_MS = 45_000;
export const SWITCH_NODES = ["room1", "room2", "room3", "commonarea", "relay", "security"] as const;

export interface SwitchCommand {
  id: string;
  value: boolean;
  speed?: number;
  issuedAt: number;
  expiresAt: number;
}

export interface SwitchReport { value: boolean; speed?: number }
export interface SwitchAcknowledgment { commandId: string; outcome: "applied" | "rejected" }

export interface SwitchNodeSnapshot {
  commands?: Record<string, SwitchCommand>;
  reports?: { heartbeatAt?: number } & Partial<Record<string, SwitchReport | SwitchAcknowledgment | number>>;
}

export function getSwitchStatus(
  command: SwitchCommand | undefined,
  report: SwitchReport | undefined,
  acknowledgment: SwitchAcknowledgment | undefined,
  offline: boolean,
  now: number,
  currentLabel = report?.value ? "ON" : "OFF",
) {
  const last = report ? ` · Last reported ${currentLabel}` : "";
  const awaiting = !!command && command.id !== acknowledgment?.commandId;
  const pending = awaiting && command.expiresAt > now;

  if (offline) return { text: `Offline${last}`, pending };
  if (pending) {
    const action = command.speed ? `Setting speed ${command.speed}…` : command.value ? "Turning on…" : "Turning off…";
    return { text: `${action}${last}`, pending };
  }
  if (awaiting) return { text: `No confirmation${last}`, pending };
  if (command && acknowledgment?.outcome === "rejected") return { text: `Command rejected${last}`, pending };
  return { text: report ? undefined : "Awaiting device report", pending };
}
