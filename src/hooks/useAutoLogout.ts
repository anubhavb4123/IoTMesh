import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const AUTO_LOGOUT_TIME = 30 * 60 * 1000; // 30 minutes

export function useAutoLogout() {
  const { setRole } = useAuth();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [remaining, setRemaining] = useState(AUTO_LOGOUT_TIME);

  const logout = () => {
    localStorage.removeItem("mock_user");
    setRole(null);
    window.location.href = "/auth";
  };

  const resetTimer = () => {
    setRemaining(AUTO_LOGOUT_TIME);

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(logout, AUTO_LOGOUT_TIME);
  };

  useEffect(() => {
    resetTimer();

    const updateRemaining = setInterval(() => {
      setRemaining((prev) => Math.max(prev - 1000, 0));
    }, 1000);

    const events = ["mousemove", "keydown", "click", "touchstart"];

    events.forEach((event) =>
      window.addEventListener(event, resetTimer)
    );

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      clearInterval(updateRemaining);

      events.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      );
    };
  }, []);

  return { remaining };
}