import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parses IoT node timestamps into millisecond epochs.
 * Supports:
 * - Epoch seconds or milliseconds (numbers or numeric strings)
 * - "DD/MM/YYYY HH:mm:ss [IST]" or "DD-MM-YYYY HH:mm:ss" (e.g. room1.ino)
 * - "HH:mm:ss DD-MM-YYYY" (e.g. IoTMesh last_update)
 * - ISO date strings
 */
export function parseNodeTimestampToMs(val?: string | number | null): number | null {
  if (val === undefined || val === null || val === "") return null;

  if (typeof val === "number") {
    if (isNaN(val) || val <= 0) return null;
    return val < 1e11 ? val * 1000 : val;
  }

  const str = String(val).trim();
  if (!str) return null;

  // Numeric string (e.g. "1726550000" or "1726550000000")
  const num = Number(str);
  if (!isNaN(num) && num > 1e7) {
    return num < 1e11 ? num * 1000 : num;
  }

  // Format 1: "DD/MM/YYYY HH:mm:ss [IST]" or "DD-MM-YYYY HH:mm:ss"
  const dmyMatch = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})[T\s]+(\d{1,2}):(\d{1,2}):(\d{1,2})/);
  if (dmyMatch) {
    const [, d, m, y, h, min, s] = dmyMatch.map(Number);
    // ESP32 NTP in IST (UTC+05:30) -> convert to UTC epoch ms
    return Date.UTC(y, m - 1, d, h, min, s) - 5.5 * 60 * 60 * 1000;
  }

  // Format 2: "HH:mm:ss DD-MM-YYYY" (IoTMesh last_update)
  const hmsMatch = str.match(/^(\d{1,2}):(\d{1,2}):(\d{1,2})[T\s]+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (hmsMatch) {
    const [, h, min, s, d, m, y] = hmsMatch.map(Number);
    return Date.UTC(y, m - 1, d, h, min, s) - 5.5 * 60 * 60 * 1000;
  }

  // Fallback to standard Date.parse
  const parsed = Date.parse(str);
  if (!isNaN(parsed)) return parsed;

  return null;
}

/**
 * Formats a node timestamp into a full, human-readable date & time string.
 * Prevents UI truncation and cleanly displays:
 * - "Today at 01:45:12 PM"
 * - "Yesterday at 06:30:33 PM"
 * - "16/09/2026, 06:30:33 PM"
 */
export function formatNodeLastSeen(val?: string | number | null): string {
  if (val === undefined || val === null || val === "") return "—";

  const ms = parseNodeTimestampToMs(val);
  if (!ms) {
    return String(val);
  }

  const date = new Date(ms);
  const now = new Date();

  const timeStr = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    return `Today at ${timeStr}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  if (isYesterday) {
    return `Yesterday at ${timeStr}`;
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}, ${timeStr}`;
}
