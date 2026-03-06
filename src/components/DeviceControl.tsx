import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { sounds } from "@/lib/sounds";
import { haptic } from "@/lib/haptic";

interface DeviceControlProps {
  title: string;
  icon: LucideIcon;
  isActive: boolean;
  onToggle: (active: boolean) => void;
  type?: 'switch' | 'button';
  disabled?: boolean;
}

export const DeviceControl = ({
  title,
  icon: Icon,
  isActive,
  onToggle,
  type = 'switch',
  disabled = false
}: DeviceControlProps) => {

  const handleToggle = (newState: boolean) => {
    newState ? sounds.toggleOn() : sounds.toggleOff();
    onToggle(newState);
    haptic.light();
  };

  return (
    <Card className={cn(
      "relative border-border/50 bg-card/10",
      "transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5",
      isActive && "border-primary/70 shadow-[0_0_30px_hsl(var(--primary)/0.2)]"
    )}>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-3 rounded-xl transition-all duration-300",
              isActive
                ? "bg-primary text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.5)] scale-110"
                : "bg-secondary text-secondary-foreground"
            )}>
              <Icon className={cn("h-6 w-6 transition-transform duration-300", isActive && "rotate-[360deg]")} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className={cn(
                "text-sm transition-colors duration-300",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>

          {type === 'switch' ? (
            <Switch
              checked={isActive}
              onCheckedChange={handleToggle}
              disabled={disabled}
              className="data-[state=checked]:bg-primary"
            />
          ) : (
            <Button
              onClick={() => handleToggle(!isActive)}
              disabled={disabled}
              variant={isActive ? "default" : "secondary"}
              size="sm"
              className="transition-transform duration-150 active:scale-95"
            >
              {isActive ? 'Turn Off' : 'Turn On'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
