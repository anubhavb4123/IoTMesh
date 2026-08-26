import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import {
  Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ComposedChart, Line
} from "recharts";
import { useSensorData } from "@/hooks/useSensorData";
import { database } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import {
  Thermometer, Droplets, Wind, Gauge,
  Waves, TrendingUp, TrendingDown, Minus, Activity, BatteryCharging,
  WifiOff
} from "lucide-react";
import { SensorsSkeleton } from "@/components/skeletons/SensorsSkeleton";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────
interface HistoryPoint {
  timestamp: number;
  temperature: number;
  temperatureBMP: number;
  humidity: number;
  gas: number;
  pressure: number;
  waterLevel: number;
  batteryPercent: number;
  batteryVolt: number;
  time: string;
}

type Metric = "temperature" | "humidity" | "gas" | "pressure" | "waterLevel" | "batteryPercent";
type Range = 1 | 12 | 24;

// ── Metric config ─────────────────────────────────────────────
const METRICS = [
  { key: "temperature" as Metric, label: "Temperature", unit: "°C", icon: Thermometer, color: "#ef4444", warn: 35, critical: 42 },
  { key: "humidity" as Metric, label: "Humidity", unit: "%", icon: Droplets, color: "#0ea5e9", warn: 75, critical: 90 },
  { key: "gas" as Metric, label: "Air Quality", unit: " PPM", icon: Wind, color: "#10b981", warn: 300, critical: 500 },
  { key: "pressure" as Metric, label: "Pressure", unit: " hPa", icon: Gauge, color: "#f59e0b", warn: 1020, critical: 1040 },
  { key: "waterLevel" as Metric, label: "Water Level", unit: " cm", icon: Waves, color: "#6366f1", warn: 30, critical: 15 },
  { key: "batteryPercent" as Metric, label: "Battery", unit: "%", icon: BatteryCharging, color: "#22c55e", warn: 30, critical: 15 },
];

function parseLastUpdateToMs(lastUpdate?: string): number | null {
  if (!lastUpdate) return null;
  const [timePart, datePart] = lastUpdate.split(" ");
  if (!timePart || !datePart) return null;
  const [h, m, s] = timePart.split(":").map(Number);
  const [d, mo, y] = datePart.split("-").map(Number);
  return new Date(y, mo - 1, d, h, m, s).getTime();
}

// ── Custom Tooltip ────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, unit, color }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-xs bg-zinc-950/95 border border-zinc-800 shadow-xl space-y-1">
      <p className="text-zinc-500 font-mono text-[10px]">{label}</p>
      {payload.map((item: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: item.color || color }} />
          <span className="text-zinc-400 font-medium">{item.name}:</span>
          <span className="text-white font-mono font-semibold">
            {Number(item.value).toFixed(1)}{unit}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function Sensors() {
  const { sensorData, loading, error } = useSensorData();
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [range, setRange] = useState<Range>(24);
  const [selectedMetric, setSelectedMetric] = useState<Metric>("temperature");
  const [isOnline, setIsOnline] = useState(false);

  // Parse history from Firebase RTDB
  useEffect(() => {
    const histRef = ref(database, "home/room1/history/h24");
    const unsub = onValue(histRef, (snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.val() as Record<string, any>;
      const points: HistoryPoint[] = Object.values(data)
        .map((pt) => {
          const ts = pt.timestamp ? Number(pt.timestamp) : 0;
          const date = new Date(ts);
          return {
            timestamp: ts,
            temperature: pt.temperature ? Number(pt.temperature) : 0,
            temperatureBMP: pt.temperatureBMP ? Number(pt.temperatureBMP) : 0,
            humidity: pt.humidity ? Number(pt.humidity) : 0,
            gas: pt.gas ? Number(pt.gas) : 0,
            pressure: pt.pressure ? Number(pt.pressure) : 0,
            waterLevel: pt.waterLevel ? Number(pt.waterLevel) : 0,
            batteryPercent: pt.batteryPercent ? Number(pt.batteryPercent) : 0,
            batteryVolt: pt.batteryVolt ? Number(pt.batteryVolt) : 0,
            time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }),
          };
        })
        .filter((pt) => pt.timestamp > 0)
        .sort((a, b) => a.timestamp - b.timestamp);
      setHistory(points);
    });
    return () => unsub();
  }, []);

  // Liveness watchdog
  useEffect(() => {
    const tick = () => {
      const ms = parseLastUpdateToMs(sensorData?.last_update);
      if (!ms) { setIsOnline(false); return; }
      setIsOnline(Date.now() - ms <= 120_000);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [sensorData?.last_update]);

  if (loading) return <SensorsSkeleton />;

  if (error) {
    return (
      <Layout>
        <div className="flex items-center gap-2 text-red-400 mt-12 text-sm bg-red-950/20 border border-red-800/40 p-4 rounded-xl">
          <WifiOff className="h-4 w-4" /> Telemetry error: {error}
        </div>
      </Layout>
    );
  }

  // Filter history by sliding range
  const cutoff = Date.now() - range * 3600 * 1000;
  const filteredHistory = history.filter((p) => p.timestamp >= cutoff);
  const activeCfg = METRICS.find((m) => m.key === selectedMetric) ?? METRICS[0];

  // Mathematical aggregations
  const vals = filteredHistory.map((p) => Number(p[selectedMetric]) || 0);
  const valsBMP = filteredHistory.map((p) => Number(p.temperatureBMP) || 0);
  const valsV = filteredHistory.map((p) => Number(p.batteryVolt) || 0);

  const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  const mx = vals.length ? Math.max(...vals) : 0;
  const mn = vals.length ? Math.min(...vals) : 0;

  const avgB = valsBMP.length ? valsBMP.reduce((a, b) => a + b, 0) / valsBMP.length : 0;
  const mxB = valsBMP.length ? Math.max(...valsBMP) : 0;
  const mnB = valsBMP.length ? Math.min(...valsBMP) : 0;

  const avgV = valsV.length ? valsV.reduce((a, b) => a + b, 0) / valsV.length : 0;

  return (
    <Layout>
      <div className="space-y-6 pb-12 max-w-7xl">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">Sensor Telemetry & History</h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Real-time analytics and sliding 24-hour time-series logs
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium",
              isOnline ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
            )}>
              <span className={cn("w-2 h-2 rounded-full", isOnline ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
              <span>{isOnline ? "Live Streaming" : "Node Offline"}</span>
            </div>
          </div>
        </div>

        {/* ── Metrics Selector Tabs ── */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {METRICS.map((m) => {
            const isSelected = selectedMetric === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setSelectedMetric(m.key)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 select-none",
                  isSelected
                    ? "bg-white text-black shadow-sm"
                    : "bg-black border border-white/12 text-neutral-400 hover:text-white hover:border-white/30"
                )}
              >
                <m.icon className="w-3.5 h-3.5" />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Analytics Chart Card ── */}
        <div className="rounded-2xl border border-white/12 bg-black p-5 space-y-4 shadow-sm">
          
          {/* Chart Header: Title, Range Pills, Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{activeCfg.label} Timeseries</span>
                <span className="text-xs text-neutral-400 font-mono">({filteredHistory.length} data points)</span>
              </div>

              {/* Stats badges */}
              <div className="flex items-center gap-3 mt-2 text-xs font-mono">
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-neutral-900 border border-white/10">
                  <Minus className="w-3 h-3 text-neutral-400" />
                  <span className="text-neutral-400">Avg:</span>
                  <span className="text-white font-bold">{avg.toFixed(1)}{activeCfg.unit}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-neutral-900 border border-white/10">
                  <TrendingUp className="w-3 h-3 text-emerald-400" />
                  <span className="text-neutral-400">Max:</span>
                  <span className="text-emerald-400 font-bold">{mx.toFixed(1)}{activeCfg.unit}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-neutral-900 border border-white/10">
                  <TrendingDown className="w-3 h-3 text-blue-400" />
                  <span className="text-neutral-400">Min:</span>
                  <span className="text-blue-400 font-bold">{mn.toFixed(1)}{activeCfg.unit}</span>
                </div>
                {selectedMetric === "temperature" && (
                  <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded bg-neutral-900 border border-white/10">
                    <span className="text-amber-400 font-bold">BMP180:</span>
                    <span className="text-white">{avgB.toFixed(1)}°C</span>
                  </div>
                )}
              </div>
            </div>

            {/* Range Selector */}
            <div className="p-1 rounded-xl bg-black border border-white/12 flex items-center gap-1 self-start sm:self-auto">
              {([1, 12, 24] as Range[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold transition-colors select-none",
                    range === r
                      ? "bg-white text-black shadow-sm"
                      : "text-neutral-400 hover:text-white"
                  )}
                >
                  {r}H
                </button>
              ))}
            </div>
          </div>

          {/* Chart Rendering */}
          <div className="h-72 w-full pt-2">
            {filteredHistory.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-zinc-500 font-mono">
                No historical records within the past {range} hour(s)
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {selectedMetric === "temperature" ? (
                  <ComposedChart data={filteredHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dhtGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="bmpGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="time" stroke="#71717a" fontSize={10} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={10} domain={['auto', 'auto']} tickLine={false} />
                    <Tooltip content={<CustomTooltip unit="°C" color="#ef4444" />} />
                    <Area type="monotone" dataKey="temperature" name="DHT11" stroke="#ef4444" strokeWidth={2} fill="url(#dhtGrad)" />
                    <Area type="monotone" dataKey="temperatureBMP" name="BMP180" stroke="#f59e0b" strokeWidth={1.5} fill="url(#bmpGrad)" />
                  </ComposedChart>
                ) : selectedMetric === "batteryPercent" ? (
                  <ComposedChart data={filteredHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="battGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="time" stroke="#71717a" fontSize={10} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={10} domain={[0, 100]} tickLine={false} />
                    <Tooltip content={<CustomTooltip unit="%" color="#22c55e" />} />
                    <Area type="monotone" dataKey="batteryPercent" name="Charge %" stroke="#22c55e" strokeWidth={2} fill="url(#battGrad)" />
                    <Line type="monotone" dataKey="batteryVolt" name="Voltage" stroke="#86efac" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                  </ComposedChart>
                ) : (
                  <ComposedChart data={filteredHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="metricGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={activeCfg.color} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={activeCfg.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="time" stroke="#71717a" fontSize={10} tickLine={false} />
                    <YAxis stroke="#71717a" fontSize={10} domain={['auto', 'auto']} tickLine={false} />
                    <Tooltip content={<CustomTooltip unit={activeCfg.unit} color={activeCfg.color} />} />
                    <Area type="monotone" dataKey={selectedMetric} name={activeCfg.label} stroke={activeCfg.color} strokeWidth={2} fill="url(#metricGrad)" />
                  </ComposedChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
}