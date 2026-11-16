import { Link } from "react-router-dom";
import { useWled } from "@/hooks/useWled";
import { cn } from "@/lib/utils";
import { rgbToHex } from "@/lib/wled";
import { Sparkles, ChevronRight } from "lucide-react";

export function WledDashboardItem() {
  const {
    endpoint,
    state,
    connected,
    loading,
    busy,
    primaryColor,
    currentEffectName,
    togglePower,
  } = useWled();

  const isPowerOn = connected && !!state?.on;
  const bri = state?.bri ?? 128;
  const briPercent = Math.round((bri / 255) * 100);
  const hexColor = rgbToHex(primaryColor[0], primaryColor[1], primaryColor[2]);

  return (
    <div
      className="p-3.5 rounded-2xl bg-white/70 hover:bg-white border border-black/[0.05] hover:border-black/[0.12] flex items-center justify-between gap-3 shadow-sm transition-all group"
    >
      <Link to="/wled" className="flex flex-1 items-center gap-3 min-w-0">
        <div
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shadow-inner transition-all shrink-0",
            isPowerOn ? "text-white ring-1 ring-white/30" : "bg-[#edece8] text-[#55565d]"
          )}
          style={{
            backgroundColor: isPowerOn ? hexColor : undefined,
            boxShadow: isPowerOn ? `0 0 14px ${hexColor}60` : undefined,
          }}
        >
          <Sparkles className="w-4 h-4" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold text-[#18191c] truncate">ESP32 Pixel LED (WLED)</p>
            <span
              className={cn(
                "text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold border shrink-0",
                connected
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              )}
            >
              {connected ? "LIVE" : loading ? "CONNECTING" : "OFFLINE"}
            </span>
          </div>
          <p className="text-[11px] text-[#797a82] truncate">
            {connected
              ? isPowerOn ? `${currentEffectName} · ${briPercent}% brightness` : "Off"
              : endpoint.replace(/^https?:\/\//, "")}
          </p>
        </div>
        <ChevronRight className="ml-auto w-4 h-4 text-[#797a82] group-hover:text-[#18191c] shrink-0 transition-colors" />
      </Link>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={togglePower}
          disabled={!connected || busy}
          aria-label="Toggle ESP32 Pixel LED"
          aria-pressed={isPowerOn}
          className={cn("clay-switch", isPowerOn && "checked")}
        >
          <span className="clay-switch-thumb" />
        </button>
      </div>
    </div>
  );
}
