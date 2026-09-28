import { useState, useMemo } from "react";
import { Layout } from "@/components/Layout";
import { useSchedules, formatRemainingSeconds, formatTime12H, formatDaysSummary } from "@/hooks/useSchedules";
import { ALL_DEVICES, getDeviceMeta, DeviceMeta } from "@/lib/devices";
import { firebaseService, ControlData, ScheduleItem, ScheduleAction, RepeatType } from "@/lib/firebase";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { sounds } from "@/lib/sounds";
import { haptic } from "@/lib/haptic";
import { toast } from "sonner";
import {
  Clock,
  Timer,
  Plus,
  Play,
  Trash2,
  X,
  Check,
  Calendar,
  ChevronRight,
  Sparkles,
  Zap,
  Power,
  RotateCcw,
  Bell,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Flame,
  ArrowRight,
} from "lucide-react";

export default function Schedules() {
  const {
    allItems,
    timers,
    activeTimers,
    routines,
    activeRoutines,
    loading,
    now,
    createTimer,
    createSchedule,
    toggleSchedule,
    cancelTimer,
    addTimeToTimer,
    deleteSchedule,
    executeNow,
    getDeviceScheduleInfo,
  } = useSchedules();

  const [controls, setControls] = useState<ControlData>({} as ControlData);

  // Realtime controls state
  useEffect(() => {
    const unsub = firebaseService.listenToControlStates(setControls);
    return () => unsub();
  }, []);

  // Filter & Search states
  const [roomFilter, setRoomFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [routineTabFilter, setRoutineTabFilter] = useState<string>("all");

  // Modal Dialog states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalTab, setModalTab] = useState<"timer" | "schedule">("timer");

  // Modal Form states
  const [formDevice, setFormDevice] = useState<string>("room1Light");
  const [formAction, setFormAction] = useState<ScheduleAction>("off");
  const [formName, setFormName] = useState<string>("");
  const [formNotify, setFormNotify] = useState<boolean>(true);

  // Timer specific form states
  const [formDurationMinutes, setFormDurationMinutes] = useState<number>(30);
  const [formAutoTurnOnFirst, setFormAutoTurnOnFirst] = useState<boolean>(false);

  // Schedule specific form states
  const [formTimeHours, setFormTimeHours] = useState<number>(7);
  const [formTimeMinutes, setFormTimeMinutes] = useState<number>(30);
  const [formTimeAmPm, setFormTimeAmPm] = useState<"AM" | "PM">("AM");
  const [formRepeatType, setFormRepeatType] = useState<RepeatType>("everyday");
  const [formSelectedDays, setFormSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
  const [formSpecificDate, setFormSpecificDate] = useState<string>("");

  // Quick Open Helper for a specific device
  const openTimerForDevice = (deviceKey: string, defaultMinutes = 30) => {
    haptic.tick();
    sounds.click();
    setFormDevice(deviceKey);
    setFormAction("off");
    setFormDurationMinutes(defaultMinutes);
    setFormAutoTurnOnFirst(false);
    setFormName("");
    setModalTab("timer");
    setIsModalOpen(true);
  };

  const openScheduleForDevice = (deviceKey: string) => {
    haptic.tick();
    sounds.click();
    setFormDevice(deviceKey);
    setFormAction("on");
    setFormName("");
    setModalTab("schedule");
    setIsModalOpen(true);
  };

  // Switch Toggle Handler
  const handleSwitchToggle = async (key: keyof ControlData, currentState: boolean) => {
    try {
      haptic.tick();
      sounds.click();
      await firebaseService.updateSwitchState(key, !currentState);
      toast.success(
        `${getDeviceMeta(key).name} turned ${!currentState ? "ON 💡" : "OFF 🌑"}`
      );
    } catch (err: any) {
      toast.error("Failed to toggle switch", { description: err.message });
    }
  };

  // Instant Quick Timer (1-click from switch card)
  const handleQuickTimerPreset = async (
    deviceKey: string,
    minutes: number,
    action: ScheduleAction = "off"
  ) => {
    const meta = getDeviceMeta(deviceKey);
    await createTimer({
      device: deviceKey,
      action,
      durationMinutes: minutes,
      autoTurnOnFirst: action === "off" ? false : true,
      name: `${action === "off" ? "Turn OFF" : "Turn ON"} ${meta.name} in ${minutes}m`,
      notification: true,
    });
  };

  // Form Submit Handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (modalTab === "timer") {
      if (formDurationMinutes <= 0) {
        toast.error("Please enter a duration greater than 0 minutes");
        return;
      }
      await createTimer({
        device: formDevice,
        action: formAction,
        durationMinutes: formDurationMinutes,
        name: formName,
        autoTurnOnFirst: formAutoTurnOnFirst,
        notification: formNotify,
      });
      setIsModalOpen(false);
    } else {
      // Format 24-hour time "HH:mm"
      let hour24 = formTimeHours;
      if (formTimeAmPm === "PM" && hour24 < 12) hour24 += 12;
      if (formTimeAmPm === "AM" && hour24 === 12) hour24 = 0;
      const formattedTime = `${String(hour24).padStart(2, "0")}:${String(formTimeMinutes).padStart(2, "0")}`;

      let daysToSave = [0, 1, 2, 3, 4, 5, 6];
      if (formRepeatType === "weekdays") daysToSave = [1, 2, 3, 4, 5];
      else if (formRepeatType === "weekends") daysToSave = [0, 6];
      else if (formRepeatType === "custom") daysToSave = formSelectedDays;
      else if (formRepeatType === "once") daysToSave = [];

      await createSchedule({
        device: formDevice,
        action: formAction,
        time: formattedTime,
        days: daysToSave,
        repeatType: formRepeatType,
        specificDate: formRepeatType === "once" ? formSpecificDate : undefined,
        name: formName,
        notification: formNotify,
      });
      setIsModalOpen(false);
    }
  };

  // Filtered devices list
  const filteredDevices = useMemo(() => {
    return ALL_DEVICES.filter((d) => {
      if (roomFilter !== "all" && d.roomKey !== roomFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          d.name.toLowerCase().includes(q) ||
          d.room.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [roomFilter, searchQuery]);

  // Filtered routines list
  const filteredRoutines = useMemo(() => {
    return routines.filter((r) => {
      if (routineTabFilter === "all") return true;
      if (routineTabFilter === "daily") return r.repeatType === "everyday" || (!r.repeatType && r.days?.length === 7);
      if (routineTabFilter === "weekdays") return r.repeatType === "weekdays" || (r.days?.length === 5 && !r.days.includes(0) && !r.days.includes(6));
      if (routineTabFilter === "weekends") return r.repeatType === "weekends" || (r.days?.length === 2 && r.days.includes(0) && r.days.includes(6));
      if (routineTabFilter === "custom") return r.repeatType === "custom" || r.repeatType === "once" || !!r.specificDate;
      return true;
    });
  }, [routines, routineTabFilter]);

  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Layout>
      <div className="space-y-8 pb-16 max-w-[1440px] mx-auto">
        {/* ── HEADER & STATS ── */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pt-2">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#18191c]">
                Timers & Scheduling
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Render 24/7 Engine
              </span>
            </div>
            <p className="text-xs text-[#797a82] mt-0.5">
              Set automated duration countdowns and recurring clock routines. Executed continuously on the cloud backend.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => {
                haptic.tick();
                sounds.click();
                setModalTab("timer");
                setIsModalOpen(true);
              }}
              className="clay-btn flex items-center gap-2 text-xs font-bold text-[#18191c]"
            >
              <Timer className="w-3.5 h-3.5 text-amber-500" />
              <span>New Countdown Timer</span>
            </button>

            <button
              onClick={() => {
                haptic.tick();
                sounds.click();
                setModalTab("schedule");
                setIsModalOpen(true);
              }}
              className="clay-btn-dark flex items-center gap-2 text-xs font-bold shadow-md"
            >
              <Clock className="w-3.5 h-3.5 text-white" />
              <span>New Scheduled Routine</span>
            </button>
          </div>
        </div>

        {/* ── KPI METRICS CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="clay-card p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#797a82] font-mono">
                Active Timers
              </span>
              <Timer className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-[#18191c] font-mono">
              {activeTimers.length}
            </p>
            <p className="text-[10px] text-[#797a82]">
              {activeTimers.length === 1 ? "1 countdown running" : `${activeTimers.length} countdowns running`}
            </p>
          </div>

          <div className="clay-card p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#797a82] font-mono">
                Active Routines
              </span>
              <Clock className="w-4 h-4 text-indigo-500" />
            </div>
            <p className="text-2xl font-black text-[#18191c] font-mono">
              {activeRoutines.length}
            </p>
            <p className="text-[10px] text-[#797a82]">
              {routines.length} total routine(s) configured
            </p>
          </div>

          <div className="clay-card p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#797a82] font-mono">
                Devices Controlled
              </span>
              <Zap className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-black text-[#18191c] font-mono">
              {ALL_DEVICES.length}
            </p>
            <p className="text-[10px] text-[#797a82]">Across 4 rooms & relay bank</p>
          </div>

          <div className="clay-card p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#797a82] font-mono">
                Backend Status
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <p className="text-sm font-bold text-emerald-700 font-mono mt-1">
              Synchronized ⚡
            </p>
            <p className="text-[10px] text-[#797a82]">
              Render Service 24/7 Tick Active
            </p>
          </div>
        </div>

        {/* ── ACTIVE COUNTDOWN TIMERS DECK (LIVE) ── */}
        {activeTimers.length > 0 && (
          <div className="clay-card p-5 sm:p-6 space-y-4 border-amber-500/30 bg-amber-500/[0.02]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                </span>
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#18191c] font-mono">
                  Live Active Timers ({activeTimers.length})
                </h2>
              </div>
              <span className="text-[11px] font-mono text-[#797a82] font-semibold">
                Auto-executing on Render
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {activeTimers.map((timer) => {
                const devMeta = getDeviceMeta(timer.device);
                const DevIcon = devMeta.icon;
                const remainingSec = Math.max(
                  0,
                  Math.round(((timer.targetTimestamp || 0) - now) / 1000)
                );
                const remainingStr = formatRemainingSeconds(remainingSec);
                const totalSec = (timer.durationMinutes || 1) * 60;
                const progress = Math.min(
                  100,
                  Math.max(0, ((totalSec - remainingSec) / totalSec) * 100)
                );
                const isTargetOn = timer.action === "on";

                return (
                  <div
                    key={timer.id}
                    className="p-4 rounded-2xl bg-white border border-black/[0.07] shadow-sm space-y-3 relative overflow-hidden group hover:border-amber-400/50 transition-all"
                  >
                    {/* Top row: Device Info + Action */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#18191c] text-white flex items-center justify-center shrink-0 shadow-sm">
                          <DevIcon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#18191c] truncate">
                            {devMeta.name}
                          </p>
                          <span className="text-[9px] font-mono font-bold text-[#797a82]">
                            {devMeta.room}
                          </span>
                        </div>
                      </div>

                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0",
                          isTargetOn
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        )}
                      >
                        {isTargetOn ? "Turns ON" : "Turns OFF"}
                      </span>
                    </div>

                    {/* Countdown Digits */}
                    <div className="bg-[#edece8] p-3 rounded-xl border border-black/[0.04] space-y-1.5 shadow-inner">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] uppercase font-bold text-[#797a82] font-mono">
                          Remaining Time
                        </span>
                        <span className="text-[10px] font-mono font-bold text-[#18191c]">
                          {Math.round(progress)}%
                        </span>
                      </div>

                      <p className="text-xl sm:text-2xl font-black font-mono tracking-tight text-[#18191c]">
                        {remainingStr}
                      </p>

                      {/* Progress Bar */}
                      <div className="w-full h-1.5 rounded-full bg-neutral-300 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Quick Extend & Actions */}
                    <div className="flex items-center justify-between gap-1.5 pt-1">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => addTimeToTimer(timer.id, 5)}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#edece8] hover:bg-[#dedcd5] text-[#18191c] transition-colors"
                        >
                          +5m
                        </button>
                        <button
                          onClick={() => addTimeToTimer(timer.id, 15)}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#edece8] hover:bg-[#dedcd5] text-[#18191c] transition-colors"
                        >
                          +15m
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => executeNow(timer)}
                          title="Execute Action Now"
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                        >
                          <Play className="w-3.5 h-3.5 fill-emerald-600" />
                        </button>
                        <button
                          onClick={() => cancelTimer(timer.id)}
                          title="Cancel Timer"
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── ALL SWITCHES SHOWCASE & QUICK ACTION DECK ── */}
        <div className="clay-card p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#18191c] font-mono">
                All Switches & Quick Timers
              </h2>
              <p className="text-xs text-[#797a82]">
                Click any switch to toggle live, or set quick countdowns & scheduled routines
              </p>
            </div>

            {/* Room Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {[
                { id: "all", label: "All Switches" },
                { id: "room1", label: "Room 1" },
                { id: "room2", label: "Room 2" },
                { id: "room3", label: "Room 3" },
                { id: "common", label: "Common" },
                { id: "relay", label: "Relays" },
                { id: "security", label: "Security" },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    haptic.tick();
                    setRoomFilter(r.id);
                  }}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                    roomFilter === r.id
                      ? "bg-[#18191c] text-white shadow-sm"
                      : "bg-[#edece8] text-[#55565d] hover:text-[#18191c] hover:bg-white/70"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#797a82] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search appliances, lights, relays by name or room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#edece8] border border-black/[0.06] text-xs font-bold text-[#18191c] placeholder:text-[#9b9a94] outline-none focus:border-[#18191c] focus:bg-white shadow-inner transition-all"
            />
          </div>

          {/* Switches Grid */}
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredDevices.map((dev) => {
              const DevIcon = dev.icon;
              const isActive = !!controls[dev.key];
              const schedInfo = getDeviceScheduleInfo(dev.key);

              return (
                <div
                  key={dev.key}
                  className={cn(
                    "p-4 rounded-2xl border transition-all duration-200 shadow-sm flex flex-col justify-between space-y-3 relative group",
                    isActive
                      ? "bg-[#18191c] text-white border-[#18191c] shadow-md"
                      : "bg-white/85 border-black/[0.06] text-[#2c2d33] hover:bg-white hover:border-black/[0.12]"
                  )}
                >
                  {/* Top: Icon + Name + Manual Toggle */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-inner",
                          isActive
                            ? "bg-white/15 text-white"
                            : "bg-[#edece8] text-[#18191c]"
                        )}
                      >
                        <DevIcon className="w-4 h-4" />
                      </div>

                      <div className="min-w-0">
                        <p
                          className={cn(
                            "text-xs font-bold truncate",
                            isActive ? "text-white" : "text-[#18191c]"
                          )}
                        >
                          {dev.name}
                        </p>
                        <span
                          className={cn(
                            "text-[9px] font-mono font-bold",
                            isActive ? "text-neutral-400" : "text-[#797a82]"
                          )}
                        >
                          {dev.room}
                        </span>
                      </div>
                    </div>

                    {/* Smooth Switch */}
                    <div
                      onClick={() => handleSwitchToggle(dev.key, isActive)}
                      className={cn(
                        "clay-switch shrink-0 cursor-pointer",
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
                  </div>

                  {/* Active Timer / Schedule Badge if present */}
                  {schedInfo.hasScheduleOrTimer && (
                    <div
                      onClick={() => {
                        if (schedInfo.activeTimer) {
                          cancelTimer(schedInfo.activeTimer.id);
                        } else if (schedInfo.nextSchedule) {
                          openScheduleForDevice(dev.key);
                        }
                      }}
                      className={cn(
                        "p-2 rounded-xl flex items-center justify-between gap-1.5 text-[10px] font-mono font-bold cursor-pointer transition-all border",
                        schedInfo.badgeType === "timer"
                          ? "bg-amber-500/20 text-amber-300 border-amber-400/30"
                          : "bg-indigo-500/20 text-indigo-300 border-indigo-400/30"
                      )}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        {schedInfo.badgeType === "timer" ? (
                          <span className="relative flex h-2 w-2 shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                          </span>
                        ) : (
                          <Clock className="w-3 h-3 text-indigo-400 shrink-0" />
                        )}
                        <span className="truncate">{schedInfo.badgeText}</span>
                      </div>
                      {schedInfo.activeTimer && (
                        <span className="text-[9px] text-amber-200 hover:text-white underline shrink-0">
                          Cancel
                        </span>
                      )}
                    </div>
                  )}

                  {/* Bottom Action Row: Quick Timers & Schedule Trigger */}
                  <div
                    className={cn(
                      "pt-2 border-t flex items-center justify-between gap-1 text-[10px] font-bold",
                      isActive ? "border-white/10" : "border-black/[0.05]"
                    )}
                  >
                    {/* Quick Presets */}
                    <div className="flex items-center gap-1">
                      {[15, 30, 60].map((mins) => (
                        <button
                          key={mins}
                          onClick={() =>
                            handleQuickTimerPreset(
                              dev.key,
                              mins,
                              isActive ? "off" : "on"
                            )
                          }
                          title={`Set ${mins} min timer`}
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all",
                            isActive
                              ? "bg-white/10 text-neutral-300 hover:bg-white/20 hover:text-white"
                              : "bg-[#edece8] text-[#55565d] hover:bg-[#dedcd5] hover:text-[#18191c]"
                          )}
                        >
                          +{mins}m
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openTimerForDevice(dev.key)}
                        title="Custom Timer"
                        className={cn(
                          "p-1 rounded text-[10px] font-mono flex items-center gap-0.5 transition-all",
                          isActive
                            ? "hover:bg-white/15 text-neutral-300"
                            : "hover:bg-[#dedcd5] text-[#55565d]"
                        )}
                      >
                        <Timer className="w-3 h-3 text-amber-500" />
                      </button>

                      <button
                        onClick={() => openScheduleForDevice(dev.key)}
                        title="Schedule Routine"
                        className={cn(
                          "p-1 rounded text-[10px] font-mono flex items-center gap-0.5 transition-all",
                          isActive
                            ? "hover:bg-white/15 text-neutral-300"
                            : "hover:bg-[#dedcd5] text-[#55565d]"
                        )}
                      >
                        <Clock className="w-3 h-3 text-indigo-400" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── SCHEDULED ROUTINES DECK (RECURRING / CLOCK TIME) ── */}
        <div className="clay-card p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-[#18191c] font-mono">
                Scheduled Routines ({routines.length})
              </h2>
              <p className="text-xs text-[#797a82]">
                Daily and weekly automation routines evaluated every minute in Asia/Kolkata (IST)
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {[
                { id: "all", label: "All Routines" },
                { id: "daily", label: "Daily" },
                { id: "weekdays", label: "Mon – Fri" },
                { id: "weekends", label: "Weekends" },
                { id: "custom", label: "Custom / Once" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    haptic.tick();
                    setRoutineTabFilter(tab.id);
                  }}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap",
                    routineTabFilter === tab.id
                      ? "bg-[#18191c] text-white shadow-sm"
                      : "bg-[#edece8] text-[#55565d] hover:text-[#18191c] hover:bg-white/70"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredRoutines.length === 0 ? (
            <div className="text-center py-10 px-4 bg-white/50 rounded-2xl border border-black/[0.05] space-y-3">
              <Clock className="w-8 h-8 text-[#9b9a94] mx-auto" />
              <p className="text-xs font-bold text-[#18191c]">
                No scheduled routines found in this filter
              </p>
              <button
                onClick={() => {
                  setModalTab("schedule");
                  setIsModalOpen(true);
                }}
                className="clay-btn text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Your First Routine</span>
              </button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRoutines.map((routine) => {
                const devMeta = getDeviceMeta(routine.device);
                const DevIcon = devMeta.icon;
                const isTargetOn = routine.action === "on";
                const isEnabled = routine.enabled !== false;

                return (
                  <div
                    key={routine.id}
                    className={cn(
                      "p-4 rounded-2xl border transition-all duration-200 shadow-sm space-y-3 bg-white",
                      isEnabled
                        ? "border-black/[0.08]"
                        : "border-black/[0.04] opacity-70 bg-neutral-50"
                    )}
                  >
                    {/* Header: Time + Enable Toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-black font-mono tracking-tight text-[#18191c]">
                          {formatTime12H(routine.time || "")}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-[#797a82]">
                          IST
                        </span>
                      </div>

                      {/* Enable/Pause Switch */}
                      <div
                        onClick={() => toggleSchedule(routine.id, !isEnabled)}
                        className={cn(
                          "clay-switch shrink-0 cursor-pointer",
                          isEnabled && "checked !bg-[#18191c]"
                        )}
                      >
                        <span
                          className={cn(
                            "clay-switch-thumb",
                            isEnabled && "translate-x-5 !bg-white"
                          )}
                        />
                      </div>
                    </div>

                    {/* Device + Action Badge */}
                    <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#edece8] border border-black/[0.04]">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#18191c] text-white flex items-center justify-center shrink-0">
                          <DevIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#18191c] truncate">
                            {devMeta.name}
                          </p>
                          <p className="text-[9px] font-mono text-[#797a82]">
                            {devMeta.room}
                          </p>
                        </div>
                      </div>

                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0",
                          isTargetOn
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-rose-100 text-rose-800 border border-rose-300"
                        )}
                      >
                        {isTargetOn ? "Turn ON" : "Turn OFF"}
                      </span>
                    </div>

                    {/* Recurrence Days Badges */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[9px] font-mono text-[#797a82] font-bold">
                        <span>Repeats: {formatDaysSummary(routine)}</span>
                        {routine.notification !== false && (
                          <span className="flex items-center gap-1 text-sky-600">
                            <Bell className="w-2.5 h-2.5" /> Telegram
                          </span>
                        )}
                      </div>

                      {/* Day Bubbles */}
                      <div className="flex items-center gap-1">
                        {DAY_LABELS.map((day, idx) => {
                          const isActiveDay =
                            routine.repeatType === "everyday" ||
                            (!routine.repeatType && routine.days?.length === 7) ||
                            (routine.days && routine.days.includes(idx));

                          return (
                            <span
                              key={day}
                              className={cn(
                                "flex-1 py-1 text-center rounded text-[9px] font-mono font-bold",
                                isActiveDay
                                  ? "bg-[#18191c] text-white"
                                  : "bg-[#edece8] text-[#9b9a94]"
                              )}
                            >
                              {day[0]}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Footer Actions: Run Now + Delete */}
                    <div className="pt-2 border-t border-black/[0.05] flex items-center justify-between">
                      <button
                        onClick={() => executeNow(routine)}
                        className="text-[11px] font-bold text-[#55565d] hover:text-[#18191c] flex items-center gap-1 transition-colors"
                      >
                        <Play className="w-3 h-3 fill-[#55565d]" /> Test Now
                      </button>

                      <button
                        onClick={() => deleteSchedule(routine.id)}
                        className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── CREATE / EDIT MODAL DIALOG ── */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl bg-[#edece8] border border-black/[0.08] shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-[#18191c]">
                    {modalTab === "timer"
                      ? "Set Countdown Timer"
                      : "Create Scheduled Routine"}
                  </h3>
                  <p className="text-[11px] text-[#797a82]">
                    {modalTab === "timer"
                      ? "Executes after elapsed duration"
                      : "Triggers automatically at designated clock time"}
                  </p>
                </div>

                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-[#797a82] hover:text-[#18191c] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mode Tabs */}
              <div className="clay-pill-bar flex p-1 rounded-2xl bg-white/60 border border-black/[0.06]">
                <button
                  type="button"
                  onClick={() => setModalTab("timer")}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                    modalTab === "timer"
                      ? "bg-[#18191c] text-white shadow-sm"
                      : "text-[#55565d] hover:text-[#18191c]"
                  )}
                >
                  <Timer className="w-3.5 h-3.5" />
                  <span>Countdown Timer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalTab("schedule")}
                  className={cn(
                    "flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5",
                    modalTab === "schedule"
                      ? "bg-[#18191c] text-white shadow-sm"
                      : "text-[#55565d] hover:text-[#18191c]"
                  )}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Scheduled Routine</span>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* 1. Device Picker */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#18191c] flex items-center justify-between">
                    <span>Select Target Switch</span>
                    <span className="text-[10px] font-mono text-[#797a82]">
                      {getDeviceMeta(formDevice).room}
                    </span>
                  </label>
                  <select
                    value={formDevice}
                    onChange={(e) => setFormDevice(e.target.value)}
                    className="w-full rounded-xl bg-white border border-black/[0.08] px-3 py-2 text-xs font-bold text-[#18191c] outline-none focus:border-[#18191c] shadow-sm cursor-pointer"
                  >
                    {ALL_DEVICES.map((d) => (
                      <option key={d.key} value={d.key}>
                        {d.name} ({d.room})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Target Action */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#18191c]">
                    Target Action
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormAction("off")}
                      className={cn(
                        "py-2.5 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2",
                        formAction === "off"
                          ? "bg-rose-500 text-white border-rose-600 shadow-sm"
                          : "bg-white text-[#55565d] border-black/[0.06] hover:bg-neutral-50"
                      )}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>Turn OFF / Disconnect</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormAction("on")}
                      className={cn(
                        "py-2.5 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2",
                        formAction === "on"
                          ? "bg-emerald-600 text-white border-emerald-700 shadow-sm"
                          : "bg-white text-[#55565d] border-black/[0.06] hover:bg-neutral-50"
                      )}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Turn ON / Energize</span>
                    </button>
                  </div>
                </div>

                {/* ── TIMER SPECIFIC CONTROLS ── */}
                {modalTab === "timer" && (
                  <div className="space-y-4 pt-1">
                    {/* Duration Preset Chips */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#18191c] flex items-center justify-between">
                        <span>Timer Duration</span>
                        <span className="text-xs font-mono font-bold text-amber-600">
                          {formDurationMinutes} minutes ({formatRemainingSeconds(formDurationMinutes * 60)})
                        </span>
                      </label>

                      <div className="grid grid-cols-4 gap-1.5">
                        {[1, 5, 15, 30, 45, 60, 120, 240].map((mins) => (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => setFormDurationMinutes(mins)}
                            className={cn(
                              "py-1.5 rounded-lg text-xs font-bold font-mono transition-all",
                              formDurationMinutes === mins
                                ? "bg-[#18191c] text-white shadow-sm"
                                : "bg-white text-[#55565d] hover:bg-neutral-100"
                            )}
                          >
                            {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                          </button>
                        ))}
                      </div>

                      <div className="pt-2">
                        <input
                          type="range"
                          min="1"
                          max="480"
                          step="1"
                          value={formDurationMinutes}
                          onChange={(e) =>
                            setFormDurationMinutes(parseInt(e.target.value, 10))
                          }
                          className="w-full accent-[#18191c] cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Auto Turn ON First Checkbox */}
                    <label className="flex items-center gap-2.5 p-3 rounded-xl bg-white border border-black/[0.06] cursor-pointer shadow-sm">
                      <input
                        type="checkbox"
                        checked={formAutoTurnOnFirst}
                        onChange={(e) => setFormAutoTurnOnFirst(e.target.checked)}
                        className="w-4 h-4 rounded text-[#18191c] accent-[#18191c] cursor-pointer"
                      />
                      <div>
                        <p className="text-xs font-bold text-[#18191c]">
                          Turn ON immediately now
                        </p>
                        <p className="text-[10px] text-[#797a82]">
                          Switch will turn ON now, then automatically turn OFF when timer expires
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                {/* ── SCHEDULE SPECIFIC CONTROLS ── */}
                {modalTab === "schedule" && (
                  <div className="space-y-4 pt-1">
                    {/* Time Picker */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#18191c]">
                        Execution Time (IST)
                      </label>
                      <div className="flex items-center gap-2">
                        {/* Hour */}
                        <select
                          value={formTimeHours}
                          onChange={(e) =>
                            setFormTimeHours(parseInt(e.target.value, 10))
                          }
                          className="flex-1 rounded-xl bg-white border border-black/[0.08] px-3 py-2 text-sm font-bold font-mono text-[#18191c] outline-none cursor-pointer"
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                            <option key={h} value={h}>
                              {String(h).padStart(2, "0")}
                            </option>
                          ))}
                        </select>

                        <span className="font-bold text-lg text-[#797a82]">:</span>

                        {/* Minute */}
                        <select
                          value={formTimeMinutes}
                          onChange={(e) =>
                            setFormTimeMinutes(parseInt(e.target.value, 10))
                          }
                          className="flex-1 rounded-xl bg-white border border-black/[0.08] px-3 py-2 text-sm font-bold font-mono text-[#18191c] outline-none cursor-pointer"
                        >
                          {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                            <option key={m} value={m}>
                              {String(m).padStart(2, "0")}
                            </option>
                          ))}
                        </select>

                        {/* AM/PM */}
                        <div className="flex rounded-xl bg-white border border-black/[0.08] p-0.5">
                          <button
                            type="button"
                            onClick={() => setFormTimeAmPm("AM")}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all",
                              formTimeAmPm === "AM"
                                ? "bg-[#18191c] text-white shadow-sm"
                                : "text-[#55565d]"
                            )}
                          >
                            AM
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormTimeAmPm("PM")}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all",
                              formTimeAmPm === "PM"
                                ? "bg-[#18191c] text-white shadow-sm"
                                : "text-[#55565d]"
                            )}
                          >
                            PM
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Recurrence Selector */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-[#18191c]">
                        Recurrence Frequency
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {[
                          { id: "everyday", label: "Everyday" },
                          { id: "weekdays", label: "Mon – Fri" },
                          { id: "weekends", label: "Weekends" },
                          { id: "custom", label: "Custom Days" },
                        ].map((rec) => (
                          <button
                            key={rec.id}
                            type="button"
                            onClick={() => setFormRepeatType(rec.id as RepeatType)}
                            className={cn(
                              "py-1.5 px-2 rounded-xl text-xs font-bold transition-all",
                              formRepeatType === rec.id
                                ? "bg-[#18191c] text-white shadow-sm"
                                : "bg-white text-[#55565d] hover:bg-neutral-100"
                            )}
                          >
                            {rec.label}
                          </button>
                        ))}
                      </div>

                      {/* Custom Days Checkbox Row */}
                      {formRepeatType === "custom" && (
                        <div className="pt-2 flex items-center justify-between gap-1">
                          {DAY_LABELS.map((day, idx) => {
                            const isSelected = formSelectedDays.includes(idx);
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setFormSelectedDays(
                                      formSelectedDays.filter((d) => d !== idx)
                                    );
                                  } else {
                                    setFormSelectedDays([...formSelectedDays, idx]);
                                  }
                                }}
                                className={cn(
                                  "flex-1 py-1.5 rounded-lg text-xs font-bold font-mono transition-all",
                                  isSelected
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : "bg-white text-[#55565d] hover:bg-neutral-100"
                                )}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. Telegram Notification Toggle */}
                <label className="flex items-center justify-between p-3 rounded-xl bg-white border border-black/[0.06] cursor-pointer shadow-sm">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-sky-600" />
                    <div>
                      <p className="text-xs font-bold text-[#18191c]">
                        Telegram Dispatch Alert
                      </p>
                      <p className="text-[10px] text-[#797a82]">
                        Send notification to bot subscribers when executed
                      </p>
                    </div>
                  </div>

                  <input
                    type="checkbox"
                    checked={formNotify}
                    onChange={(e) => setFormNotify(e.target.checked)}
                    className="w-4 h-4 rounded accent-[#18191c] cursor-pointer"
                  />
                </label>

                {/* 4. Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#dedcd5] hover:bg-[#d0cecd] text-[#18191c] transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="clay-btn-dark px-5 py-2 text-xs font-bold shadow-md"
                  >
                    {modalTab === "timer" ? "Start Countdown Timer" : "Save Scheduled Routine"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
