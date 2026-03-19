import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface DeviceControlProps {
  title: string;
  icon: LucideIcon;
  isActive: boolean;
  onToggle: (active: boolean) => void;
  type?: 'switch' | 'button';
  disabled?: boolean;
}
// =A reusable component for controlling a device (light, fan, relay) with a nice UI
export const DeviceControl = ({
  title,
  icon: Icon,
  isActive,
  onToggle,
  type = 'switch',
  disabled = false
}: DeviceControlProps) => {
  return (
    <Card className={cn(
      "border-border/50 bg-card/10 ",
      isActive && "border-primary/70"
    )}>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-3 rounded-xl transition-all duration-300",
              isActive 
                ? "bg-primary text-primary-foreground" 
                : "bg-secondary text-secondary-foreground"
            )}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground">
                {isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
          
          {type === 'switch' ? (
            <Switch
              checked={isActive}
              onCheckedChange={onToggle}
              disabled={disabled}
              className="data-[state=checked]:bg-primary"
            />
          ) : (
            <Button
              onClick={() => onToggle(!isActive)}
              disabled={disabled}
              variant={isActive ? "default" : "secondary"}
              size="sm"
            >
              {isActive ? 'Turn Off' : 'Turn On'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
