import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface SensorCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  status?: 'ok' | 'warning' | 'alert';
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
    ok: 'text-status-ok',
    warning: 'text-status-warning',
    alert: 'text-status-alert',
  };

  const statusGlow = {
    ok: 'shadow-[0_0_20px_hsl(var(--status-ok)/0.3)]',
    warning: 'shadow-[0_0_20px_hsl(var(--status-warning)/0.3)]',
    alert: 'shadow-[0_0_20px_hsl(var(--status-alert)/0.3)]',
  };

  return (
    <Card 
      className={cn(
        "border-border/50 bg-card/50 relative overflow-hidden",
        statusGlow[status]
      )}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "p-3 rounded-xl bg-secondary/50 backdrop-blur-sm",
            statusColors[status]
          )}>
            <Icon className="h-6 w-6" />
          </div>
          <div className={cn(
            "h-3 w-3 rounded-full animate-pulse-glow",
            status === 'ok' && "battery-ok",
            status === 'warning' && "battery-warning",
            status === 'alert' && "battery-critical"
          )} />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-foreground">
              {typeof value === "number" ? Number(value).toFixed(1) : (value ?? "0")}
            </span>
            {unit && <span className="text-lg text-muted-foreground">{unit}</span>}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
    </Card>
  );
};
