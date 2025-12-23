import { database } from "@/lib/firebase";
import { ref, push } from "firebase/database";

interface NewAlert {
  alert_type: string;
  severity: "info" | "warning" | "error" | "critical";
  message: string;
  sensor_value?: number | null;
  timestamp: number;
}

class AlertService {
  async newAlert(alert: NewAlert) {
    try {
      const alertRef = ref(database, "home/room1/alerts");
      await push(alertRef, alert);
      console.log("Alert saved:", alert);
    } catch (error) {
      console.error("Failed to save alert:", error);
    }
  }
}

export const alertService = new AlertService();
