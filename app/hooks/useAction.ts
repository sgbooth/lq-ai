import { useCallback, useRef, useState } from "react";
export function useAction() {
  const running = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const run = useCallback(async (action: () => Promise<unknown>, message = "") => {
    if (running.current) return false;
    running.current = true;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await action();
      setSuccess(message);
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : "The action failed.");
      return false;
    } finally {
      running.current = false;
      setBusy(false);
    }
  }, []);
  return {
    run,
    busy,
    error,
    success,
    clear: () => {
      setError("");
      setSuccess("");
    },
  };
}
