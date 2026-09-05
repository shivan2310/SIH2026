import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/auth/server";
import { buildQuantumContext, type ClientSimulationData } from "./context";
import { parseCode } from "@/lib/quantum/code";

const MODEL = process.env["AI_MODEL"] || "gpt-oss:120b-cloud";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callGateway(messages: ChatMessage[]): Promise<string> {
  const ollamaUrl =
    process.env["OLLAMA_URL"] || "http://localhost:11434";

  const endpoint = `${ollamaUrl}/v1/chat/completions`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        stream: false,
      }),
    });

    if (!res.ok) {
      throw new Error(
        `AI error (${res.status}): ${await res.text()}`,
      );
    }

    const json = (await res.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };

    const content = json.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("The AI returned an empty response.");
    }

    return content;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch failed")) {
      throw new Error("AI Tutor cannot reach the QuantumLab AI server. Check that the Ollama host is running and accessible.");
    }
    throw error;
  }
}

const DSL_SPEC = `Circuit DSL (one instruction per line):
qreg q[N]            # N qubits, 1..12, must be the first line
h q[0]               # single-qubit: h, x, y, z, s, sdg, t, tdg
rx(pi/2) q[1]        # parameterised: rx, ry, rz — angle may use pi and * / + -
cx q[0], q[1]        # two-qubit: cx and cz take control first, then target
swap q[0], q[1]
ccx q[0], q[1], q[2] # Toffoli: two controls then target
measure q[0]
No other syntax, no comments, no imports, no Python.`;

const TUTOR_SYSTEM = `You are the AI Tutor inside QuantumLab, an interactive quantum-computing learning platform.

You are not a generic chatbot. Your job is to help the student understand quantum computing using the actual QuantumLab learning context, circuit, simulator results, and student level.

When circuit context is provided, prioritize that context.
Never pretend to have information that was not provided.
Never invent circuit gates, simulation results, amplitudes, probabilities, or measurements.
For numerical quantum-computing results, treat the QuantumLab simulator output as the source of truth.

Adapt your explanation to the learner's level:
- Beginner: use intuitive explanations and simple examples. Do not overwhelm a beginner with advanced mathematics unless requested.
- Intermediate: introduce mathematical reasoning, amplitudes, phase, tensor products, and circuit behaviour.
- Advanced: discuss mathematical notation and deeper quantum-computing concepts.

When the learner's current circuit is provided, always ground your answer in that circuit. Use short paragraphs and plain markdown.

FORMAT MATHEMATICS CORRECTLY.

Use Markdown for normal text.

Use LaTeX for mathematical and quantum-computing expressions.

For inline mathematics use $...$.

For display equations use $$...$$.

Use proper bra-ket notation:

$|0\\rangle$
$|1\\rangle$
$|\\psi\\rangle$

Do not expose raw LaTeX commands as normal text.

For example, write:

$|\\psi\\rangle =
\\frac{|0\\rangle + |1\\rangle}{\\sqrt{2}}$

instead of:

\\frac{|0>+|1>}{\\sqrt{2}}

Do not put mathematical expressions inside code blocks unless the user explicitly asks for the raw LaTeX/code.
Explain WHY something happens, not only WHAT happens.

If the learner asks about their circuit, refer specifically to the gates, qubits, measurements, and expected behaviour.
Keep answers under approximately 200 words unless the learner asks for more detail.`;


// ============================================================
// TUTOR CHAT
// ============================================================

/**
 * Context-aware chat tutor scoped to the circuit currently in the lab.
 */
export const tutorChat = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator(
    (input: {
      messages: Array<{
        role: "user" | "assistant";
        content: string;
      }>;
      circuitCode: string;
      level: "beginner" | "intermediate" | "advanced";
      simulation?: ClientSimulationData | undefined;
      lessonContext?: string | undefined;
    }) => input,
  )
  .handler(async ({ data }) => {
    const history = data.messages.slice(-12).map((m) => ({
      role: m.role,
      content: m.content.slice(0, 4000),
    }));

    const contextStr = buildQuantumContext({
      circuitCode: data.circuitCode,
      simulation: data.simulation,
      studentLevel: data.level,
      rawLessonContext: data.lessonContext,
    });

    const reply = await callGateway([
      {
        role: "system",
        content: TUTOR_SYSTEM,
      },
      {
        role: "system",
        content: contextStr,
      },
      ...history,
    ]);

    return { reply };
  });


// ============================================================
// CIRCUIT ANALYSIS
// ============================================================

export interface CircuitAnalysis {
  summary: string;
  issues: Array<{
    severity: "error" | "warning" | "info";
    message: string;
  }>;
  optimizations: string[];
}

/**
 * Error detection, redundant-gate detection,
 * and depth optimization suggestions.
 */
export const analyzeCircuit = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator(
    (input: {
      circuitCode: string;
      goal?: string | undefined;
      simulation?: ClientSimulationData | undefined;
    }) => input,
  )
  .handler(async ({ data }): Promise<CircuitAnalysis> => {
    const raw = await callGateway([
      {
        role: "system",
        content: `You analyse quantum circuits written in this DSL.

${DSL_SPEC}

Respond with ONLY a JSON object.
Do not use markdown fences.

Required shape:

{
  "summary": "string",
  "issues": [
    {
      "severity": "error" | "warning" | "info",
      "message": "string"
    }
  ],
  "optimizations": ["string"]
}

Rules:

summary:
1-3 sentences explaining what the circuit does and what state it
approximately prepares.

issues:
Identify genuine problems such as:
- unused qubits
- missing measurements
- redundant gates
- gates that cancel
- gates with no observable effect
- invalid circuit intent
- likely mistakes
- unnecessary circuit depth

Use an empty array if there are no issues.

optimizations:
Suggest concrete circuit rewrites that reduce:
- gate count
- circuit depth
- unnecessary operations

Use an empty array if there are no useful optimizations.

Do not invent problems.`,
      },
      {
        role: "user",
        content: buildQuantumContext({
          circuitCode: data.circuitCode,
          simulation: data.simulation,
        }) + (data.goal ? `\n\nIntended behaviour:\n${data.goal}` : ""),
      },
    ]);

    const cleaned = raw
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/i, "")
      .trim();

    try {
      const parsed = JSON.parse(cleaned) as Partial<CircuitAnalysis>;

      return {
        summary: parsed.summary ?? "",
        issues: Array.isArray(parsed.issues)
          ? parsed.issues
          : [],
        optimizations: Array.isArray(parsed.optimizations)
          ? parsed.optimizations
          : [],
      };
    } catch {
      return {
        summary: raw,
        issues: [],
        optimizations: [],
      };
    }
  });


// ============================================================
// NATURAL LANGUAGE → CIRCUIT
// ============================================================

/**
 * Converts a natural-language request into QuantumLab DSL.
 */
export const generateCircuit = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator(
    (input: {
      prompt: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const raw = await callGateway([
      {
        role: "system",
        content: `You generate quantum circuits for QuantumLab.

Use ONLY the following DSL:

${DSL_SPEC}

Output ONLY the DSL program.

Do NOT output:
- explanations
- markdown
- code fences
- comments
- Python
- Qiskit code
- imports
- prose

Use the smallest number of qubits that satisfies the request.

The first line MUST be:
qreg q[N]`,
      },
      {
        role: "user",
        content: data.prompt.slice(0, 2000),
      },
    ]);

    const code = raw
      .replace(/```[a-z]*\n?/gi, "")
      .replace(/```/g, "")
      .trim() + "\n";

    const { errors } = parseCode(code);
    if (errors.length > 0) {
      throw new Error(`The AI generated invalid circuit code:\n${errors.map(e => e.message).join(", ")}`);
    }

    return {
      code,
    };
  });


// ============================================================
// EXPLAIN CIRCUIT
// ============================================================

/**
 * Provides a plain-English explanation of the current circuit.
 */
export const explainCircuit = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator(
    (input: {
      circuitCode: string;
      level: "beginner" | "intermediate" | "advanced";
      simulation?: ClientSimulationData | undefined;
    }) => input,
  )
  .handler(async ({ data }) => {
    const reply = await callGateway([
      {
        role: "system",
        content: TUTOR_SYSTEM,
      },
      {
        role: "user",
        content: `Explain this circuit for a ${data.level} learner.

Cover:
1. What each stage does.
2. What quantum state it prepares.
3. How the gates affect the qubits.
4. What the measurement statistics should look like.

${buildQuantumContext({
  circuitCode: data.circuitCode,
  simulation: data.simulation,
  studentLevel: data.level
})}`,
      },
    ]);

    return {
      reply,
    };
  });


// ============================================================
// GLOBAL AI CHAT
// ============================================================

/**
 * General QuantumLab AI assistant.
 */
export const globalChat = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator(
    (input: {
      messages: Array<{
        role: "user" | "assistant";
        content: string;
      }>;
    }) => input,
  )
  .handler(async ({ data }) => {
    const history = data.messages.slice(-20).map((m) => ({
      role: m.role,
      content: m.content.slice(0, 4000),
    }));

    const reply = await callGateway([
      {
        role: "system",
        content: TUTOR_SYSTEM,
      },
      ...history,
    ]);

    return {
      reply,
    };
  });


// ============================================================
// LESSON AI CHAT
// ============================================================

/**
 * AI tutor scoped to a specific lesson.
 */
export const lessonChat = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator(
    (input: {
      messages: Array<{
        role: "user" | "assistant";
        content: string;
      }>;
      lessonContext: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const history = data.messages.slice(-12).map((m) => ({
      role: m.role,
      content: m.content.slice(0, 4000),
    }));

    const contextStr = buildQuantumContext({
      rawLessonContext: data.lessonContext,
    });

    const reply = await callGateway([
      {
        role: "system",
        content: TUTOR_SYSTEM,
      },
      {
        role: "system",
        content: `You are currently helping the learner with a specific lesson.

${contextStr}

Base your explanations on this lesson material.
If the learner asks something outside the lesson, explain the connection
briefly rather than ignoring the question.`,
      },
      ...history,
    ]);

    return {
      reply,
    };
  });