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

export const SensorCard = ({
  title,
  value,
  unit,
  icon: Icon,
  description,
}: SensorCardProps) => {
  const formattedValue =
    typeof value === "number"
      ? Number(value).toFixed(1)
      : value ?? "—";

  return (
    <Card className="bg-black rounded-2xl p-4 transition-all duration-200 group shadow-sm border border-white/12 hover:border-white/25">
      
      {/* Top row: Icon + Title */}
      <div className="flex items-center gap-2.5 mb-3">
        {/* Minimal Monochrome Icon Box */}
        <div className="w-9 h-9 rounded-xl bg-neutral-900 border border-white/10 flex items-center justify-center shrink-0 text-white transition-colors group-hover:border-white/20">
          <Icon className="w-4 h-4 fill-none stroke-[2]" />
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
