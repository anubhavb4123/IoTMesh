import { cn } from "@/lib/utils";
import { LucideIcon, Clock, Timer, X } from "lucide-react";

export interface DeviceTimerBadge {
  type: "timer" | "schedule";
  label: string;
  subtext?: string;
  onCancel?: () => void;
  onClick?: () => void;
  isExpiringSoon?: boolean;
}

interface DeviceControlProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  isActive: boolean;
  onToggle: (active: boolean) => void;
  type?: "switch" | "button";
  disabled?: boolean;
  timerBadge?: DeviceTimerBadge | null;
}

export const DeviceControl = ({
  title,
  subtitle,
  icon: Icon,
  isActive,
  onToggle,
  type = "switch",
  disabled = false,
  timerBadge,
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
        "relative flex flex-col justify-between p-4 rounded-2xl border cursor-pointer select-none transition-all duration-200 shadow-sm overflow-hidden group",
        isActive
          ? "bg-[#18191c] text-white border-[#18191c] shadow-md"
          : "bg-white/80 border-black/[0.06] text-[#2c2d33] hover:bg-white hover:border-black/[0.12] hover:shadow-md",
        disabled && "opacity-50 cursor-not-allowed pointer-events-none"
      )}
    >
      {/* Top Row: Icon + Label + Switch */}
      <div className="flex items-center justify-between gap-3 w-full">
        {/* Icon + Label */}
        <div className="flex items-center gap-3.5 min-w-0 pr-2">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-inner",
              isActive
                ? "bg-white/15 text-white"
                : "bg-[#edece8] border border-black/[0.05] text-[#18191c]"
            )}
          >
            <Icon className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <p
              className={cn(
                "text-xs font-bold truncate",
                isActive ? "text-white" : "text-[#18191c]"
              )}
            >
              {title}
            </p>
            <p
              className={cn(
                "text-[10px] mt-0.5",
                isActive ? "text-neutral-300 font-medium" : "text-[#797a82]"
              )}
            >
              {statusText}
            </p>
          </div>
        </div>

        {/* Smooth Clay Switch Indicator */}
        {type === "switch" && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) onToggle(!isActive);
            }}
            className={cn(
              "clay-switch shrink-0",
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

      {/* Timer / Schedule Active Chip on the Button */}
      {timerBadge && (
        <div
          onClick={(e) => {
            if (timerBadge.onClick) {
              e.stopPropagation();
              timerBadge.onClick();
            }
          }}
          className={cn(
            "mt-2.5 pt-2 border-t flex items-center justify-between gap-2 text-[10px] font-bold tracking-tight rounded-lg px-2 py-1 transition-all",
            isActive
              ? "border-white/10 bg-white/10 text-white"
              : "border-black/[0.04] bg-[#f2f1ed] text-[#18191c]",
            timerBadge.type === "timer" && "border-amber-500/30 text-amber-600 bg-amber-50/80 dark:text-amber-300"
          )}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {timerBadge.type === "timer" ? (
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
            ) : (
              <Clock className="w-3 h-3 text-indigo-500 shrink-0" />
            )}

            <span className="truncate font-mono font-bold">
              {timerBadge.label}
            </span>
          </div>

          {timerBadge.onCancel && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                timerBadge.onCancel?.();
              }}
              title="Cancel Timer"
              className="p-0.5 rounded hover:bg-black/10 text-neutral-500 hover:text-red-500 shrink-0 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
