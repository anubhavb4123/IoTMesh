import { useState, useEffect } from 'react';
import { firebaseService, SensorData } from '@/lib/firebase';
import { alertService } from "@/lib/alertService";

export const useSensorData = () => {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeSensorData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Initial data
        const initial = await firebaseService.getSensorData();
        if (initial) {
          setSensorData({
            ...initial,
            timestamp: initial.timestamp ?? Date.now()
          });
        }

        // Live updates
        unsubscribe = firebaseService.listenToSensorDataLive((data) => {

          // ⭐ ALWAYS UPDATE TIMESTAMP WHEN SENSOR DATA CHANGES
          setSensorData({
            ...data,
            timestamp: Date.now()
          });

          // ALERT LOGIC (unchanged)
          if (data.temperature > 30) {
            alertService.newAlert({
              alert_type: "Temperature",
              severity: "warning",
              message: `High temperature (${data.temperature}°C)`,
              sensor_value: data.temperature,
              timestamp: Date.now(),
            });
          }

          if (data.humidity < 30) {
            alertService.newAlert({
              alert_type: "Humidity",
              severity: "warning",
              message: `Humidity low (${data.humidity}%)`,
              sensor_value: data.humidity,
              timestamp: Date.now(),
            });
          }

          if (data.gas > 450) {
            alertService.newAlert({
              alert_type: "Air Quality",
              severity: "error",
              message: `Critical gas level (${data.gas} PPM)`,
              sensor_value: data.gas,
              timestamp: Date.now(),
            });
          }

          if (data.rain === true) {
            alertService.newAlert({
              alert_type: "Rain",
              severity: "info",
              message: `Rain detected`,
              timestamp: Date.now(),
            });
          }

          if (data.WaterLevel < 20) {
            alertService.newAlert({
              alert_type: "Water Level",
              severity: "warning",
              message: `Low water level (${data.WaterLevel} cm)`,
              sensor_value: data.WaterLevel,
              timestamp: Date.now(),
            });
          }
        });

        setLoading(false);
      } catch (err) {
        console.error("Sensor error:", err);
        setError("Failed to load sensor data");
        setLoading(false);
      }
    };

    initializeSensorData();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return { sensorData, loading, error };
};