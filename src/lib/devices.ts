import {
  Lightbulb,
  Fan,
  ToggleLeft,
  Tv,
  Refrigerator,
  Zap,
  Lock,
  ShieldCheck,
  LucideIcon,
} from "lucide-react";
import { ControlData } from "./firebase";

export interface DeviceMeta {
  key: keyof ControlData;
  name: string;
  room: string;
  roomKey: "room1" | "room2" | "room3" | "common" | "relay" | "security";
  category: "Lighting" | "Climate" | "Appliances" | "Power & Relays" | "Security";
  icon: LucideIcon;
  description: string;
  defaultAction?: "on" | "off";
  supportsSpeed?: boolean;
  speedKey?: keyof ControlData;
}

export const ALL_DEVICES: DeviceMeta[] = [
  // ── ROOM 1 ──────────────────────────────────────
  {
    key: "room1Light",
    name: "Room 1 Ceiling Light",
    room: "Room 1",
    roomKey: "room1",
    category: "Lighting",
    icon: Lightbulb,
    description: "Main ceiling illumination in Bedroom 1",
  },
  {
    key: "room1Switch",
    name: "Room 1 Wall Switch",
    room: "Room 1",
    roomKey: "room1",
    category: "Appliances",
    icon: ToggleLeft,
    description: "Auxiliary wall socket switch in Bedroom 1",
  },
  {
    key: "room1Fan",
    name: "Room 1 Ceiling Fan",
    room: "Room 1",
    roomKey: "room1",
    category: "Climate",
    icon: Fan,
    description: "3-Speed regulated ceiling fan in Bedroom 1",
    supportsSpeed: true,
    speedKey: "room1FanSpeed",
  },

  // ── ROOM 2 ──────────────────────────────────────
  {
    key: "room2Light",
    name: "Room 2 Ceiling Light",
    room: "Room 2",
    roomKey: "room2",
    category: "Lighting",
    icon: Lightbulb,
    description: "Main ceiling illumination in Bedroom 2",
  },
  {
    key: "room2Switch",
    name: "Room 2 Wall Switch",
    room: "Room 2",
    roomKey: "room2",
    category: "Appliances",
    icon: ToggleLeft,
    description: "Auxiliary wall socket switch in Bedroom 2",
  },
  {
    key: "room2Fan",
    name: "Room 2 Ceiling Fan",
    room: "Room 2",
    roomKey: "room2",
    category: "Climate",
    icon: Fan,
    description: "3-Speed regulated ceiling fan in Bedroom 2",
    supportsSpeed: true,
    speedKey: "room2FanSpeed",
  },

  // ── ROOM 3 ──────────────────────────────────────
  {
    key: "room3Light",
    name: "Room 3 Ceiling Light",
    room: "Room 3",
    roomKey: "room3",
    category: "Lighting",
    icon: Lightbulb,
    description: "Main ceiling illumination in Guest Bedroom 3",
  },
  {
    key: "room3Switch",
    name: "Room 3 Wall Switch",
    room: "Room 3",
    roomKey: "room3",
    category: "Appliances",
    icon: ToggleLeft,
    description: "Auxiliary wall socket switch in Bedroom 3",
  },
  {
    key: "room3Fan",
    name: "Room 3 Ceiling Fan",
    room: "Room 3",
    roomKey: "room3",
    category: "Climate",
    icon: Fan,
    description: "3-Speed regulated ceiling fan in Bedroom 3",
    supportsSpeed: true,
    speedKey: "room3FanSpeed",
  },

  // ── COMMON AREA ─────────────────────────────────
  {
    key: "lobbyLight",
    name: "Lobby / Porch Light",
    room: "Common Area",
    roomKey: "common",
    category: "Lighting",
    icon: Lightbulb,
    description: "Main foyer and lobby ambient lighting",
  },
  {
    key: "lobbyFan",
    name: "Lobby Ceiling Fan",
    room: "Common Area",
    roomKey: "common",
    category: "Climate",
    icon: Fan,
    description: "Central high-output fan in main living lounge",
    supportsSpeed: true,
    speedKey: "lobbyFanSpeed",
  },
  {
    key: "lobbyTV",
    name: "Living Room Smart TV",
    room: "Common Area",
    roomKey: "common",
    category: "Appliances",
    icon: Tv,
    description: "Entertainment display power relay",
  },
  {
    key: "refrigerator",
    name: "Kitchen Refrigerator",
    room: "Common Area",
    roomKey: "common",
    category: "Appliances",
    icon: Refrigerator,
    description: "Constant-power cooling compressor supply",
  },

  // ── RELAY BANK ──────────────────────────────────
  {
    key: "relay1",
    name: "Relay Channel 1",
    room: "Relay Bank",
    roomKey: "relay",
    category: "Power & Relays",
    icon: Zap,
    description: "High voltage AC optocoupled relay channel 1",
  },
  {
    key: "relay2",
    name: "Relay Channel 2",
    room: "Relay Bank",
    roomKey: "relay",
    category: "Power & Relays",
    icon: Zap,
    description: "High voltage AC optocoupled relay channel 2",
  },
  {
    key: "relay3",
    name: "Relay Channel 3",
    room: "Relay Bank",
    roomKey: "relay",
    category: "Power & Relays",
    icon: Zap,
    description: "High voltage AC optocoupled relay channel 3",
  },
  {
    key: "relay4",
    name: "Relay Channel 4",
    room: "Relay Bank",
    roomKey: "relay",
    category: "Power & Relays",
    icon: Zap,
    description: "High voltage AC optocoupled relay channel 4",
  },

  // ── SECURITY ────────────────────────────────────
  {
    key: "lock",
    name: "Perimeter Smart Door Lock",
    room: "Security",
    roomKey: "security",
    category: "Security",
    icon: Lock,
    description: "Electronic solenoid main entrance lock",
  },
  {
    key: "motion",
    name: "PIR Intrusion Alarm",
    room: "Security",
    roomKey: "security",
    category: "Security",
    icon: ShieldCheck,
    description: "Perimeter motion detection siren armed state",
  },
];

export const DEVICE_MAP = new Map<keyof ControlData, DeviceMeta>(
  ALL_DEVICES.map((d) => [d.key, d])
);

export function getDeviceMeta(key: string): DeviceMeta {
  const found = DEVICE_MAP.get(key as keyof ControlData);
  if (found) return found;

  return {
    key: key as keyof ControlData,
    name: key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase()),
    room: "General",
    roomKey: "common",
    category: "Appliances",
    icon: ToggleLeft,
    description: "IoT switch device",
  };
}
