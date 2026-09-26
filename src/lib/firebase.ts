// ------------------------------------------------------
// IMPORTS
// ------------------------------------------------------
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  get,
  onValue,
  set,
  update,
  push
} from "firebase/database";

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
const database = getDatabase(app);
const CONTROL_PATH = "home/room1/controls";

// ------------------------------------------------------
// DATABASE PATHS
// ------------------------------------------------------
const PATHS = {
  SENSORS: "home/room1/sensor",
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
  ALERTS: "home/room1/alerts/logs",
  IGNITION: "special/ignition",
  WEATHER: "home/room1/weather",
} as const;

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
  
  async getControlStates(): Promise<ControlData> {
    try {
      const paths = [
        "home/room1/controls",
        "home/room2/controls",
        "home/room3/controls",
        "home/commonarea/controls",
        "home/relay/controls",
        "security/controls",
      ];
      const snaps = await Promise.all(paths.map((p) => get(ref(database, p))));
      let merged: ControlData = { ...DEFAULT_CONTROLS };
      snaps.forEach((snap, idx) => {
        if (!snap.exists()) return;
        const val = snap.val();
        if (!val || typeof val !== "object") return;
        const p = paths[idx];
        if (p === "home/room1/controls") {
          if ("light" in val) merged.room1Light = Boolean(val.light);
          if ("switch" in val) merged.room1Switch = Boolean(val.switch);
          if ("fan" in val) merged.room1Fan = Boolean(val.fan);
          if ("fanspeed" in val) merged.room1FanSpeed = Number(val.fanspeed);
        } else if (p.includes("room2")) {
          if ("light" in val) merged.room2Light = Boolean(val.light);
          if ("switch" in val) merged.room2Switch = Boolean(val.switch);
          if ("fan" in val) merged.room2Fan = Boolean(val.fan);
          if ("fanspeed" in val) merged.room2FanSpeed = Number(val.fanspeed);
        } else if (p.includes("room3")) {
          if ("light" in val) merged.room3Light = Boolean(val.light);
          if ("switch" in val) merged.room3Switch = Boolean(val.switch);
          if ("fan" in val) merged.room3Fan = Boolean(val.fan);
          if ("fanspeed" in val) merged.room3FanSpeed = Number(val.fanspeed);
        } else if (p.includes("common")) {
          if ("light" in val) merged.lobbyLight = Boolean(val.light);
          if ("fan" in val) merged.lobbyFan = Boolean(val.fan);
          if ("fanspeed" in val) merged.lobbyFanSpeed = Number(val.fanspeed);
          if ("refrigerator" in val) merged.refrigerator = Boolean(val.refrigerator);
          if ("tv" in val) merged.lobbyTV = Boolean(val.tv);
        } else if (p.includes("relay")) {
          if ("relay1" in val) merged.relay1 = Boolean(val.relay1);
          if ("relay2" in val) merged.relay2 = Boolean(val.relay2);
          if ("relay3" in val) merged.relay3 = Boolean(val.relay3);
          if ("relay4" in val) merged.relay4 = Boolean(val.relay4);
        } else if (p === "security/controls") {
          if ("lock" in val) merged.lock = Boolean(val.lock);
          if ("motion" in val) merged.motion = Boolean(val.motion);
          if ("nightMode" in val) merged.nightMode = Boolean(val.nightMode);
        }
      });
      return merged;
    } catch (e) {
      console.error("Error fetching control states:", e);
      return DEFAULT_CONTROLS;
    }
  }

  listenToControlStates(callback: (data: ControlData) => void): () => void {
    let mergedState: ControlData = { ...DEFAULT_CONTROLS };

    const pathsToListen = [
      "home/room1/controls",
      "home/room2/controls",
      "home/room3/controls",
      "home/commonarea/controls",
      "home/relay/controls",
      "security/controls",
    ];

    const unsubs: (() => void)[] = [];

    pathsToListen.forEach((path) => {
      const unsub = onValue(
        ref(database, path),
        (snapshot) => {
          if (!snapshot.exists()) return;
          const val = snapshot.val();
          if (!val || typeof val !== "object") return;

          const mapped: Partial<ControlData> = {};

          if (path === "home/room1/controls") {
            if ("light" in val) mapped.room1Light = Boolean(val.light);
            if ("switch" in val) mapped.room1Switch = Boolean(val.switch);
            if ("fan" in val) mapped.room1Fan = Boolean(val.fan);
            if ("fanspeed" in val) mapped.room1FanSpeed = Number(val.fanspeed);
          } else if (path.includes("room2")) {
            if ("light" in val) mapped.room2Light = Boolean(val.light);
            if ("switch" in val) mapped.room2Switch = Boolean(val.switch);
            if ("fan" in val) mapped.room2Fan = Boolean(val.fan);
            if ("fanspeed" in val) mapped.room2FanSpeed = Number(val.fanspeed);
          } else if (path.includes("room3")) {
            if ("light" in val) mapped.room3Light = Boolean(val.light);
            if ("switch" in val) mapped.room3Switch = Boolean(val.switch);
            if ("fan" in val) mapped.room3Fan = Boolean(val.fan);
            if ("fanspeed" in val) mapped.room3FanSpeed = Number(val.fanspeed);
          } else if (path.includes("common")) {
            if ("light" in val) mapped.lobbyLight = Boolean(val.light);
            if ("fan" in val) mapped.lobbyFan = Boolean(val.fan);
            if ("fanspeed" in val) mapped.lobbyFanSpeed = Number(val.fanspeed);
            if ("refrigerator" in val) mapped.refrigerator = Boolean(val.refrigerator);
            if ("tv" in val) mapped.lobbyTV = Boolean(val.tv);
          } else if (path.includes("relay")) {
            if ("relay1" in val) mapped.relay1 = Boolean(val.relay1);
            if ("relay2" in val) mapped.relay2 = Boolean(val.relay2);
            if ("relay3" in val) mapped.relay3 = Boolean(val.relay3);
            if ("relay4" in val) mapped.relay4 = Boolean(val.relay4);
          } else if (path === "security/controls") {
            if ("lock" in val) mapped.lock = Boolean(val.lock);
            if ("motion" in val) mapped.motion = Boolean(val.motion);
            if ("nightMode" in val) mapped.nightMode = Boolean(val.nightMode);
          }

          mergedState = {
            ...mergedState,
            ...mapped,
          };

          callback({ ...mergedState });
        },
        (error) => {
          console.warn(`[Firebase RTDB] Listener on ${path} warning:`, error.message);
        }
      );

      unsubs.push(unsub);
    });

    return () => {
      unsubs.forEach((u) => u());
    };
  }

  async updateSwitchState(key: keyof ControlData, value: boolean) {
    const { path: targetPath, property } = getFirebaseControlTarget(key);
    const payload: Record<string, any> = { [property]: value };

    return update(ref(database, targetPath), payload);
  }

  async updateMultipleSwitches(updates: Partial<ControlData>) {
    const grouped: Record<string, Record<string, any>> = {};

    for (const [k, v] of Object.entries(updates)) {
      const key = k as keyof ControlData;
      const { path: targetPath, property } = getFirebaseControlTarget(key);
      if (!grouped[targetPath]) grouped[targetPath] = {};
      grouped[targetPath][property] = v;
    }

    const promises = Object.entries(grouped).map(([targetPath, payload]) =>
      update(ref(database, targetPath), payload)
    );

    await Promise.allSettled(promises);
  }

  async updateFanSpeed(key: keyof ControlData, speed: number) {
    const { path: targetPath, property } = getFirebaseControlTarget(key);
    const payload: Record<string, any> = { [property]: speed };
    return update(ref(database, targetPath), payload);
  }
  // ── Ignition ──
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
    await push(ref(database, "home/room1/alerts/logs"), alert);
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
  database,
  PATHS,
};
