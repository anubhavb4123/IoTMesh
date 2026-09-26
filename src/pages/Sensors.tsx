import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import {
  Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ComposedChart, Line
} from "recharts";
import { useSensorData } from "@/hooks/useSensorData";
import { database, SensorData } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import {
  Thermometer, Droplets, Wind, Gauge,
  Waves, TrendingUp, TrendingDown, Minus, Activity, BatteryCharging,
  WifiOff, Zap, Radio
} from "lucide-react";
import { SensorsSkeleton } from "@/components/skeletons/SensorsSkeleton";
import { cn, parseNodeTimestampToMs } from "@/lib/utils";

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
type Range = 1 | 6 | 12 | 24;

const NODE_LABELS = {
  room1: "Room 1 (Hub)",
  room2: "Room 2 (Subnode)",
  room3: "Room 3 (Subnode)",
};

const METRICS = [
  { key: "temperature" as Metric, label: "Temperature", unit: "°C", icon: Thermometer, color: "#ff7a00", warn: 35, critical: 42 },
  { key: "humidity" as Metric, label: "Humidity", unit: "%", icon: Droplets, color: "#0284c7", warn: 75, critical: 90 },
  { key: "gas" as Metric, label: "Air Quality", unit: " PPM", icon: Wind, color: "#16a34a", warn: 300, critical: 500 },
  { key: "pressure" as Metric, label: "Pressure", unit: " hPa", icon: Gauge, color: "#d97706", warn: 1020, critical: 1040 },
  { key: "waterLevel" as Metric, label: "Water Tank", unit: " cm", icon: Waves, color: "#6366f1", warn: 30, critical: 15 },
  { key: "batteryPercent" as Metric, label: "Battery", unit: "%", icon: BatteryCharging, color: "#15803d", warn: 30, critical: 15 },
];

const CustomTooltip = ({ active, payload, label, unit, color }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="clay-card p-3 text-xs shadow-xl space-y-1 border border-black/[0.08]">
      <p className="text-[#797a82] font-mono text-[10px]">{label}</p>
      {payload.map((item: any, i: number) => {
        const valNum = Number(item.value);
        const displayVal = !isNaN(valNum) && isFinite(valNum) ? valNum.toFixed(1) : "—";
        return (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: item.color || color }} />
            <span className="text-[#55565d] font-bold">{item.name}:</span>
            <span className="text-[#18191c] font-mono font-extrabold">
              {displayVal}{unit}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default function Sensors() {
  const { sensorData: globalLive, loading, error } = useSensorData();
  const [selectedNode, setSelectedNode] = useState<"room1" | "room2" | "room3">("room1");
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [nodeLive, setNodeLive] = useState<SensorData | null>(null);
  const [range, setRange] = useState<Range>(24);
  const [selectedMetric, setSelectedMetric] = useState<Metric>("temperature");
  const [isOnline, setIsOnline] = useState(false);
  const [syncAge, setSyncAge] = useState("—");

  // Listen to node-specific live sensor telemetry
  useEffect(() => {
    const sRef = ref(database, `home/${selectedNode}/sensor`);
    const unsub = onValue(sRef, (snap) => {
      if (snap.exists()) {
        setNodeLive(snap.val());
      } else if (selectedNode === "room1") {
        setNodeLive(globalLive);
      } else {
        setNodeLive(null);
      }
    });
    return () => unsub();
  }, [selectedNode, globalLive]);

  // Listen to 24h Timeseries History from Firebase
  useEffect(() => {
    const histRef = ref(database, `home/${selectedNode}/history/h24`);
    const unsub = onValue(histRef, (snapshot) => {
      if (!snapshot.exists()) {
        setHistory([]);
        return;
      }
      const data = snapshot.val() as Record<string, any>;
      const cutoff = Date.now() - range * 3600 * 1000;
      const points: HistoryPoint[] = Object.values(data)
        .map((pt) => {
          const ts = pt.timestamp ? Number(pt.timestamp) : 0;
          const date = new Date(ts);
          const t = pt.temperature != null ? Number(pt.temperature) : null;
          const tb = pt.temperatureBMP != null ? Number(pt.temperatureBMP) : null;
          const h = pt.humidity != null ? Number(pt.humidity) : null;
          const g = pt.gas != null ? Number(pt.gas) : null;
          const p = pt.pressure != null ? Number(pt.pressure) : null;
          const w = pt.waterLevel != null ? Number(pt.waterLevel) : null;
          const bp = pt.batteryPercent != null ? Number(pt.batteryPercent) : null;
          const bv = pt.batteryVoltage != null ? Number(pt.batteryVoltage) : (pt.batteryVolt != null ? Number(pt.batteryVolt) : null);

          return {
            timestamp: ts,
            temperature: t != null && t >= -20 && t <= 80 ? t : 0,
            temperatureBMP: tb != null && tb >= -20 && tb <= 80 ? tb : 0,
            humidity: h != null && h >= 0 && h <= 100 ? h : 0,
            gas: g != null && g >= 0 && g <= 10000 ? g : 0,
            pressure: p != null && p >= 700 && p <= 1300 ? p : 0,
            waterLevel: w != null && w >= 0 && w <= 500 ? w : 0,
            batteryPercent: bp != null && bp >= 0 && bp <= 100 ? bp : 0,
            batteryVolt: bv != null && bv >= 0 ? bv : 0,
            time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }),
          };
        })
        .filter((pt) => pt.timestamp >= cutoff && (pt.temperature > 0 || pt.humidity > 0 || pt.gas > 0 || pt.pressure > 0 || pt.batteryPercent > 0))
        .sort((a, b) => a.timestamp - b.timestamp);
      setHistory(points);
    });
    return () => unsub();
  }, [selectedNode, range]);

  const activeLive = nodeLive || (selectedNode === "room1" ? globalLive : null);

  // Online telemetry sync age calculation
  useEffect(() => {
    const tick = () => {
      const ms = parseNodeTimestampToMs(activeLive?.last_update);
      if (!ms) {
        setIsOnline(activeLive != null);
        setSyncAge("—");
        return;
      }
      const diff = Date.now() - ms;
      setIsOnline(diff >= -5000 && diff <= 60_000);
      const s = Math.max(0, Math.floor(diff / 1000));
      setSyncAge(s < 60 ? `${s}s ago` : s < 3600 ? `${Math.floor(s / 60)}m ago` : `${Math.floor(s / 3600)}h ago`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeLive?.last_update, activeLive]);

  if (loading) return <SensorsSkeleton />;

  if (error) {
    return (
      <Layout>
        <div className="flex items-center gap-2 text-red-600 mt-12 text-sm bg-red-50 border border-red-200 p-4 rounded-2xl">
          <WifiOff className="h-4 w-4" /> Telemetry error: {error}
        </div>
      </Layout>
    );
  }

  // Filter valid points specifically for selected metric so invalid zero drops are eliminated
  const activeMetricPoints = history.filter((p) => {
    if (selectedMetric === "temperature") return p.temperature > 0;
    if (selectedMetric === "humidity") return p.humidity > 0;
    if (selectedMetric === "gas") return p.gas >= 0;
    if (selectedMetric === "pressure") return p.pressure >= 700;
    if (selectedMetric === "waterLevel") return p.waterLevel >= 0;
    if (selectedMetric === "batteryPercent") return p.batteryPercent >= 0;
    return true;
  });

  const activeCfg = METRICS.find((m) => m.key === selectedMetric) ?? METRICS[0];

  // Live sensor values
  const rawLiveVal = activeLive ? (
    selectedMetric === "temperature" ? activeLive.temperature :
    selectedMetric === "humidity" ? activeLive.humidity :
    selectedMetric === "gas" ? activeLive.gas :
    selectedMetric === "pressure" ? activeLive.pressure :
    selectedMetric === "waterLevel" ? activeLive.WaterLevel :
    (activeLive.batteryPercent != null ? activeLive.batteryPercent : null)
  ) : null;

  const numLiveVal = rawLiveVal != null && !isNaN(Number(rawLiveVal)) ? Number(rawLiveVal) : null;

  // Append live telemetry point to history
  const chartData: HistoryPoint[] = activeMetricPoints.length > 0
    ? (
        numLiveVal != null
          ? [
              ...activeMetricPoints,
              {
                timestamp: Date.now(),
                time: "Now",
                temperature: Number(activeLive?.temperature) || 0,
                temperatureBMP: Number(activeLive?.temperatureBMP ?? activeLive?.temperature) || 0,
                humidity: Number(activeLive?.humidity) || 0,
                gas: Number(activeLive?.gas) || 0,
                pressure: Number(activeLive?.pressure) || 0,
                waterLevel: Number(activeLive?.WaterLevel) || 0,
                batteryPercent: Number(activeLive?.batteryPercent) || 0,
                batteryVolt: Number(activeLive?.batteryVoltage ?? activeLive?.batteryVolt) || 0,
              },
            ]
          : activeMetricPoints
      )
    : (
        numLiveVal != null
          ? [
              {
                timestamp: Date.now(),
                time: "Live",
                temperature: Number(activeLive?.temperature) || 0,
                temperatureBMP: Number(activeLive?.temperatureBMP ?? activeLive?.temperature) || 0,
                humidity: Number(activeLive?.humidity) || 0,
                gas: Number(activeLive?.gas) || 0,
                pressure: Number(activeLive?.pressure) || 0,
                waterLevel: Number(activeLive?.WaterLevel) || 0,
                batteryPercent: Number(activeLive?.batteryPercent) || 0,
                batteryVolt: Number(activeLive?.batteryVoltage ?? activeLive?.batteryVolt) || 0,
              },
            ]
          : []
      );

  const validVals = activeMetricPoints
    .map((p) => Number(p[selectedMetric]))
    .filter((v) => !isNaN(v) && isFinite(v));
  const validValsBMP = activeMetricPoints
    .map((p) => Number(p.temperatureBMP))
    .filter((v) => !isNaN(v) && isFinite(v));

  const validLive = numLiveVal != null && isFinite(numLiveVal) ? numLiveVal : 0;

  const avg = validVals.length ? validVals.reduce((a, b) => a + b, 0) / validVals.length : validLive;
  const mx = validVals.length ? Math.max(...validVals) : validLive;
  const mn = validVals.length ? Math.min(...validVals) : validLive;

  const avgB = validValsBMP.length ? validValsBMP.reduce((a, b) => a + b, 0) / validValsBMP.length : 0;

  return (
    <Layout>
      <div className="space-y-6 pb-12 max-w-[1440px] mx-auto">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-2">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#18191c]">
                Sensor Telemetry & History
              </h1>
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono",
                isOnline ? "badge-running" : "badge-warning"
              )}>
                {isOnline ? "Live Streaming" : "Node Standby"}
              </span>
            </div>
            <p className="text-xs text-[#797a82] mt-1 flex items-center gap-2">
              <span>ESP32 Multi-Sensor Mesh</span>
              <span>·</span>
              <span className="font-mono text-[#55565d]">Last Sync: {syncAge}</span>
              <span>·</span>
              <span className="font-semibold text-[#18191c]">{NODE_LABELS[selectedNode]}</span>
            </p>
          </div>

          {/* Node Selector Pills */}
          <div className="clay-pill-bar flex items-center gap-1 p-1 self-start md:self-auto flex-wrap">
            {(["room1", "room2", "room3"] as const).map((nKey) => (
              <button
                key={nKey}
                onClick={() => setSelectedNode(nKey)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-bold transition-all select-none flex items-center gap-1.5",
                  selectedNode === nKey
                    ? "bg-[#18191c] text-white shadow-sm"
                    : "text-[#6c6e75] hover:text-[#18191c]"
                )}
              >
                <Radio className="w-3 h-3" />
                <span>{nKey === "room1" ? "Room 1 (Hub)" : nKey === "room2" ? "Room 2" : "Room 3"}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Metrics Selector Tabs ── */}
        <div className="clay-pill-bar flex gap-1 overflow-x-auto pb-1 max-w-full">
          {METRICS.map((m) => {
            const isSelected = selectedMetric === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setSelectedMetric(m.key)}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 select-none",
                  isSelected
                    ? "bg-[#18191c] text-white shadow-sm"
                    : "text-[#5e6068] hover:text-[#18191c] hover:bg-white/60"
                )}
              >
                <m.icon className="w-3.5 h-3.5" style={{ color: isSelected ? "currentColor" : m.color }} />
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Analytics Chart Card ── */}
        <div className="clay-card p-6 space-y-5">
          
          {/* Chart Header: Title, Range Pills, Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-black/[0.05]">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold text-[#18191c]">{activeCfg.label} Timeseries</span>
                <span className="px-2 py-0.5 rounded-full bg-[#18191c]/[0.06] text-[10px] font-mono font-bold text-[#18191c]">
                  Last {range}H
                </span>
                <span className="text-xs text-[#797a82] font-mono">({chartData.length} data points)</span>
              </div>

              {/* Stats badges */}
              <div className="flex items-center gap-2.5 mt-2.5 text-xs font-mono flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/70 border border-black/[0.05] shadow-sm">
                  <Minus className="w-3 h-3 text-[#797a82]" />
                  <span className="text-[#797a82]">Avg:</span>
                  <span className="text-[#18191c] font-bold">{avg.toFixed(1)}{activeCfg.unit}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/70 border border-black/[0.05] shadow-sm">
                  <TrendingUp className="w-3 h-3 text-emerald-600" />
                  <span className="text-[#797a82]">Max:</span>
                  <span className="text-emerald-700 font-bold">{mx.toFixed(1)}{activeCfg.unit}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/70 border border-black/[0.05] shadow-sm">
                  <TrendingDown className="w-3 h-3 text-blue-600" />
                  <span className="text-[#797a82]">Min:</span>
                  <span className="text-blue-700 font-bold">{mn.toFixed(1)}{activeCfg.unit}</span>
                </div>
                {selectedMetric === "temperature" && avgB > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/70 border border-black/[0.05] shadow-sm">
                    <span className="text-amber-600 font-bold">BMP180:</span>
                    <span className="text-[#18191c] font-bold">{avgB.toFixed(1)}°C</span>
                  </div>
                )}
              </div>
            </div>

            {/* Range Selector */}
            <div className="clay-pill-bar flex items-center gap-1 self-start sm:self-auto">
              {([1, 6, 12, 24] as Range[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold transition-all select-none font-mono",
                    range === r
                      ? "bg-[#18191c] text-white shadow-sm"
                      : "text-[#6c6e75] hover:text-[#18191c]"
                  )}
                >
                  {r}H
                </button>
              ))}
            </div>
          </div>

          {/* Chart Rendering with Live Floating Tactile Glass Badge */}
          <div className="relative h-80 w-full pt-2">
            
            {/* Live Floating Badge */}
            {rawLiveVal != null && (
              <div className="absolute top-4 left-[38%] z-20 pointer-events-none hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-white/95 border border-black/[0.08] shadow-lg backdrop-blur-md">
                <div
                  className="w-2.5 h-2.5 rounded-full animate-ping shrink-0"
                  style={{ background: activeCfg.color }}
                />
                <div>
                  <p className="text-xs font-extrabold text-[#18191c] leading-none">
                    {Number(rawLiveVal).toFixed(1)}{activeCfg.unit}
                  </p>
                  <p className="text-[9px] text-[#797a82] font-semibold mt-0.5">
                    {activeCfg.label} (Live Telemetry)
                  </p>
                </div>
              </div>
            )}

            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-[#797a82] font-mono">
                Awaiting time-series sync records for the selected {range}H window ({NODE_LABELS[selectedNode]})...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {selectedMetric === "temperature" ? (
                  <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="dhtGradSensors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ff7a00" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#ff7a00" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="bmpGradSensors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d97706" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#d97706" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                    <XAxis dataKey="time" stroke="#9d9ca4" fontSize={10} tickLine={false} axisLine={{ stroke: "rgba(0,0,0,0.06)" }} />
                    <YAxis
                      stroke="#9d9ca4"
                      fontSize={10}
                      domain={[
                        (dataMin: number) => (!isFinite(dataMin) || isNaN(dataMin) ? 0 : Math.floor(Math.max(-20, dataMin - 1.5))),
                        (dataMax: number) => (!isFinite(dataMax) || isNaN(dataMax) ? 50 : Math.ceil(dataMax + 1.5))
                      ]}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip unit="°C" color="#ff7a00" />} />
                    <Area type="monotone" dataKey="temperature" name="DHT11" stroke="#ff7a00" strokeWidth={3} fill="url(#dhtGradSensors)" dot={{ fill: "#ff7a00", r: 3, strokeWidth: 2, stroke: "#ffffff" }} activeDot={{ r: 6, fill: "#ff7a00", stroke: "#ffffff", strokeWidth: 2 }} />
                    <Line type="monotone" dataKey="temperatureBMP" name="BMP180" stroke="#d97706" strokeWidth={2} dot={false} />
                  </ComposedChart>
                ) : (
                  <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="metricGradSensors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={activeCfg.color} stopOpacity={0.25} />
                        <stop offset="100%" stopColor={activeCfg.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />
                    <XAxis dataKey="time" stroke="#9d9ca4" fontSize={10} tickLine={false} axisLine={{ stroke: "rgba(0,0,0,0.06)" }} />
                    <YAxis
                      stroke="#9d9ca4"
                      fontSize={10}
                      domain={[
                        (dataMin: number) => {
                          if (!isFinite(dataMin) || isNaN(dataMin)) return 0;
                          if (selectedMetric === "humidity") return Math.max(0, Math.floor(dataMin - 5));
                          if (selectedMetric === "pressure") return Math.floor(dataMin - 2);
                          if (selectedMetric === "waterLevel") return 0;
                          if (selectedMetric === "gas") return Math.max(0, Math.floor(dataMin - 10));
                          if (selectedMetric === "batteryPercent") return Math.max(0, Math.floor(dataMin - 5));
                          return Math.max(0, Math.floor(dataMin - 5));
                        },
                        (dataMax: number) => {
                          if (!isFinite(dataMax) || isNaN(dataMax)) return 100;
                          if (selectedMetric === "humidity") return Math.min(100, Math.ceil(dataMax + 5));
                          if (selectedMetric === "pressure") return Math.ceil(dataMax + 2);
                          if (selectedMetric === "waterLevel") return Math.ceil(dataMax + 10);
                          if (selectedMetric === "gas") return Math.ceil(dataMax + 20);
                          if (selectedMetric === "batteryPercent") return Math.min(100, Math.ceil(dataMax + 5));
                          return Math.ceil(dataMax + 10);
                        }
                      ]}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip unit={activeCfg.unit} color={activeCfg.color} />} />
                    <Area type="monotone" dataKey={selectedMetric} name={activeCfg.label} stroke={activeCfg.color} strokeWidth={3} fill="url(#metricGradSensors)" dot={{ fill: activeCfg.color, r: 3, strokeWidth: 2, stroke: "#ffffff" }} activeDot={{ r: 6, fill: activeCfg.color, stroke: "#ffffff", strokeWidth: 2 }} />
                  </ComposedChart>
                )}
              </ResponsiveContainer>
            )}
          </div>

          {/* ── Real Live Sensor Metric Tiles Underneath (Rounded & Clean) ── */}
          <div className="pt-4 border-t border-black/[0.05] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-2xl bg-white/70 border border-black/[0.04] shadow-sm">
              <div className="flex items-center justify-between text-[#797a82]">
                <p className="text-[10px] uppercase font-bold font-mono">Temp (DHT11)</p>
                <Thermometer className="w-3.5 h-3.5 text-[#ff7a00]" />
              </div>
              <p className="text-lg font-extrabold text-[#18191c] mt-1">
                {activeLive?.temperature != null ? `${Number(activeLive.temperature).toFixed(1)}°C` : "—"}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/70 border border-black/[0.04] shadow-sm">
              <div className="flex items-center justify-between text-[#797a82]">
                <p className="text-[10px] uppercase font-bold font-mono">Humidity</p>
                <Droplets className="w-3.5 h-3.5 text-[#0284c7]" />
              </div>
              <p className="text-lg font-extrabold text-[#18191c] mt-1">
                {activeLive?.humidity != null ? `${Number(activeLive.humidity).toFixed(0)}%` : "—"}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/70 border border-black/[0.04] shadow-sm">
              <div className="flex items-center justify-between text-[#797a82]">
                <p className="text-[10px] uppercase font-bold font-mono">Gas / Air</p>
                <Wind className="w-3.5 h-3.5 text-[#16a34a]" />
              </div>
              <p className="text-lg font-extrabold text-[#18191c] mt-1">
                {activeLive?.gas != null ? `${Number(activeLive.gas).toFixed(0)} PPM` : "—"}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/70 border border-black/[0.04] shadow-sm">
              <div className="flex items-center justify-between text-[#797a82]">
                <p className="text-[10px] uppercase font-bold font-mono">Water Depth</p>
                <Waves className="w-3.5 h-3.5 text-[#6366f1]" />
              </div>
              <p className="text-lg font-extrabold text-[#18191c] mt-1">
                {activeLive?.WaterLevel != null ? `${Number(activeLive.WaterLevel).toFixed(0)} cm` : "—"}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/70 border border-black/[0.04] shadow-sm">
              <div className="flex items-center justify-between text-[#797a82]">
                <p className="text-[10px] uppercase font-bold font-mono">Barometer</p>
                <Gauge className="w-3.5 h-3.5 text-[#d97706]" />
              </div>
              <p className="text-lg font-extrabold text-[#18191c] mt-1">
                {activeLive?.pressure != null ? `${Number(activeLive.pressure).toFixed(0)} hPa` : "—"}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/70 border border-black/[0.04] shadow-sm">
              <div className="flex items-center justify-between text-[#797a82]">
                <p className="text-[10px] uppercase font-bold font-mono">Battery</p>
                <BatteryCharging className="w-3.5 h-3.5 text-[#15803d]" />
              </div>
              <p className="text-lg font-extrabold text-[#18191c] mt-1">
                {activeLive?.batteryPercent != null ? `${Number(activeLive.batteryPercent).toFixed(0)}%` : "—"}
              </p>
            </div>
          </div>

        </div>

      </div>
    </Layout>
  );
}