import { useCallback, useMemo, useSyncExternalStore } from "react";

const KEY = "hc-coin-best";
const listeners = new Set<() => void>();
let memory = "";

function read(): string {
  try {
    return localStorage.getItem(KEY) ?? memory;
  } catch {
    return memory;
  }
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

function parse(raw: string): Record<string, number> {
  try {
    const v: unknown = JSON.parse(raw);
    return v && typeof v === "object" ? (v as Record<string, number>) : {};
  } catch {
    return {};
  }
}

export function useBest(key: string): [number, (value: number) => void] {
  const raw = useSyncExternalStore(subscribe, read, () => "");
  const best = useMemo(() => Number(parse(raw)[key]) || 0, [raw, key]);
  const save = useCallback(
    (value: number) => {
      const map = parse(read());
      if (value <= (Number(map[key]) || 0)) return;
      map[key] = value;
      memory = JSON.stringify(map);
      try {
        localStorage.setItem(KEY, memory);
      } catch {}
      listeners.forEach((cb) => cb());
    },
    [key],
  );
  return [best, save];
}
