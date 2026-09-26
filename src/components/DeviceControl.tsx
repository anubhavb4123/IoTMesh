import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

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

  const statusText = subtitle ?? (isActive ? "Energized" : "Turned Off");

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      className={cn(
        "relative flex items-center justify-between p-4 rounded-2xl border cursor-pointer select-none transition-all duration-200 shadow-sm",
        isActive
          ? "bg-[#18191c] text-white border-[#18191c] shadow-md"
          : "bg-white/80 border-black/[0.06] text-[#2c2d33] hover:bg-white hover:border-black/[0.12] hover:shadow-md",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none"
      )}
    >
      {/* Icon + Label */}
      <div className="flex items-center gap-3.5 min-w-0 pr-2">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-inner",
          isActive
            ? "bg-white/15 text-white"
            : "bg-[#edece8] border border-black/[0.05] text-[#18191c]"
        )}>
          <Icon className="w-5 h-5" />
        </div>

        <div className="min-w-0">
          <p className={cn(
            "text-xs font-bold truncate",
            isActive ? "text-white" : "text-[#18191c]"
          )}>
            {title}
          </p>
          <p className={cn(
            "text-[10px] mt-0.5",
            isActive ? "text-neutral-300 font-medium" : "text-[#797a82]"
          )}>
            {statusText}
          </p>
        </div>
      </div>

      {/* Smooth Clay Switch Indicator */}
      {type === 'switch' && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (!disabled) onToggle(!isActive);
          }}
          className={cn(
            "clay-switch shrink-0",
            isActive && (isActive ? "bg-white" : "bg-[#18191c]"),
            isActive && "!bg-white"
          )}
        >
          <span
            className={cn(
              "clay-switch-thumb",
              isActive && "translate-x-5 !bg-[#18191c]"
            )}
          />
        </div>
      )}
    </div>
  );
};
