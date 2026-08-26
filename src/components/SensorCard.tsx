import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface SensorCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  status?: 'ok' | 'warning' | 'alert' | 'cold';
  description?: string;
}

const STATUS_CONFIG: Record<string, {
  iconClass: string;
  color: string;
  bg: string;
}> = {
  ok: {
    iconClass: "icon-ok",
    color: "#22c55e",
    bg: "rgba(34, 197, 94, 0.12)",
  },
  warning: {
    iconClass: "icon-warning",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.14)",
  },
  alert: {
    iconClass: "icon-critical",
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.16)",
  },
  cold: {
    iconClass: "icon-cold",
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.12)",
  },
};

export const SensorCard = ({
  title,
  value,
  unit,
  icon: Icon,
  status = 'ok',
  description,
}: SensorCardProps) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.ok;

  const formattedValue =
    typeof value === "number"
      ? Number(value).toFixed(1)
      : value ?? "—";

  return (
    <Card className="bg-black rounded-2xl p-4 transition-all duration-200 group shadow-sm border border-white/12 hover:border-white/25">
      
      {/* Top row: Animated Color-Blinking Icon + Title */}
      <div className="flex items-center gap-2.5 mb-3">
        {/* Animated Color-Blinking Icon Box */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors"
          style={{
            background: cfg.bg,
            border: `1px solid ${cfg.color}44`,
          }}
        >
          <Icon className={cn("w-4 h-4 fill-none stroke-[2]", cfg.iconClass)} />
        </div>

        <span className="text-xs font-semibold text-white tracking-wide truncate">{title}</span>
      </div>

      {/* Main Metric Value */}
      <div className="flex items-baseline gap-1.5 mt-2.5">
        <span className="text-2xl font-bold tracking-tight text-white font-mono">
          {formattedValue}
        </span>
        {unit && (
          <span className="text-xs font-bold text-neutral-400 font-sans">
            {unit}
          </span>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="text-[11px] text-neutral-400 mt-1 truncate font-medium">
          {description}
        </p>
      )}
    </Card>
  );
};
