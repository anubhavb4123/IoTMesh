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

const TYPE_CFG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  GAS: { icon: Wind, label: "Gas Leakage", color: "#16a34a" },
  DOOR: { icon: DoorOpen, label: "Door Perimeter", color: "#0284c7" },
  POWER: { icon: Zap, label: "Power Grid", color: "#d97706" },
  BATT: { icon: BatteryLow, label: "Battery Level", color: "#ea580c" },
  IGNITION: { icon: Flame, label: "Ignition Event", color: "#dc2626" },
  HUMIDITY: { icon: Droplets, label: "Humidity", color: "#0891b2" },
  WEATHER: { icon: CloudSun, label: "Weather Trend", color: "#6366f1" },
  INFO: { icon: Info, label: "System Info", color: "#55565d" },
};

const SEVERITY_BADGE: Record<string, { badge: string; label: string }> = {
  critical: { badge: "badge-stopped", label: "Critical" },
  error: { badge: "badge-stopped", label: "Error" },
  warning: { badge: "badge-warning", label: "Warning" },
  info: { badge: "badge-running", label: "Info" },
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
      <div className="space-y-6 pb-12 max-w-[1440px] mx-auto">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#18191c]">
              System Alerts & Event Logs
            </h1>
            <p className="text-xs text-[#797a82] mt-0.5">
              Diagnostic audit trail from hardware sensors and cloud trigger interlocks
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-[#55565d] bg-white/80 px-3 py-1.5 rounded-full border border-black/[0.06] shadow-sm">
              {alerts.length} total events logged
            </span>
          </div>
        </div>

        {/* ── Category Filter Pills ── */}
        <div className="clay-pill-bar flex gap-1 overflow-x-auto pb-1 max-w-max">
          {filterTypes.map((t) => {
            const count = t === "ALL" ? alerts.length : counts[t] ?? 0;
            const isSelected = filter === t;

            return (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 select-none",
                  isSelected
                    ? "bg-[#18191c] text-white shadow-sm"
                    : "text-[#5e6068] hover:text-[#18191c] hover:bg-white/60"
                )}
              >
                <span>{t}</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold",
                  isSelected ? "bg-white text-[#18191c]" : "bg-[#dedcd5] text-[#55565d]"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Event Timeline List ── */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="clay-card p-12 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="text-sm font-bold text-[#18191c]">No alerts found</p>
              <p className="text-xs text-[#797a82]">No telemetry events match the selected category filter.</p>
            </div>
          ) : (
            filtered.map((alert) => {
              const typeCfg = TYPE_CFG[alert.alert_type?.toUpperCase()] ?? TYPE_CFG.INFO;
              const sev = SEVERITY_BADGE[alert.severity?.toLowerCase()] ?? SEVERITY_BADGE.info;
              const { time, date } = formatTimestamp(alert.timestamp);

              return (
                <div
                  key={alert.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white/80 hover:bg-white border border-black/[0.06] transition-all gap-3 shadow-sm hover:shadow-md"
                >
                  {/* Left: Icon + Type + Message */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#edece8] border border-black/[0.05] flex items-center justify-center shrink-0 text-[#18191c] shadow-inner">
                      <typeCfg.icon className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-[#18191c]">{typeCfg.label}</span>
                        <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold font-mono", sev.badge)}>
                          • {sev.label}
                        </span>
                        {alert.sensor_value !== null && alert.sensor_value !== undefined && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#edece8] font-mono font-bold text-[#18191c]">
                            val: {alert.sensor_value}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#55565d] leading-relaxed truncate">{alert.message}</p>
                    </div>
                  </div>

                  {/* Right: Timestamp */}
                  <div className="sm:text-right shrink-0 text-xs font-mono text-[#797a82] pl-12 sm:pl-0">
                    <div className="text-[#18191c] font-bold">{time}</div>
                    <div className="text-[10px] text-[#9b9a94]">{date}</div>
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
