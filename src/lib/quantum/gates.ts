import type { GateType } from "./ir";

/** Complex 2x2 matrix, row-major: [[a,b],[c,d]] as [re, im] pairs. */
export type Complex = readonly [number, number];
export type Matrix2 = readonly [Complex, Complex, Complex, Complex];

const SQRT1_2 = Math.SQRT1_2;

export interface GateDef {
  type: GateType;
  label: string;
  name: string;
  description: string;
  /** number of target qubits */
  targets: number;
  /** number of control qubits */
  controls: number;
  /** parameter names (radians) */
  params: string[];
  /** category for the palette */
  category: "single" | "phase" | "rotation" | "multi" | "meta";
  /** single-qubit unitary (undefined for structural gates) */
  matrix?: (params: number[]) => Matrix2;
  color: string;
}

const I: Complex = [0, 0];
const ONE: Complex = [1, 0];

function rot(theta: number, axis: "x" | "y" | "z"): Matrix2 {
  const c = Math.cos(theta / 2);
  const s = Math.sin(theta / 2);
  if (axis === "x") return [[c, 0], [0, -s], [0, -s], [c, 0]];
  if (axis === "y") return [[c, 0], [-s, 0], [s, 0], [c, 0]];
  return [
    [Math.cos(-theta / 2), Math.sin(-theta / 2)],
    I,
    I,
    [Math.cos(theta / 2), Math.sin(theta / 2)],
  ];
}

export const GATES: Record<GateType, GateDef> = {
  h: {
    type: "h",
    label: "H",
    name: "Hadamard",
    description:
      "Creates an equal superposition: |0⟩ → (|0⟩+|1⟩)/√2. The workhorse of quantum parallelism.",
    targets: 1,
    controls: 0,
    params: [],
    category: "single",
    color: "var(--q-gate-h)",
    matrix: () => [
      [SQRT1_2, 0],
      [SQRT1_2, 0],
      [SQRT1_2, 0],
      [-SQRT1_2, 0],
    ],
  },
  x: {
    type: "x",
    label: "X",
    name: "Pauli-X (NOT)",
    description: "Bit flip: swaps |0⟩ and |1⟩. A π rotation about the X axis.",
    targets: 1,
    controls: 0,
    params: [],
    category: "single",
    color: "var(--q-gate-pauli)",
    matrix: () => [I, ONE, ONE, I],
  },
  y: {
    type: "y",
    label: "Y",
    name: "Pauli-Y",
    description: "Bit and phase flip: a π rotation about the Y axis.",
    targets: 1,
    controls: 0,
    params: [],
    category: "single",
    color: "var(--q-gate-pauli)",
    matrix: () => [I, [0, -1], [0, 1], I],
  },
  z: {
    type: "z",
    label: "Z",
    name: "Pauli-Z",
    description: "Phase flip: leaves |0⟩ alone and maps |1⟩ → −|1⟩.",
    targets: 1,
    controls: 0,
    params: [],
    category: "single",
    color: "var(--q-gate-pauli)",
    matrix: () => [ONE, I, I, [-1, 0]],
  },
  s: {
    type: "s",
    label: "S",
    name: "S (phase)",
    description: "Quarter turn about Z: |1⟩ → i|1⟩.",
    targets: 1,
    controls: 0,
    params: [],
    category: "phase",
    color: "var(--q-gate-phase)",
    matrix: () => [ONE, I, I, [0, 1]],
  },
  sdg: {
    type: "sdg",
    label: "S†",
    name: "S-dagger",
    description: "Inverse of the S gate: |1⟩ → −i|1⟩.",
    targets: 1,
    controls: 0,
    params: [],
    category: "phase",
    color: "var(--q-gate-phase)",
    matrix: () => [ONE, I, I, [0, -1]],
  },
  t: {
    type: "t",
    label: "T",
    name: "T (π/8)",
    description: "Eighth turn about Z: |1⟩ → e^{iπ/4}|1⟩.",
    targets: 1,
    controls: 0,
    params: [],
    category: "phase",
    color: "var(--q-gate-phase)",
    matrix: () => [ONE, I, I, [SQRT1_2, SQRT1_2]],
  },
  tdg: {
    type: "tdg",
    label: "T†",
    name: "T-dagger",
    description: "Inverse of the T gate.",
    targets: 1,
    controls: 0,
    params: [],
    category: "phase",
    color: "var(--q-gate-phase)",
    matrix: () => [ONE, I, I, [SQRT1_2, -SQRT1_2]],
  },
  rx: {
    type: "rx",
    label: "RX",
    name: "X rotation",
    description: "Rotates the state by θ radians about the X axis.",
    targets: 1,
    controls: 0,
    params: ["θ"],
    category: "rotation",
    color: "var(--q-gate-rot)",
    matrix: (p) => rot(p[0] ?? 0, "x"),
  },
  ry: {
    type: "ry",
    label: "RY",
    name: "Y rotation",
    description: "Rotates the state by θ radians about the Y axis.",
    targets: 1,
    controls: 0,
    params: ["θ"],
    category: "rotation",
    color: "var(--q-gate-rot)",
    matrix: (p) => rot(p[0] ?? 0, "y"),
  },
  rz: {
    type: "rz",
    label: "RZ",
    name: "Z rotation",
    description: "Rotates the state by θ radians about the Z axis.",
    targets: 1,
    controls: 0,
    params: ["θ"],
    category: "rotation",
    color: "var(--q-gate-rot)",
    matrix: (p) => rot(p[0] ?? 0, "z"),
  },
  cx: {
    type: "cx",
    label: "CX",
    name: "CNOT",
    description:
      "Flips the target when the control is |1⟩. The standard entangling gate.",
    targets: 1,
    controls: 1,
    params: [],
    category: "multi",
    color: "var(--q-gate-multi)",
  },
  cz: {
    type: "cz",
    label: "CZ",
    name: "Controlled-Z",
    description: "Applies a phase flip when both qubits are |1⟩.",
    targets: 1,
    controls: 1,
    params: [],
    category: "multi",
    color: "var(--q-gate-multi)",
  },
  swap: {
    type: "swap",
    label: "SWAP",
    name: "Swap",
    description: "Exchanges the states of two qubits.",
    targets: 2,
    controls: 0,
    params: [],
    category: "multi",
    color: "var(--q-gate-multi)",
  },
  ccx: {
    type: "ccx",
    label: "CCX",
    name: "Toffoli",
    description: "Flips the target only when both controls are |1⟩.",
    targets: 1,
    controls: 2,
    params: [],
    category: "multi",
    color: "var(--q-gate-multi)",
  },
  measure: {
    type: "measure",
    label: "M",
    name: "Measure",
    description:
      "Collapses the qubit onto the computational basis and records the outcome.",
    targets: 1,
    controls: 0,
    params: [],
    category: "meta",
    color: "var(--q-gate-measure)",
  },
};

export const GATE_LIST = Object.values(GATES);

export const CATEGORY_LABELS: Record<GateDef["category"], string> = {
  single: "Single qubit",
  phase: "Phase",
  rotation: "Rotations",
  multi: "Multi qubit",
  meta: "Measurement",
};

export function totalQubits(def: GateDef): number {
  return def.targets + def.controls;
}
