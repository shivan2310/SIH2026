import { GATES, totalQubits } from "./gates";
import {
  MAX_QUBITS,
  firstFreeColumn,
  newGateId,
  orderedGates,
  type GateInstance,
  type GateType,
  type QCircuit,
} from "./ir";

/**
 * Bidirectional transpiler between the QCircuit IR and a compact,
 * Qiskit-flavoured text DSL.
 *
 *   qreg q[3]
 *   h q[0]
 *   cx q[0], q[1]
 *   rx(pi/2) q[2]
 *   measure q[0]
 */

export interface ParseError {
  line: number;
  message: string;
}

export interface ParseResult {
  circuit: QCircuit | null;
  errors: ParseError[];
}

export function circuitToCode(circuit: QCircuit): string {
  const lines: string[] = [`qreg q[${circuit.numQubits}]`, ""];
  for (const g of orderedGates(circuit)) {
    const def = GATES[g.type];
    const paramPart =
      g.params.length > 0
        ? `(${g.params.map((p) => formatAngle(p)).join(", ")})`
        : "";
    const qubits = [...g.controls, ...g.targets]
      .map((q) => `q[${q}]`)
      .join(", ");
    const name = g.type === "measure" ? "measure" : def.type;
    lines.push(`${name}${paramPart} ${qubits}`);
  }
  return lines.join("\n") + "\n";
}

export function formatAngle(value: number): string {
  const ratios: Array<[number, string]> = [
    [1, "pi"],
    [1 / 2, "pi/2"],
    [1 / 3, "pi/3"],
    [1 / 4, "pi/4"],
    [1 / 6, "pi/6"],
    [1 / 8, "pi/8"],
    [3 / 4, "3*pi/4"],
    [2 / 3, "2*pi/3"],
    [3 / 2, "3*pi/2"],
    [2, "2*pi"],
  ];
  for (const [r, label] of ratios) {
    if (Math.abs(value - r * Math.PI) < 1e-9) return label;
    if (Math.abs(value + r * Math.PI) < 1e-9) return `-${label}`;
  }
  if (Math.abs(value) < 1e-12) return "0";
  return value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}

export function parseAngle(raw: string): number | null {
  const text = raw.trim().toLowerCase();
  if (text === "") return null;
  if (!/^[-+*/(). 0-9pi]+$/.test(text)) return null;
  const expr = text.replace(/\bpi\b/g, `(${Math.PI})`);
  try {
    // eslint-disable-next-line no-new-func
    const value = Function(`"use strict";return (${expr});`)() as unknown;
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

const GATE_NAMES = new Set(Object.keys(GATES));
const ALIASES: Record<string, GateType> = {
  cnot: "cx",
  toffoli: "ccx",
  ccnot: "ccx",
  not: "x",
  m: "measure",
};

export function parseCode(source: string): ParseResult {
  const errors: ParseError[] = [];
  const rawLines = source.split("\n");
  let numQubits = 0;
  const gates: GateInstance[] = [];
  let circuit: QCircuit = { numQubits: 1, gates: [] };

  // First pass: find the register declaration.
  rawLines.forEach((line, i) => {
    const m = /^\s*qreg\s+q\[(\d+)\]\s*;?\s*$/i.exec(line);
    if (m) {
      const n = Number(m[1]);
      if (!Number.isInteger(n) || n < 1 || n > MAX_QUBITS) {
        errors.push({
          line: i + 1,
          message: `Register size must be between 1 and ${MAX_QUBITS}.`,
        });
      } else {
        numQubits = Math.max(numQubits, n);
      }
    }
  });

  rawLines.forEach((raw, i) => {
    const lineNo = i + 1;
    const line = raw.replace(/\/\/.*$/, "").replace(/;$/, "").trim();
    if (line === "") return;
    if (/^qreg\b/i.test(line)) return;

    const m = /^([a-zA-Z]+)\s*(\(([^)]*)\))?\s*(.*)$/.exec(line);
    if (!m) {
      errors.push({ line: lineNo, message: `Could not parse "${line}".` });
      return;
    }
    const rawName = (m[1] ?? "").toLowerCase();
    const name = (ALIASES[rawName] ?? rawName) as GateType;
    if (!GATE_NAMES.has(name)) {
      errors.push({ line: lineNo, message: `Unknown gate "${rawName}".` });
      return;
    }
    const def = GATES[name];

    const params: number[] = [];
    const paramText = (m[3] ?? "").trim();
    if (paramText !== "") {
      for (const piece of paramText.split(",")) {
        const value = parseAngle(piece);
        if (value === null) {
          errors.push({
            line: lineNo,
            message: `Invalid angle "${piece.trim()}". Try numbers or expressions like pi/2.`,
          });
          return;
        }
        params.push(value);
      }
    }
    if (params.length !== def.params.length) {
      errors.push({
        line: lineNo,
        message: `${def.label} expects ${def.params.length} parameter(s), got ${params.length}.`,
      });
      return;
    }

    const qubitText = (m[4] ?? "").trim();
    const qubits: number[] = [];
    if (qubitText !== "") {
      for (const piece of qubitText.split(",")) {
        const qm = /^\s*(?:q\[)?(\d+)\]?\s*$/.exec(piece);
        if (!qm) {
          errors.push({
            line: lineNo,
            message: `Invalid qubit reference "${piece.trim()}". Use q[0] style.`,
          });
          return;
        }
        qubits.push(Number(qm[1]));
      }
    }

    const need = totalQubits(def);
    if (qubits.length !== need) {
      errors.push({
        line: lineNo,
        message: `${def.label} acts on ${need} qubit(s), got ${qubits.length}.`,
      });
      return;
    }
    if (new Set(qubits).size !== qubits.length) {
      errors.push({ line: lineNo, message: `Qubits must be distinct.` });
      return;
    }
    for (const q of qubits) {
      if (q >= MAX_QUBITS) {
        errors.push({
          line: lineNo,
          message: `Qubit index ${q} exceeds the ${MAX_QUBITS}-qubit limit.`,
        });
        return;
      }
      numQubits = Math.max(numQubits, q + 1);
    }

    const controls = qubits.slice(0, def.controls);
    const targets = qubits.slice(def.controls);
    gates.push({
      id: newGateId(),
      type: name,
      controls,
      targets,
      params,
      column: 0,
    });
  });

  if (errors.length > 0) return { circuit: null, errors };

  circuit = { numQubits: Math.max(1, numQubits), gates: [] };
  // Pack gates into the earliest column that still preserves per-wire order.
  const lastColumn = new Map<number, number>();
  for (const g of gates) {
    const span = [...g.controls, ...g.targets];
    const earliest = Math.max(
      0,
      ...span.map((q) => (lastColumn.has(q) ? lastColumn.get(q)! + 1 : 0)),
    );
    const column = firstFreeColumn(circuit, span, earliest);
    for (const q of span) lastColumn.set(q, column);
    circuit = { ...circuit, gates: [...circuit.gates, { ...g, column }] };
  }


  return { circuit, errors: [] };
}

/** Export the IR as runnable Qiskit Python. */
export function circuitToQiskit(circuit: QCircuit): string {
  const lines = [
    "from qiskit import QuantumCircuit",
    "from qiskit_aer import AerSimulator",
    "import numpy as np",
    "",
    `qc = QuantumCircuit(${circuit.numQubits}, ${circuit.numQubits})`,
  ];
  for (const g of orderedGates(circuit)) {
    const qs = [...g.controls, ...g.targets];
    if (g.type === "measure") {
      lines.push(`qc.measure(${qs[0]}, ${qs[0]})`);
      continue;
    }
    const ps = g.params.map((p) => p.toFixed(6)).join(", ");
    const args = ps ? `${ps}, ${qs.join(", ")}` : qs.join(", ");
    lines.push(`qc.${g.type}(${args})`);
  }
  lines.push("", "result = AerSimulator().run(qc, shots=1024).result()", "print(result.get_counts())");
  return lines.join("\n");
}
