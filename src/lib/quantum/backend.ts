import type { QCircuit } from "./ir";
import { simulate, type RunOptions, type SimulationResult } from "./simulator";

/**
 * Pluggable simulator contract.
 *
 * The browser statevector engine is always available. External SDK backends
 * (Qiskit Aer, PennyLane, Cirq, qBraid) are served by an external compute
 * service that speaks a small JSON protocol; when it is not configured or
 * unreachable, the adapter falls back to the browser engine so the lab never
 * dead-ends.
 */
export interface SimulatorBackend {
  id: string;
  name: string;
  vendor: string;
  description: string;
  maxQubits: number;
  /** false = shown in the UI but not selectable yet. */
  available: boolean;
  /** true when running it may transparently fall back to the browser engine. */
  remote?: boolean;
  run(circuit: QCircuit, options?: RunOptions): Promise<SimulationResult>;
}

export const browserStatevectorBackend: SimulatorBackend = {
  id: "browser-statevector",
  name: "Browser Statevector",
  vendor: "QuantumLab",
  description:
    "Pure TypeScript statevector engine running locally in your browser. No setup, no latency, fully offline.",
  maxQubits: 12,
  available: true,
  async run(circuit, options) {
    return { ...simulate(circuit, options), backendId: "browser-statevector" };
  },
};

/** Base URL of the external quantum compute service, when deployed. */
export const REMOTE_SERVICE_URL: string =
  (import.meta.env['VITE_QUANTUM_SERVICE_URL'] as string | undefined) ?? "";

export const remoteServiceConfigured = REMOTE_SERVICE_URL.length > 0;

interface RemoteResponse {
  counts?: Record<string, number>;
  probabilities?: number[];
}

function remoteBackend(
  id: string,
  name: string,
  vendor: string,
  description: string,
  maxQubits: number,
): SimulatorBackend {
  return {
    id,
    name,
    vendor,
    description,
    maxQubits,
    available: remoteServiceConfigured,
    remote: true,
    async run(circuit, options = {}) {
      const local = simulate(circuit, options);
      if (!remoteServiceConfigured) {
        return {
          ...local,
          backendId: id,
          fallback: `${name} is not connected — simulated in your browser instead.`,
        };
      }
      try {
        const res = await fetch(`${REMOTE_SERVICE_URL.replace(/\/$/, "")}/simulate`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            backend: id,
            circuit,
            shots: options.shots ?? 1024,
            seed: options.seed ?? 0,
          }),
        });
        if (!res.ok) throw new Error(`service responded ${res.status}`);
        const json = (await res.json()) as RemoteResponse;
        return {
          ...local,
          backendId: id,
          ...(json.counts ? { counts: json.counts } : {}),
          ...(json.probabilities
            ? { probabilities: Float64Array.from(json.probabilities) }
            : {}),
        };
      } catch (err) {
        return {
          ...local,
          backendId: id,
          fallback: `${name} is unreachable (${
            err instanceof Error ? err.message : "network error"
          }) — simulated in your browser instead.`,
        };
      }
    },
  };
}

export const BACKENDS: SimulatorBackend[] = [
  browserStatevectorBackend,
  remoteBackend(
    "qiskit-aer",
    "Qiskit Aer",
    "IBM",
    "High-performance statevector, density-matrix and noisy simulation via the external compute service.",
    30,
  ),
  remoteBackend(
    "pennylane",
    "PennyLane default.qubit",
    "Xanadu",
    "Differentiable simulation for variational and hybrid quantum-classical workflows.",
    24,
  ),
  remoteBackend(
    "cirq",
    "Cirq Simulator",
    "Google",
    "Google's simulator with native support for their gate sets and device topologies.",
    24,
  ),
  remoteBackend(
    "qbraid",
    "qBraid Cloud",
    "qBraid",
    "Cloud dispatch to a range of simulators and real quantum hardware providers.",
    32,
  ),
];

export function getBackend(id: string): SimulatorBackend {
  return BACKENDS.find((b) => b.id === id) ?? browserStatevectorBackend;
}
