import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { cn, parseNodeTimestampToMs } from "@/lib/utils";
import {
  Thermometer, Droplets, Wind, Gauge, Waves,
  CloudRain, PersonStanding, DoorOpen, Database,
  Zap, BatteryCharging, Cpu, WifiOff,
  TrendingUp, TrendingDown, Minus, Activity, Radio,
  RefreshCw, Filter, Plus, Server, Terminal, Settings,
  Play, RotateCcw, Trash2, ChevronRight, CheckCircle2,
  Clock, ShieldCheck, MessageSquare, Flame, Check, Sparkles,
  Lightbulb, Fan, Lock, LockOpen, Tv, Refrigerator, ToggleLeft,
  Wifi, Sun, Moon, AlertTriangle, ShieldAlert
} from "lucide-react";
import { useSensorData } from "@/hooks/useSensorData";
import { firebaseService, ControlData, NodeStatusData, WeatherData, database } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import { BarcodeSparkline } from "@/components/ui/BarcodeSparkline";
import { GaugeArc } from "@/components/ui/GaugeArc";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area
} from "recharts";
import { toast } from "sonner";
import { sounds } from "@/lib/sounds";
import { haptic } from "@/lib/haptic";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// ── Types ─────────────────────────────────────────────────────
interface DashboardData {
  temp: number; tempBMP: number; humidity: number; pressure: number; gas: number;
  rain: string; waterLevel: number; motion: string; door: number;
  power?: number; last_update?: string;
  batteryVolt?: number; batteryPercent?: number;
}

interface HistoryPoint {
  timestamp: number;
  temperature: number;
  temperatureBMP: number;
  humidity: number;
  gas: number;
  pressure: number;
  waterLevel: number;
  batteryPercent: number;
  time: string;
}

interface RealAlertItem {
  id: string;
  alert_type: string;
  message: string;
  severity: string;
  sensor_value?: number | null;
  timestamp: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { sensorData: live, loading, error } = useSensorData();
  const [controls, setControls] = useState<ControlData>({} as ControlData);
  const [sensorOnline, setSensorOnline] = useState(false);
  const [syncAge, setSyncAge] = useState("—");
  const [weather, setWeather] = useState<WeatherData | null>(null);

  // Real Node Statuses from Firebase
  const [room1Status, setRoom1Status] = useState<NodeStatusData | null>(null);
  const [room2Status, setRoom2Status] = useState<NodeStatusData | null>(null);
  const [commonStatus, setCommonStatus] = useState<NodeStatusData | null>(null);

  // Real 24h Timeseries History from Firebase
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [chartMetric, setChartMetric] = useState<"temperature" | "humidity" | "gas" | "waterLevel" | "pressure">("temperature");
  const [chartNode, setChartNode] = useState<"room1" | "room2" | "room3">("room1");
  const [chartRange, setChartRange] = useState<1 | 6 | 12 | 24>(24);

  // Real Alerts from Firebase
  const [alerts, setAlerts] = useState<RealAlertItem[]>([]);
  const [alertFilter, setAlertFilter] = useState<string>("ALL");

  // Listen to Controls
  useEffect(() => {
    const unsub = firebaseService.listenToControlStates(setControls);
    return () => unsub();
  }, []);

  // Listen to Weather
  useEffect(() => firebaseService.listenToWeather(setWeather), []);

  // Listen to Node Statuses
  useEffect(() => {
    const unsub1 = firebaseService.listenToRoom1Status(setRoom1Status);
    const unsub2 = firebaseService.listenToRoom2Status(setRoom2Status);
    const unsubCommon = firebaseService.listenToCommonAreaStatus(setCommonStatus);
    return () => {
      unsub1();
      unsub2();
      unsubCommon();
    };
  }, []);

  // Listen to Timeseries History from Firebase with physical range sanitization & sliding time window
  useEffect(() => {
    const histRef = ref(database, `home/${chartNode}/history/h24`);
    const unsub = onValue(histRef, (snapshot) => {
      if (!snapshot.exists()) {
        setHistory([]);
        return;
      }
      const data = snapshot.val() as Record<string, any>;
      const cutoff = Date.now() - chartRange * 3600 * 1000;
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

          return {
            timestamp: ts,
            // Validate against physical sensor bounds so corrupted analog ADC / invalid packets don't skew the chart
            temperature: t != null && t >= -20 && t <= 80 ? t : 0,
            temperatureBMP: tb != null && tb >= -20 && tb <= 80 ? tb : 0,
            humidity: h != null && h >= 0 && h <= 100 ? h : 0,
            gas: g != null && g >= 0 && g <= 10000 ? g : 0,
            pressure: p != null && p >= 700 && p <= 1300 ? p : 0,
            waterLevel: w != null && w >= 0 && w <= 500 ? w : 0,
            batteryPercent: bp != null && bp >= 0 && bp <= 100 ? bp : 0,
            time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }),
          };
        })
        .filter((pt) => pt.timestamp >= cutoff && (pt.temperature > 0 || pt.humidity > 0 || pt.gas > 0 || pt.pressure > 0))
        .sort((a, b) => a.timestamp - b.timestamp);
      setHistory(points);
    });
    return () => unsub();
  }, [chartNode, chartRange]);

  // Listen to Alerts from Firebase
  useEffect(() => {
    const r = ref(database, "home/room1/alerts/logs");
    return onValue(r, (snap) => {
      if (snap.exists()) {
        const list = Object.entries(snap.val())
          .map(([id, val]: any) => ({ id, ...val }))
          .sort((a: any, b: any) => b.timestamp - a.timestamp);
        setAlerts(list as RealAlertItem[]);
      } else {
        setAlerts([]);
      }
    });
  }, []);

  // Real Data Gauge & Telemetry Helpers
  const formatUptime = (seconds?: number | null): string => {
    if (seconds == null || isNaN(seconds) || seconds <= 0) return "—";
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${(seconds / 3600).toFixed(1)}h`;
    return `${(seconds / 86400).toFixed(1)}d`;
  };

  const getUptimePercent = (seconds?: number | null): number => {
    if (seconds == null || isNaN(seconds) || seconds <= 0) return 0;
    return Math.min(100, Math.max(10, Math.round((seconds / 86400) * 100)));
  };

  const getHeapPercent = (freeHeap?: number | null): number => {
    if (freeHeap == null || isNaN(freeHeap) || freeHeap <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((freeHeap / (320 * 1024)) * 100)));
  };

  const getWifiPercent = (rssi?: number | null): number => {
    if (rssi == null || isNaN(rssi)) return 0;
    return Math.min(100, Math.max(0, 2 * (rssi + 100)));
  };

  const getTempPercent = (temp?: number | null): number => {
    if (temp == null || isNaN(temp)) return 0;
    return Math.min(100, Math.max(0, Math.round((temp / 60) * 100)));
  };

  // Pure Real Live Sensor Telemetry (Null when not reported)
  const rawTemp = live?.temperature != null && !isNaN(live.temperature) && live.temperature >= -20 && live.temperature <= 80 ? live.temperature : null;
  const rawTempBMP = live?.temperatureBMP != null && !isNaN(live.temperatureBMP) && live.temperatureBMP >= -20 && live.temperatureBMP <= 80 ? live.temperatureBMP : null;
  const rawHumidity = live?.humidity != null && !isNaN(live.humidity) && live.humidity >= 0 && live.humidity <= 100 ? live.humidity : null;
  const rawGas = live?.gas != null && !isNaN(live.gas) && live.gas >= 0 ? live.gas : null;
  const rawPressure = live?.pressure != null && !isNaN(live.pressure) && live.pressure >= 700 && live.pressure <= 1300 ? live.pressure : null;
  const rawWaterLevel = live?.WaterLevel != null && !isNaN(live.WaterLevel) && live.WaterLevel >= 0 ? live.WaterLevel : null;
  const rawBatteryVolt = live?.batteryVoltage != null && !isNaN(live.batteryVoltage) && live.batteryVoltage >= 0
    ? live.batteryVoltage
    : (live?.batteryVolt != null && !isNaN(live.batteryVolt) && live.batteryVolt >= 0 ? live.batteryVolt : null);
  const rawBatteryPercent = live?.batteryPercent != null && !isNaN(live.batteryPercent) && live.batteryPercent >= 0 && live.batteryPercent <= 100 ? live.batteryPercent : null;
  const power = live?.power;
  const door = live?.door;

  const d: DashboardData = {
    temp: rawTemp ?? 0,
    tempBMP: rawTempBMP ?? 0,
    humidity: rawHumidity ?? 0,
    gas: rawGas ?? 0,
    pressure: rawPressure ?? 0,
    rain: live?.rain ? "Detected" : "Clear",
    waterLevel: rawWaterLevel ?? 0,
    motion: live?.motion ? "Detected" : "Clear",
    door: door ?? 0,
    last_update: live?.last_update,
    batteryVolt: rawBatteryVolt ?? 0,
    batteryPercent: rawBatteryPercent ?? 0,
  };

  // Online check
  useEffect(() => {
    const tick = () => {
      const lastMs = parseNodeTimestampToMs(d.last_update);
      if (!lastMs) { setSensorOnline(false); setSyncAge("—"); return; }
      const diff = Date.now() - lastMs;
      setSensorOnline(diff >= -5000 && diff <= 60_000);
      const s = Math.max(0, Math.floor(diff / 1000));
      setSyncAge(s < 60 ? `${s}s ago` : s < 3600 ? `${Math.floor(s / 60)}m ago` : `${Math.floor(s / 3600)}h ago`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [d.last_update]);

  // Calculate Real Metrics: Active Appliances count
  const allSwitchKeys: (keyof ControlData)[] = [
    "room1Light", "room1Switch", "room1Fan",
    "room2Light", "room2Switch", "room2Fan",
    "room3Light", "room3Switch", "room3Fan",
    "lobbyLight", "lobbyFan", "lobbyTV", "refrigerator",
    "relay1", "relay2", "relay3", "relay4",
  ];
  const activeAppliancesCount = allSwitchKeys.filter((k) => !!controls[k]).length;
  const totalAppliances = allSwitchKeys.length;

  // Node online calculations
  const isNode1Online = (() => {
    const ts = room1Status?.serverTimestamp ?? room1Status?.lastSeenEpoch ?? room1Status?.timestamp ?? room1Status?.lastSeen;
    const ms = parseNodeTimestampToMs(ts);
    if (!ms) return sensorOnline;
    const diff = Date.now() - ms;
    return diff >= -5000 && diff <= 60_000;
  })();

  const isNode2Online = (() => {
    const ts = room2Status?.serverTimestamp ?? room2Status?.lastSeenEpoch ?? room2Status?.timestamp ?? room2Status?.lastSeen;
    const ms = parseNodeTimestampToMs(ts);
    if (!ms) return false;
    const diff = Date.now() - ms;
    return diff >= -5000 && diff <= 60_000;
  })();

  const onlineNodesCount = (isNode1Online ? 1 : 0) + (isNode2Online ? 1 : 0) + (commonStatus ? 1 : 0);

  // Toggle quick appliance from dashboard
  const handleToggle = async (key: keyof ControlData) => {
    haptic.tick();
    sounds.click();
    const currentVal = !!controls[key];
    const nextVal = !currentVal;
    await firebaseService.updateSwitchState(key, nextVal);
    toast.success(`${key} ${nextVal ? "turned ON" : "turned OFF"}`);
  };

  // Toggle night mode
  const toggleNightMode = async () => {
    haptic.medium();
    const isNight = !!controls.nightMode;
    if (isNight) {
      await firebaseService.updateMultipleSwitches({ nightMode: false, lock: false, motion: false });
      sounds.success();
      toast.success("Day Mode Active ☀️");
    } else {
      await firebaseService.updateMultipleSwitches({ nightMode: true, lock: true, motion: true });
      sounds.success();
      toast.success("Night Mode Armed 🌙", { description: "Perimeter locked & motion sensors armed" });
    }
  };

  // Node Names Mapping
  const NODE_NAMES: Record<string, string> = {
    room1: "Room 1 ESP32 Hub",
    room2: "Room 2 Subnode",
    room3: "Room 3 Subnode",
  };

  // Filter history points specifically for active metric so unrecorded/0 values don't plummet the line to 0
  const activeMetricPoints = history.filter((pt) => {
    if (chartMetric === "temperature") return pt.temperature > 0;
    if (chartMetric === "humidity") return pt.humidity > 0;
    if (chartMetric === "gas") return pt.gas >= 0;
    if (chartMetric === "waterLevel") return pt.waterLevel >= 0;
    if (chartMetric === "pressure") return pt.pressure >= 700;
    return true;
  });

  // Prepare chart dataset (use only real history points, plus current live point if available)
  const chartData: HistoryPoint[] = activeMetricPoints.length > 0
    ? (
      rawTemp != null
        ? [
          ...activeMetricPoints,
          {
            timestamp: Date.now(),
            time: "Now",
            temperature: rawTemp,
            temperatureBMP: rawTempBMP ?? rawTemp,
            humidity: rawHumidity ?? 0,
            gas: rawGas ?? 0,
            pressure: rawPressure ?? 0,
            waterLevel: rawWaterLevel ?? 0,
            batteryPercent: rawBatteryPercent ?? 0,
          },
        ]
        : activeMetricPoints
    )
    : (
      rawTemp != null
        ? [
          {
            timestamp: Date.now(),
            time: "Live",
            temperature: rawTemp,
            temperatureBMP: rawTempBMP ?? rawTemp,
            humidity: rawHumidity ?? 0,
            gas: rawGas ?? 0,
            pressure: rawPressure ?? 0,
            waterLevel: rawWaterLevel ?? 0,
            batteryPercent: rawBatteryPercent ?? 0,
          },
        ]
        : []
    );

  // Metric configs for chart
  const METRIC_CONFIGS = {
    temperature: { name: "Temperature", unit: "°C", color: "#ff7a00", key: "temperature" },
    humidity: { name: "Humidity", unit: "%", color: "#0284c7", key: "humidity" },
    gas: { name: "Air Quality", unit: " PPM", color: "#16a34a", key: "gas" },
    waterLevel: { name: "Water Tank Depth", unit: " cm", color: "#6366f1", key: "waterLevel" },
    pressure: { name: "Atmospheric Pressure", unit: " hPa", color: "#d97706", key: "pressure" },
  };

  const activeMetricCfg = METRIC_CONFIGS[chartMetric];

  // Filter alerts
  const filteredAlerts = alertFilter === "ALL"
    ? alerts
    : alerts.filter((a) => (a.alert_type?.toUpperCase() ?? "INFO") === alertFilter);

  return (
    <Layout>
      <div className="space-y-6 pb-12 max-w-[1440px] mx-auto">

        {/* ── COMMAND CENTER HERO HEADER ── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-2">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#18191c]">
                Dashboard
              </h1>
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono",
                sensorOnline ? "badge-running" : "badge-warning"
              )}>
                {sensorOnline ? "Live Streaming" : "Node Standby"}
              </span>
            </div>
            <p className="text-xs text-[#797a82] mt-1 flex items-center gap-2">
              <span>Dual-Sensor Mesh Hub</span>
              <span>·</span>
              <span className="font-mono text-[#55565d]">Last update: {syncAge}</span>
              <span>·</span>
              <span className="font-semibold text-[#18191c]">
                {weather?.prediction || (rawPressure != null ? `${rawPressure.toFixed(0)} hPa · ${rawPressure >= 1013 ? "Fair Weather" : "Unsettled"}` : "Barometer Syncing")}
              </span>
            </p>
          </div>

          {/* Action Pills */}
          <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
            <button
              onClick={() => {
                haptic.tick();
                sounds.click();
                window.location.reload();
              }}
              className="clay-btn flex items-center gap-2 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#55565d]" />
              <span>Refresh</span>
            </button>

            <button
              onClick={toggleNightMode}
              className={cn(
                "flex items-center gap-2 text-xs transition-all",
                controls.nightMode ? "clay-btn-dark font-bold" : "clay-btn font-medium"
              )}
            >
              {controls.nightMode ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-amber-300" />
                  <span>Night Mode (Active)</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Day Mode</span>
                </>
              )}
            </button>

            <button
              onClick={() => navigate("/devices")}
              className="clay-btn-dark flex items-center gap-2 text-xs"
            >
              <Zap className="w-4 h-4 text-white" />
              <span>Device Controls</span>
            </button>
          </div>
        </div>

        {/* ── 8 LIVE SENSOR TELEMETRY CARDS (UPPER ROW) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">

          {/* 1. Temp (DHT11) */}
          <div
            onClick={() => navigate("/sensors")}
            className="clay-card p-4 space-y-2 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#797a82] font-mono">
                Temp (DHT11)
              </span>
              <Thermometer className="w-3.5 h-3.5 text-[#ff7a00]" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-[#18191c] font-mono tracking-tight">
              {rawTemp != null ? `${rawTemp.toFixed(1)}°C` : "—"}
            </p>
          </div>

          {/* 2. Temp (BMP180) */}
          <div
            onClick={() => navigate("/sensors")}
            className="clay-card p-4 space-y-2 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#797a82] font-mono">
                Temp (BMP180)
              </span>
              <Flame className="w-3.5 h-3.5 text-[#ea580c]" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-[#18191c] font-mono tracking-tight">
              {rawTempBMP != null ? `${rawTempBMP.toFixed(1)}°C` : "—"}
            </p>
          </div>

          {/* 3. Humidity */}
          <div
            onClick={() => navigate("/sensors")}
            className="clay-card p-4 space-y-2 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#797a82] font-mono">
                Humidity
              </span>
              <Droplets className="w-3.5 h-3.5 text-[#0284c7]" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-[#18191c] font-mono tracking-tight">
              {rawHumidity != null ? `${rawHumidity.toFixed(0)}%` : "—"}
            </p>
          </div>

          {/* 4. Barometric Pressure */}
          <div
            onClick={() => navigate("/sensors")}
            className="clay-card p-4 space-y-2 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#797a82] font-mono">
                Pressure
              </span>
              <Gauge className="w-3.5 h-3.5 text-[#8b5cf6]" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-[#18191c] font-mono tracking-tight">
              {rawPressure != null ? `${rawPressure.toFixed(1)} hPa` : "—"}
            </p>
          </div>

          {/* 5. Gas / Air Quality */}
          <div
            onClick={() => navigate("/sensors")}
            className="clay-card p-4 space-y-2 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#797a82] font-mono">
                Gas / Air
              </span>
              <Wind className="w-3.5 h-3.5 text-[#16a34a]" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-[#18191c] font-mono tracking-tight">
              {rawGas != null ? `${rawGas.toFixed(0)} PPM` : "—"}
            </p>
          </div>

          {/* 6. Perimeter Door Reed Switch */}
          <div
            onClick={() => navigate("/security")}
            className="clay-card p-4 space-y-2 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#797a82] font-mono">
                Door Perimeter
              </span>
              {door === 1 ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <DoorOpen className="w-3.5 h-3.5 text-red-500" />
              )}
            </div>
            <p className="text-lg sm:text-xl font-extrabold text-[#18191c] flex items-center gap-2">
              <span className={cn("w-2 h-2 rounded-full", door === 1 ? "bg-emerald-500" : "bg-red-500 animate-pulse")} />
              <span>{door !== undefined ? (door === 1 ? "Closed" : "Open") : "—"}</span>
            </p>
          </div>

          {/* 7. AC Mains Power Grid */}
          <div
            onClick={() => navigate("/sensors")}
            className="clay-card p-4 space-y-2 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#797a82] font-mono">
                AC Mains Power
              </span>
              <Zap className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <p className="text-lg sm:text-xl font-extrabold text-[#18191c] flex items-center gap-2">
              <span className={cn("w-2 h-2 rounded-full", power === 1 ? "bg-emerald-500" : "bg-amber-500")} />
              <span>{power !== undefined ? (power === 1 ? "230V Active" : "Inverter Mode") : "—"}</span>
            </p>
          </div>

          {/* 8. Battery Backup & Voltage */}
          <div
            onClick={() => navigate("/sensors")}
            className="clay-card p-4 space-y-2 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#797a82] font-mono">
                Battery & Bus
              </span>
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <p className="text-xl sm:text-2xl font-extrabold text-[#18191c] font-mono tracking-tight">
              {rawBatteryPercent != null ? `${rawBatteryPercent}%` : "—"}{" "}
              <span className="text-xs sm:text-sm font-semibold text-[#797a82]">
                {rawBatteryVolt != null ? `(${rawBatteryVolt.toFixed(2)}V)` : ""}
              </span>
            </p>
          </div>

        </div>

        {/* ── MIDDLE ROW: REAL TELEMETRY CHART & HARDWARE NODES STATUS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT 7-COLUMNS: REAL ENVIRONMENTAL TELEMETRY CHART */}
          <div className="lg:col-span-7 clay-card p-6 space-y-5 flex flex-col justify-between">

            {/* Chart Card Header & Control Selectors */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-[#18191c]">
                      Environmental & Telemetry Trends
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-[#18191c]/[0.06] text-[10px] font-mono font-bold text-[#18191c]">
                      Last {chartRange}H
                    </span>
                  </div>
                  <p className="text-[11px] text-[#797a82] mt-0.5">
                    Live timeseries records from {NODE_NAMES[chartNode]} ({chartData.length} samples)
                  </p>
                </div>

                {/* Right controls: Node Selector & Time Range Selector */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Node Selector */}
                  <div className="clay-pill-bar flex items-center gap-1 p-0.5">
                    {(["room1", "room2", "room3"] as const).map((nKey) => (
                      <button
                        key={nKey}
                        onClick={() => setChartNode(nKey)}
                        className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold transition-all select-none",
                          chartNode === nKey
                            ? "bg-[#18191c] text-white shadow-sm"
                            : "text-[#6c6e75] hover:text-[#18191c]"
                        )}
                      >
                        {nKey === "room1" ? "Room 1 (Hub)" : nKey === "room2" ? "Room 2" : "Room 3"}
                      </button>
                    ))}
                  </div>

                  {/* Time Range Selector */}
                  <div className="clay-pill-bar flex items-center gap-0.5 p-0.5">
                    {([1, 6, 12, 24] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setChartRange(r)}
                        className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-bold font-mono transition-all select-none",
                          chartRange === r
                            ? "bg-[#18191c] text-white shadow-sm"
                            : "text-[#6c6e75] hover:text-[#18191c]"
                        )}
                      >
                        {r}H
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Metric Selector Pills */}
              <div className="clay-pill-bar flex items-center gap-1 overflow-x-auto self-start max-w-full">
                {(Object.keys(METRIC_CONFIGS) as (keyof typeof METRIC_CONFIGS)[]).map((mKey) => (
                  <button
                    key={mKey}
                    onClick={() => setChartMetric(mKey)}
                    className={cn(
                      "px-3 py-1 rounded-full text-[11px] font-bold capitalize transition-all shrink-0 flex items-center gap-1.5 select-none",
                      chartMetric === mKey
                        ? "bg-[#18191c] text-white shadow-sm"
                        : "text-[#6c6e75] hover:text-[#18191c]"
                    )}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: METRIC_CONFIGS[mKey].color }}
                    />
                    <span>{mKey === "waterLevel" ? "Tank Depth" : mKey}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recharts Multi-line Smooth Chart with Live Floating Badge */}
            <div className="relative h-64 sm:h-72 w-full pt-4">

              {/* Floating Tactile Glass Badge for Real Current Value */}
              <div className="absolute top-2 left-[38%] z-20 pointer-events-none hidden sm:flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-white/95 border border-black/[0.08] shadow-lg backdrop-blur-md">
                <div
                  className="w-2.5 h-2.5 rounded-full animate-ping shrink-0"
                  style={{ background: activeMetricCfg.color }}
                />
                <div>
                  <p className="text-xs font-extrabold text-[#18191c] leading-none">
                    {chartMetric === "temperature" ? (rawTemp != null ? `${rawTemp.toFixed(1)}°C` : "—") :
                      chartMetric === "humidity" ? (rawHumidity != null ? `${rawHumidity.toFixed(0)}%` : "—") :
                        chartMetric === "gas" ? (rawGas != null ? `${rawGas.toFixed(0)} PPM` : "—") :
                          chartMetric === "waterLevel" ? (rawWaterLevel != null ? `${rawWaterLevel.toFixed(0)} cm` : "—") :
                            (rawPressure != null ? `${rawPressure.toFixed(0)} hPa` : "—")}
                  </p>
                  <p className="text-[9px] text-[#797a82] font-semibold mt-0.5">
                    {activeMetricCfg.name} (Live Telemetry)
                  </p>
                </div>
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={activeMetricCfg.color} stopOpacity={0.22} />
                      <stop offset="100%" stopColor={activeMetricCfg.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" vertical={false} />

                  <XAxis
                    dataKey="time"
                    stroke="#9d9ca4"
                    fontSize={10}
                    tickLine={false}
                    axisLine={{ stroke: "rgba(0,0,0,0.06)" }}
                  />

                  <YAxis
                    stroke="#9d9ca4"
                    fontSize={10}
                    domain={[
                      (dataMin: number) => {
                        if (!isFinite(dataMin) || isNaN(dataMin)) return 0;
                        if (chartMetric === "temperature") return Math.floor(Math.max(-20, dataMin - 1.5));
                        if (chartMetric === "humidity") return Math.max(0, Math.floor(dataMin - 5));
                        if (chartMetric === "pressure") return Math.floor(dataMin - 2);
                        if (chartMetric === "waterLevel") return 0;
                        if (chartMetric === "gas") return Math.max(0, Math.floor(dataMin - 10));
                        return Math.max(0, Math.floor(dataMin - 5));
                      },
                      (dataMax: number) => {
                        if (!isFinite(dataMax) || isNaN(dataMax)) return 100;
                        if (chartMetric === "temperature") return Math.ceil(dataMax + 1.5);
                        if (chartMetric === "humidity") return Math.min(100, Math.ceil(dataMax + 5));
                        if (chartMetric === "pressure") return Math.ceil(dataMax + 2);
                        if (chartMetric === "waterLevel") return Math.ceil(dataMax + 10);
                        if (chartMetric === "gas") return Math.ceil(dataMax + 20);
                        return Math.ceil(dataMax + 10);
                      }
                    ]}
                    tickLine={false}
                    axisLine={false}
                  />

                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="clay-card p-3 text-xs space-y-1 shadow-xl border border-black/[0.08]">
                          <p className="font-mono text-[10px] text-[#797a82]">{label}</p>
                          <div className="flex items-center gap-2 font-bold" style={{ color: activeMetricCfg.color }}>
                            <span className="w-2 h-2 rounded-full" style={{ background: activeMetricCfg.color }} />
                            <span>{activeMetricCfg.name}: {Number(payload[0]?.value).toFixed(1)}{activeMetricCfg.unit}</span>
                          </div>
                        </div>
                      );
                    }}
                  />

                  {/* Primary Area Curve */}
                  <Area
                    type="monotone"
                    dataKey={chartMetric}
                    stroke={activeMetricCfg.color}
                    strokeWidth={3}
                    fill="url(#activeGrad)"
                    dot={{ fill: activeMetricCfg.color, r: 3, strokeWidth: 2, stroke: "#ffffff" }}
                    activeDot={{ r: 6, fill: activeMetricCfg.color, stroke: "#ffffff", strokeWidth: 2 }}
                  />

                  {/* Secondary Sensor Curve if Temperature */}
                  {chartMetric === "temperature" && (
                    <Line
                      type="monotone"
                      dataKey="temperatureBMP"
                      name="BMP180"
                      stroke="#d97706"
                      strokeWidth={2}
                      dot={false}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

          </div>

          {/* RIGHT 5-COLUMNS: REAL HARDWARE ESP32 MESH STATUS */}
          <div className="lg:col-span-5 space-y-4">

            <div className="flex items-center justify-between px-1">
              <h2 className="text-base font-extrabold text-[#18191c]">Mesh Hardware Status</h2>
              <span className="text-xs font-mono font-bold text-[#797a82]">
                {onlineNodesCount} Node{onlineNodesCount === 1 ? "" : "s"} Active
              </span>
            </div>

            {/* Node 1: Master Gateway (Room 1 ESP32-C3) */}
            <div className="clay-card p-5 space-y-4">

              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#18191c]">
                    ESP32 Master Gateway · Room 1
                  </h3>
                  <p className="text-[11px] text-[#797a82] font-mono mt-0.5">
                    IP: {room1Status?.ip || "—"} · RSSI: {room1Status?.rssi != null ? `${room1Status.rssi} dBm` : "—"}
                  </p>
                </div>

                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono flex items-center gap-1.5",
                  isNode1Online ? "badge-running" : "badge-stopped"
                )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", isNode1Online ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
                  {isNode1Online ? "Online" : "Offline"}
                </span>
              </div>

              {/* 4 Real Gauge Arcs: Heap, Wi-Fi Signal, Node Uptime, Temperature */}
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2 pt-1 pb-2">
                <GaugeArc
                  value={room1Status?.freeHeap ? `${getHeapPercent(room1Status.freeHeap)}%` : "—"}
                  unit=""
                  label="Free Heap"
                  percentage={getHeapPercent(room1Status?.freeHeap)}
                  color="#16a34a"
                  size={64}
                />
                <GaugeArc
                  value={room1Status?.rssi != null ? `${getWifiPercent(room1Status.rssi)}%` : "—"}
                  unit=""
                  label="Wi-Fi Signal"
                  percentage={getWifiPercent(room1Status?.rssi)}
                  color="#0284c7"
                  size={64}
                />
                <GaugeArc
                  value={formatUptime(room1Status?.uptime)}
                  unit=""
                  label="Uptime"
                  percentage={getUptimePercent(room1Status?.uptime)}
                  color="#ff7a00"
                  size={64}
                />
                <GaugeArc
                  value={room1Status?.chipTempC != null ? `${room1Status.chipTempC.toFixed(1)}°C` : (rawTemp != null ? `${rawTemp.toFixed(1)}°C` : "—")}
                  unit=""
                  label="Temp"
                  percentage={getTempPercent(room1Status?.chipTempC ?? rawTemp)}
                  color="#ef4444"
                  size={64}
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-black/[0.05]">
                <button
                  onClick={() => {
                    haptic.tick();
                    sounds.click();
                    toast.success("Ping packet sent to Room 1 ESP32 gateway");
                  }}
                  className="clay-btn py-1.5 px-2 flex items-center justify-center gap-1.5 text-[11px]"
                >
                  <RotateCcw className="w-3 h-3 text-[#55565d]" />
                  <span>Ping</span>
                </button>

                <button
                  onClick={() => {
                    navigate("/devices");
                    haptic.tick();
                  }}
                  className="clay-btn py-1.5 px-2 flex items-center justify-center gap-1.5 text-[11px]"
                >
                  <Lightbulb className="w-3 h-3 text-[#55565d]" />
                  <span>Devices</span>
                </button>

                <button
                  onClick={() => {
                    navigate("/sensors");
                    haptic.tick();
                  }}
                  className="clay-btn py-1.5 px-2 flex items-center justify-center gap-1.5 text-[11px]"
                >
                  <Activity className="w-3 h-3 text-[#55565d]" />
                  <span>Sensors</span>
                </button>
              </div>

            </div>

            {/* Node 2: Sensor Node (Room 2 / Subnode) */}
            <div className="clay-card p-5 space-y-4">

              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#18191c]">
                    ESP32 Sensor Subnode · Room 2
                  </h3>
                  <p className="text-[11px] text-[#797a82] font-mono mt-0.5">
                    IP: {room2Status?.ip || "—"} · RSSI: {room2Status?.rssi != null ? `${room2Status.rssi} dBm` : "—"}
                  </p>
                </div>

                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono flex items-center gap-1.5",
                  isNode2Online ? "badge-running" : "badge-stopped"
                )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", isNode2Online ? "bg-emerald-500 animate-pulse" : "bg-red-500")} />
                  {isNode2Online ? "Online" : "Offline"}
                </span>
              </div>

              {/* 4 Real Gauge Arcs for Room 2: Heap, Wi-Fi Signal, Uptime, Temperature */}
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2 pt-1 pb-2">
                <GaugeArc
                  value={room2Status?.freeHeap ? `${getHeapPercent(room2Status.freeHeap)}%` : "—"}
                  unit=""
                  label="Free Heap"
                  percentage={getHeapPercent(room2Status?.freeHeap)}
                  color="#16a34a"
                  size={64}
                />
                <GaugeArc
                  value={room2Status?.rssi != null ? `${getWifiPercent(room2Status.rssi)}%` : "—"}
                  unit=""
                  label="Wi-Fi Signal"
                  percentage={getWifiPercent(room2Status?.rssi)}
                  color="#0284c7"
                  size={64}
                />
                <GaugeArc
                  value={formatUptime(room2Status?.uptime)}
                  unit=""
                  label="Uptime"
                  percentage={getUptimePercent(room2Status?.uptime)}
                  color="#ff7a00"
                  size={64}
                />
                <GaugeArc
                  value={room2Status?.chipTempC != null ? `${room2Status.chipTempC.toFixed(1)}°C` : "—"}
                  unit=""
                  label="Temp"
                  percentage={getTempPercent(room2Status?.chipTempC)}
                  color="#ef4444"
                  size={64}
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-black/[0.05]">
                <button
                  onClick={() => {
                    navigate("/devices");
                    haptic.tick();
                  }}
                  className="clay-btn py-1.5 px-2 flex items-center justify-center gap-1.5 text-[11px] bg-white font-bold"
                >
                  <Zap className="w-3 h-3 text-amber-600" />
                  <span>Actuate</span>
                </button>

                <button
                  onClick={() => {
                    navigate("/sensors");
                    haptic.tick();
                  }}
                  className="clay-btn py-1.5 px-2 flex items-center justify-center gap-1.5 text-[11px]"
                >
                  <Activity className="w-3 h-3 text-[#55565d]" />
                  <span>Sensors</span>
                </button>

                <button
                  onClick={() => {
                    navigate("/security");
                    haptic.tick();
                  }}
                  className="clay-btn py-1.5 px-2 flex items-center justify-center gap-1.5 text-[11px]"
                >
                  <ShieldCheck className="w-3 h-3 text-[#55565d]" />
                  <span>Security</span>
                </button>
              </div>

            </div>

          </div>

        </div>

        {/* ── BOTTOM ROW: REAL LIVE ALERTS & DIRECT APPLIANCE RELAYS ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT 6-COLUMNS: REAL LIVE SECURITY & TELEMETRY ALERTS */}
          <div className="lg:col-span-6 clay-card p-6 space-y-4">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-extrabold text-[#18191c]">Live Event & Alert Audit</h2>
                <p className="text-[11px] text-[#797a82]">Real-time hardware triggers and safety interlocks</p>
              </div>

              {/* Filter Pills */}
              <div className="clay-pill-bar flex items-center gap-1 self-start sm:self-auto">
                {["ALL", "GAS", "DOOR", "POWER", "IGNITION"].map((fKey) => (
                  <button
                    key={fKey}
                    onClick={() => setAlertFilter(fKey)}
                    className={cn(
                      "px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize transition-all",
                      alertFilter === fKey
                        ? "bg-[#18191c] text-white shadow-sm"
                        : "text-[#6c6e75] hover:text-[#18191c]"
                    )}
                  >
                    {fKey}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Real Alerts */}
            <div className="space-y-2.5 pt-1">
              {filteredAlerts.length === 0 ? (
                <div className="p-8 text-center space-y-2 rounded-2xl bg-white/50 border border-black/[0.04]">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                  <p className="text-xs font-bold text-[#18191c]">All systems nominal</p>
                  <p className="text-[11px] text-[#797a82]">No critical gas, door perimeter, or power faults recorded.</p>
                </div>
              ) : (
                filteredAlerts.slice(0, 5).map((a) => {
                  const date = new Date(a.timestamp);
                  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

                  return (
                    <div
                      key={a.id}
                      className="p-3.5 rounded-2xl bg-white/70 hover:bg-white border border-black/[0.05] transition-all flex items-center justify-between gap-3 shadow-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#edece8] border border-black/[0.05] flex items-center justify-center shrink-0 text-[#18191c]">
                          {a.alert_type === "GAS" ? <Wind className="w-4 h-4 text-emerald-600" /> :
                            a.alert_type === "DOOR" ? <DoorOpen className="w-4 h-4 text-sky-600" /> :
                              a.alert_type === "IGNITION" ? <Flame className="w-4 h-4 text-red-600" /> :
                                <AlertTriangle className="w-4 h-4 text-amber-600" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#18191c] truncate">{a.alert_type} Alert</p>
                          <p className="text-[10px] text-[#797a82] truncate">{a.message}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-mono text-[#797a82]">{timeStr}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold font-mono",
                          a.severity === "critical" || a.severity === "error" ? "badge-stopped" : "badge-warning"
                        )}>
                          • {a.severity}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

          {/* RIGHT 6-COLUMNS: REAL CONNECTED APPLIANCES & DIRECT TOGGLE RELAYS */}
          <div className="lg:col-span-6 clay-card p-6 space-y-4">

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-[#18191c]">Quick Appliance Controls</h2>
                <p className="text-[11px] text-[#797a82]">Directly toggle relays and smart appliances in real time</p>
              </div>
              <button
                onClick={() => navigate("/devices")}
                className="text-xs font-bold text-[#18191c] hover:underline flex items-center gap-1"
              >
                <span>All Devices</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Real Appliance Items with Smooth Tactile Switches */}
            <div className="space-y-3 pt-1">

              {/* Room 1 Ceiling Light */}
              <div className="p-3.5 rounded-2xl bg-white/70 border border-black/[0.05] flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shadow-inner transition-colors",
                    controls.room1Light ? "bg-[#18191c] text-white" : "bg-[#edece8] text-[#55565d]"
                  )}>
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#18191c]">Room 1 Ceiling Light</p>
                    <p className="text-[11px] text-[#797a82]">{controls.room1Light ? "Energized (ON)" : "Turned OFF"}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggle("room1Light")}
                  className={cn("clay-switch", controls.room1Light && "checked")}
                >
                  <span className="clay-switch-thumb" />
                </button>
              </div>

              {/* Room 1 Ceiling Fan */}
              <div className="p-3.5 rounded-2xl bg-white/70 border border-black/[0.05] flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shadow-inner transition-colors",
                    controls.room1Fan ? "bg-[#18191c] text-white" : "bg-[#edece8] text-[#55565d]"
                  )}>
                    <Fan className={cn("w-4 h-4", controls.room1Fan && "animate-spin [animation-duration:1.5s]")} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#18191c]">Room 1 Ceiling Fan</p>
                    <p className="text-[11px] text-[#797a82]">{controls.room1Fan ? `Speed ${(controls.room1FanSpeed as number) || 1} (Running)` : "Turned OFF"}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggle("room1Fan")}
                  className={cn("clay-switch", controls.room1Fan && "checked")}
                >
                  <span className="clay-switch-thumb" />
                </button>
              </div>

              {/* Lobby Light */}
              <div className="p-3.5 rounded-2xl bg-white/70 border border-black/[0.05] flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shadow-inner transition-colors",
                    controls.lobbyLight ? "bg-[#18191c] text-white" : "bg-[#edece8] text-[#55565d]"
                  )}>
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#18191c]">Lobby Main Light</p>
                    <p className="text-[11px] text-[#797a82]">{controls.lobbyLight ? "Energized (ON)" : "Turned OFF"}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggle("lobbyLight")}
                  className={cn("clay-switch", controls.lobbyLight && "checked")}
                >
                  <span className="clay-switch-thumb" />
                </button>
              </div>

              {/* Main Perimeter Door Lock */}
              <div className="p-3.5 rounded-2xl bg-white/70 border border-black/[0.05] flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shadow-inner transition-colors",
                    controls.lock ? "bg-[#18191c] text-white" : "bg-[#edece8] text-[#55565d]"
                  )}>
                    {controls.lock ? <Lock className="w-4 h-4 text-emerald-400" /> : <LockOpen className="w-4 h-4 text-[#55565d]" />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#18191c]">Main Perimeter Lock</p>
                    <p className="text-[11px] text-[#797a82]">{controls.lock ? "Locked 🔒" : "Unlocked 🔓"}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (role === "admin") {
                      handleToggle("lock");
                    } else {
                      navigate("/devices");
                    }
                  }}
                  className={cn("clay-switch", controls.lock && "checked")}
                >
                  <span className="clay-switch-thumb" />
                </button>
              </div>

            </div>

          </div>

        </div>

      </div>
    </Layout>
  );
}
