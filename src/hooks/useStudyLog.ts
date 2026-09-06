/**
 * useStudyLog – persists per-day study time in localStorage.
 *
 * Storage format (key "studyLog"):
 *   Record<string, number>   →  { "2024-09-06": 75, "2024-09-07": 30, ... }
 *   The value is total minutes studied on that day.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  createElement,
  type ReactNode,
} from "react";

const STORAGE_KEY = "studyLog";

type StudyLogMap = Record<string, number>; // date → minutes

interface StudyLogContextValue {
  /** Add (or accumulate) minutes for a given date (YYYY-MM-DD). */
  addEntry: (date: string, minutes: number) => void;
  /** Get total minutes logged for a given date. Returns 0 if none. */
  getEntry: (date: string) => number;
  /** Set of all dates that have at least 1 minute logged. */
  activeDates: Set<string>;
  /** Remove all stored entries (useful for testing). */
  clearAll: () => void;
}

const StudyLogContext = createContext<StudyLogContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function StudyLogProvider({ children }: { children: ReactNode }) {
  const [log, setLog] = useState<StudyLogMap>(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as StudyLogMap;
    } catch {
      /* ignore */
    }
    return {};
  });

  const logRef = useRef(log);
  logRef.current = log;

  // Persist to localStorage whenever log changes
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
    } catch {
      /* storage unavailable */
    }
  }, [log]);

  const addEntry = useCallback((date: string, minutes: number) => {
    setLog((prev) => ({
      ...prev,
      [date]: (prev[date] ?? 0) + minutes,
    }));
  }, []);

  const getEntry = useCallback(
    (date: string) => logRef.current[date] ?? 0,
    [],
  );

  const clearAll = useCallback(() => {
    setLog({});
  }, []);

  const activeDates = useMemo(
    () => new Set(Object.keys(log).filter((d) => (log[d] ?? 0) > 0)),
    [log],
  );

  const value = useMemo<StudyLogContextValue>(
    () => ({ addEntry, getEntry, activeDates, clearAll }),
    [addEntry, getEntry, activeDates, clearAll],
  );

  return createElement(StudyLogContext.Provider, { value }, children);
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useStudyLog(): StudyLogContextValue {
  const ctx = useContext(StudyLogContext);
  if (!ctx) {
    throw new Error("useStudyLog must be used inside <StudyLogProvider>");
  }
  return ctx;
}
