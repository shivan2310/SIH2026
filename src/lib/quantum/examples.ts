import { parseCode } from "./code";
import type { QCircuit } from "./ir";

export interface ExampleCircuit {
  id: string;
  title: string;
  blurb: string;
  code: string;
}

export const EXAMPLES: ExampleCircuit[] = [
  {
    id: "superposition",
    title: "Single-qubit superposition",
    blurb: "One Hadamard turns a definite |0> into a 50/50 coin.",
    code: `qreg q[1]

h q[0]
measure q[0]
`,
  },
  {
    id: "bell",
    title: "Bell state (Φ+)",
    blurb: "The canonical two-qubit entangled pair: outcomes are always correlated.",
    code: `qreg q[2]

h q[0]
cx q[0], q[1]
measure q[0]
measure q[1]
`,
  },
  {
    id: "ghz",
    title: "GHZ state",
    blurb: "Three-way entanglement — all zeros or all ones, nothing in between.",
    code: `qreg q[3]

h q[0]
cx q[0], q[1]
cx q[1], q[2]
measure q[0]
measure q[1]
measure q[2]
`,
  },
  {
    id: "teleport",
    title: "Quantum teleportation",
    blurb: "Move an unknown state from q0 to q2 using entanglement and corrections.",
    code: `qreg q[3]

ry(pi/3) q[0]
h q[1]
cx q[1], q[2]
cx q[0], q[1]
h q[0]
cx q[1], q[2]
cz q[0], q[2]
measure q[2]
`,
  },
  {
    id: "grover",
    title: "Grover search (2 qubits)",
    blurb: "One iteration finds the marked |11> state with certainty.",
    code: `qreg q[2]

h q[0]
h q[1]
cz q[0], q[1]
h q[0]
h q[1]
x q[0]
x q[1]
cz q[0], q[1]
x q[0]
x q[1]
h q[0]
h q[1]
measure q[0]
measure q[1]
`,
  },
  {
    id: "phase-kickback",
    title: "Phase kickback",
    blurb: "A controlled gate writes phase back onto the control qubit.",
    code: `qreg q[2]

h q[0]
x q[1]
h q[1]
cx q[0], q[1]
h q[0]
measure q[0]
`,
  },
];

export function exampleCircuit(id: string): QCircuit | null {
  const ex = EXAMPLES.find((e) => e.id === id);
  if (!ex) return null;
  return parseCode(ex.code).circuit;
}
