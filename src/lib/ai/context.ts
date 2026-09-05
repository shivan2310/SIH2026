import { getLesson, trackOf, type Lesson } from "@/lib/learn/content";

export interface ClientSimulationData {
  probabilities: number[];
  counts: Record<string, number>;
  shots: number;
  backend: string;
}

export interface QuantumContextParams {
  circuitCode?: string | undefined;
  simulation?: ClientSimulationData | undefined;
  studentLevel?: "beginner" | "intermediate" | "advanced" | undefined;
  lessonId?: string | undefined;
  rawLessonContext?: string | undefined;
}

/**
 * Prepares the simulation result string for the AI prompt.
 */
function formatSimulation(sim: ClientSimulationData): string {
  const parts = [];
  
  if (sim.backend) {
    parts.push(`Backend: ${sim.backend}`);
  }
  parts.push(`Shots: ${sim.shots}`);
  
  if (Object.keys(sim.counts).length > 0) {
    parts.push("Measurement Counts:");
    for (const [bitstring, count] of Object.entries(sim.counts)) {
      parts.push(`  |${bitstring}> : ${count}`);
    }
  }

  // Find basis labels for the non-zero probabilities
  if (sim.probabilities && sim.probabilities.length > 0) {
    const numQubits = Math.log2(sim.probabilities.length);
    if (Number.isInteger(numQubits)) {
      parts.push("State Probabilities (Simulator Exact):");
      for (let i = 0; i < sim.probabilities.length; i++) {
        const p = sim.probabilities[i];
        if (p && p > 0.001) {
          const label = i.toString(2).padStart(numQubits, "0");
          parts.push(`  |${label}> = ${(p * 100).toFixed(2)}%`);
        }
      }
    }
  }
  
  return parts.join("\n");
}

/**
 * Serializes a lesson to plain text.
 */
export function serializeLesson(l: Lesson): string {
  const parts = [`Title: ${l.title}`, `Description: ${l.blurb}`, "Body:"];
  l.body.forEach((b: any) => {
    if (b.kind === "h") parts.push(`## ${b.text}`);
    if (b.kind === "p") parts.push(b.text);
    if (b.kind === "math") parts.push(b.text);
    if (b.kind === "list") parts.push("- " + b.items.join("\n- "));
  });
  return parts.join("\n\n");
}

/**
 * Prepares the unified QuantumLab context string for the AI prompt.
 */
export function buildQuantumContext(params: QuantumContextParams): string {
  const blocks: string[] = [];
  
  if (params.studentLevel) {
    blocks.push(`Student level: ${params.studentLevel}`);
  }

  if (params.circuitCode) {
    blocks.push(`Current circuit:\n${params.circuitCode}`);
  }

  if (params.simulation) {
    blocks.push(`Simulation:\n${formatSimulation(params.simulation)}`);
  }

  // Determine lesson context
  let lessonContext = params.rawLessonContext;
  if (!lessonContext && params.lessonId) {
    const l = getLesson(params.lessonId);
    if (l) {
      lessonContext = serializeLesson(l);
      const track = trackOf(l);
      if (track) {
        lessonContext = `Track: ${track.title}\n${lessonContext}`;
      }
    }
  }

  if (lessonContext) {
    blocks.push(`LESSON CONTEXT:\n${lessonContext}`);
  }
  
  return blocks.join("\n\n");
}

/**
 * Placeholder for RAG / Vector Database retrieval in the future.
 */
export async function retrieveQuantumKnowledge(query: string): Promise<string | null> {
  // TODO: integrate vector store here.
  return null;
}
