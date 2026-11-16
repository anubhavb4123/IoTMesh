import { Link } from "react-router-dom";
import { useWled, useWledSlider } from "@/hooks/useWled";
import { cn } from "@/lib/utils";
import { rgbToHex, COLOR_SWATCHES } from "@/lib/wled";
import {
  Sparkles,
  Power,
  Sun,
  Palette,
  ExternalLink,
  ChevronRight,
  Wifi,
  WifiOff,
  Flame,
  Zap,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";

export function WledDeviceCard() {
  const {
    endpoint,
    state,
    info,
    connected,
    loading,
    busy,
    segment,
    primaryColor,
    currentEffectName,
    togglePower,
    setBrightness,
    setColor,
  } = useWled();

  const isPowerOn = connected && !!state?.on;
  const brightnessSlider = useWledSlider(state?.bri ?? 128, setBrightness);
  const bri = brightnessSlider.value;
  const briPercent = Math.round((bri / 255) * 100);
  const hexColor = rgbToHex(primaryColor[0], primaryColor[1], primaryColor[2]);

  return (
    <div
      className={cn(
        "relative rounded-3xl p-5 border transition-all duration-300 shadow-sm overflow-hidden flex flex-col justify-between group",
        isPowerOn
          ? "bg-[#18191c] text-white border-black/80 shadow-xl"
          : "bg-white/80 border-black/[0.06] text-[#1c1d22] hover:bg-white hover:border-black/[0.12]"
      )}
    >
      {/* Background Ambient Glow when powered on */}
      {isPowerOn && (
        <div
          className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-35 pointer-events-none transition-all duration-500"
          style={{ backgroundColor: hexColor }}
        />
      )}

      {/* ── Top Header Row ── */}
      <div>
        <div className="flex items-center justify-between gap-2">
          {/* Icon + Title */}
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-inner shrink-0",
                isPowerOn
                  ? "bg-white/15 text-white ring-2 ring-white/20"
                  : "bg-[#edece8] text-[#55565d]"
              )}
              style={
                isPowerOn
                  ? {
                      boxShadow: `0 0 16px ${hexColor}40`,
                    }
                  : undefined
              }
            >
              <Sparkles
                className={cn(
                  "w-5 h-5 transition-transform duration-300",
                  isPowerOn && "scale-110"
                )}
                style={isPowerOn ? { color: hexColor } : undefined}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3
                  className={cn(
                    "text-sm font-extrabold tracking-tight",
                    isPowerOn ? "text-white" : "text-[#18191c]"
                  )}
                >
                  ESP32 Pixel LED
                </h3>
                {/* Online / Offline Pill */}
                <span
                  className={cn(
                    "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider",
                    connected
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                  )}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      connected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                    )}
                  />
                  {connected ? "LIVE" : loading ? "CONNECTING" : "OFFLINE"}
                </span>
              </div>
              <p
                className={cn(
                  "text-[10px] font-mono mt-0.5",
                  isPowerOn ? "text-neutral-400" : "text-[#797a82]"
                )}
              >
                {endpoint.replace(/^https?:\/\//, "")}
                {connected && info?.leds?.count != null && ` · ${info.leds.count} LEDs`}
              </p>
            </div>
          </div>

          {/* Big Tactile Power Button */}
          <button
            type="button"
            onClick={togglePower}
            aria-label="Pixel LED power"
            aria-pressed={isPowerOn}
            disabled={!connected || busy}
            title={isPowerOn ? "Turn Off Pixel LEDs" : "Turn On Pixel LEDs"}
            className={cn(
              "w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-95 shadow-md shrink-0 cursor-pointer",
              isPowerOn
                ? "bg-white text-[#18191c] hover:bg-neutral-100 shadow-white/10"
                : "bg-[#18191c] text-white hover:bg-neutral-800"
            )}
            style={
              isPowerOn
                ? {
                    boxShadow: `0 0 20px ${hexColor}80`,
                  }
                : undefined
            }
          >
            <Power className="w-5 h-5" />
          </button>
        </div>

        {/* ── Status Bar: Current Effect & LED Color ── */}
        <div
          className={cn(
            "mt-4 p-2.5 rounded-2xl flex items-center justify-between gap-3 text-xs border transition-colors",
            isPowerOn
              ? "bg-white/5 border-white/10"
              : "bg-[#edece8]/80 border-black/[0.04]"
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            {/* Color Dot */}
            <span
              className="w-4 h-4 rounded-full border border-black/10 shrink-0 shadow-sm"
              style={{
                backgroundColor: hexColor,
                boxShadow: isPowerOn ? `0 0 10px ${hexColor}` : undefined,
              }}
            />
            <span
              className={cn(
                "text-[11px] font-bold truncate",
                isPowerOn ? "text-neutral-200" : "text-[#2c2d33]"
              )}
            >
              {currentEffectName}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={cn(
                "text-[10px] font-mono font-bold px-2 py-0.5 rounded-full",
                isPowerOn
                  ? "bg-white/10 text-neutral-300"
                  : "bg-white text-[#55565d] border border-black/[0.05]"
              )}
            >
              {isPowerOn ? `${briPercent}% Bri` : "OFF"}
            </span>
          </div>
        </div>

        {/* ── Master Brightness Slider ── */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span
              className={cn(
                "text-[10px] font-bold tracking-wider uppercase font-mono flex items-center gap-1.5",
                isPowerOn ? "text-neutral-400" : "text-[#797a82]"
              )}
            >
              <Sun className="w-3.5 h-3.5" />
              Brightness
            </span>
            <span
              className={cn(
                "text-[11px] font-mono font-bold",
                isPowerOn ? "text-white" : "text-[#18191c]"
              )}
            >
              {briPercent}%
            </span>
          </div>

          <Slider
            {...brightnessSlider}
            thumbLabel="Pixel LED brightness"
            value={[bri]}
            min={1}
            max={255}
            step={1}
            disabled={!isPowerOn}
            className="w-full cursor-pointer py-1"
          />
        </div>

        {/* ── Quick Color Swatches ── */}
        <div className="mt-4">
          <p
            className={cn(
              "text-[10px] font-bold tracking-wider uppercase font-mono mb-2",
              isPowerOn ? "text-neutral-400" : "text-[#797a82]"
            )}
          >
            Quick Colors
          </p>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {COLOR_SWATCHES.slice(0, 7).map((swatch) => (
              <button
                key={swatch.name}
                type="button"
                disabled={!connected || !segment}
                onClick={() => setColor(swatch.rgb[0], swatch.rgb[1], swatch.rgb[2])}
                title={swatch.name}
                className={cn(
                  "w-7 h-7 rounded-xl transition-all duration-150 hover:scale-110 active:scale-95 shrink-0 border shadow-sm",
                  hexColor.toLowerCase() === swatch.hex.toLowerCase()
                    ? "ring-2 ring-white scale-105 border-white"
                    : "border-black/10 hover:border-white/50"
                )}
                style={{ backgroundColor: swatch.hex }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer Navigation Actions ── */}
      <div className="mt-5 pt-3 border-t border-black/[0.08] dark:border-white/10 flex items-center justify-between gap-2">
        <a
          href={endpoint}
          target="_blank"
          rel="noopener noreferrer"
          title="Open native WLED interface in new tab"
          className={cn(
            "inline-flex items-center gap-1.5 text-[11px] font-mono font-medium transition-colors hover:underline",
            isPowerOn ? "text-neutral-400 hover:text-white" : "text-[#797a82] hover:text-[#18191c]"
          )}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>{endpoint.replace(/^https?:\/\//, "")}</span>
        </a>

        <Link
          to="/wled"
          className={cn(
            "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm",
            isPowerOn
              ? "bg-white text-[#18191c] hover:bg-neutral-100"
              : "bg-[#18191c] text-white hover:bg-neutral-800"
          )}
        >
          <span>Studio Controls</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
