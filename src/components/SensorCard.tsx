import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { BarcodeSparkline } from "@/components/ui/BarcodeSparkline";

interface SensorCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  status?: 'ok' | 'warning' | 'alert' | 'cold';
  description?: string;
}

const STATUS_CONFIG: Record<string, {
  color: string;
  bg: string;
  badge: string;
}> = {
  ok: {
    color: "#15803d",
    bg: "#eaf8f0",
    badge: "badge-running",
  },
  warning: {
    color: "#a16207",
    bg: "#fefce8",
    badge: "badge-warning",
  },
  alert: {
    color: "#b91c1c",
    bg: "#fef2f2",
    badge: "badge-stopped",
  },
  cold: {
    color: "#1d4ed8",
    bg: "#eff6ff",
    badge: "badge-running",
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
    <div className="clay-card p-4 space-y-3 transition-all duration-200 hover:scale-[1.01] hover:shadow-md">
      
      {/* Top row: Icon in soft box + Title + Status Dot */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-inner"
            style={{
              background: cfg.bg,
              color: cfg.color,
            }}
          >
            <Icon className="w-4 h-4" />
          </div>

          <span className="text-xs font-bold text-[#18191c] truncate">
            {title}
          </span>
        </div>

        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: cfg.color }}
        />
      </div>

      {/* Main Metric Value */}
      <div className="flex items-baseline gap-1.5 pt-1">
        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#18191c] font-mono">
          {formattedValue}
        </span>
        {unit && (
          <span className="text-xs font-bold text-[#797a82] font-sans">
            {unit}
          </span>
        )}
      </div>

      {/* Description */}
      {description && (
        <p className="text-[11px] text-[#797a82] truncate font-medium">
          {description}
        </p>
      )}
    </div>
  );
};
