import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface DeviceControlProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  isActive: boolean;
  onToggle: (active: boolean) => void;
  type?: 'switch' | 'button';
  disabled?: boolean;
}

export const DeviceControl = ({
  title,
  subtitle,
  icon: Icon,
  isActive,
  onToggle,
  type = 'switch',
  disabled = false
}: DeviceControlProps) => {
  const handleClick = () => {
    if (disabled) return;
    onToggle(!isActive);
  };

  const statusText = subtitle ?? (isActive ? "On" : "Off");

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      className={cn(
        "tile-btn relative flex items-center justify-between p-4 rounded-2xl border cursor-pointer select-none transition-all duration-150 shadow-sm",
        isActive
          ? "bg-white text-black border-white shadow-md font-semibold"
          : "bg-black border-white/12 text-neutral-300 hover:border-white/25 hover:bg-neutral-950",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none"
      )}
    >
      {/* Icon + Label */}
      <div className="flex items-center gap-3.5 min-w-0 pr-2">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
          isActive
            ? "bg-black text-white"
            : "bg-neutral-900 border border-white/10 text-neutral-400"
        )}>
          <Icon className="w-5 h-5" />
        </div>

        <div className="min-w-0">
          <p className={cn(
            "text-sm font-semibold truncate",
            isActive ? "text-black" : "text-white"
          )}>
            {title}
          </p>
          <p className={cn(
            "text-xs mt-0.5",
            isActive ? "text-neutral-700 font-medium" : "text-neutral-500"
          )}>
            {statusText}
          </p>
        </div>
      </div>

      {/* Switch indicator */}
      {type === 'switch' && (
        <div onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={isActive}
            onCheckedChange={onToggle}
            disabled={disabled}
            className={cn(
              "data-[state=checked]:bg-black data-[state=unchecked]:bg-neutral-800",
              isActive && "border border-neutral-300"
            )}
          />
        </div>
      )}
    </div>
  );
};
