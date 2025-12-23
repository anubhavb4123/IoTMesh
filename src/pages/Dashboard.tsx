import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { SensorCard } from "@/components/SensorCard";

import {
  Thermometer,
  Droplets,
  Wind,
  Gauge,
  Waves,
  CloudRain,
  Activity,
  DoorOpen,
} from "lucide-react";
import { useSensorData } from "@/hooks/useSensorData";

interface DashboardData {
  temp: number;
  humidity: number;
  pressure: number;
  gas: number;
  rain: string;
  waterLevel: number;
  motion: string;
  door: number;
  power?: number;
  last_update?: string;
}
function formatLastUpdated(timeString?: string) {
  if (!timeString) return "Updated: --";

  // Example input: "20:45:12 13-12-2025"
  const [timePart, datePart] = timeString.split(" ");
  if (!timePart || !datePart) return "Updated: --";

  const [hour, minute, second] = timePart.split(":").map(Number);
  const [day, month, year] = datePart.split("-").map(Number);

  const updateDate = new Date(year, month - 1, day, hour, minute, second);
  const now = new Date();

  // Format time in AM/PM
  const timeFormatted = updateDate.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  // Check if today
  const today =
    updateDate.getDate() === now.getDate() &&
    updateDate.getMonth() === now.getMonth() &&
    updateDate.getFullYear() === now.getFullYear();

  // Check if yesterday
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  const isYesterday =
    updateDate.getDate() === yesterday.getDate() &&
    updateDate.getMonth() === yesterday.getMonth() &&
    updateDate.getFullYear() === yesterday.getFullYear();

  if (today) return `Updated Today at ${timeFormatted}`;
  if (isYesterday) return `Updated Yesterday at ${timeFormatted}`;

  // Otherwise show full date
  const dateFormatted = updateDate.toLocaleDateString();

  return `Updated on ${dateFormatted} at ${timeFormatted}`;
}


export default function Dashboard() {
  const { sensorData: liveSensorData, loading, error } = useSensorData();

  // Safe fallback helper
  const safe = (v: any, fallback = 0) =>
    typeof v === "number" && !isNaN(v) ? v : fallback;

  const power = liveSensorData?.power;

  const dashboard: DashboardData = {
    temp: safe(liveSensorData?.temperature),
    humidity: safe(liveSensorData?.humidity),
    gas: safe(liveSensorData?.gas),
    pressure: safe(liveSensorData?.pressure),
    rain: liveSensorData?.rain ? "Detected" : "Clear",
    waterLevel: safe(liveSensorData?.WaterLevel),
    motion: liveSensorData?.motion ? "Detected" : "Clear",
    door : safe(liveSensorData?.door),
    last_update: liveSensorData?.last_update,
  };

  const getTempStatus = (t: number) => (t < 15 || t > 30 ? "warning" : "ok");

  const getHumidityStatus = (h: number) =>
    h < 30 || h > 70 ? "warning" : "ok";

  const getGasStatus = (g: number) =>
    g > 300 ? "alert" : g > 200 ? "warning" : "ok";

  if (loading)
    return (
      <Layout>
        <p>Loading...</p>
      </Layout>
    );

  if (error)
    return (
      <Layout>
        <p className="text-red-500">Error: {error}</p>
      </Layout>
    );

  return (
    <Layout>
      <div className="flex flex-col gap-6 ">
        <h2 className="text-2xl font-bold tracking-tight">
          Dashboard{" "}
          <span className="text-sm text-muted-foreground ml-2">
            {formatLastUpdated(dashboard.last_update)}
          </span>
        </h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <SensorCard
            title="Temperature"
            value={dashboard.temp}
            unit="°C"
            icon={Thermometer}
            status={getTempStatus(dashboard.temp)}
            description="Ambient temperature"
          />

          <SensorCard
            title="Humidity"
            value={dashboard.humidity}
            unit="%"
            icon={Droplets}
            status={getHumidityStatus(dashboard.humidity)}
            description="Relative humidity"
          />

          <SensorCard
            title="Air Quality"
            value={dashboard.gas}
            unit="PPM"
            icon={Wind}
            status={getGasStatus(dashboard.gas)}
            description="Gas sensor (MQ135)"
          />

          <SensorCard
            title="Pressure"
            value={dashboard.pressure}
            unit="hPa"
            icon={Gauge}
            status="ok"
            description="Atmospheric pressure"
          />

          <SensorCard
            title="Water Level"
            value={dashboard.waterLevel}
            unit="cm"
            icon={Waves}
            status={dashboard.waterLevel < 20 ? "warning" : "ok"}
            description="Tank water level"
          />

          <SensorCard
            title="Rain Sensor"
            value={dashboard.rain}
            icon={CloudRain}
            status={dashboard.rain === "Detected" ? "alert" : "ok"}
            description="Rain detection"
          />

          <SensorCard
            title="Motion"
            value={dashboard.motion}
            icon={Activity}
            status={dashboard.motion === "Detected" ? "warning" : "ok"}
            description="PIR motion sensor"
          />

          <SensorCard
            title="Door Status"
            value={dashboard.door === 1 ? "Open" : "Closed"}
            icon={DoorOpen}
            status={dashboard.door === 1 ? "warning" : "ok"}
            description="Magnetic door sensor"
          />
        </div>

        {/* System Status */}
        <div className="border-border/50 bg-card/50 p-6 rounded-lg">
          <h2 className="text-xl mb-4">System Status</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <StatusItem label="Firebase Connection" ok={!!liveSensorData} />
            <StatusItem label="Sensor Status" ok={!!liveSensorData} />
            <StatusItem
              label="Power Source"
              ok={power === 1}
              value={
                power === 1
                  ? "GRID"
                  : power === 0
                  ? "INVERTER"
                  : "Unknown"
              }
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatusItem({ label, ok, value }: any) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`h-3 w-3 rounded-full animate-pulse-glow ${
          ok ? "bg-status-ok" : "bg-status-warning"
        }`}
      />
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          {value !== undefined && value !== null
            ? value
            : ok
            ? "Online"
            : "Offline"}
        </p>
      </div>
    </div>
  );
}