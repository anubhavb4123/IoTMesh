import { useState, useEffect } from "react";
import { firebaseService, SensorData } from "@/lib/firebase";

export const useSensorData = () => {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const init = async () => {
      try {
        setLoading(true);

        const initial = await firebaseService.getSensorData();
        if (initial) {
          setSensorData({ ...initial, timestamp: Date.now() });
        }

        unsubscribe = firebaseService.listenToSensorDataLive((data) => {
          setSensorData({ ...data, timestamp: Date.now() });
        });

        setLoading(false);
      } catch (err) {
        console.error(err);
        setError("Failed to load sensor data");
        setLoading(false);
      }
    };

    init();
    return () => unsubscribe?.();
  }, []);

  return { sensorData, loading, error };
};
