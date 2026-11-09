// ------------------------------------------------------
// IMPORTS
// ------------------------------------------------------
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
  getDatabase,
  ref,
  get,
  onValue,
  set,
  update,
  push,
  runTransaction
} from "firebase/database";
import { COMMAND_TTL_MS, SWITCH_NODES, type SwitchCommand, type SwitchNodeSnapshot } from "./switchControl";

// ------------------------------------------------------
// FIREBASE CONFIG (.env)
// ------------------------------------------------------
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// ------------------------------------------------------
// INITIALIZE FIREBASE
// ------------------------------------------------------
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });
const database = getDatabase(app);
let switchClockOffset = 0;

export function getSwitchTime() {
  return Date.now() + switchClockOffset;
}
const CONTROL_PATH = "home/room1/controls";

// ------------------------------------------------------
// DATABASE PATHS
// ------------------------------------------------------
const PATHS = {
  SENSORS: "home/sensor",
  CONTROLS: "home/room1/controls",
  CONTROLS_ROOM1: "home/room1/controls",
  CONTROLS_ROOM2: "home/room2/controls",
  CONTROLS_ROOM3: "home/room3/controls",
  CONTROLS_COMMON: "home/commonarea/controls",
  CONTROLS_RELAY: "home/relay/controls",
  STATUS: "home/room1/status",
  STATUS_ROOM1: "home/room1/status",
  STATUS_ROOM2: "home/room2/status",
  STATUS_ROOM3: "home/room3/status",
  STATUS_COMMON: "home/commonarea/status",
  USERS: "users",
  AUTHORIZED_USERS: "authorized_users",
  ALERTS: "home/alerts/logs",
  AUTOMATIONS: "home/automations",
  SCHEDULES: "home/schedules",
  IGNITION: "special/ignition",
  WEATHER: "home/weather",
  HISTORY: "home/history",
} as const;

export type ScheduleType = "timer" | "schedule";
export type ScheduleAction = "on" | "off";
export type RepeatType = "everyday" | "weekdays" | "weekends" | "custom" | "once";

export interface ScheduleItem {
  id: string;
  name: string;
  type: ScheduleType;          // "timer" | "schedule"
  device: keyof ControlData | string; // e.g. "room1Light", "lobbyFan", etc.
  action: ScheduleAction;      // "on" | "off"
  enabled: boolean;
  createdAt: number;
  
  // Countdown Timer properties
  durationMinutes?: number;    // original duration in minutes
  targetTimestamp?: number;    // epoch in ms when timer triggers
  autoTurnOnFirst?: boolean;   // turn switch ON immediately, then OFF at targetTimestamp
  status?: "active" | "completed" | "cancelled" | "unconfirmed";
  completedAt?: number;

  // Recurring / Specific Schedule properties
  time?: string;               // "HH:mm" in 24h format (e.g. "07:30", "22:00")
  days?: number[];             // [0..6] (0 = Sun, 1 = Mon ... 6 = Sat)
  repeatType?: RepeatType;
  specificDate?: string;       // "YYYY-MM-DD" for one-off scheduled date
  lastRun?: number;            // epoch in ms when last fired
  lastRunKey?: string;
  lastRunResult?: "confirmed" | "unconfirmed";
  pendingRun?: { key: string; device: string; command: SwitchCommand };
  notification?: boolean;      // send Telegram alert when executed
}

// INTERFACES
export interface SensorData {
  temperature: number;
  temperatureBMP?: number;
  humidity: number;
  pressure: number;
  gas: number;
  rain: boolean;
  WaterLevel: number;
  motion?: boolean;
  door?: number;
  power?: number;
  timestamp: number;
  last_update?: string;
  batteryVolt?: number;
  batteryVoltage?: number;
  batteryPercent?: number;
}

export const DEFAULT_CONTROLS: ControlData = {
  room1Light: false,
  room1Switch: false,
  room1Fan: false,
  room1FanSpeed: 0,

  room2Light: false,
  room2Switch: false,
  room2Fan: false,
  room2FanSpeed: 0,

  room3Light: false,
  room3Switch: false,
  room3Fan: false,
  room3FanSpeed: 0,

  lobbyFan: false,
  lobbyFanSpeed: 0,
  lobbyLight: false,
  lobbyTV: false,
  refrigerator: false,

  relay1: false,
  relay2: false,
  relay3: false,
  relay4: false,

  lock: false,
  motion: false,
  nightMode: false,
};
export interface ControlData {
  // ===== ROOMS =====
  room1Light: boolean;
  room1Fan: boolean;
  room1FanSpeed: number;
  room1Switch: boolean;

  room2Light: boolean;
  room2Fan: boolean;
  room2FanSpeed: number;
  room2Switch: boolean;

  room3Light: boolean;
  room3Fan: boolean;
  room3FanSpeed: number;
  room3Switch: boolean;

  // ===== COMMON =====
  lobbyLight: boolean;
  refrigerator: boolean;
  lobbyFan: boolean;
  lobbyFanSpeed: number;
  lobbyTV: boolean;

  // ===== RELAYS =====
  relay1: boolean;
  relay2: boolean;
  relay3: boolean;
  relay4: boolean;

  // ===== SECURITY =====
  lock: boolean;
  motion: boolean;
  nightMode: boolean;
}

/** Map a ControlData key to its Firebase path and exact child property name according to user mapping */
export function getFirebaseControlTarget(key: keyof ControlData): { path: string; property: string } {
  // Room 1: light, fan, switch, fanspeed
  if (key === "room1Light") return { path: "home/room1/controls", property: "light" };
  if (key === "room1Fan") return { path: "home/room1/controls", property: "fan" };
  if (key === "room1Switch") return { path: "home/room1/controls", property: "switch" };
  if (key === "room1FanSpeed") return { path: "home/room1/controls", property: "fanspeed" };

  // Room 2: light, fan, switch, fanspeed
  if (key === "room2Light") return { path: "home/room2/controls", property: "light" };
  if (key === "room2Fan") return { path: "home/room2/controls", property: "fan" };
  if (key === "room2Switch") return { path: "home/room2/controls", property: "switch" };
  if (key === "room2FanSpeed") return { path: "home/room2/controls", property: "fanspeed" };

  // Room 3: light, fan, switch, fanspeed
  if (key === "room3Light") return { path: "home/room3/controls", property: "light" };
  if (key === "room3Fan") return { path: "home/room3/controls", property: "fan" };
  if (key === "room3Switch") return { path: "home/room3/controls", property: "switch" };
  if (key === "room3FanSpeed") return { path: "home/room3/controls", property: "fanspeed" };

  // Common Area: light, fan, fanspeed, refrigerator (and tv)
  if (key === "lobbyLight") return { path: "home/commonarea/controls", property: "light" };
  if (key === "lobbyFan") return { path: "home/commonarea/controls", property: "fan" };
  if (key === "lobbyFanSpeed") return { path: "home/commonarea/controls", property: "fanspeed" };
  if (key === "refrigerator") return { path: "home/commonarea/controls", property: "refrigerator" };
  if (key === "lobbyTV") return { path: "home/commonarea/controls", property: "tv" };

  // Relay: relay1, relay2, relay3, relay4
  if (key === "relay1") return { path: "home/relay/controls", property: "relay1" };
  if (key === "relay2") return { path: "home/relay/controls", property: "relay2" };
  if (key === "relay3") return { path: "home/relay/controls", property: "relay3" };
  if (key === "relay4") return { path: "home/relay/controls", property: "relay4" };

  // Security / System modes
  if (key === "lock" || key === "motion" || key === "nightMode") {
    return { path: "security/controls", property: key };
  }

  return { path: "home/room1/controls", property: key };
}

/** Determines the Firebase node path for a control key */
export function getNodeControlsPath(key: keyof ControlData): string {
  return getFirebaseControlTarget(key).path;
}

export type SwitchSnapshots = Partial<Record<(typeof SWITCH_NODES)[number], SwitchNodeSnapshot>>;

export function getSwitchChannel(key: keyof ControlData) {
  const { path, property } = getFirebaseControlTarget(key);
  const segments = path.split("/");
  return {
    node: segments[segments.length - 2] as keyof SwitchSnapshots,
    property: property === "fanspeed" ? "fan" : property,
    isSpeed: property === "fanspeed",
  };
}

function waitForSwitchReport(path: string, command: SwitchCommand, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    let unsubscribe = () => {};
    const finish = (error?: Error) => {
      clearTimeout(timeout);
      signal.removeEventListener("abort", cancel);
      unsubscribe();
      if (error) reject(error);
      else resolve();
    };
    const cancel = () => finish(new Error("Confirmation cancelled"));
    const timeout = setTimeout(
      () => finish(new Error("No confirmation from the device")),
      Math.max(0, command.expiresAt - getSwitchTime()),
    );
    signal.addEventListener("abort", cancel, { once: true });
    unsubscribe = onValue(ref(database, `switchControl/${path.replace("/commands/", "/reports/")}Ack`), (snapshot) => {
      if (snapshot.child("commandId").val() !== command.id) return;
      const outcome = snapshot.child("outcome").val();
      if (outcome === "applied") finish();
      if (outcome === "rejected") finish(new Error("Device rejected the command"));
    }, finish);
  });
}

export interface NodeStatusData {
  online?: boolean;
  ip?: string;
  rssi?: number;
  uptime?: number;      // seconds since boot
  freeHeap?: number;   // bytes
  chipTempC?: number;  // ESP32-C3 internal chip temperature
  lastSeen?: string | number;   // e.g. "16/09/2026 17:44:33 IST" or epoch
  lastSeenEpoch?: number;       // Unix epoch in seconds
  serverTimestamp?: number;     // Firebase RTDB server value in ms
  timestamp?: number;           // Unix epoch in seconds or ms
}

export type Room1StatusData = NodeStatusData;

/** @deprecated Use Room1StatusData instead */
export interface StatusData {
  online: boolean;
  lastSeen: number;
}

export interface WeatherData {
  trend: number;
  prediction: string;
  latest_hpa: number;
  oldest_hpa: number;
  samples: number;
  updated_at: string;
  timestamp?: number;
}

export interface NewAlert {
  alert_type: string;
  severity: "info" | "warning" | "error" | "critical";
  message: string;
  sensor_value?: number | null;
  timestamp: number;
}

/** Helper to recursively strip any undefined values from Firebase payloads */
export function cleanFirebasePayload<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(cleanFirebasePayload) as unknown as T;
  }
  if (typeof obj === "object" && !(obj instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = cleanFirebasePayload(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

// ------------------------------------------------------
// SENSOR + CONTROL + STATUS SERVICE
// ------------------------------------------------------
class FirebaseService {
  async getSensorData() {
    try {
      const snap = await get(ref(database, PATHS.SENSORS));
      return snap.exists() ? snap.val() : null;
    } catch (e) {
      console.error("Sensor fetch error:", e);
      return null;
    }
  }

  listenToSensorDataLive(callback: (data: SensorData) => void): () => void {
    return onValue(ref(database, PATHS.SENSORS), (snap) => {
      if (snap.exists()) {
        const raw = snap.val() || {};
        callback({ ...raw, timestamp: raw.timestamp ?? Date.now() });
      }
    });
  }
  
  listenToSwitchNodes(callback: (nodes: SwitchSnapshots) => void, onError?: (error: Error) => void) {
    const nodes: SwitchSnapshots = {};
    const stopClock = onValue(ref(database, ".info/serverTimeOffset"), (snapshot) => {
      const offset = snapshot.val();
      if (typeof offset === "number") switchClockOffset = offset;
    });
    const unsubscribers = SWITCH_NODES.map((node) =>
      onValue(ref(database, `switchControl/${node}`), (snapshot) => {
        nodes[node] = snapshot.val() ?? {};
        callback({ ...nodes });
      }, onError),
    );
    return () => {
      stopClock();
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }

  updateSwitchState(key: keyof ControlData, value: boolean) {
    return this.updateMultipleSwitches({ [key]: value });
  }

  async updateMultipleSwitches(updates: Partial<ControlData>) {
    const issuedAt = getSwitchTime();
    const expiresAt = issuedAt + COMMAND_TTL_MS;
    const commands = new Map<string, SwitchCommand>();
    for (const [key, value] of Object.entries(updates)) {
      if (!Object.prototype.hasOwnProperty.call(DEFAULT_CONTROLS, key)) throw new Error(`Unknown switch: ${key}`);
      const { node, property } = getSwitchChannel(key as keyof ControlData);
      const path = `${node}/commands/${property}`;
      const command = commands.get(path) ?? {
        id: push(ref(database, `switchControl/${node}/commands`)).key!,
        value: false,
        issuedAt,
        expiresAt,
      };
      if (typeof value === "number") {
        if (property !== "fan") throw new Error(`Invalid speed control: ${key}`);
        command.speed = value;
        command.value = value > 0;
      } else if (command.speed === undefined) {
        command.value = value;
      }
      commands.set(path, command);
    }

    if (!commands.size) return;
    const abort = new AbortController();
    try {
      await Promise.all([
        ...Array.from(commands, ([path, command]) => waitForSwitchReport(path, command, abort.signal)),
        update(ref(database, "switchControl"), Object.fromEntries(commands)),
      ]);
    } finally {
      abort.abort();
    }
  }

  updateFanSpeed(key: keyof ControlData, speed: number) {
    return this.updateMultipleSwitches({ [key]: speed });
  }

  triggerIgnition() {
    return set(ref(database, PATHS.IGNITION), 1);
  }

  resetIgnition() {
    return set(ref(database, PATHS.IGNITION), 0);
  }

  async updateDeviceStatus(online: boolean) {
    await set(ref(database, PATHS.STATUS), {
      online,
      lastSeen: Date.now()
    });
  }

  listenToDeviceStatus(callback: (data: StatusData) => void) {
    return onValue(ref(database, PATHS.STATUS), (snap) => {
      if (snap.exists()) callback(snap.val());
    });
  }

  /** Generic multi-path listener for ESP node status */
  listenToNodeStatus(
    paths: string | string[],
    callback: (data: NodeStatusData | null) => void
  ): () => void {
    const pathList = Array.isArray(paths) ? paths : [paths];
    const unsubs: (() => void)[] = [];
    let latestData: NodeStatusData | null = null;

    pathList.forEach((p) => {
      const cleanPath = p.replace(/^\//, "");
      const unsub = onValue(ref(database, cleanPath), (snap) => {
        if (snap.exists()) {
          latestData = snap.val() as NodeStatusData;
          callback(latestData);
        } else if (!latestData) {
          callback(null);
        }
      });
      unsubs.push(unsub);
    });

    return () => {
      unsubs.forEach((u) => u());
    };
  }

  /** Listen to Room 1 ESP node status from /home/room1/status */
  listenToRoom1Status(callback: (data: NodeStatusData | null) => void): () => void {
    return this.listenToNodeStatus(["home/room1/status"], callback);
  }

  /** Listen to Room 2 ESP node status from /home/room2/status */
  listenToRoom2Status(callback: (data: NodeStatusData | null) => void): () => void {
    return this.listenToNodeStatus(["home/room2/status"], callback);
  }

  /** Listen to Room 3 ESP node status from /home/room3/status */
  listenToRoom3Status(callback: (data: NodeStatusData | null) => void): () => void {
    return this.listenToNodeStatus(["home/room3/status"], callback);
  }

  /** Listen to Common Area ESP node status from /home/commonarea/status */
  listenToCommonAreaStatus(callback: (data: NodeStatusData | null) => void): () => void {
    return this.listenToNodeStatus(["home/commonarea/status"], callback);
  }

  listenToWeather(callback: (data: WeatherData | null) => void): () => void {
    return onValue(ref(database, PATHS.WEATHER), (snap) => {
      callback(snap.exists() ? (snap.val() as WeatherData) : null);
    });
  }

  /** Listen to live Timers and Schedules from /home/schedules */
  listenToSchedules(callback: (data: Record<string, ScheduleItem>) => void): () => void {
    return onValue(ref(database, PATHS.SCHEDULES), (snap) => {
      callback(snap.exists() ? (snap.val() as Record<string, ScheduleItem>) : {});
    });
  }

  /** Save or create a Timer or Scheduled routine */
  async saveSchedule(item: ScheduleItem): Promise<void> {
    const clean = cleanFirebasePayload(item);
    return set(ref(database, `${PATHS.SCHEDULES}/${item.id}`), clean);
  }

  /** Update partial properties of a Timer or Schedule */
  async updateSchedule(id: string, updates: Partial<ScheduleItem>): Promise<void> {
    const clean = cleanFirebasePayload(updates);
    return update(ref(database, `${PATHS.SCHEDULES}/${id}`), clean);
  }

  async requestTimerExecution(id: string): Promise<void> {
    const now = Date.now();
    const result = await runTransaction(ref(database, `${PATHS.SCHEDULES}/${id}`), (timer: ScheduleItem | null) => {
      if (timer?.type !== "timer" || timer.status !== "active" || timer.enabled === false || timer.pendingRun) return;
      return { ...timer, targetTimestamp: Math.min(timer.targetTimestamp ?? now, now) };
    }, { applyLocally: false });
    if (!result.committed && !result.snapshot.val()?.pendingRun) throw new Error("Timer is no longer active");
  }

  /** Delete a Timer or Schedule */
  async deleteSchedule(id: string): Promise<void> {
    return set(ref(database, `${PATHS.SCHEDULES}/${id}`), null);
  }
}

// ALERT SERVICE
class AlertService {
  private lastAlert: Record<string, number> = {};
  private COOLDOWN = 60000;

  async newAlert(key: string, alert: NewAlert) {
    const now = Date.now();
    if (this.lastAlert[key] && now - this.lastAlert[key] < this.COOLDOWN) {
      return;
    }

    this.lastAlert[key] = now;
    console.log(`[AlertService] newAlert called for ${key}`);
    console.log(`[AlertService] Writing alert to Firebase: ${key}`, alert);
    await push(ref(database, PATHS.ALERTS), alert);
    console.log(`[AlertService] Alert written successfully for ${key}`);
  }

  // Hard test write for debugging
  async testWrite() {
    console.log("[AlertService] Performing hard test write to DEBUG/firebase_test");
    await set(ref(database, "DEBUG/firebase_test"), {
      test: true,
      timestamp: Date.now(),
      message: "Firebase RTDB test write"
    });
    console.log("[AlertService] Test write completed");
  }
}

export const alertService = new AlertService();

// ------------------------------------------------------
// USER LOGIN STORE
// ------------------------------------------------------
export const userStore = {
  async addLogin(name: string, role: string) {
    await push(ref(database, PATHS.USERS), {
      name,
      role,
      loginTime: Date.now()
    });
  },

  async getUsers() {
    const snap = await get(ref(database, PATHS.USERS));
    if (!snap.exists()) return [];
    return Object.entries(snap.val()).map(([id, user]: any) => ({
      id,
      ...user
    }));
  },

  async deleteUser(id: string) {
    await set(ref(database, `${PATHS.USERS}/${id}`), null);
  }
};


// EXPORTS
export const firebaseService = new FirebaseService();

export {
  auth,
  googleProvider,
  database,
  PATHS,
};
