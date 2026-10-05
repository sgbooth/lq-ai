import { useCallback, useEffect, useRef, useState } from "react";
export function useResource<T>(
  load: (signal: AbortSignal) => Promise<T>,
  dependencies: readonly unknown[] = [],
  interval?: number,
) {
  const loader = useRef(load);
  loader.current = load;
  const generation = useRef(0);
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: string }>({
    data: null,
    loading: true,
    error: "",
  });
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision((value) => value + 1), []);
  const lastRevision = useRef(revision);
  useEffect(() => {
    const ticket = ++generation.current;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    // A reload refreshes the same resource: keep showing it. New dependencies clear it.
    const refreshing = lastRevision.current !== revision;
    lastRevision.current = revision;
    setState((state) => ({ data: refreshing ? state.data : null, loading: true, error: "" }));
    async function run() {
      try {
        const data = await loader.current(controller.signal);
        if (ticket === generation.current) setState({ data, loading: false, error: "" });
      } catch (error) {
        if (ticket === generation.current && !controller.signal.aborted)
          setState((state) => ({
            ...state,
            loading: false,
            error: error instanceof Error ? error.message : "Unable to load this page.",
          }));
      }
      if (interval && !controller.signal.aborted) timer = setTimeout(run, interval);
    }
    void run();
    return () => {
      ++generation.current;
      controller.abort();
      clearTimeout(timer);
    };
  }, [...dependencies, revision, interval]);
  return { ...state, reload };
}
