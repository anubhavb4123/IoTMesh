import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { SensorCard } from "@/components/SensorCard";
import { cn } from "@/lib/utils";
import {
  Thermometer, Droplets, Wind, Gauge, Waves,
  CloudRain, Activity, DoorOpen, Database,
  Zap, BatteryCharging, Cpu, LayoutDashboard, WifiOff,
} from "lucide-react";
import { LucideIcon } from "lucide-react";
import { useSensorData } from "@/hooks/useSensorData";

// ── Types ─────────────────────────────────────────────────────
interface DashboardData {
  temp: number; humidity: number; pressure: number; gas: number;
  rain: string; waterLevel: number; motion: string; door: number;
  power?: number; last_update?: string;
  batteryVoltage?: number; batteryPercent?: number;
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
  if (!t) return "Last sync —";
  const [tp, dp] = t.split(" ");
  if (!tp || !dp) return "Last sync —";
  const [h, m, s]   = tp.split(":").map(Number);
  const [d, mo, y]  = dp.split("-").map(Number);
  const date = new Date(y, mo - 1, d, h, m, s);
  const now  = new Date();
  const fmt  = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
  if (date.toDateString() === now.toDateString()) return `Today at ${fmt}`;
  const yest = new Date(now); yest.setDate(now.getDate() - 1);
  if (date.toDateString() === yest.toDateString()) return `Yesterday at ${fmt}`;
  return `${date.toLocaleDateString()} at ${fmt}`;
}

// ── StatusItem ────────────────────────────────────────────────
function StatusItem({ label, ok, value, icon: Icon, indicatorClass }: {
  label: string; ok: boolean; value?: string;
  icon: LucideIcon; indicatorClass?: string;
}) {
  const status =
    indicatorClass === "battery-ok"       ? "ok"      :
    indicatorClass === "battery-warning"  ? "warning" :
    indicatorClass === "battery-critical" ? "alert"   :
    ok ? "ok" : "alert";

  const color  = status === "ok" ? "#22c55e" : status === "warning" ? "#f59e0b" : "#ef4444";
  const iconCls = status === "ok" ? "icon-ok" : status === "warning" ? "icon-warning" : "icon-critical";

  return (
    <div
      className="relative flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 hover:scale-[1.02] overflow-hidden"
      style={{ borderColor: "rgba(255,255,255,0.07)", background: "transparent", boxShadow: "none" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${color}44`; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)"; }}
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
        <Icon className={cn("h-5 w-5 fill-none stroke-[1.8]", iconCls, label === "Battery" && "rotate-90 scale-x-[-1]")} />
      </div>

      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground/50 tracking-widest uppercase">{label}</p>
        <p className="text-sm font-semibold mt-0.5 truncate" style={{ color }}>
          {value ?? (ok ? "Online" : "Offline")}
        </p>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────
export default function Dashboard() {
  const { sensorData: live, loading, error } = useSensorData();
  const [sensorOnline, setSensorOnline] = useState(false);
  const [syncAge,      setSyncAge]      = useState("—");

  const safe  = (v: any, fb = 0) => typeof v === "number" && !isNaN(v) ? v : fb;
  const power = live?.power;

  const d: DashboardData = {
    temp:           safe(live?.temperature),
    humidity:       safe(live?.humidity),
    gas:            safe(live?.gas),
    pressure:       safe(live?.pressure),
    rain:           live?.rain   ? "Detected" : "Clear",
    waterLevel:     safe(live?.WaterLevel),
    motion:         live?.motion ? "Detected" : "Clear",
    door:           safe(live?.door),
    last_update:    live?.last_update,
    batteryVoltage: safe(live?.batteryVoltage),
    batteryPercent: safe(live?.batteryPercent),
  };

  // Online check every second
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

  const getTempStatus     = (t: number) => t < 25 ? "cold" : t < 30 ? "ok" : t < 35 ? "warning" : "alert";
  const getHumidityStatus = (h: number) => h < 30 || h > 70 ? "warning" : "ok";
  const getGasStatus      = (g: number) => g > 350 ? "alert" : g > 250 ? "warning" : "ok";
  const getBatteryStatus  = (p = 0) => p > 60 ? "battery-ok" : p > 30 ? "battery-warning" : "battery-critical";

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="loader-o" style={{ width: 40, height: 40, borderWidth: 3 }} />
          <p className="text-muted-foreground tracking-widest text-sm animate-pulse">Loading IoTMesh...</p>
        </div>
      </div>
    </Layout>
  );

  if (error) return (
    <Layout>
      <div className="flex items-center gap-2 text-red-400 mt-12 text-sm">
        <WifiOff className="h-4 w-4" /> {error}
      </div>
    </Layout>
  );

  const cards = [
    <SensorCard title="Temperature" value={d.temp}       unit="°C"  icon={Thermometer} status={getTempStatus(d.temp)}            description="Ambient temperature"  />,
    <SensorCard title="Humidity"    value={d.humidity}   unit="%"   icon={Droplets}    status={getHumidityStatus(d.humidity)}     description="Relative humidity"    />,
    <SensorCard title="Air Quality" value={d.gas}        unit="PPM" icon={Wind}        status={getGasStatus(d.gas)}               description="Gas sensor (MQ135)"   />,
    <SensorCard title="Pressure"    value={d.pressure}   unit="hPa" icon={Gauge}       status="ok"                                description="Atmospheric pressure" />,
    <SensorCard title="Water Level" value={d.waterLevel} unit="cm"  icon={Waves}       status={d.waterLevel > 60 ? "ok" : d.waterLevel > 20 ? "warning" : "alert"} description="Tank water level" />,
    <SensorCard title="Rain"        value={d.rain}                  icon={CloudRain}   status={d.rain === "Detected" ? "alert" : "ok"}    description="Rain detection"      />,
    <SensorCard title="Motion"      value={d.motion}                icon={Activity}    status={d.motion === "Detected" ? "warning" : "ok"} description="PIR motion sensor"   />,
    <SensorCard title="Door"        value={d.door === 1 ? "Open" : "Closed"} icon={DoorOpen} status={d.door === 1 ? "warning" : "ok"} description="Magnetic door sensor" />,
  ];

  return (
    <Layout>
      <div className="flex flex-col gap-5" style={{ animation: "fadeSlideIn 0.4s ease both" }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between" style={{ animation: "fadeSlideIn 0.3s ease both" }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-400/10 border border-cyan-400/20">
              <LayoutDashboard className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-xs text-muted-foreground/50 mt-0.5 tracking-wide">
                {formatLastUpdated(d.last_update)}
              </p>
            </div>
          </div>

          {/* Live / Offline badge */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-500"
            style={
              sensorOnline
                ? { borderColor: "rgba(34,197,94,0.25)", background: "rgba(34,197,94,0.08)" }
                : { borderColor: "rgba(239,68,68,0.25)",  background: "rgba(239,68,68,0.08)"  }
            }
          >
            <span
              className="w-2 h-2 rounded-full"
              style={
                sensorOnline
                  ? { background: "#22c55e", boxShadow: "0 0 6px #22c55e", animation: "pulse 2s infinite" }
                  : { background: "#ef4444", boxShadow: "0 0 6px #ef4444" }
              }
            />
            <span className="text-[11px] font-medium tracking-wider" style={{ color: sensorOnline ? "#22c55e" : "#ef4444" }}>
              {sensorOnline ? "LIVE" : "OFFLINE"}
            </span>
            <span className="text-[10px] text-muted-foreground/40 hidden sm:block">· {syncAge}</span>
          </div>
        </div>

        {/* ── Sensor cards ── */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((card, i) => (
            <div key={i} style={{ animation: "fadeSlideIn 0.4s ease both", animationDelay: `${i * 0.06}s` }}>
              {card}
            </div>
          ))}
        </div>

        {/* System status */}
        <div
          className="rounded-2xl border border-border/40 bg-card/40 overflow-hidden"
          style={{
            
            animation: "fadeSlideIn 0.4s ease both",
            animationDelay: "0.5s",
          }}
        >
          <div className="flex items-center gap-2 px-5 py-3 border-b border-border/20">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" style={{ boxShadow: "0 0 6px #22d3ee" }} />
            <span className="text-[10px] font-semibold tracking-widest text-muted-foreground/50 uppercase">
              System Status
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-4 p-4">
            <StatusItem label="Firebase"     ok={!!live}       value={live ? "Connected" : "Disconnected"}                                                   icon={Database}       />
            <StatusItem label="ESP Device"   ok={sensorOnline} value={sensorOnline ? `Online` : `Offline`} icon={Cpu} />
            <StatusItem label="Power Source" ok={power === 1}  value={power === 1 ? "Grid ⚡" : power === 0 ? "Inverter 🔋" : "Unknown"}                      icon={Zap}            />
            <StatusItem label="Battery"      ok={!!d.batteryPercent} value={`${d.batteryPercent ?? "—"}%  ${d.batteryVoltage?.toFixed(2) ?? "—"}V`}
              indicatorClass={getBatteryStatus(d.batteryPercent)} icon={BatteryCharging}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Layout>
  );
}
