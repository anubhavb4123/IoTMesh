import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { onValue, ref } from "firebase/database";
import { database } from "@/lib/firebase";
import {
  AlertCircle, AlertTriangle, Info, Zap,
  DoorOpen, Wind, BatteryLow, Activity, Flame,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────
interface Alert {
  id: string;
  alert_type: string;
  message: string;
  severity: "info" | "warning" | "error" | "critical";
  sensor_value: number | null;
  timestamp: number;
}

// ── Type config ───────────────────────────────────────────────
const TYPE_CFG: Record<string, {
  icon: React.ElementType; color: string;
  bg: string; border: string; label: string;
}> = {
  GAS:      { icon: Wind,         color: "#10b981", bg: "#10b98112", border: "#10b98133", label: "Gas"      },
  DOOR:     { icon: DoorOpen,     color: "#38bdf8", bg: "#38bdf812", border: "#38bdf833", label: "Door"     },
  POWER:    { icon: Zap,          color: "#f59e0b", bg: "#f59e0b12", border: "#f59e0b33", label: "Power"    },
  BATT:     { icon: BatteryLow,   color: "#f97316", bg: "#f9731612", border: "#f9731633", label: "Battery"  },
  IGNITION: { icon: Flame,        color: "#ef4444", bg: "#ef444412", border: "#ef444433", label: "Ignition" },
  INFO:     { icon: Info,         color: "#6b7280", bg: "#6b728012", border: "#6b728033", label: "Info"     },
};

const SEVERITY_COLOR: Record<string, string> = {
  info: "#6b7280", warning: "#f59e0b", error: "#ef4444", critical: "#ef4444",
};

function getCfg(type: string) {
  return TYPE_CFG[type?.toUpperCase()] ?? TYPE_CFG.INFO;
}

function formatTime(ts: number) {
  const d   = new Date(ts);
  const now = new Date();
  const yest = new Date(now); yest.setDate(now.getDate() - 1);
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  if (d.toDateString() === now.toDateString())  return { primary: time, secondary: "Today" };
  if (d.toDateString() === yest.toDateString()) return { primary: time, secondary: "Yesterday" };
  return { primary: time, secondary: d.toLocaleDateString() };
}

// ── Page 
export default function Alerts() {
  const [alerts,  setAlerts]  = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("ALL");

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

  const filterTypes = ["ALL", "GAS", "DOOR", "POWER", "BATT", "IGNITION"];
  const ignitionCount = counts["IGNITION"] ?? 0;

  return (
    <Layout>
      <div className="space-y-5" style={{ animation: "fadeSlideIn 0.4s ease both" }}>

        {/* Header */}
        <div className="flex items-center justify-between" style={{ animation: "fadeSlideIn 0.3s ease both" }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
              <Activity className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Alert Log</h1>
              <p className="text-xs text-muted-foreground/60 mt-0.5 tracking-wide">
                {alerts.length} total · live from ESP8266
              </p>
            </div>
          </div>
          {ignitionCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-500/25 bg-red-500/10">
              <Flame className="h-3.5 w-3.5 text-red-400" />
              <span className="text-[11px] text-red-400 font-medium tracking-wider">
                {ignitionCount} ignition event{ignitionCount > 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

        {/* Summary pills */}
        {Object.entries(TYPE_CFG).some(([k]) => k !== "INFO" && counts[k]) && (
          <div className="flex gap-2 flex-wrap" style={{ animation: "fadeSlideIn 0.4s ease both", animationDelay: "0.05s" }}>
            {Object.entries(TYPE_CFG).filter(([k]) => k !== "INFO" && counts[k]).map(([key, cfg]) => (
              <div
                key={key}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer transition-all duration-200 hover:opacity-80"
                style={{ background: cfg.bg, borderColor: cfg.border, color: cfg.color }}
                onClick={() => setFilter(filter === key ? "ALL" : key)}
              >
                <cfg.icon style={{ width: 11, height: 11 }} />
                {cfg.label} · {counts[key]}
              </div>
            ))}
          </div>
        )}

        {/* Filter bar */}
        <div className="flex gap-1.5 flex-wrap" style={{ animation: "fadeSlideIn 0.4s ease both", animationDelay: "0.1s" }}>
          {filterTypes.map((type) => {
            const cfg    = type === "ALL" ? null : TYPE_CFG[type];
            const active = filter === type;
            return (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-medium transition-all duration-200"
                style={
                  active
                    ? { background: cfg ? `${cfg.color}22` : "rgba(255,255,255,0.1)", color: cfg?.color ?? "var(--color-text-primary)", border: `1px solid ${cfg ? cfg.color + "55" : "rgba(255,255,255,0.3)"}` }
                    : { background: "rgba(255,255,255,0.03)", color: "#555", border: "1px solid rgba(255,255,255,0.08)" }
                }
              >
                {cfg && <cfg.icon style={{ width: 10, height: 10 }} />}
                {type === "ALL" ? "All" : cfg!.label}
                {type !== "ALL" && counts[type] ? <span className="opacity-60 ml-0.5">{counts[type]}</span> : null}
              </button>
            );
          })}
        </div>

        {/* Alert list */}
        <div
          className="rounded-2xl border border-border/40 bg-card/40 overflow-hidden"
          style={{ animation: "fadeSlideIn 0.4s ease both", animationDelay: "0.15s" }}
        >
          {loading ? (
            <div className="flex items-center gap-3 px-6 py-8 text-muted-foreground">
              <div className="loader-o" />
              <span className="text-sm animate-pulse">Loading alerts...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-12 text-center text-muted-foreground/30 text-sm">
              {filter === "ALL" ? "No alerts recorded yet" : `No ${getCfg(filter).label} alerts`}
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              {filtered.map((alert, i) => {
                const cfg  = getCfg(alert.alert_type);
                const Icon = cfg.icon;
                const t    = formatTime(alert.timestamp);
                const sevColor = SEVERITY_COLOR[alert.severity] ?? "#6b7280";
                const isIgn = alert.alert_type?.toUpperCase() === "IGNITION";

                return (
                  <div
                    key={alert.id}
                    className="flex items-start gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors duration-150"
                    style={{
                      animation: "fadeSlideIn 0.3s ease both",
                      animationDelay: `${Math.min(i * 0.025, 0.3)}s`,
                      borderLeft: isIgn ? `3px solid ${cfg.color}` : "3px solid transparent",
                    }}
                  >
                    {/* Icon */}
                    <div
                      className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 mt-0.5"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                    >
                      <Icon style={{ width: 15, height: 15, color: cfg.color }} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-[11px] font-bold tracking-wider uppercase" style={{ color: cfg.color }}>
                          {cfg.label}
                        </span>
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase"
                          style={{ background: `${sevColor}18`, color: sevColor, border: `1px solid ${sevColor}33` }}
                        >
                          {alert.severity}
                        </span>
                        {alert.sensor_value !== null && alert.sensor_value >= 0 && (
                          <span className="text-[10px] text-muted-foreground/50 tabular-nums">
                            {alert.sensor_value}
                            {alert.alert_type?.toUpperCase() === "GAS"  ? " PPM" :
                             alert.alert_type?.toUpperCase() === "BATT" ? "%" :
                             alert.alert_type?.toUpperCase() === "POWER" ? (alert.sensor_value === 0 ? " · Inverter" : " · Grid") : ""}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground/75 leading-snug">{alert.message}</p>
                    </div>

                    {/* Time */}
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-xs font-medium tabular-nums" style={{ color: "var(--color-text-secondary)" }}>{t.primary}</p>
                      <p className="text-[10px] text-muted-foreground/40 mt-0.5">{t.secondary}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
