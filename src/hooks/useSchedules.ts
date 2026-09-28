import { useState, useEffect, useMemo, useCallback } from "react";
import { firebaseService, ScheduleItem, ScheduleType, ScheduleAction, RepeatType, ControlData } from "@/lib/firebase";
import { getDeviceMeta } from "@/lib/devices";
import { toast } from "sonner";
import { sounds } from "@/lib/sounds";
import { haptic } from "@/lib/haptic";

export interface CreateTimerParams {
  device: keyof ControlData | string;
  action: ScheduleAction;
  durationMinutes: number;
  name?: string;
  autoTurnOnFirst?: boolean;
  notification?: boolean;
}

export interface CreateScheduleParams {
  device: keyof ControlData | string;
  action: ScheduleAction;
  time: string; // "HH:mm"
  days?: number[];
  repeatType?: RepeatType;
  specificDate?: string;
  name?: string;
  notification?: boolean;
}

export interface DeviceScheduleInfo {
  activeTimer: ScheduleItem | null;
  timerRemainingSeconds: number;
  timerRemainingFormatted: string;
  timerProgressPercent: number;
  nextSchedule: ScheduleItem | null;
  scheduleFormatted: string;
  hasScheduleOrTimer: boolean;
  badgeType: "timer" | "schedule" | null;
  badgeText: string;
  allDeviceSchedules: ScheduleItem[];
}

export function formatRemainingSeconds(sec: number): string {
  if (sec <= 0) return "0s";
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export function formatTime12H(time24: string): string {
  if (!time24) return "";
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr || "00";
  if (isNaN(h)) return time24;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
}

export function formatDaysSummary(item: ScheduleItem): string {
  if (item.specificDate) {
    return item.specificDate;
  }
  if (item.repeatType === "everyday") return "Daily";
  if (item.repeatType === "weekdays") return "Mon – Fri";
  if (item.repeatType === "weekends") return "Sat & Sun";
  if (item.repeatType === "once") return "Once";

  if (Array.isArray(item.days) && item.days.length > 0) {
    if (item.days.length === 7) return "Daily";
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return item.days.map((d) => dayNames[d]).join(", ");
  }

  return "Daily";
}

export function useSchedules() {
  const [schedulesMap, setSchedulesMap] = useState<Record<string, ScheduleItem>>({});
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState<number>(Date.now());

  // Realtime subscription from Firebase
  useEffect(() => {
    const unsub = firebaseService.listenToSchedules((data) => {
      setSchedulesMap(data || {});
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 1-second interval ticker for smooth live UI countdowns
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // All schedules as flat array
  const allItems = useMemo(() => Object.values(schedulesMap), [schedulesMap]);

  // Timers
  const timers = useMemo(() => {
    return allItems
      .filter((item) => item.type === "timer")
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [allItems]);

  // Active timers (running now and targetTimestamp in future)
  const activeTimers = useMemo(() => {
    return timers.filter((t) => {
      if (t.status !== "active" || t.enabled === false) return false;
      if (!t.targetTimestamp) return false;
      return t.targetTimestamp > now;
    });
  }, [timers, now]);

  // Scheduled routines
  const routines = useMemo(() => {
    return allItems
      .filter((item) => item.type === "schedule")
      .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  }, [allItems]);

  // Active scheduled routines
  const activeRoutines = useMemo(() => {
    return routines.filter((r) => r.enabled !== false);
  }, [routines]);

  // Create a new Countdown Timer
  const createTimer = useCallback(
    async (params: CreateTimerParams): Promise<string> => {
      const id = `timer_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const targetTimestamp = Date.now() + params.durationMinutes * 60 * 1000;
      const deviceMeta = getDeviceMeta(params.device);

      const actionText = params.action === "on" ? "Turn ON" : "Turn OFF";
      const name =
        params.name?.trim() ||
        `${actionText} ${deviceMeta.name} in ${params.durationMinutes}m`;

      const item: ScheduleItem = {
        id,
        name,
        type: "timer",
        device: params.device,
        action: params.action,
        enabled: true,
        durationMinutes: params.durationMinutes,
        targetTimestamp,
        autoTurnOnFirst: !!params.autoTurnOnFirst,
        status: "active",
        createdAt: Date.now(),
        notification: params.notification ?? true,
      };

      try {
        // If autoTurnOnFirst is true, energize the switch right now!
        if (params.autoTurnOnFirst) {
          await firebaseService.updateSwitchState(params.device as keyof ControlData, true);
        }

        await firebaseService.saveSchedule(item);
        sounds.success();
        haptic.medium();
        toast.success("Countdown Timer Set ⏱️", {
          description: `${name} (${formatRemainingSeconds(params.durationMinutes * 60)})`,
        });
        return id;
      } catch (err: any) {
        sounds.error();
        haptic.error();
        toast.error("Failed to set timer", { description: err.message });
        throw err;
      }
    },
    []
  );

  // Create a new Scheduled Routine
  const createSchedule = useCallback(
    async (params: CreateScheduleParams): Promise<string> => {
      const id = `sched_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const deviceMeta = getDeviceMeta(params.device);
      const actionText = params.action === "on" ? "Turn ON" : "Turn OFF";
      const timeDisplay = formatTime12H(params.time);

      const name =
        params.name?.trim() ||
        `${actionText} ${deviceMeta.name} at ${timeDisplay}`;

      const item: ScheduleItem = {
        id,
        name,
        type: "schedule",
        device: params.device,
        action: params.action,
        time: params.time,
        days: params.days || [0, 1, 2, 3, 4, 5, 6],
        repeatType: params.repeatType || "everyday",
        enabled: true,
        createdAt: Date.now(),
        notification: params.notification ?? true,
      };

      if (params.specificDate) {
        item.specificDate = params.specificDate;
      }

      try {
        await firebaseService.saveSchedule(item);
        sounds.success();
        haptic.medium();
        toast.success("Schedule Created ⏰", {
          description: `${name} • ${formatDaysSummary(item)}`,
        });
        return id;
      } catch (err: any) {
        sounds.error();
        haptic.error();
        toast.error("Failed to create schedule", { description: err.message });
        throw err;
      }
    },
    []
  );

  // Toggle Schedule / Routine enable state
  const toggleSchedule = useCallback(async (id: string, enabled: boolean) => {
    try {
      await firebaseService.updateSchedule(id, { enabled });
      haptic.tick();
      sounds.click();
      toast.success(enabled ? "Routine Enabled ⏰" : "Routine Paused ⏸️");
    } catch (err: any) {
      toast.error("Error updating schedule", { description: err.message });
    }
  }, []);

  // Cancel an active timer
  const cancelTimer = useCallback(async (id: string) => {
    try {
      await firebaseService.updateSchedule(id, {
        status: "cancelled",
        enabled: false,
      });
      haptic.medium();
      sounds.click();
      toast.success("Timer Cancelled 🛑");
    } catch (err: any) {
      toast.error("Failed to cancel timer", { description: err.message });
    }
  }, []);

  // Add more time to an active timer (+5 min, +15 min, etc.)
  const addTimeToTimer = useCallback(
    async (id: string, additionalMinutes: number) => {
      const existing = schedulesMap[id];
      if (!existing || !existing.targetTimestamp) return;

      const newTarget = Math.max(Date.now(), existing.targetTimestamp) + additionalMinutes * 60 * 1000;
      const newDuration = (existing.durationMinutes || 0) + additionalMinutes;

      try {
        await firebaseService.updateSchedule(id, {
          targetTimestamp: newTarget,
          durationMinutes: newDuration,
          status: "active",
          enabled: true,
        });
        haptic.tick();
        sounds.success();
        toast.success(`+${additionalMinutes} Minutes Added ⏱️`);
      } catch (err: any) {
        toast.error("Failed to extend timer", { description: err.message });
      }
    },
    [schedulesMap]
  );

  // Delete a schedule or timer completely
  const deleteSchedule = useCallback(async (id: string) => {
    try {
      await firebaseService.deleteSchedule(id);
      haptic.heavy();
      sounds.click();
      toast.success("Deleted successfully 🗑️");
    } catch (err: any) {
      toast.error("Failed to delete", { description: err.message });
    }
  }, []);

  // Manually trigger a schedule or timer right now (Execute Now)
  const executeNow = useCallback(async (item: ScheduleItem) => {
    try {
      const targetState = item.action === "on";
      await firebaseService.updateSwitchState(item.device as keyof ControlData, targetState);
      haptic.heavy();
      sounds.success();
      const devMeta = getDeviceMeta(item.device);
      toast.success(`Action Executed: ${devMeta.name} → ${targetState ? "ON" : "OFF"}`);

      if (item.type === "timer") {
        await firebaseService.updateSchedule(item.id, {
          status: "completed",
          completedAt: Date.now(),
          enabled: false,
        });
      }
    } catch (err: any) {
      toast.error("Failed to execute action", { description: err.message });
    }
  }, []);

  // Device-level query helper: returns active timer countdown, next schedule, and badge info
  const getDeviceScheduleInfo = useCallback(
    (deviceKey: string): DeviceScheduleInfo => {
      const deviceItems = allItems.filter((i) => i.device === deviceKey);

      // Find active countdown timer for this device
      const activeTimer =
        deviceItems.find(
          (t) =>
            t.type === "timer" &&
            t.status === "active" &&
            t.enabled !== false &&
            (t.targetTimestamp || 0) > now
        ) || null;

      let timerRemainingSeconds = 0;
      let timerRemainingFormatted = "";
      let timerProgressPercent = 0;

      if (activeTimer && activeTimer.targetTimestamp) {
        timerRemainingSeconds = Math.max(0, Math.round((activeTimer.targetTimestamp - now) / 1000));
        timerRemainingFormatted = formatRemainingSeconds(timerRemainingSeconds);

        const totalDurationSec = (activeTimer.durationMinutes || 1) * 60;
        const elapsedSec = Math.max(0, totalDurationSec - timerRemainingSeconds);
        timerProgressPercent = Math.min(100, Math.max(0, (elapsedSec / totalDurationSec) * 100));
      }

      // Find enabled routines for this device
      const deviceRoutines = deviceItems.filter(
        (r) => r.type === "schedule" && r.enabled !== false
      );
      const nextSchedule = deviceRoutines[0] || null;

      let scheduleFormatted = "";
      if (nextSchedule) {
        scheduleFormatted = `${formatTime12H(nextSchedule.time || "")} • ${formatDaysSummary(nextSchedule)}`;
      }

      let badgeType: "timer" | "schedule" | null = null;
      let badgeText = "";

      if (activeTimer) {
        badgeType = "timer";
        const actionWord = activeTimer.action === "on" ? "ON in" : "OFF in";
        badgeText = `⏱️ ${actionWord} ${timerRemainingFormatted}`;
      } else if (nextSchedule) {
        badgeType = "schedule";
        badgeText = `⏰ ${formatTime12H(nextSchedule.time || "")} (${nextSchedule.action === "on" ? "ON" : "OFF"})`;
      }

      return {
        activeTimer,
        timerRemainingSeconds,
        timerRemainingFormatted,
        timerProgressPercent,
        nextSchedule,
        scheduleFormatted,
        hasScheduleOrTimer: !!(activeTimer || nextSchedule),
        badgeType,
        badgeText,
        allDeviceSchedules: deviceItems,
      };
    },
    [allItems, now]
  );

  return {
    schedulesMap,
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
  };
}
