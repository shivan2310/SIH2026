import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { circuitToCode, parseCode, type ParseError } from "@/lib/quantum/code";
import { GATES, totalQubits } from "@/lib/quantum/gates";
import {
  MAX_QUBITS,
  MIN_QUBITS,
  canPlace,
  createEmptyCircuit,
  newGateId,
  normalizeColumns,
  removeGate,
  setQubitCount,
  updateGate,
  type GateInstance,
  type GateType,
  type QCircuit,
} from "@/lib/quantum/ir";
import { getBackend } from "@/lib/quantum/backend";
import type { SimulationResult } from "@/lib/quantum/simulator";
import { exampleCircuit } from "@/lib/quantum/examples";

const STORAGE_KEY = "quantumlab.circuit.v1";

export interface LabState {
  circuit: QCircuit;
  code: string;
  codeErrors: ParseError[];
  result: SimulationResult | null;
  running: boolean;
  runError: string | null;
  shots: number;
  seed: number;
  backendId: string;
  step: number;
  selectedId: string | null;
  canUndo: boolean;
  canRedo: boolean;
}

export function useCircuitLab() {
  const [circuit, setCircuitState] = useState<QCircuit>(() =>
    createEmptyCircuit(2),
  );
  const [code, setCode] = useState<string>(() =>
    circuitToCode(createEmptyCircuit(2)),
  );
  const [codeErrors, setCodeErrors] = useState<ParseError[]>([]);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [running, setRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [shots, setShots] = useState(1024);
  const [seed, setSeed] = useState(1337);
  const [backendId, setBackendId] = useState("browser-statevector");
  const [step, setStep] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const past = useRef<QCircuit[]>([]);
  const future = useRef<QCircuit[]>([]);
  const [historyTick, setHistoryTick] = useState(0);
  const hydrated = useRef(false);

  const applyCircuit = useCallback(
    (next: QCircuit, opts: { history?: boolean } = {}) => {
      setCircuitState((prev) => {
        if (opts.history !== false) {
          past.current = [...past.current.slice(-49), prev];
          future.current = [];
        }
        return next;
      });
      setCode(circuitToCode(next));
      setCodeErrors([]);
      setHistoryTick((t) => t + 1);
    },
    [],
  );

  // Restore the last session's circuit after hydration.
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as QCircuit;
      if (parsed && typeof parsed.numQubits === "number" && Array.isArray(parsed.gates)) {
        setCircuitState(parsed);
        setCode(circuitToCode(parsed));
      }
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(circuit));
    } catch {
      /* storage full or unavailable */
    }
  }, [circuit]);

  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    setCircuitState((current) => {
      future.current = [...future.current, current];
      return prev;
    });
    setCode(circuitToCode(prev));
    setCodeErrors([]);
    setHistoryTick((t) => t + 1);
  }, []);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    setCircuitState((current) => {
      past.current = [...past.current, current];
      return next;
    });
    setCode(circuitToCode(next));
    setCodeErrors([]);
    setHistoryTick((t) => t + 1);
  }, []);

  /** Code editor edits: parse and adopt when valid. */
  const onCodeChange = useCallback((text: string) => {
    setCode(text);
    const { circuit: parsed, errors } = parseCode(text);
    setCodeErrors(errors);
    if (parsed) {
      setCircuitState((prev) => {
        past.current = [...past.current.slice(-49), prev];
        future.current = [];
        return parsed;
      });
      setHistoryTick((t) => t + 1);
    }
  }, []);

  const placeGate = useCallback(
    (type: GateType, qubit: number, column: number) => {
      const def = GATES[type];
      const need = totalQubits(def);
      setCircuitState((prev) => {
        let numQubits = prev.numQubits;
        let start = qubit;
        if (qubit + need > numQubits) {
          if (qubit + need <= MAX_QUBITS) numQubits = qubit + need;
          else start = Math.max(0, numQubits - need);
        }
        const span = Array.from({ length: need }, (_, i) => start + i);
        if (span.some((q) => q >= numQubits)) return prev;
        const base = { ...prev, numQubits };
        if (!canPlace(base, span, column)) return prev;
        const gate: GateInstance = {
          id: newGateId(),
          type,
          controls: span.slice(0, def.controls),
          targets: span.slice(def.controls),
          params: def.params.map(() => Math.PI / 2),
          column,
        };
        const next = { ...base, gates: [...base.gates, gate] };
        past.current = [...past.current.slice(-49), prev];
        future.current = [];
        setCode(circuitToCode(next));
        setCodeErrors([]);
        return next;
      });
      setHistoryTick((t) => t + 1);
    },
    [],
  );

  const moveGate = useCallback(
    (id: string, qubit: number, column: number) => {
      setCircuitState((prev) => {
        const gate = prev.gates.find((g) => g.id === id);
        if (!gate) return prev;
        const span = [...gate.controls, ...gate.targets];
        const lo = Math.min(...span);
        const delta = qubit - lo;
        const moved = span.map((q) => q + delta);
        if (moved.some((q) => q < 0 || q >= prev.numQubits)) return prev;

        // If target cell is occupied by another single-qubit gate, swap them!
        if (!canPlace(prev, moved, column, id)) {
          if (span.length === 1) {
            const other = prev.gates.find(
              (g) =>
                g.id !== id &&
                g.column === column &&
                g.targets.includes(qubit) &&
                g.controls.length === 0 &&
                g.targets.length === 1,
            );
            if (other) {
              const oldQubit = lo;
              const next = {
                ...prev,
                gates: prev.gates.map((g) => {
                  if (g.id === id) return { ...g, column, targets: [qubit] };
                  if (g.id === other.id)
                    return { ...g, column: gate.column, targets: [oldQubit] };
                  return g;
                }),
              };
              past.current = [...past.current.slice(-49), prev];
              future.current = [];
              setCode(circuitToCode(next));
              setCodeErrors([]);
              return next;
            }
          }
          return prev;
        }

        const next = {
          ...prev,
          gates: prev.gates.map((g) =>
            g.id === id
              ? {
                  ...g,
                  column,
                  controls: g.controls.map((q) => q + delta),
                  targets: g.targets.map((q) => q + delta),
                }
              : g,
          ),
        };
        past.current = [...past.current.slice(-49), prev];
        future.current = [];
        setCode(circuitToCode(next));
        setCodeErrors([]);
        return next;
      });
      setHistoryTick((t) => t + 1);
    },
    [],
  );

  const reorderQubits = useCallback(
    (fromQubit: number, toQubit: number) => {
      if (fromQubit === toQubit) return;
      setCircuitState((prev) => {
        if (
          fromQubit < 0 ||
          fromQubit >= prev.numQubits ||
          toQubit < 0 ||
          toQubit >= prev.numQubits
        ) {
          return prev;
        }
        const swapQ = (q: number) => {
          if (q === fromQubit) return toQubit;
          if (q === toQubit) return fromQubit;
          return q;
        };
        const next = {
          ...prev,
          gates: prev.gates.map((g) => ({
            ...g,
            controls: g.controls.map(swapQ),
            targets: g.targets.map(swapQ),
          })),
        };
        past.current = [...past.current.slice(-49), prev];
        future.current = [];
        setCode(circuitToCode(next));
        setCodeErrors([]);
        return next;
      });
      setHistoryTick((t) => t + 1);
    },
    [],
  );

  const deleteGate = useCallback(
    (id: string) => {
      applyCircuit(normalizeColumns(removeGate(circuit, id)));
      setSelectedId((s) => (s === id ? null : s));
    },
    [applyCircuit, circuit],
  );

  const setGateParam = useCallback(
    (id: string, index: number, value: number) => {
      const gate = circuit.gates.find((g) => g.id === id);
      if (!gate) return;
      const params = [...gate.params];
      params[index] = value;
      applyCircuit(updateGate(circuit, id, { params }));
    },
    [applyCircuit, circuit],
  );

  const addQubit = useCallback(() => {
    if (circuit.numQubits >= MAX_QUBITS) return;
    applyCircuit(setQubitCount(circuit, circuit.numQubits + 1));
  }, [applyCircuit, circuit]);

  const removeQubit = useCallback(() => {
    if (circuit.numQubits <= MIN_QUBITS) return;
    applyCircuit(setQubitCount(circuit, circuit.numQubits - 1));
  }, [applyCircuit, circuit]);

  const clear = useCallback(() => {
    applyCircuit(createEmptyCircuit(circuit.numQubits));
    setResult(null);
  }, [applyCircuit, circuit.numQubits]);

  const loadExample = useCallback(
    (id: string) => {
      const ex = exampleCircuit(id);
      if (ex) {
        applyCircuit(ex);
        setResult(null);
        setStep(0);
      }
    },
    [applyCircuit],
  );

  const loadCircuit = useCallback(
    (next: QCircuit) => {
      applyCircuit(next);
      setResult(null);
      setStep(0);
    },
    [applyCircuit],
  );

  const run = useCallback(async () => {
    setRunning(true);
    setRunError(null);
    try {
      // Small simulated execution latency (350ms) so user perceives real computation
      await new Promise((resolve) => setTimeout(resolve, 350));
      const backend = getBackend(backendId);
      const res = await backend.run(circuit, { shots, seed, trace: true });
      setResult(res);
      setStep(res.steps.length - 1);
      return res;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Simulation failed.";
      setRunError(msg);
      setResult(null);
      throw err;
    } finally {
      setRunning(false);
    }
  }, [backendId, circuit, seed, shots]);

  const state: LabState = useMemo(
    () => ({
      circuit,
      code,
      codeErrors,
      result,
      running,
      runError,
      shots,
      seed,
      backendId,
      step,
      selectedId,
      canUndo: past.current.length > 0,
      canRedo: future.current.length > 0,
    }),
    // historyTick forces canUndo/canRedo to refresh with the refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      circuit,
      code,
      codeErrors,
      result,
      running,
      runError,
      shots,
      seed,
      backendId,
      step,
      selectedId,
      historyTick,
    ],
  );

  return {
    ...state,
    setShots,
    setSeed,
    setBackendId,
    setStep,
    setSelectedId,
    placeGate,
    moveGate,
    deleteGate,
    setGateParam,
    addQubit,
    removeQubit,
    clear,
    loadExample,
    loadCircuit,
    reorderQubits,
    onCodeChange,
    undo,
    redo,
    run,
  };
}
