/**
 * QCircuit IR — the canonical internal representation of a quantum circuit.
 *
 * Every surface of the platform (drag-and-drop builder, code editor,
 * simulators, visualizations, AI services) reads and writes this shape.
 * Nothing else should invent its own circuit format.
 */

export type GateType =
  | "h"
  | "x"
  | "y"
  | "z"
  | "s"
  | "sdg"
  | "t"
  | "tdg"
  | "rx"
  | "ry"
  | "rz"
  | "cx"
  | "cz"
  | "swap"
  | "ccx"
  | "measure";

export interface GateInstance {
  /** Stable unique id for React keys / drag operations. */
  id: string;
  type: GateType;
  /** Qubit indices the gate acts on (order matters for swap / targets). */
  targets: number[];
  /** Control qubit indices, if any. */
  controls: number[];
  /** Continuous parameters in radians (rx/ry/rz). */
  params: number[];
  /** Time step (column) in the circuit grid. */
  column: number;
}

export interface QCircuit {
  numQubits: number;
  gates: GateInstance[];
}

export const MAX_QUBITS = 12;
export const MIN_QUBITS = 1;

export function createEmptyCircuit(numQubits = 3): QCircuit {
  return { numQubits, gates: [] };
}

let idCounter = 0;
export function newGateId(): string {
  idCounter += 1;
  return `g${idCounter}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export function circuitDepth(circuit: QCircuit): number {
  return circuit.gates.reduce((m, g) => Math.max(m, g.column + 1), 0);
}

export function qubitsOf(gate: GateInstance): number[] {
  return [...gate.controls, ...gate.targets];
}

export function gateAt(
  circuit: QCircuit,
  qubit: number,
  column: number,
): GateInstance | undefined {
  return circuit.gates.find(
    (g) => g.column === column && qubitsOf(g).includes(qubit),
  );
}

/** True when every qubit the gate spans (including wires it crosses) is free. */
export function canPlace(
  circuit: QCircuit,
  qubits: number[],
  column: number,
  ignoreId?: string,
): boolean {
  const lo = Math.min(...qubits);
  const hi = Math.max(...qubits);
  const span: number[] = [];
  for (let q = lo; q <= hi; q++) span.push(q);
  return !circuit.gates.some((g) => {
    if (g.id === ignoreId) return false;
    if (g.column !== column) return false;
    const gq = qubitsOf(g);
    const glo = Math.min(...gq);
    const ghi = Math.max(...gq);
    return !(ghi < lo || glo > hi) && span.length > 0;
  });
}

/** Earliest column at or after `from` where the gate fits. */
export function firstFreeColumn(
  circuit: QCircuit,
  qubits: number[],
  from = 0,
): number {
  let col = from;
  while (!canPlace(circuit, qubits, col)) col += 1;
  return col;
}

export function addGate(circuit: QCircuit, gate: GateInstance): QCircuit {
  return { ...circuit, gates: [...circuit.gates, gate] };
}

export function removeGate(circuit: QCircuit, id: string): QCircuit {
  return { ...circuit, gates: circuit.gates.filter((g) => g.id !== id) };
}

export function updateGate(
  circuit: QCircuit,
  id: string,
  patch: Partial<GateInstance>,
): QCircuit {
  return {
    ...circuit,
    gates: circuit.gates.map((g) => (g.id === id ? { ...g, ...patch } : g)),
  };
}

export function setQubitCount(circuit: QCircuit, n: number): QCircuit {
  const numQubits = Math.min(MAX_QUBITS, Math.max(MIN_QUBITS, n));
  return {
    numQubits,
    gates: circuit.gates.filter((g) => qubitsOf(g).every((q) => q < numQubits)),
  };
}

/** Compact circuit columns so there are no empty time steps. */
export function normalizeColumns(circuit: QCircuit): QCircuit {
  const used = [...new Set(circuit.gates.map((g) => g.column))].sort(
    (a, b) => a - b,
  );
  const map = new Map(used.map((c, i) => [c, i]));
  return {
    ...circuit,
    gates: circuit.gates.map((g) => ({ ...g, column: map.get(g.column) ?? 0 })),
  };
}

/** Deterministic ordering: by column, then by lowest qubit. */
export function orderedGates(circuit: QCircuit): GateInstance[] {
  return [...circuit.gates].sort(
    (a, b) =>
      a.column - b.column || Math.min(...qubitsOf(a)) - Math.min(...qubitsOf(b)),
  );
}
