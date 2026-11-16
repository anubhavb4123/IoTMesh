import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { useWled, useWledSlider } from "@/hooks/useWled";
import {
  rgbToHex,
  hexToRgb,
  COLOR_SWATCHES,
  DEFAULT_WLED_IP,
} from "@/lib/wled";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  Power,
  Sun,
  Palette,
  ExternalLink,
  Wifi,
  WifiOff,
  RefreshCw,
  Settings2,
  Sliders,
  Flame,
  Zap,
  Moon,
  Clock,
  Check,
  Search,
  Monitor,
  LayoutGrid,
  Radio,
  Cpu,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { sounds } from "@/lib/sounds";
import { haptic } from "@/lib/haptic";

export default function WledControl() {
  const {
    endpoint,
    state,
    info,
    segment,
    effects,
    palettes,
    presets,
    presetsError,
    connected,
    loading,
    busy,
    error,
    lastSeen,
    primaryColor,
    currentEffectId,
    currentEffectName,
    currentPaletteId,
    currentPaletteName,
    togglePower,
    setBrightness,
    setColor,
    setEffect,
    setSpeed,
    setIntensity,
    setPalette,
    setPreset,
    setNightlight,
    setScene,
    updateEndpoint,
    resetEndpoint,
    refresh,
  } = useWled({ includePresets: true });

  // Tabs: "studio" vs "native_ui"
  const [activeTab, setActiveTab] = useState<"studio" | "native_ui">("studio");

  // Effect search filter
  const [effectSearch, setEffectSearch] = useState("");

  // Endpoint / IP edit modal state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [ipInput, setIpInput] = useState(endpoint);

  // Colors & Sliders
  const isPowerOn = connected && !!state?.on;
  const brightnessSlider = useWledSlider(state?.bri ?? 128, setBrightness);
  const speedSlider = useWledSlider(segment?.sx ?? 128, setSpeed);
  const intensitySlider = useWledSlider(segment?.ix ?? 128, setIntensity);
  const bri = brightnessSlider.value;
  const briPercent = Math.round((bri / 255) * 100);
  const speed = speedSlider.value;
  const intensity = intensitySlider.value;

  const hexColor = rgbToHex(primaryColor[0], primaryColor[1], primaryColor[2]);

  const allEffects = useMemo(() => effects
    .map((name, id) => ({ id, name }))
    .filter(({ name }) => name && !["RSVD", "-"].includes(name)), [effects]);

  const filteredEffects = useMemo(() => {
    if (!effectSearch.trim()) return allEffects;
    const q = effectSearch.toLowerCase();
    return allEffects.filter((e) => e.name.toLowerCase().includes(q));
  }, [allEffects, effectSearch]);

  const allPalettes = palettes.map((name, id) => ({ id, name }));

  // Preset Scenes
  const SCENES = [
    {
      title: "Warm Hearth",
      desc: "Cozy Fireplace Glow",
      color: [255, 109, 0] as [number, number, number],
      effect: "Fire 2012",
      speed: 140,
      intensity: 160,
      brightness: 180,
    },
    {
      title: "Cyberpunk",
      desc: "Neon Cyan & Magenta",
      color: [0, 229, 255] as [number, number, number],
      effect: "Colorloop",
      speed: 120,
      intensity: 180,
      brightness: 220,
    },
    {
      title: "Aurora",
      desc: "Boreal Green Ribbon",
      color: [0, 230, 118] as [number, number, number],
      effect: "Aurora",
      speed: 80,
      intensity: 130,
      brightness: 190,
    },
    {
      title: "Daylight Focus",
      desc: "Clean 6500K Pure White",
      color: [234, 242, 255] as [number, number, number],
      effect: "Solid",
      speed: 128,
      intensity: 128,
      brightness: 255,
    },
    {
      title: "Candlelight",
      desc: "Gentle 2200K Ambient",
      color: [255, 147, 41] as [number, number, number],
      effect: "Fire Flicker",
      speed: 70,
      intensity: 90,
      brightness: 80,
    },
    {
      title: "Party Rave",
      desc: "Full Spectrum Rainbow",
      color: [255, 0, 128] as [number, number, number],
      effect: "Rainbow",
      speed: 210,
      intensity: 220,
      brightness: 255,
    },
  ];

  const applyScene = async (scene: (typeof SCENES)[0]) => {
    haptic.medium();
    if (await setScene(scene)) {
      sounds.success();
      toast.success(`Activated ${scene.title} scene`);
    }
  };

  const handleIpSave = () => {
    if (updateEndpoint(ipInput)) setShowConfigModal(false);
  };

  return (
    <Layout>
      <div className="space-y-6 pb-16 max-w-[1440px] mx-auto">
        {/* ── TOP HERO HEADER ── */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pt-2">
          <div>
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-inner"
                style={{
                  backgroundColor: isPowerOn ? hexColor : "#18191c",
                  color: isPowerOn ? "#18191c" : "#ffffff",
                  boxShadow: isPowerOn ? `0 0 24px ${hexColor}60` : undefined,
                }}
              >
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#18191c]">
                    Pixel LED Studio
                  </h1>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider transition-colors",
                      connected
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    )}
                  >
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full",
                        connected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                      )}
                    />
                    {connected ? "ONLINE" : loading ? "CONNECTING" : "OFFLINE"}
                  </span>
                </div>
                <p className="text-xs text-[#797a82] mt-0.5 flex items-center gap-2 flex-wrap">
                  <span>ESP32 WLED Controller</span>
                  <span>·</span>
                  <button
                    onClick={() => {
                      setIpInput(endpoint);
                      setShowConfigModal(true);
                    }}
                    className="font-mono text-[#18191c] hover:underline flex items-center gap-1"
                  >
                    <span>{endpoint}</span>
                    <Settings2 className="w-3 h-3 text-[#797a82]" />
                  </button>
                  {connected && info?.leds?.count != null && (
                    <>
                      <span>·</span>
                      <span className="font-mono font-bold">{info.leds.count} LEDs</span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Switcher Pills */}
            <div className="p-1 rounded-full bg-[#e4e3dd] border border-black/[0.06] flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  haptic.tick();
                  setActiveTab("studio");
                }}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5",
                  activeTab === "studio"
                    ? "bg-[#18191c] text-white shadow-sm"
                    : "text-[#5e6068] hover:text-[#18191c]"
                )}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Studio Controls</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  haptic.tick();
                  setActiveTab("native_ui");
                }}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5",
                  activeTab === "native_ui"
                    ? "bg-[#18191c] text-white shadow-sm"
                    : "text-[#5e6068] hover:text-[#18191c]"
                )}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Embedded Web UI</span>
              </button>
            </div>

            {/* Refresh Telemetry */}
            <button
              type="button"
              onClick={() => {
                haptic.tick();
                refresh();
              }}
              title="Refresh WLED Telemetry"
              className="w-9 h-9 rounded-full bg-white/80 hover:bg-white border border-black/[0.06] text-[#4d4f57] hover:text-[#18191c] flex items-center justify-center shadow-sm transition-transform active:scale-95"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>

            {/* Direct Link to ESP32 */}
            <a
              href={endpoint}
              target="_blank"
              rel="noopener noreferrer"
              title="Open WLED in a new tab"
              className="w-9 h-9 rounded-full bg-white/80 hover:bg-white border border-black/[0.06] text-[#4d4f57] hover:text-[#18191c] flex items-center justify-center shadow-sm transition-transform active:scale-95"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* ── ERROR / OFFLINE NOTICE (IF UNREACHABLE) ── */}
        {!connected && error && (
          <div className="clay-card p-4 border-amber-200 bg-amber-50/70 text-amber-900 rounded-2xl flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-amber-950">
                  {error}
                </p>
                <p className="text-amber-800 leading-relaxed">
                  Connect to the same Wi-Fi as the ESP32 and confirm its address in Settings. Allow local network access if your browser asks.
                  You can also run IoTMesh at http://localhost:8080 from a computer on that network.
                </p>
              </div>
            </div>
            <button
              onClick={() => refresh()}
              className="px-3 py-1.5 rounded-xl bg-amber-200 text-amber-950 font-bold text-xs hover:bg-amber-300 transition-colors shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════ */}
        {/* TAB 1: STUDIO CONTROLS                                    */}
        {/* ═════════════════════════════════════════════════════════ */}
        {activeTab === "studio" && (
          <div className="space-y-6">
            {/* ── VIRTUAL LED STRIP SIMULATION BAR ── */}
            <div className="clay-card p-4 sm:p-5 relative overflow-hidden">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-[#797a82] mb-3">
                <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                  <Sparkles className="w-3.5 h-3.5" />
                  Live Virtual LED Strip Simulation
                </span>
                <span className="text-[11px] text-[#18191c]">
                  {isPowerOn ? `${currentEffectName} · ${briPercent}% Brightness` : "De-energized"}
                </span>
              </div>

              {/* Strip Track */}
              <div className="relative py-2 px-1 rounded-2xl bg-[#141517] border border-black/20 shadow-inner flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
                {Array.from({ length: 24 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-3.5 h-7 rounded-md transition-all duration-300 shrink-0 border"
                    style={{
                      backgroundColor: isPowerOn ? hexColor : "#2a2b30",
                      borderColor: isPowerOn ? `${hexColor}aa` : "#3a3b40",
                      opacity: isPowerOn ? Math.max(0.25, bri / 255) : 0.3,
                      boxShadow: isPowerOn
                        ? `0 0 ${Math.round((bri / 255) * 14)}px ${hexColor}`
                        : "none",
                      animation:
                        isPowerOn && currentEffectId !== 0
                          ? `pulse 2s infinite ease-in-out ${i * 0.08}s`
                          : "none",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* ── ROW 1: POWER, BRIGHTNESS & DYNAMICS ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Power & Master Brightness (8 cols) */}
              <div className="lg:col-span-8 clay-card p-6 flex flex-col justify-between space-y-6">
                {/* Header: Power & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={togglePower}
                      aria-label="Pixel LED power"
                      aria-pressed={isPowerOn}
                      disabled={!connected || busy}
                      className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md cursor-pointer active:scale-95",
                        isPowerOn
                          ? "bg-[#18191c] text-white hover:bg-neutral-800"
                          : "bg-white text-[#797a82] hover:text-[#18191c] border border-black/[0.08]"
                      )}
                      style={
                        isPowerOn
                          ? {
                              boxShadow: `0 0 28px ${hexColor}90`,
                            }
                          : undefined
                      }
                    >
                      <Power className="w-7 h-7" />
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-extrabold text-[#18191c]">
                          Master Power
                        </h2>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase",
                            isPowerOn
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-neutral-100 text-[#797a82]"
                          )}
                        >
                          {connected ? (isPowerOn ? "On" : "Off") : "Unavailable"}
                        </span>
                      </div>
                      <p className="text-xs text-[#797a82] mt-0.5">
                        {isPowerOn
                          ? `Rendering ${currentEffectName} at ${hexColor}`
                          : connected ? "LEDs are off" : "Connect to WLED to control the LEDs"}
                      </p>
                    </div>
                  </div>

                  {/* Quick Nightlight Button */}
                  <button
                    type="button"
                    onClick={setNightlight}
                    disabled={!isPowerOn}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/80 hover:bg-white border border-black/[0.06] text-xs font-bold text-[#18191c] shadow-sm transition-all disabled:opacity-50"
                  >
                    <Moon className="w-4 h-4 text-amber-500" />
                    <span>30m Nightlight Fade</span>
                  </button>
                </div>

                {/* Master Brightness Slider */}
                <div className="space-y-3 bg-white/60 p-4 rounded-2xl border border-black/[0.04]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold uppercase tracking-wider text-[11px] font-mono text-[#55565d] flex items-center gap-2">
                      <Sun className="w-4 h-4 text-amber-500" />
                      Master Brightness
                    </span>
                    <span className="font-mono font-extrabold text-sm text-[#18191c]">
                      {briPercent}%
                      <span className="text-[10px] text-[#797a82] ml-1 font-normal">
                        ({bri}/255)
                      </span>
                    </span>
                  </div>

                  <Slider
                    {...brightnessSlider}
                    thumbLabel="Master brightness"
                    value={[bri]}
                    min={1}
                    max={255}
                    step={1}
                    disabled={!isPowerOn}
                    className="w-full cursor-pointer py-1"
                  />

                  {/* Quick percentage steps */}
                  <div className="grid grid-cols-5 gap-1.5 pt-1">
                    {[10, 25, 50, 75, 100].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        disabled={!isPowerOn}
                        onClick={() => setBrightness(Math.round((pct / 100) * 255))}
                        className={cn(
                          "py-1 rounded-xl text-[11px] font-mono font-bold transition-all text-center",
                          briPercent === pct
                            ? "bg-[#18191c] text-white shadow-sm"
                            : "bg-white text-[#55565d] hover:bg-[#edece8] border border-black/[0.05]"
                        )}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Effect Dynamics: Speed & Intensity (4 cols) */}
              <div className="lg:col-span-4 clay-card p-6 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider font-mono text-[#18191c] flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Effect Dynamics
                  </h3>
                  <p className="text-xs text-[#797a82] mt-0.5">
                    Tune animation speed & pattern intensity
                  </p>
                </div>

                {/* Speed Slider */}
                <div className="space-y-2 bg-white/60 p-3.5 rounded-2xl border border-black/[0.04]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[10px] uppercase font-bold text-[#55565d]">
                      Animation Speed
                    </span>
                    <span className="font-mono font-bold text-[#18191c]">{speed}</span>
                  </div>
                  <Slider
                    {...speedSlider}
                    thumbLabel="Animation speed"
                    value={[speed]}
                    min={0}
                    max={255}
                    step={1}
                    disabled={!isPowerOn || !segment}
                    className="w-full cursor-pointer"
                  />
                </div>

                {/* Intensity Slider */}
                <div className="space-y-2 bg-white/60 p-3.5 rounded-2xl border border-black/[0.04]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-[10px] uppercase font-bold text-[#55565d]">
                      Effect Intensity
                    </span>
                    <span className="font-mono font-bold text-[#18191c]">{intensity}</span>
                  </div>
                  <Slider
                    {...intensitySlider}
                    thumbLabel="Effect intensity"
                    value={[intensity]}
                    min={0}
                    max={255}
                    step={1}
                    disabled={!isPowerOn || !segment}
                    className="w-full cursor-pointer"
                  />
                </div>

                {/* Active Effect & Palette Badge */}
                <div className="p-3 rounded-2xl bg-[#edece8] border border-black/[0.05] space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#797a82] font-mono">Effect:</span>
                    <span className="font-bold text-[#18191c] truncate">{currentEffectName}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#797a82] font-mono">Palette:</span>
                    <span className="font-bold text-[#18191c] truncate">{currentPaletteName}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── ROW 2: COLOR STUDIO & PALETTES ── */}
            <div className="clay-card p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-[#18191c] flex items-center gap-2">
                    <Palette className="w-4 h-4 text-purple-500" />
                    Color Palette & Swatches
                  </h2>
                  <p className="text-xs text-[#797a82] mt-0.5">
                    Click swatches or use the precision color picker to tint your pixel LEDs
                  </p>
                </div>

                {/* Color Input & Hex Code */}
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <div className="relative flex items-center">
                    <input
                      type="color"
                      aria-label="Pixel LED color"
                      disabled={!connected || !segment}
                      value={hexColor}
                      onChange={(e) => {
                        const rgb = hexToRgb(e.target.value);
                        setColor(rgb[0], rgb[1], rgb[2]);
                      }}
                      className="w-9 h-9 rounded-xl border-2 border-white shadow-sm cursor-pointer overflow-hidden p-0"
                    />
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-white border border-black/[0.08] font-mono text-xs font-bold text-[#18191c]">
                    {hexColor.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* 12 Curated Color Swatches */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {COLOR_SWATCHES.map((swatch) => {
                  const isSelected = hexColor.toLowerCase() === swatch.hex.toLowerCase();
                  return (
                    <button
                      key={swatch.name}
                      type="button"
                      disabled={!connected || !segment}
                      onClick={() => setColor(swatch.rgb[0], swatch.rgb[1], swatch.rgb[2])}
                      className={cn(
                        "p-2 rounded-2xl border transition-all duration-150 flex items-center gap-2.5 text-left group",
                        isSelected
                          ? "bg-white border-[#18191c] shadow-md ring-2 ring-[#18191c]/20"
                          : "bg-white/70 border-black/[0.06] hover:bg-white hover:border-black/[0.15]"
                      )}
                    >
                      <span
                        className="w-7 h-7 rounded-xl shrink-0 border border-black/10 shadow-sm transition-transform group-hover:scale-105"
                        style={{
                          backgroundColor: swatch.hex,
                          boxShadow: isSelected ? `0 0 12px ${swatch.hex}` : undefined,
                        }}
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#18191c] truncate">
                          {swatch.name}
                        </p>
                        <p className="text-[10px] font-mono text-[#797a82]">
                          {swatch.hex}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Color Palettes Selection */}
              <div className="pt-2 border-t border-black/[0.06]">
                <p className="text-[11px] font-mono font-bold text-[#797a82] uppercase mb-2">
                  WLED Built-in Color Palettes
                </p>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                  {allPalettes.map((pal) => (
                    <button
                      key={pal.id}
                      type="button"
                      onClick={() => setPalette(pal.id)}
                      disabled={!connected || !segment}
                      aria-pressed={currentPaletteId === pal.id}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 font-mono",
                        currentPaletteId === pal.id
                          ? "bg-[#18191c] text-white shadow-sm"
                          : "bg-white/80 text-[#55565d] hover:bg-white hover:text-[#18191c] border border-black/[0.05]"
                      )}
                    >
                      {pal.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── ROW 3: PRESET SCENES & QUICK AMBIENCE ── */}
            <div className="clay-card p-6 space-y-4">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-[#18191c] flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  Instant Atmosphere Scenes
                </h2>
                <p className="text-xs text-[#797a82] mt-0.5">
                  1-Click lighting moods and effect combinations
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {SCENES.map((scene) => (
                  <button
                    key={scene.title}
                    type="button"
                    onClick={() => applyScene(scene)}
                    disabled={!connected || !segment}
                    className="p-4 rounded-2xl bg-white/70 hover:bg-white border border-black/[0.06] hover:border-black/[0.12] transition-all duration-200 text-left flex items-center gap-3.5 shadow-sm hover:shadow group"
                  >
                    <span
                      className="w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center border border-black/10 transition-transform group-hover:scale-105"
                      style={{
                        backgroundColor: rgbToHex(scene.color[0], scene.color[1], scene.color[2]),
                        boxShadow: `0 0 16px ${rgbToHex(scene.color[0], scene.color[1], scene.color[2])}40`,
                      }}
                    >
                      <Sparkles className="w-5 h-5 text-white/90 drop-shadow" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-[#18191c]">{scene.title}</p>
                      <p className="text-[11px] text-[#797a82] truncate">{scene.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Presets saved on the controller */}
              <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between gap-3 flex-wrap">
                <span className="text-[11px] font-mono font-bold text-[#797a82] uppercase">
                  WLED Hardware Presets
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {presets?.map(({ id, name }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPreset(id)}
                      disabled={!connected}
                      aria-pressed={state?.ps === id}
                      className={cn(
                        "min-h-11 px-3 rounded-xl text-xs font-bold transition-all shadow-sm",
                        state?.ps === id
                          ? "bg-[#18191c] text-white"
                          : "bg-white text-[#55565d] hover:bg-[#edece8] border border-black/[0.06]"
                      )}
                    >
                      {name}
                    </button>
                  ))}
                  {!presets?.length && (
                    <span className="text-xs text-[#797a82]">
                      {presetsError ? "Presets unavailable" : presets ? "No presets saved" : "—"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ── ROW 4: COMPLETE EFFECTS EXPLORER ── */}
            <div className="clay-card p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-[#18191c] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Effects Engine ({allEffects.length} available)
                  </h2>
                  <p className="text-xs text-[#797a82] mt-0.5">
                    Select an algorithm to animate your pixel LED strip
                  </p>
                </div>

                {/* Effect Search Bar */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#797a82]" />
                  <Input
                    placeholder="Search effects..."
                    value={effectSearch}
                    onChange={(e) => setEffectSearch(e.target.value)}
                    className="pl-8 h-9 text-xs rounded-xl bg-white/90 border-black/[0.08]"
                  />
                </div>
              </div>

              {/* Effects Grid / Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-80 overflow-y-auto p-1 rounded-2xl bg-black/[0.02]">
                {filteredEffects.map((fx) => {
                  const isSelected = currentEffectId === fx.id;
                  return (
                    <button
                      key={fx.id}
                      type="button"
                      onClick={() => setEffect(fx.id)}
                      disabled={!connected || !segment}
                      aria-pressed={isSelected}
                      className={cn(
                        "p-2.5 rounded-xl text-left transition-all duration-150 border font-mono text-xs flex items-center justify-between gap-2 group",
                        isSelected
                          ? "bg-[#18191c] text-white border-[#18191c] shadow-sm font-bold"
                          : "bg-white/80 text-[#2c2d33] border-black/[0.05] hover:bg-white hover:border-black/[0.12]"
                      )}
                    >
                      <span className="truncate">{fx.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0 text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── ROW 5: HARDWARE TELEMETRY & DIAGNOSTICS ── */}
            <div className="clay-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-[#18191c] flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-blue-500" />
                    ESP32 Hardware Diagnostics
                  </h2>
                  <p className="text-xs text-[#797a82] mt-0.5">
                    Live system metrics transmitted from WLED firmware
                  </p>
                </div>
                <span className="text-[11px] font-mono font-bold text-[#797a82]">
                  {info?.ver ? `v${info.ver}` : "WLED"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  {
                    label: "IP Address",
                    value: endpoint.replace(/^https?:\/\//, ""),
                  },
                  {
                    label: "LED Count",
                    value: info?.leds?.count != null ? `${info.leds.count} Pixels` : "—",
                  },
                  {
                    label: "Frame Rate",
                    value: info?.leds?.fps != null ? `${info.leds.fps} FPS` : "—",
                  },
                  {
                    label: "Current Draw",
                    value: info?.leds?.pwr != null ? `${info.leds.pwr} mA` : "—",
                  },
                  {
                    label: "Wi-Fi Signal",
                    value: info?.wifi?.rssi != null ? `${info.wifi.rssi} dBm` : "—",
                  },
                  {
                    label: "Free Memory",
                    value:
                      info?.freeheap != null
                        ? `${(info.freeheap / 1024).toFixed(0)} KB`
                        : "—",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="p-3 rounded-2xl bg-white/70 border border-black/[0.05] space-y-1"
                  >
                    <p className="text-[9px] font-bold font-mono text-[#797a82] uppercase">
                      {item.label}
                    </p>
                    <p className="text-xs font-mono font-extrabold text-[#18191c] truncate">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════ */}
        {/* TAB 2: EMBEDDED NATIVE WLED WEBVIEW                       */}
        {/* ═════════════════════════════════════════════════════════ */}
        {activeTab === "native_ui" && (
          <div className="clay-card p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-[#18191c]">
                  Embedded WLED Web Console
                </h2>
                <p className="text-xs text-[#797a82] mt-0.5">
                  Complete native interface served directly by your ESP32 at {endpoint}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={endpoint}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-full bg-[#18191c] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-neutral-800"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Fullscreen</span>
                </a>
              </div>
            </div>

            {/* Embedded Iframe */}
            <div className="w-full h-[750px] rounded-2xl border border-black/[0.08] overflow-hidden bg-neutral-900 shadow-inner">
              <iframe
                src={endpoint}
                title="WLED Native Web UI"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          </div>
        )}

        {/* ── ENDPOINT CONFIGURATION MODAL ── */}
        {showConfigModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="clay-card p-6 max-w-md w-full space-y-4 shadow-2xl bg-[#fafaf8]">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-[#18191c]">
                  Configure WLED Endpoint
                </h3>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="text-xs text-[#797a82] hover:text-[#18191c] font-bold"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-[#55565d] leading-relaxed">
                Enter the local IP address or hostname of your ESP32 running WLED on your home network. Default is{" "}
                <span className="font-mono font-bold text-[#18191c]">{DEFAULT_WLED_IP}</span>.
              </p>

              <div className="space-y-2">
                <label htmlFor="wled-endpoint" className="text-[10px] font-mono uppercase font-bold text-[#797a82]">
                  Device URL or IP Address
                </label>
                <Input
                  id="wled-endpoint"
                  value={ipInput}
                  onChange={(e) => setIpInput(e.target.value)}
                  placeholder={DEFAULT_WLED_IP}
                  className="font-mono text-xs rounded-xl"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIpInput(resetEndpoint());
                    setShowConfigModal(false);
                  }}
                  className="text-xs text-[#797a82] hover:text-[#18191c] font-bold"
                >
                  Reset Default
                </button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowConfigModal(false)}
                    className="rounded-xl text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleIpSave}
                    className="rounded-xl text-xs bg-[#18191c] text-white hover:bg-neutral-800"
                  >
                    Save & Reconnect
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
