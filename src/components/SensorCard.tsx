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

// Status → hex color map (matches Dashboard StatusItem)
const STATUS_COLOR: Record<string, string> = {
  ok: "#22c55e",
  warning: "#f59e0b",
  alert: "#ef4444",
  cold: "#0263ff",
};

// Status → icon CSS class (animated glow, same as StatusItem)
const ICON_CLASS: Record<string, string> = {
  ok: "icon-ok",
  warning: "icon-warning",
  alert: "icon-critical",
  cold: "icon-cold",
};

export const SensorCard = ({
  title,
  value,
  unit,
  icon: Icon,
  status = 'ok',
  description,
}: SensorCardProps) => {
  const color = STATUS_COLOR[status] ?? STATUS_COLOR.ok;
  const iconCls = ICON_CLASS[status] ?? ICON_CLASS.ok;

  return (
    <Card
      className="relative overflow-hidden border-border/40 bg-card/40"
    >
      {/* ── Icon (top-right) with color-reactive bg + glow ── */}
      <div className="absolute top-4 right-4 z-10">
        <div
          className="p-2 rounded-xl backdrop-blur-sm"
          style={{
            background: `${color}18`,
            border: `1px solid ${color}35`,
          }}
        >
          <Icon
            className={cn("h-6 w-6 fill-none stroke-[1.8]", iconCls)}
          />
        </div>
      </div>

      <div className="p-5 pt-5 pr-14">
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-muted-foreground">
            {title}
          </h3>

          <div className="flex items-baseline gap-2">
            <span className={typeof value === "number" ? "text-3xl font-bold text-foreground" : "text-xl font-bold text-foreground"}>
              {typeof value === "number"
                ? Number(value).toFixed(1)
                : value ?? "0"}
            </span>
            {unit && (
              <span className="text-lg text-muted-foreground">
                {unit}
              </span>
            )}
          </div>

          {description && (
            <p className="text-xs text-muted-foreground/70">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
    </Card>
  );
};
