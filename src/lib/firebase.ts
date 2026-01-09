// ------------------------------------------------------
// IMPORTS
// ------------------------------------------------------
import { toast } from "@/components/ui/sonner";
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
  ALERTS: "home/room1/alerts"
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
  lastAlert: Record<string, number> = {};

  async createAlert(type: string, message: string, severity: string, value: number | null) {
    const now = Date.now();
    if (this.lastAlert[type] && now - this.lastAlert[type] < 60000) return;
    this.lastAlert[type] = now;

    await push(ref(database, PATHS.ALERTS), {
      type,
      message,
      severity,
      sensor_value: value,
      timestamp: now
    });
  }
}

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
export const alertService = new AlertService();

export {
  database,
  PATHS,
};