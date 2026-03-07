// ── haptic.ts ──────────────────────────────────────────
// Vibration feedback utility using the Web Vibration API.
// Silently ignored on desktop and unsupported browsers.
// Usage: import { haptic } from "@/lib/haptic";
// ────────────────────────────────────────────────────────

export const haptic = {
  light:     () => navigator.vibrate?.(50),
  medium:    () => navigator.vibrate?.(100),
  heavy:     () => navigator.vibrate?.(200),

  armed:     () => navigator.vibrate?.([80, 40, 80, 40, 80]),
  disarmed:  () => navigator.vibrate?.(150),
  wrong:     () => navigator.vibrate?.([100, 50, 100]),
  fire:      () => navigator.vibrate?.([300, 100, 300]),
  complete:  () => navigator.vibrate?.(400),
  tick:      () => navigator.vibrate?.(30),
  countdown: (remaining: number) => navigator.vibrate?.(remaining === 1 ? 120 : 60),

  success:   () => navigator.vibrate?.([50, 30, 80]),
  error:     () => navigator.vibrate?.([100, 40, 100, 40, 100]),
  warning:   () => navigator.vibrate?.([80, 40, 80]),
  click:     () => navigator.vibrate?.(20),
};
