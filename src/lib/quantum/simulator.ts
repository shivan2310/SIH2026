import { GATES, type Matrix2 } from "./gates";
import { orderedGates, type GateInstance, type QCircuit } from "./ir";

/**
 * Pure-TypeScript statevector simulator.
 *
 * Amplitudes are stored as parallel Float64Arrays (real / imaginary) so the
 * engine can later be swapped for a WASM kernel or moved into a Web Worker
 * without changing any call site.
 *
 * Convention: qubit 0 is the least significant bit of the basis index.
 */
export interface StateVector {
  numQubits: number;
  re: Float64Array;
  im: Float64Array;
}

export function zeroState(numQubits: number): StateVector {
  const size = 1 << numQubits;
  const re = new Float64Array(size);
  const im = new Float64Array(size);
  re[0] = 1;
  return { numQubits, re, im };
}

export function cloneState(s: StateVector): StateVector {
  return {
    numQubits: s.numQubits,
    re: Float64Array.from(s.re),
    im: Float64Array.from(s.im),
  };
}

function applyControlledMatrix(
  state: StateVector,
  m: Matrix2,
  target: number,
  controls: number[],
): void {
  const { re, im } = state;
  const size = re.length;
  const tBit = 1 << target;
  let ctrlMask = 0;
  for (const c of controls) ctrlMask |= 1 << c;
  const [a, b, c2, d] = m;

  for (let i = 0; i < size; i++) {
    if (i & tBit) continue;
    if ((i & ctrlMask) !== ctrlMask) continue;
    const j = i | tBit;
    const x0r = re[i]!;
    const x0i = im[i]!;
    const x1r = re[j]!;
    const x1i = im[j]!;
    re[i] = a[0] * x0r - a[1] * x0i + b[0] * x1r - b[1] * x1i;
    im[i] = a[0] * x0i + a[1] * x0r + b[0] * x1i + b[1] * x1r;
    re[j] = c2[0] * x0r - c2[1] * x0i + d[0] * x1r - d[1] * x1i;
    im[j] = c2[0] * x0i + c2[1] * x0r + d[0] * x1i + d[1] * x1r;
  }
}

function applySwap(state: StateVector, q1: number, q2: number): void {
  if (q1 === q2) return;
  const { re, im } = state;
  const b1 = 1 << q1;
  const b2 = 1 << q2;
  for (let i = 0; i < re.length; i++) {
    const hasA = (i & b1) !== 0;
    const hasB = (i & b2) !== 0;
    if (hasA && !hasB) {
      const j = (i & ~b1) | b2;
      const tr = re[i]!;
      const ti = im[i]!;
      re[i] = re[j]!;
      im[i] = im[j]!;
      re[j] = tr;
      im[j] = ti;
    }
  }
}

const X_MATRIX: Matrix2 = [
  [0, 0],
  [1, 0],
  [1, 0],
  [0, 0],
];
const Z_MATRIX: Matrix2 = [
  [1, 0],
  [0, 0],
  [0, 0],
  [-1, 0],
];

export function applyGate(state: StateVector, gate: GateInstance): void {
  const def = GATES[gate.type];
  switch (gate.type) {
    case "measure":
      return;
    case "swap": {
      const [q1, q2] = gate.targets;
      if (q1 !== undefined && q2 !== undefined) applySwap(state, q1, q2);
      return;
    }
    case "cx":
    case "ccx": {
      const t = gate.targets[0];
      if (t !== undefined) applyControlledMatrix(state, X_MATRIX, t, gate.controls);
      return;
    }
    case "cz": {
      const t = gate.targets[0];
      if (t !== undefined) applyControlledMatrix(state, Z_MATRIX, t, gate.controls);
      return;
    }
    default: {
      const t = gate.targets[0];
      if (t === undefined || !def.matrix) return;
      applyControlledMatrix(state, def.matrix(gate.params), t, gate.controls);
    }
  }
}

export function probabilities(state: StateVector): Float64Array {
  const out = new Float64Array(state.re.length);
  for (let i = 0; i < out.length; i++) {
    out[i] = state.re[i]! * state.re[i]! + state.im[i]! * state.im[i]!;
  }
  return out;
}

/** Bloch vector (x, y, z) of a single qubit from the reduced density matrix. */
export function blochVector(
  state: StateVector,
  qubit: number,
): { x: number; y: number; z: number; purity: number } {
  const bit = 1 << qubit;
  // rho = [[r00, r01],[r10, r11]]
  let r00 = 0;
  let r11 = 0;
  let r01re = 0;
  let r01im = 0;
  for (let i = 0; i < state.re.length; i++) {
    if (i & bit) continue;
    const j = i | bit;
    const a0r = state.re[i]!;
    const a0i = state.im[i]!;
    const a1r = state.re[j]!;
    const a1i = state.im[j]!;
    r00 += a0r * a0r + a0i * a0i;
    r11 += a1r * a1r + a1i * a1i;
    // rho01 = sum a0 * conj(a1)
    r01re += a0r * a1r + a0i * a1i;
    r01im += a0i * a1r - a0r * a1i;
  }
  const x = 2 * r01re;
  const y = -2 * r01im;
  const z = r00 - r11;
  const purity = Math.sqrt(x * x + y * y + z * z);
  return { x, y, z, purity };
}

/** Mulberry32 PRNG for deterministic, seedable shot sampling. */
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SimulationResult {
  numQubits: number;
  /** Final statevector amplitudes. */
  state: StateVector;
  /** Probability of every basis state. */
  probabilities: Float64Array;
  /** Qubits with an explicit measure gate (all qubits when none present). */
  measuredQubits: number[];
  /** Sampled bitstring counts over the measured qubits. */
  counts: Record<string, number>;
  shots: number;
  /** Statevector after each time step, for step-through playback. */
  steps: StateVector[];
  depth: number;
  gateCount: number;
  durationMs: number;
  /** Which backend produced the result. */
  backendId?: string;
  /** Set when a remote backend degraded to the local engine. */
  fallback?: string;
}

export interface RunOptions {
  shots?: number;
  seed?: number;
  /** Capture intermediate statevectors (default true). */
  trace?: boolean;
}

export function simulate(
  circuit: QCircuit,
  options: RunOptions = {},
): SimulationResult {
  const started =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  const shots = options.shots ?? 1024;
  const rng = makeRng(options.seed ?? 0x5eed);
  const gates = orderedGates(circuit);
  const state = zeroState(circuit.numQubits);
  const steps: StateVector[] = [cloneState(state)];

  const columns = [...new Set(gates.map((g) => g.column))].sort((a, b) => a - b);
  for (const col of columns) {
    for (const g of gates.filter((x) => x.column === col)) applyGate(state, g);
    if (options.trace !== false) steps.push(cloneState(state));
  }

  const explicit = [
    ...new Set(
      gates.filter((g) => g.type === "measure").flatMap((g) => g.targets),
    ),
  ].sort((a, b) => a - b);
  const measuredQubits =
    explicit.length > 0
      ? explicit
      : Array.from({ length: circuit.numQubits }, (_, i) => i);

  const probs = probabilities(state);
  // Cumulative distribution over the full basis, then project onto measured bits.
  const cdf = new Float64Array(probs.length);
  let acc = 0;
  for (let i = 0; i < probs.length; i++) {
    acc += probs[i]!;
    cdf[i] = acc;
  }

  const counts: Record<string, number> = {};
  for (let s = 0; s < shots; s++) {
    const r = rng() * (acc || 1);
    let lo = 0;
    let hi = cdf.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cdf[mid]! < r) lo = mid + 1;
      else hi = mid;
    }
    const key = measuredQubits
      .map((q) => ((lo >> q) & 1).toString())
      .reverse()
      .join("");
    counts[key] = (counts[key] ?? 0) + 1;
  }

  const ended =
    typeof performance !== "undefined" ? performance.now() : Date.now();

  return {
    numQubits: circuit.numQubits,
    state,
    probabilities: probs,
    measuredQubits,
    counts,
    shots,
    steps,
    depth: columns.length,
    gateCount: gates.length,
    durationMs: ended - started,
  };
}

export function basisLabel(index: number, numQubits: number): string {
  let s = "";
  for (let q = numQubits - 1; q >= 0; q--) s += (index >> q) & 1;
  return s;
}
