import { logout } from "@/auth/authApi.ts";
import { refreshSession } from "@/shared/api.ts";
import { useCallback, useEffect, useRef, useState } from "react";
export function useSessionActivity() {
  const [warning, setWarning] = useState(false);
  const lastActivity = useRef(Date.now());
  const lastRefresh = useRef(Date.now());
  const noteActivity = useCallback(() => {
    const now = Date.now();
    lastActivity.current = now;
    setWarning(false);
    if (now - lastRefresh.current >= 60000) {
      lastRefresh.current = now;
      void refreshSession().catch(() => {});
    }
  }, []);
  useEffect(() => {
    const events = ["pointerdown", "keydown", "scroll", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, noteActivity, { passive: true }));
    const timer = setInterval(() => {
      const idle = Date.now() - lastActivity.current;
      if (idle >= 30 * 60000) {
        void logout().catch(() => {});
      } else setWarning(idle >= 25 * 60000);
    }, 30000);
    return () => {
      clearInterval(timer);
      events.forEach((e) => window.removeEventListener(e, noteActivity));
    };
  }, [noteActivity]);
  return { warning, noteActivity };
}
