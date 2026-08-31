/**
 * Coding challenges with automatic grading (Phase 4).
 *
 * A challenge is graded by simulating the learner's circuit and comparing its
 * measurement distribution (and optionally its full statevector) against a
 * reference solution written in the same DSL.
 */

import { parseCode } from "@/lib/quantum/code";
import { circuitDepth } from "@/lib/quantum/ir";
import { probabilities, simulate } from "@/lib/quantum/simulator";

export type Difficulty = "intro" | "core" | "advanced";

export interface Challenge {
  id: string;
  title: string;
  blurb: string;
  difficulty: Difficulty;
  /** Related lesson, for "learn this first" links. */
  lessonId?: string;
  prompt: string[];
  starter: string;
  hint: string;
  /** Reference solution — defines the target distribution. */
  solution: string;
  /** Compare full amplitudes (phase-sensitive) instead of probabilities only. */
  matchPhase?: boolean;
  /** Reject solutions that use more than this many gates. */
  maxGates?: number;
}

export const CHALLENGES: Challenge[] = [
  {
    id: "make-superposition",
    title: "Balanced coin",
    blurb: "Put a single qubit into an equal superposition.",
    difficulty: "intro",
    lessonId: "superposition",
    prompt: [
      "Start from |0> and produce a state that measures 0 half of the time and 1 half of the time.",
      "One gate is enough.",
    ],
    starter: "qreg q[1]\n\n",
    hint: "The Hadamard gate is written `h q[0]`.",
    solution: "qreg q[1]\n\nh q[0]\n",
    maxGates: 2,
  },
  {
    id: "flip-to-one",
    title: "Deterministic one",
    blurb: "Prepare |1> with certainty.",
    difficulty: "intro",
    lessonId: "single-gates",
    prompt: ["Turn |0> into |1> so the measurement always returns 1."],
    starter: "qreg q[1]\n\n",
    hint: "X is the quantum NOT gate.",
    solution: "qreg q[1]\n\nx q[0]\n",
    maxGates: 2,
  },
  {
    id: "bell-pair",
    title: "Build a Bell pair",
    blurb: "Create the maximally entangled state (|00> + |11>)/sqrt(2).",
    difficulty: "core",
    lessonId: "entanglement",
    prompt: [
      "Entangle two qubits so that the only outcomes are 00 and 11, each about half the time.",
      "Two gates are enough.",
    ],
    starter: "qreg q[2]\n\n",
    hint: "Superpose the control first, then copy it with cx.",
    solution: "qreg q[2]\n\nh q[0]\ncx q[0], q[1]\n",
    maxGates: 3,
  },
  {
    id: "ghz3",
    title: "Three-qubit GHZ",
    blurb: "Extend entanglement to a trio.",
    difficulty: "core",
    lessonId: "entanglement",
    prompt: ["Prepare (|000> + |111>)/sqrt(2) on three qubits."],
    starter: "qreg q[3]\n\n",
    hint: "Chain two CNOTs off one Hadamard.",
    solution: "qreg q[3]\n\nh q[0]\ncx q[0], q[1]\ncx q[1], q[2]\n",
    maxGates: 4,
  },
  {
    id: "phase-flip",
    title: "Interference to |1>",
    blurb: "Use interference, not an X gate, to land on |1> with certainty.",
    difficulty: "core",
    lessonId: "interference",
    prompt: [
      "Reach |1> deterministically without using x, y, rx or ry.",
      "Exactly three gates are needed.",
    ],
    starter: "qreg q[1]\n\n",
    hint: "Sandwich a Z between two Hadamards.",
    solution: "qreg q[1]\n\nh q[0]\nz q[0]\nh q[0]\n",
    maxGates: 3,
  },
  {
    id: "grover2",
    title: "Grover finds |11>",
    blurb: "One iteration, one certain answer.",
    difficulty: "advanced",
    lessonId: "grover",
    prompt: [
      "Search a two-qubit space where |11> is marked, so the measurement returns 11 every time.",
      "Uniform superposition, oracle (cz), then the diffusion operator.",
    ],
    starter: "qreg q[2]\n\nh q[0]\nh q[1]\n",
    hint: "Diffusion = H·X on both, cz, X·H on both.",
    solution:
      "qreg q[2]\n\nh q[0]\nh q[1]\ncz q[0], q[1]\nh q[0]\nh q[1]\nx q[0]\nx q[1]\ncz q[0], q[1]\nx q[0]\nx q[1]\nh q[0]\nh q[1]\n",
  },
  {
    id: "swap-states",
    title: "Swap without SWAP",
    blurb: "Exchange two qubits using only CNOTs.",
    difficulty: "advanced",
    lessonId: "multi-gates",
    prompt: [
      "Qubit 0 starts in |1> (already written for you). Move that excitation onto qubit 1 using cx gates only — no swap instruction.",
    ],
    starter: "qreg q[2]\n\nx q[0]\n",
    hint: "cx a,b then cx b,a then cx a,b.",
    solution: "qreg q[2]\n\nx q[0]\ncx q[0], q[1]\ncx q[1], q[0]\ncx q[0], q[1]\n",
    matchPhase: true,
  },
  {
    id: "teleport",
    title: "Teleport a state",
    blurb: "Move an unknown single-qubit state onto the third qubit.",
    difficulty: "advanced",
    lessonId: "entanglement",
    prompt: [
      "Qubit 0 holds the state ry(pi/3)|0>. Using an entangled pair on qubits 1 and 2 plus corrections, end with qubit 2 in that state.",
    ],
    starter: "qreg q[3]\n\nry(pi/3) q[0]\n",
    hint: "Bell pair on q1/q2, Bell measurement basis on q0/q1, then cx and cz corrections.",
    solution:
      "qreg q[3]\n\nry(pi/3) q[0]\nh q[1]\ncx q[1], q[2]\ncx q[0], q[1]\nh q[0]\ncx q[1], q[2]\ncz q[0], q[2]\n",
  },
];

export function getChallenge(id: string): Challenge | undefined {
  return CHALLENGES.find((c) => c.id === id);
}

export interface GradeResult {
  passed: boolean;
  message: string;
  detail?: string;
}

const TOL = 1e-6;

/** Simulate a submission and compare it against the challenge's reference. */
export function gradeChallenge(challenge: Challenge, code: string): GradeResult {
  const submitted = parseCode(code);
  if (!submitted.circuit) {
    const first = submitted.errors[0];
    return {
      passed: false,
      message: "Your circuit doesn't parse yet.",
      ...(first ? { detail: `Line ${first.line}: ${first.message}` } : {}),
    };
  }
  const reference = parseCode(challenge.solution).circuit;
  if (!reference) {
    return { passed: false, message: "This challenge is misconfigured." };
  }

  const mine = submitted.circuit;
  if (mine.gates.length === 0) {
    return { passed: false, message: "Add some gates first." };
  }
  if (challenge.maxGates !== undefined && mine.gates.length > challenge.maxGates) {
    return {
      passed: false,
      message: `Too many gates — this can be done in ${challenge.maxGates} or fewer.`,
      detail: `You used ${mine.gates.length}.`,
    };
  }
  if (mine.numQubits !== reference.numQubits) {
    return {
      passed: false,
      message: `This challenge expects ${reference.numQubits} qubit(s).`,
      detail: `Your register declares ${mine.numQubits}.`,
    };
  }

  const a = simulate(mine, { shots: 1, trace: false });
  const b = simulate(reference, { shots: 1, trace: false });

  if (challenge.matchPhase) {
    // Compare up to a global phase: align on the largest reference amplitude.
    let k = 0;
    let best = -1;
    for (let i = 0; i < b.state.re.length; i++) {
      const mag = b.state.re[i]! ** 2 + b.state.im[i]! ** 2;
      if (mag > best) {
        best = mag;
        k = i;
      }
    }
    const phase = Math.atan2(b.state.im[k]!, b.state.re[k]!) -
      Math.atan2(a.state.im[k]!, a.state.re[k]!);
    const cos = Math.cos(phase);
    const sin = Math.sin(phase);
    for (let i = 0; i < b.state.re.length; i++) {
      const re = a.state.re[i]! * cos - a.state.im[i]! * sin;
      const im = a.state.re[i]! * sin + a.state.im[i]! * cos;
      if (Math.abs(re - b.state.re[i]!) > 1e-4 || Math.abs(im - b.state.im[i]!) > 1e-4) {
        return {
          passed: false,
          message: "Not the target state yet.",
          detail: "The amplitudes differ from the expected result.",
        };
      }
    }
  } else {
    const pa = probabilities(a.state);
    const pb = probabilities(b.state);
    for (let i = 0; i < pb.length; i++) {
      if (Math.abs(pa[i]! - pb[i]!) > 1e-4 + TOL) {
        return {
          passed: false,
          message: "Not the target distribution yet.",
          detail: "Run your circuit and compare the histogram with the goal.",
        };
      }
    }
  }

  return {
    passed: true,
    message: "Correct — the target state matches.",
    detail: `${mine.gates.length} gates, depth ${circuitDepth(mine)}.`,
  };
}
