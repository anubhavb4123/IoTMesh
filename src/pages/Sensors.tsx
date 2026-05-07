import { useEffect, useState, useRef } from "react";
import { Layout } from "@/components/Layout";
import {
  AreaChart, Area, Line, LineChart, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ComposedChart,
} from "recharts";
import { useSensorData } from "@/hooks/useSensorData";
import { database } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import {
  Thermometer, Droplets, Wind, Gauge,
  Waves, TrendingUp, TrendingDown, Minus, Activity, BatteryCharging,
} from "lucide-react";
import { SensorsSkeleton } from "@/components/skeletons/SensorsSkeleton";

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
type Range = 1 | 12 | 24; ``

// ── Metric config ─────────────────────────────────────────────
const METRICS = [
  { key: "temperature" as Metric, label: "Temperature", unit: "°C", icon: Thermometer, color: "#ef4444", glow: "#ef444440", bg: "#ef444412", warn: 35, critical: 42 },
  { key: "humidity" as Metric, label: "Humidity", unit: "%", icon: Droplets, color: "#38bdf8", glow: "#38bdf840", bg: "#38bdf812", warn: 75, critical: 90 },
  { key: "gas" as Metric, label: "Air Quality", unit: " PPM", icon: Wind, color: "#10b981", glow: "#10b98140", bg: "#10b98112", warn: 300, critical: 500 },
  { key: "pressure" as Metric, label: "Pressure", unit: " hPa", icon: Gauge, color: "#f59e0b", glow: "#f59e0b40", bg: "#f59e0b12", warn: 1020, critical: 1040 },
  { key: "waterLevel" as Metric, label: "Water Level", unit: " cm", icon: Waves, color: "#6366f1", glow: "#6366f140", bg: "#6366f112", warn: 30, critical: 15 },
  { key: "batteryPercent" as Metric, label: "Battery", unit: "%", icon: BatteryCharging, color: "#c57c22", glow: "#c5ba2240", bg: "#22c55e12", warn: 30, critical: 15 },
];

// ── Parse last_update string → ms (same logic as Dashboard)
function parseLastUpdateToMs(lastUpdate?: string): number | null {
  if (!lastUpdate) return null;
  const [timePart, datePart] = lastUpdate.split(" ");
  if (!timePart || !datePart) return null;
  const [h, m, s] = timePart.split(":").map(Number);
  const [d, mo, y] = datePart.split("-").map(Number);
  return new Date(y, mo - 1, d, h, m, s).getTime();
}

// ── Custom chart tooltip ──────────────────────────────────────
const CustomTooltip = ({
  active, payload, label, color, unit,
}: {
  active?: boolean;
  payload?: Array<{ value?: number | string }>;
  label?: string;
  color: string;
  unit: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-3 py-2 text-sm border backdrop-blur-md"
      style={{ background: "rgba(10,14,24,0.95)", borderColor: `${color}55`, boxShadow: `0 0 16px ${color}33` }}
    >
      <p className="text-muted-foreground text-xs mb-1">{label}</p>
      <p className="font-bold tabular-nums" style={{ color }}>
        {Number(payload[0].value).toFixed(1)}{unit}
      </p>
    </div>
  );
};

// ── Battery dual tooltip ─────────────────────────────────────
const BatteryTooltip = ({
  active, payload, label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string; color?: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  const pctEntry = payload.find((p) => p.name === "batteryPercent");
  const voltEntry = payload.find((p) => p.name === "batteryVolt");
  return (
    <div
      className="rounded-xl px-3 py-2 text-sm border backdrop-blur-md space-y-1"
      style={{ background: "rgba(10,14,24,0.95)", borderColor: "#22c55e55" }}
    >
      <p className="text-muted-foreground text-xs">{label}</p>
      {pctEntry && (
        <p className="font-bold tabular-nums" style={{ color: "#22c55e" }}>
          {Number(pctEntry.value).toFixed(1)}%
        </p>
      )}
      {voltEntry && (
        <p className="font-bold tabular-nums" style={{ color: "#86efac" }}>
          {Number(voltEntry.value).toFixed(2)} V
        </p>
      )}
    </div>
  );
};

// ── Temperature dual-line tooltip ────────────────────────────
const TempTooltip = ({
  active, payload, label,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string; color?: string }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  const dht = payload.find((p) => p.name === "temperature");
  const bmp = payload.find((p) => p.name === "temperatureBMP");
  return (
    <div
      className="rounded-xl px-3 py-2 text-sm border backdrop-blur-md space-y-1"
      style={{ background: "rgba(10,14,24,0.95)", borderColor: "#ef444455" }}
    >
      <p className="text-muted-foreground text-xs">{label}</p>
      {dht && (
        <p className="font-bold tabular-nums" style={{ color: "#ef4444" }}>
          DHT11: {Number(dht.value).toFixed(1)}°C
        </p>
      )}
      {bmp && (
        <p className="font-bold tabular-nums" style={{ color: "#f97316" }}>
          BMP180: {Number(bmp.value).toFixed(1)}°C
        </p>
      )}
    </div>
  );
};

// ── Sensor card ───────────────────────────────────────────────
function SensorCard({ cfg, value, index }: { cfg: typeof METRICS[number]; value: number; index: number }) {
  const Icon = cfg.icon;
  const status = value >= cfg.critical ? "critical" : value >= cfg.warn ? "warn" : "ok";
  const sc = status === "critical" ? "#ef4444" : status === "warn" ? "#f59e0b" : cfg.color;

  return (
    <div
      className="relative rounded-2xl border border-border/40 bg-card/40 overflow-hidden transition-all duration-300 group hover:-translate-y-0.5 hover:border-border/70"
      style={{
        animation: "fadeSlideIn 0.4s ease both",
        animationDelay: `${index * 0.06}s`,
      }}
    >




      <div className="relative p-4">
        {/* Icon row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl" style={{ background: cfg.bg, border: `1px solid ${cfg.color}33` }}>
            <Icon className="h-4.5 w-4.5" style={{ color: cfg.color, width: 18, height: 18 }} />
          </div>
          {status !== "ok" && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded tracking-widest uppercase"
              style={{ background: `${sc}22`, color: sc, border: `1px solid ${sc}44` }}>
              {status}
            </span>
          )}
        </div>

        {/* Value */}
        <div className="mb-1 flex items-end gap-1">
          <span className="text-3xl font-bold tabular-nums leading-none" style={{ color: sc }}>
            {value >= 100 ? value.toFixed(0) : value.toFixed(1)}
          </span>
          <span className="text-xs text-muted-foreground mb-0.5">{cfg.unit.trim()}</span>
        </div>

        {/* Label */}
        <p className="text-[11px] text-muted-foreground/60 tracking-widest uppercase">{cfg.label}</p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function Sensors() {
  const { sensorData, loading, error } = useSensorData();
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [range, setRange] = useState<Range>(24);
  const [selectedMetric, setSelectedMetric] = useState<Metric>("temperature");
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const histRef = ref(database, "home/room1/history/h24");
    return onValue(histRef, (snap) => {
      if (!snap.exists()) { setHistory([]); return; }
      const arr: HistoryPoint[] = Object.entries(snap.val()).map(([, item]: any) => {
        const ts = item.timestamp < 1e12 ? item.timestamp * 1000 : item.timestamp;
        return {
          timestamp: ts,
          temperature: item.temperature ?? 0,
          temperatureBMP: item.temperatureBMP ?? 0,
          humidity: item.humidity ?? 0,
          gas: item.gas ?? 0,
          pressure: item.pressure ?? 0,
          waterLevel: item.waterLevel ?? 0,
          batteryPercent: item.batteryPercent ?? 0,
          batteryVolt: item.batteryVolt ?? 0,
          time: new Date(ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        };
      });
      arr.sort((a, b) => a.timestamp - b.timestamp);
      setHistory(arr);
    });
  }, []);

  // ── Online/offline detection — same logic as Dashboard ──────────
  useEffect(() => {
    const check = () => {
      const lastMs = parseLastUpdateToMs(sensorData?.last_update);
      if (!lastMs) { setIsOnline(false); return; }
      setIsOnline(Date.now() - lastMs <= 120_000);  // 2 min threshold
    };
    check();
    const id = setInterval(check, 1000);  // recheck every second
    return () => clearInterval(id);
  }, [sensorData?.last_update]);

  const filteredHistory = history.filter((p) => Date.now() - p.timestamp <= range * 3_600_000);
  const activeCfg = METRICS.find((m) => m.key === selectedMetric)!;

  // ── Stats computed from the full filtered range (matches what graph shows) ──
  const vals = filteredHistory.map((p) => selectedMetric === "batteryPercent" ? p.batteryPercent : (p[selectedMetric as keyof typeof p] as number));
  const voltVals = filteredHistory.map((p) => p.batteryVolt);
  const bmpVals = filteredHistory.map((p) => p.temperatureBMP);
  const avg = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
  const mx = vals.length ? Math.max(...vals) : 0;
  const mn = vals.length ? Math.min(...vals) : 0;
  const avgV = voltVals.length ? voltVals.reduce((s, v) => s + v, 0) / voltVals.length : 0;
  const mxV = voltVals.length ? Math.max(...voltVals) : 0;
  const mnV = voltVals.length ? Math.min(...voltVals) : 0;
  const avgB = bmpVals.length ? bmpVals.reduce((s, v) => s + v, 0) / bmpVals.length : 0;
  const mxB = bmpVals.length ? Math.max(...bmpVals) : 0;
  const mnB = bmpVals.length ? Math.min(...bmpVals) : 0;

  if (loading) return <SensorsSkeleton />;

  if (error) return (
    <Layout>
      <div className="flex items-center gap-2 text-red-400 mt-12 text-sm">
        <Activity className="h-4 w-4" /> Sensor error: {error}
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="space-y-5" style={{ animation: "fadeSlideIn 0.4s ease both" }}>

        {/* ── Page header ── */}
        <div className="flex items-center justify-between" style={{ animation: "fadeSlideIn 0.3s ease both" }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-400/10 border border-cyan-400/20">
              <Activity className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Sensor Monitor</h1>
              <p className="text-xs text-muted-foreground/60 mt-0.5 tracking-wide">
                {isOnline ? "Live" : "Last seen"} · {sensorData?.last_update ?? "—"}
              </p>
            </div>
          </div>
          {/* Live / Offline badge */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-500"
            style={
              isOnline
                ? { borderColor: "rgba(34,197,94,0.25)", background: "rgba(34,197,94,0.08)" }
                : { borderColor: "rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.08)" }
            }
          >
            <span
              className="w-2 h-2 rounded-full transition-colors duration-500"
              style={
                isOnline
                  ? { background: "#22c55e", boxShadow: "0 0 6px #22c55e", animation: "pulse 2s infinite" }
                  : { background: "#ef4444", boxShadow: "0 0 6px #ef4444" }
              }
            />
            <span
              className="text-[11px] font-medium tracking-wider transition-colors duration-500"
              style={{ color: isOnline ? "#22c55e" : "#ef4444" }}
            >
              {isOnline ? "LIVE" : "OFFLINE"}
            </span>
          </div>
        </div>

        {/* ── Sensor cards ── */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          {METRICS.map((cfg, i) => {
            const val =
              cfg.key === "waterLevel"
                ? (sensorData?.WaterLevel ?? 0)
                : cfg.key === "batteryPercent"
                  ? (sensorData?.batteryPercent ?? 0)
                  : ((sensorData?.[cfg.key as keyof typeof sensorData] as number) ?? 0);
            return <SensorCard key={cfg.key} cfg={cfg} value={val} index={i} />;
          })}
        </div>

        {/* ── History chart card ── */}
        <div
          className="rounded-2xl border border-border/40 bg-card/40 overflow-hidden"
          style={{

            animation: "fadeSlideIn 0.4s ease both",
            animationDelay: "0.28s",
          }}
        >
          {/* Chart header */}
          <div className="px-5 pt-4 pb-3 border-b border-border/20">

            {/* Top row: title + range */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 rounded-full" style={{ background: activeCfg.color }} />
                {selectedMetric === "temperature" && (
                  <div className="w-1.5 h-4 rounded-full ml-0.5" style={{ background: "#f97316" }} />
                )}
                <span className="text-sm font-semibold">{activeCfg.label} History</span>
                <span className="text-xs text-muted-foreground/40">· {filteredHistory.length} pts</span>
              </div>

              <div className="flex gap-1">
                {([1, 12, 24] as Range[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium tracking-wider transition-all duration-200"
                    style={
                      range === r
                        ? { background: `${activeCfg.color}22`, color: activeCfg.color, border: `1px solid ${activeCfg.color}50` }
                        : { background: "rgba(255,255,255,0.03)", color: "#444", border: "1px solid rgba(255,255,255,0.07)" }
                    }
                  >
                    {r}h
                  </button>
                ))}
              </div>
            </div>

            {/* Stats row */}
            <div className="flex gap-4 mb-3 flex-wrap">
              {selectedMetric === "temperature" ? (
                <>
                  {/* DHT11 stats */}
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg border border-border/20">
                    <div className="w-2 h-2 rounded-full bg-[#ef4444] mr-1" />
                    <span className="text-[10px] text-muted-foreground/50 mr-1">DHT11</span>
                    {[{ label: "Avg", value: avg, icon: Minus }, { label: "Max", value: mx, icon: TrendingUp }, { label: "Min", value: mn, icon: TrendingDown }].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="flex items-center gap-1 ml-2">
                        <Icon className="h-3 w-3" style={{ color: "#ef4444", opacity: 0.7 }} />
                        <span className="text-[10px] text-muted-foreground/50">{label}</span>
                        <span className="text-xs font-bold tabular-nums" style={{ color: "#ef4444" }}>{value.toFixed(1)}°C</span>
                      </div>
                    ))}
                  </div>
                  {/* BMP180 stats */}
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg border border-border/20">
                    <div className="w-2 h-2 rounded-full bg-[#f97316] mr-1" />
                    <span className="text-[10px] text-muted-foreground/50 mr-1">BMP180</span>
                    {[{ label: "Avg", value: avgB, icon: Minus }, { label: "Max", value: mxB, icon: TrendingUp }, { label: "Min", value: mnB, icon: TrendingDown }].map(({ label, value, icon: Icon }) => (
                      <div key={label} className="flex items-center gap-1 ml-2">
                        <Icon className="h-3 w-3" style={{ color: "#f97316", opacity: 0.7 }} />
                        <span className="text-[10px] text-muted-foreground/50">{label}</span>
                        <span className="text-xs font-bold tabular-nums" style={{ color: "#f97316" }}>{value.toFixed(1)}°C</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : selectedMetric === "batteryPercent" ? (
                <>
                  {[{ label: "Avg", pct: avg, v: avgV, icon: Minus }, { label: "Max", pct: mx, v: mxV, icon: TrendingUp }, { label: "Min", pct: mn, v: mnV, icon: TrendingDown }].map(({ label, pct, v, icon: Icon }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <Icon className="h-3 w-3" style={{ color: "#22c55e", opacity: 0.7 }} />
                      <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">{label}</span>
                      <span className="text-xs font-bold tabular-nums" style={{ color: "#22c55e" }}>{pct.toFixed(1)}%</span>
                      <span className="text-xs tabular-nums" style={{ color: "#86efac" }}>{v.toFixed(2)}V</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border/20">
                    <span className="w-6 border-t-2 border-dashed border-[#86efac] opacity-70" />
                    <span className="text-[10px] text-muted-foreground/50">Voltage</span>
                    <span className="w-4 h-0.5 bg-[#22c55e] rounded opacity-70" />
                    <span className="text-[10px] text-muted-foreground/50">%</span>
                  </div>
                </>
              ) : (
                [
                  { label: "Avg", value: avg, icon: Minus },
                  { label: "Max", value: mx, icon: TrendingUp },
                  { label: "Min", value: mn, icon: TrendingDown },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <Icon className="h-3 w-3" style={{ color: activeCfg.color, opacity: 0.7 }} />
                    <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">{label}</span>
                    <span className="text-xs font-bold tabular-nums" style={{ color: activeCfg.color }}>
                      {value.toFixed(1)}{activeCfg.unit.trim()}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Metric selector */}
            <div className="flex gap-1.5 flex-wrap">
              {METRICS.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setSelectedMetric(m.key)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all duration-200"
                  style={
                    selectedMetric === m.key
                      ? { background: `${m.color}22`, color: m.color, border: `1px solid ${m.color}55`, boxShadow: `0 0 8px ${m.color}22` }
                      : { background: "rgba(255,255,255,0.03)", color: "#444", border: "1px solid rgba(255,255,255,0.07)" }
                  }
                >
                  <m.icon style={{ width: 11, height: 11 }} />
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart area*/}
          <div className="px-2 py-4 h-64">
            {filteredHistory.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground/30 text-sm">
                No data for this range
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {selectedMetric === "temperature" ? (
                  <ComposedChart data={filteredHistory} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="grad-dht" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="grad-bmp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f97316" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="time" tick={{ fill: "#333", fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: "#333", fontSize: 9 }} tickLine={false} axisLine={false} />
                    <Tooltip content={({ active, payload, label }) => <TempTooltip active={active} payload={payload as any} label={label} />} />
                    <Area type="monotone" dataKey="temperature" name="temperature" stroke="#ef4444" strokeWidth={2} fill="url(#grad-dht)" dot={false} activeDot={{ r: 4, fill: "#ef4444", stroke: "#0a0e18", strokeWidth: 2 }} />
                    <Area type="monotone" dataKey="temperatureBMP" name="temperatureBMP" stroke="#f97316" strokeWidth={1.5} fill="url(#grad-bmp)" dot={false} activeDot={{ r: 4, fill: "#f97316", stroke: "#0a0e18", strokeWidth: 2 }} />
                  </ComposedChart>
                ) : selectedMetric === "batteryPercent" ? (
                  <ComposedChart data={filteredHistory} margin={{ top: 4, right: 40, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="grad-batt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="time" tick={{ fill: "#333", fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis yAxisId="pct" tick={{ fill: "#22c55e", fontSize: 9 }} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <YAxis yAxisId="volt" orientation="right" tick={{ fill: "#86efac", fontSize: 9 }} tickLine={false} axisLine={false} domain={[3.0, 4.3]} tickFormatter={(v: number) => `${v.toFixed(1)}V`} />
                    <Tooltip
                      content={({ active, payload, label }) => (
                        <BatteryTooltip active={active} payload={payload as any} label={label} />
                      )}
                    />
                    <Area yAxisId="pct" type="monotone" dataKey="batteryPercent" name="batteryPercent" stroke="#22c55e" strokeWidth={2} fill="url(#grad-batt)" dot={false} activeDot={{ r: 4, fill: "#22c55e", stroke: "#0a0e18", strokeWidth: 2 }} />
                    <Line yAxisId="volt" type="monotone" dataKey="batteryVolt" name="batteryVolt" stroke="#86efac" strokeWidth={1.5} dot={false} strokeDasharray="4 2" activeDot={{ r: 3, fill: "#86efac", stroke: "#0a0e18", strokeWidth: 2 }} />
                  </ComposedChart>
                ) : (
                  <AreaChart data={filteredHistory} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={activeCfg.color} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={activeCfg.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="time" tick={{ fill: "#333", fontSize: 9 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: "#333", fontSize: 9 }} tickLine={false} axisLine={false} />
                    <Tooltip
                      content={({ active, payload, label }) => (
                        <CustomTooltip
                          active={active}
                          payload={payload as Array<{ value?: number | string }>}
                          label={label}
                          color={activeCfg.color}
                          unit={activeCfg.unit}
                        />
                      )}
                    />
                    <Area
                      type="monotone"
                      dataKey={selectedMetric}
                      stroke={activeCfg.color}
                      strokeWidth={2}
                      fill="url(#grad)"
                      dot={false}
                      activeDot={{ r: 4, fill: activeCfg.color, stroke: "#0a0e18", strokeWidth: 2 }}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            )}
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