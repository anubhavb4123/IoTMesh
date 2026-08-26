import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { SensorCard } from "@/components/SensorCard";
import { cn } from "@/lib/utils";
import {
  Thermometer, Droplets, Wind, Gauge, Waves,
  CloudRain, PersonStanding, DoorOpen, Database,
  Zap, BatteryCharging, Cpu, LayoutDashboard, WifiOff,
  TrendingUp, TrendingDown, Minus, Activity, Radio
} from "lucide-react";
import { LucideIcon } from "lucide-react";
import { useSensorData } from "@/hooks/useSensorData";
import { firebaseService, WeatherData } from "@/lib/firebase";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";

// ── Types ─────────────────────────────────────────────────────
interface DashboardData {
  temp: number; tempBMP: number; humidity: number; pressure: number; gas: number;
  rain: string; waterLevel: number; motion: string; door: number;
  power?: number; last_update?: string;
  batteryVolt?: number; batteryPercent?: number;
}

// ── Helpers ───────────────────────────────────────────────────
function parseLastUpdateToMs(lastUpdate?: string): number | null {
  if (!lastUpdate) return null;
  const [timePart, datePart] = lastUpdate.split(" ");
  if (!timePart || !datePart) return null;
  const [h, m, s] = timePart.split(":").map(Number);
  const [d, mo, y] = datePart.split("-").map(Number);
  return new Date(y, mo - 1, d, h, m, s).getTime();
}

function formatLastUpdated(t?: string) {
  if (!t) return "Awaiting synchronization";
  const [tp, dp] = t.split(" ");
  if (!tp || !dp) return "Awaiting synchronization";
  const [h, m, s] = tp.split(":").map(Number);
  const [d, mo, y] = dp.split("-").map(Number);
  const date = new Date(y, mo - 1, d, h, m, s);
  const now = new Date();
  const fmt = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
  if (date.toDateString() === now.toDateString()) return `Updated today at ${fmt}`;
  return `Updated on ${date.toLocaleDateString()} at ${fmt}`;
}

// ── Minimal Status Tile ───────────────────────────────────────
function StatusTile({ label, value, icon: Icon, subvalue }: {
  label: string; value: string; ok?: boolean; icon: LucideIcon; subvalue?: string; statusOverride?: 'ok' | 'warning' | 'alert';
}) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-black border border-white/12 shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-white/10 flex items-center justify-center shrink-0 text-white">
        <Icon className={cn("w-5 h-5 fill-none stroke-[2]", label === "Battery" && "rotate-90 scale-x-[-1]")} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono">{label}</p>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-xs font-bold text-white truncate">{value}</p>
          {subvalue && <span className="text-[10px] font-mono text-neutral-300 font-semibold">{subvalue}</span>}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { sensorData: live, loading, error } = useSensorData();
  const [sensorOnline, setSensorOnline] = useState(false);
  const [syncAge, setSyncAge] = useState("—");
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => firebaseService.listenToWeather(setWeather), []);

  const safe = (v: any, fb = 0) => typeof v === "number" && !isNaN(v) ? v : fb;
  const power = live?.power;

  const d: DashboardData = {
    temp: safe(live?.temperature),
    tempBMP: safe(live?.temperatureBMP),
    humidity: safe(live?.humidity),
    gas: safe(live?.gas),
    pressure: safe(live?.pressure),
    rain: live?.rain ? "Detected" : "Clear",
    waterLevel: safe(live?.WaterLevel),
    motion: live?.motion ? "Detected" : "Clear",
    door: safe(live?.door),
    last_update: live?.last_update,
    batteryVolt: safe(live?.batteryVolt),
    batteryPercent: safe(live?.batteryPercent),
  };

  // Online check
  useEffect(() => {
    const tick = () => {
      const lastMs = parseLastUpdateToMs(d.last_update);
      if (!lastMs) { setSensorOnline(false); setSyncAge("—"); return; }
      const diff = Date.now() - lastMs;
      setSensorOnline(diff <= 120_000);
      const s = Math.floor(diff / 1000);
      setSyncAge(s < 60 ? `${s}s ago` : s < 3600 ? `${Math.floor(s / 60)}m ago` : `${Math.floor(s / 3600)}h ago`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [d.last_update]);

  const getTempStatus = (t: number) => t < 25 ? "cold" : t < 35 ? "ok" : t < 40 ? "warning" : "alert";
  const avgTemp = d.tempBMP > 0 ? parseFloat(((d.temp + d.tempBMP) / 2).toFixed(1)) : d.temp;
  const getHumidityStatus = (h: number) => h < 30 || h > 70 ? "warning" : "ok";
  const getGasStatus = (g: number) => g > 350 ? "alert" : g > 250 ? "warning" : "ok";

  if (loading) return <DashboardSkeleton />;

  if (error) return (
    <Layout>
      <div className="flex items-center gap-2 text-red-400 mt-12 text-sm bg-red-950/20 border border-red-800/40 p-4 rounded-xl">
        <WifiOff className="h-4 w-4" /> Connection error: {error}
      </div>
    </Layout>
  );

  // Weather trend mapping
  const weatherStatus = weather
    ? /rising/i.test(weather.prediction) ? "ok"
      : /falling/i.test(weather.prediction) ? "alert"
        : "warning"
    : "ok";

  const weatherIcon = weather
    ? /rising/i.test(weather.prediction) ? TrendingUp
      : /falling/i.test(weather.prediction) ? TrendingDown
        : Minus
    : Minus;

  const trendStr = weather
    ? `${weather.trend >= 0 ? "+" : ""}${weather.trend.toFixed(2)} hPa/sample`
    : "Pressure steady";

  return (
    <Layout>
      <div className="space-y-6 pb-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">System Overview</h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              {formatLastUpdated(d.last_update)}
            </p>
          </div>

          {/* Liveness pill badge */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium",
              sensorOnline
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            )}>
              <span className={cn(
                "w-2 h-2 rounded-full",
                sensorOnline ? "bg-emerald-500 animate-pulse" : "bg-red-500"
              )} />
              <span>{sensorOnline ? "Hub Online" : "Hub Offline"}</span>
              <span className="text-zinc-500 text-[10px]">· {syncAge}</span>
            </div>
          </div>
        </div>

        {/* ── Sensor Telemetry Grid ── */}
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <SensorCard title="Temp (DHT11)" value={d.temp} unit="°C" icon={Thermometer} status={getTempStatus(d.temp)} description="Ambient indoor temp" />
          <SensorCard title="Temp (BMP180)" value={d.tempBMP} unit="°C" icon={Thermometer} status={getTempStatus(d.tempBMP)} description="Barometric temperature" />
          <SensorCard title="Avg Temperature" value={avgTemp} unit="°C" icon={Thermometer} status={getTempStatus(avgTemp)} description="Calculated dual-sensor mean" />
          <SensorCard title="Relative Humidity" value={d.humidity} unit="%" icon={Droplets} status={getHumidityStatus(d.humidity)} description="Moisture content" />
          <SensorCard title="Air Quality" value={d.gas} unit="PPM" icon={Wind} status={getGasStatus(d.gas)} description="MQ135 Gas telemetry" />
          <SensorCard title="Atmospheric Pressure" value={d.pressure} unit="hPa" icon={Gauge} status="ok" description="Barometric pressure" />
          <SensorCard title="Water Tank Level" value={d.waterLevel} unit="cm" icon={Waves} status={d.waterLevel > 60 ? "ok" : d.waterLevel > 20 ? "warning" : "alert"} description="Ultrasonic depth" />
          <SensorCard title="Precipitation" value={d.rain} icon={CloudRain} status={d.rain === "Detected" ? "alert" : "ok"} description="Rain detection sensor" />
          <SensorCard title="Motion Sensor" value={d.motion} icon={PersonStanding} status={d.motion === "Detected" ? "warning" : "ok"} description="PIR infrared activity" />
          <SensorCard title="Door Status" value={d.door === 1 ? "Open" : "Closed"} icon={DoorOpen} status={d.door === 1 ? "warning" : "ok"} description="Magnetic reed sensor" />
          <SensorCard title="Weather Forecast" value={weather?.prediction ?? "Steady"} icon={weatherIcon} status={weatherStatus} description={trendStr} />
          <SensorCard title="Power Grid Source" value={power === 1 ? "Grid Power" : power === 0 ? "Battery / Inverter" : "Standby"} icon={Zap} status={power === 1 ? "ok" : "warning"} description={power === 1 ? "AC mains online" : "Running on inverter"} />
        </div>

        {/* ── System Status & Energy Telemetry ── */}
        <div className="rounded-2xl border border-white/12 bg-black p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
              Hardware & Power Subsystem
            </h2>
            <span className="text-[11px] font-mono text-neutral-400">Live Hardware Telemetry</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatusTile
              label="Cloud Realtime DB"
              value={live ? "Synchronized" : "Disconnected"}
              ok={!!live}
              icon={Database}
            />
            <StatusTile
              label="ESP Edge Node"
              value={sensorOnline ? "Connected" : "Offline"}
              ok={sensorOnline}
              icon={Cpu}
              subvalue={syncAge}
            />
            <StatusTile
              label="Power Supply"
              value={power === 1 ? "Grid (230V)" : power === 0 ? "Inverter 🔋" : "Standby"}
              ok={power === 1}
              statusOverride={power === 1 ? "ok" : "warning"}
              icon={Zap}
            />
            <StatusTile
              label="Battery Backup"
              value={`${d.batteryPercent ?? 0}%`}
              ok={(d.batteryPercent ?? 0) > 30}
              statusOverride={(d.batteryPercent ?? 0) > 60 ? "ok" : (d.batteryPercent ?? 0) > 30 ? "warning" : "alert"}
              icon={BatteryCharging}
              subvalue={`${d.batteryVolt ? d.batteryVolt.toFixed(2) : "0.00"}V`}
            />
          </div>
        </div>

      </div>
    </Layout>
  );
}
