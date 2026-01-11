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

// ------------------------------------------------------
// DATABASE PATHS
// ------------------------------------------------------
const PATHS = {
  SENSORS: "home/room1/sensor",
  CONTROLS: "home/room1/controls",
  STATUS: "home/room1/status",
  USERS: "users",
  ALERTS: "home/room1/alerts/logs"
} as const;

// ------------------------------------------------------
// INTERFACES
// ------------------------------------------------------
export interface SensorData {
  temperature: number;
  humidity: number;
  pressure: number;
  gas: number;
  rain: boolean;
  WaterLevel: number;
  motion?: string;
  door?: number;
  power?: number;
  timestamp: number;
  last_update?: string;
  batteryVoltage?: number;
  batteryPercent?: number;
}

export interface ControlData {
  light: boolean;
  fan: boolean;
  timestamp?: number;
}

export interface StatusData {
  online: boolean;
  lastSeen: number;
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

  async getControlStates() {
    try {
      const snap = await get(ref(database, PATHS.CONTROLS));
      return snap.exists() ? snap.val() : null;
    } catch (e) {
      console.error("Control fetch error:", e);
      return null;
    }
  }

  listenToControlStates(callback: (data: ControlData) => void) {
    return onValue(ref(database, PATHS.CONTROLS), (snap) => {
      if (snap.exists()) callback(snap.val());
    });
  }

  async updateSwitchState(device: "light" | "fan", state: boolean) {
    await update(ref(database, PATHS.CONTROLS), {
      [device]: state,
      timestamp: Date.now()
    });
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
}

// ------------------------------------------------------
// ALERT SERVICE
// ------------------------------------------------------
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


// ------------------------------------------------------
// EXPORTS
// ------------------------------------------------------
export const firebaseService = new FirebaseService();

export {
  database,
  PATHS,
};
