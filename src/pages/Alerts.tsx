import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { onValue, ref } from "firebase/database";
import { database } from "@/lib/firebase";
import {
  Info, Zap, DoorOpen, Wind, BatteryLow, Flame,
  CloudSun, Droplets, Bell, ShieldAlert, CheckCircle2
} from "lucide-react";
import { AlertsSkeleton } from "@/components/skeletons/AlertsSkeleton";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────
interface Alert {
  id: string;
  alert_type: string;
  message: string;
  severity: "info" | "warning" | "error" | "critical";
  sensor_value: number | null;
  timestamp: number;
}

const TYPE_CFG: Record<string, { icon: React.ElementType; label: string; dot: string }> = {
  GAS: { icon: Wind, label: "Gas Leakage", dot: "bg-emerald-400" },
  DOOR: { icon: DoorOpen, label: "Door Perimeter", dot: "bg-sky-400" },
  POWER: { icon: Zap, label: "Power Grid", dot: "bg-amber-400" },
  BATT: { icon: BatteryLow, label: "Battery Level", dot: "bg-orange-400" },
  IGNITION: { icon: Flame, label: "Ignition Event", dot: "bg-red-400" },
  HUMIDITY: { icon: Droplets, label: "Humidity", dot: "bg-cyan-400" },
  WEATHER: { icon: CloudSun, label: "Weather Trend", dot: "bg-indigo-400" },
  INFO: { icon: Info, label: "System Info", dot: "bg-zinc-400" },
};

const SEVERITY_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: "bg-red-500/10 border-red-500/20", text: "text-red-400", label: "Critical" },
  error: { bg: "bg-red-500/10 border-red-500/20", text: "text-red-400", label: "Error" },
  warning: { bg: "bg-amber-500/10 border-amber-500/20", text: "text-amber-400", label: "Warning" },
  info: { bg: "bg-zinc-800/80 border-zinc-700/60", text: "text-zinc-400", label: "Info" },
};

function formatTimestamp(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return { time, date: isToday ? "Today" : d.toLocaleDateString() };
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    const r = ref(database, "home/room1/alerts/logs");
    return onValue(r, (snap) => {
      if (snap.exists()) {
        const list = Object.entries(snap.val())
          .map(([id, val]: any) => ({ id, ...val }))
          .sort((a: any, b: any) => b.timestamp - a.timestamp);
        setAlerts(list as Alert[]);
      } else {
        setAlerts([]);
      }
      setLoading(false);
    });
  }, []);

  const counts = alerts.reduce((acc, a) => {
    const k = a.alert_type?.toUpperCase() ?? "INFO";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filtered = filter === "ALL"
    ? alerts
    : alerts.filter((a) => (a.alert_type?.toUpperCase() ?? "INFO") === filter);

  const filterTypes = ["ALL", "GAS", "DOOR", "POWER", "BATT", "IGNITION", "HUMIDITY", "WEATHER"];

  if (loading) return <AlertsSkeleton />;

  return (
    <Layout>
      <div className="space-y-6 pb-12 max-w-7xl">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">System Alerts & Event Logs</h1>
            <p className="text-xs text-zinc-400 mt-0.5">
              Diagnostic audit trail from hardware sensors and cloud triggers
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-500 bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800">
              {alerts.length} total events logged
            </span>
          </div>
        </div>

        {/* ── Category Filter Pills ── */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filterTypes.map((t) => {
            const count = t === "ALL" ? alerts.length : counts[t] ?? 0;
            const isSelected = filter === t;

            return (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 select-none",
                  isSelected
                    ? "bg-white text-black shadow-sm"
                    : "bg-black border border-white/12 text-neutral-400 hover:text-white hover:border-white/30"
                )}
              >
                <span>{t}</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-mono",
                  isSelected ? "bg-black text-white font-bold" : "bg-neutral-900 text-neutral-400"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Event Timeline List ── */}
        <div className="space-y-2.5">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-white/12 bg-black p-12 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-bold text-white">No alerts found</p>
              <p className="text-xs text-neutral-400">No telemetry events match the selected category filter.</p>
            </div>
          ) : (
            filtered.map((alert) => {
              const typeCfg = TYPE_CFG[alert.alert_type?.toUpperCase()] ?? TYPE_CFG.INFO;
              const sev = SEVERITY_BADGE[alert.severity?.toLowerCase()] ?? SEVERITY_BADGE.info;
              const { time, date } = formatTimestamp(alert.timestamp);

              return (
                <div
                  key={alert.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-white/12 bg-black hover:border-white/25 transition-all gap-3 shadow-sm"
                >
                  {/* Left: Icon + Type + Message */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-white/10 flex items-center justify-center shrink-0 text-white">
                      <typeCfg.icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-white">{typeCfg.label}</span>
                        <span className={cn("text-[10px] px-2 py-0.2 rounded-full border font-semibold", sev.bg, sev.text)}>
                          {sev.label}
                        </span>
                        {alert.sensor_value !== null && alert.sensor_value !== undefined && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-900 border border-white/10 font-mono text-white">
                            val: {alert.sensor_value}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed truncate">{alert.message}</p>
                    </div>
                  </div>

                  {/* Right: Timestamp */}
                  <div className="sm:text-right shrink-0 text-xs font-mono text-neutral-400 pl-12 sm:pl-0">
                    <div className="text-white font-semibold">{time}</div>
                    <div className="text-[10px] text-neutral-500">{date}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </Layout>
  );
}
