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
  status = 'ok',
  description 
}: SensorCardProps) => {
  const statusColors = {
    cold : 'text-status-cold',
    ok: 'text-status-ok',
    warning: 'text-status-warning',
    alert: 'text-status-alert',
  };

  const statusGlow = {
    cold : 'shadow-[0_0_20px_hsl(var(--status-cold)/0.3)]',
    ok: 'shadow-[0_0_20px_hsl(var(--status-ok)/0.3)]',
    warning: 'shadow-[0_0_20px_hsl(var(--status-warning)/0.3)]',
    alert: 'shadow-[0_0_20px_hsl(var(--status-alert)/0.3)]',
  };

  return (
  <Card
    className={cn(
      "relative overflow-hidden border-border/40 bg-card/40",
      statusGlow[status]
    )}
  >
    {/* LEFT STATUS BAR */}
    <div
      className={cn(
        "absolute left-0 top-0 h-full w-1 animate-pulse-glow",
        status === "cold" && "battery-cold",
        status === "ok" && "battery-ok",
        status === "warning" && "battery-warning",
        status === "alert" && "battery-critical"
      )}
    />

    {/* ICON placed at top-right aligned with line */}
    <div className="absolute top-4 right-4 z-10">
      <div
        className={cn(
          "p-2 rounded-xl bg-secondary/50 backdrop-blur-sm",
          statusColors[status]
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
    </div>

    <div className="p-10 pr-10">
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-muted-foreground">
          {title}
        </h3>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-foreground">
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
          <p className="text-xs text-muted-foreground">
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
