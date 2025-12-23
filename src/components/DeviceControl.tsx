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
      "border-border/50 bg-card/50",
      isActive && "border-primary/70 shadow-[0_0_30px_hsl(var(--primary)/0.2)]"
    )}>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-3 rounded-xl transition-all duration-300",
              isActive 
                ? "bg-primary text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.5)]" 
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
      
      {/* Active indicator line */}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0" />
      )}
    </Card>
  );
};
