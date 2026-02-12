import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { SensorCard } from "@/components/SensorCard";
import { cn } from "@/lib/utils";
import {
  Thermometer,
  Droplets,
  Wind,
  Gauge,
  Waves,
  CloudRain,
  Activity,
  DoorOpen,
  Database,
  Activity as ActivityIcon,
  Zap,
  BatteryCharging,
  Cpu,
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
  batteryVoltage?: number;
  batteryPercent?: number;
}

function parseLastUpdateToMs(lastUpdate?: string): number | null {
  if (!lastUpdate) return null;

  // "20:45:12 13-12-2025"
  const [timePart, datePart] = lastUpdate.split(" ");
  if (!timePart || !datePart) return null;

  const [h, m, s] = timePart.split(":").map(Number);
  const [d, mo, y] = datePart.split("-").map(Number);

  return new Date(y, mo - 1, d, h, m, s).getTime();
}

function formatLastUpdated(timeString?: string) {
  if (!timeString) return "Last sync --";

  // Example input: "20:45:12 13-12-2025"
  const [timePart, datePart] = timeString.split(" ");
  if (!timePart || !datePart) return "Last sync --";

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

  if (today) return `Last sync Today at ${timeFormatted}`;
  if (isYesterday) return `Last sync Yesterday at ${timeFormatted}`;

  // Otherwise show full date
  const dateFormatted = updateDate.toLocaleDateString();

  return `Last sync ${dateFormatted} at ${timeFormatted}`;
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
    batteryVoltage: safe(liveSensorData?.batteryVoltage),
    batteryPercent: safe(liveSensorData?.batteryPercent),
  };

  useEffect(() => {
  const checkStatus = () => {
    const lastMs = parseLastUpdateToMs(dashboard.last_update);
    if (!lastMs) {
      setSensorOnline(false);
      return;
    }

    const now = Date.now();
    setSensorOnline(now - lastMs <= 120_000); // ✅ 2 minutes threshold
  };

  checkStatus();                 
  const interval = setInterval(checkStatus, 1000); // ✅ live monitoring

  return () => clearInterval(interval);
}, [dashboard.last_update]);

  const getTempStatus = (t: number) => t < 25 ? "cold" : t < 30 ? "ok" : t < 35 ? "warning" : "alert";

  const [sensorOnline, setSensorOnline] = useState(false);

  const getHumidityStatus = (h: number) =>
    h < 30 || h > 70 ? "warning" : "ok";

  const getGasStatus = (g: number) =>
    g > 350 ? "alert" : g > 250 ? "warning" : "ok";

  if (loading)
  return (
    <Layout>
      <div className="flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          
          <div className="w-20 h-20 rounded-full border-2 border-cyan-400 animate-pulse"></div>

          <p className="text-white/80 tracking-widest animate-pulse">
            Loading IoTMesh...
          </p>

        </div>
      </div>
    </Layout>
  );

  if (error)
    return (
      <Layout>
        <p className="text-red-500">Error: {error}</p>
      </Layout>
    );

    const getBatteryStatus = (percent = 0) => {
      if (percent > 60) return "battery-ok";
      if (percent > 30) return "battery-warning";
      return "battery-critical";
    };

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
            status={dashboard.waterLevel > 60 ? "ok" : dashboard.waterLevel > 20 ? "warning" : "alert"}
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
        <div className="border-border/40 bg-card/40 p-6 rounded-lg">
          <div className="grid gap-4 md:grid-cols-4">
          <StatusItem
            label="Firebase Connection"
            ok={!!liveSensorData}
            icon={Database}
          />

          <StatusItem
            label="ESP Device"
            ok={sensorOnline}
            value={sensorOnline ? "Online" : "Offline"}
            icon={Cpu}
          />

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
            icon={Zap}
          />

          <StatusItem
            label="Internal Battery"
            ok={dashboard.batteryPercent !== undefined}
            value={`${dashboard.batteryPercent ?? "--"}% • ${
              dashboard.batteryVoltage?.toFixed(2) ?? "--"
            }V`}
            indicatorClass={getBatteryStatus(dashboard.batteryPercent)}
            icon={BatteryCharging}
          />
        </div>
        </div>
      </div>
    </Layout>
  );
}

import { LucideIcon } from "lucide-react";

function StatusItem({
  label,
  ok,
  value,
  icon: Icon,
  indicatorClass,
}: {
  label: string;
  ok: boolean;
  value?: string;
  icon: LucideIcon;
  indicatorClass?: string;
}) {
// 🔥 derive status correctly
const derivedStatus =
  indicatorClass === "battery-ok"
    ? "ok"
    : indicatorClass === "battery-warning"
    ? "warning"
    : indicatorClass === "battery-critical"
    ? "alert"
    : ok
    ? "ok"
    : "alert";

const iconStrokeClass =
  derivedStatus === "ok"
    ? "icon-ok"
    : derivedStatus === "warning"
    ? "icon-warning"
    : derivedStatus === "alert"
    ? "icon-critical"
    : "icon-critical";
  return (
    <div
  className={cn(
    "flex items-center gap-1 p-2 rounded-lg border border-border/50 bg-background/40 transition-shadow",
    derivedStatus === "ok" && "shadow-[0_0_10px_rgba(34,197,94,0.25)]",
    derivedStatus === "warning" && "shadow-[0_0_10px_rgba(245,158,11,0.28)]",
    derivedStatus === "alert" && "shadow-[0_0_10px_rgba(239,68,68,0.35)]"
  )}
>
      {/* ICON */}
      <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-background/70">
        <Icon
          className={cn(
            "h-6 w-6 fill-none stroke-[1.8] transition-transform",
            iconStrokeClass,
            label === "Internal Battery" && "rotate-90 scale-x-[-1]"
          )}
        />
      </div>
      {/* TEXT */}
      <div className="flex flex-col">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">
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