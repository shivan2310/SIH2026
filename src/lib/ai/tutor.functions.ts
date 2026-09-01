import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/auth/server";

const MODEL = process.env["VITE_AI_MODEL"] || "llama3";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

async function callGateway(messages: ChatMessage[]): Promise<string> {
  const ollamaUrl = process.env["VITE_OLLAMA_URL"] || "http://localhost:11434";
  const endpoint = `${ollamaUrl}/v1/chat/completions`;
  const apiKey = process.env["GEMINI_API_KEY"] || "ollama"; // Local models don't need real keys

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ model: MODEL, messages }),
  });

  if (!res.ok) throw new Error(`AI error (${res.status}): ${await res.text()}`);

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("The AI returned an empty response.");
  return content;
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

const TUTOR_SYSTEM = `You are the QuantumLab tutor, an expert quantum computing educator.
Explain concepts clearly and correctly, adapting depth to the learner's level.
Use short paragraphs and plain markdown; write kets as |0>, |1>, |psi>.
When the learner's current circuit is given, ground your answer in it.
Keep answers under ~200 words unless asked for more.`;

/** Context-aware chat tutor scoped to the circuit currently in the lab. */
export const tutorChat = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator(
    (input: {
      messages: Array<{ role: "user" | "assistant"; content: string }>;
      circuitCode: string;
      level: "beginner" | "intermediate" | "advanced";
    }) => input,
  )
  .handler(async ({ data }) => {
    const history = data.messages.slice(-12).map((m) => ({
      role: m.role,
      content: m.content.slice(0, 4000),
    }));
    const reply = await callGateway([
      { role: "system", content: TUTOR_SYSTEM },
      {
        role: "system",
        content: `Learner level: ${data.level}.\nCurrent circuit:\n${data.circuitCode}`,
      },
      ...history,
    ]);
    return { reply };
  });

export interface CircuitAnalysis {
  summary: string;
  issues: Array<{ severity: "error" | "warning" | "info"; message: string }>;
  optimizations: string[];
}

/** Error detection, redundant-gate and depth optimization suggestions. */
export const analyzeCircuit = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: { circuitCode: string; goal?: string }) => input)
  .handler(async ({ data }): Promise<CircuitAnalysis> => {
    const raw = await callGateway([
      {
        role: "system",
        content: `You analyse quantum circuits written in this DSL.\n${DSL_SPEC}
Respond with ONLY a JSON object, no markdown fences, shaped:
{"summary": string, "issues": [{"severity":"error"|"warning"|"info","message":string}], "optimizations": [string]}
summary: 1-3 sentences on what the circuit does and the state it prepares.
issues: real problems (unused qubits, missing measurements, gates with no effect, likely mistakes). Empty array if none.
optimizations: concrete rewrites that reduce gate count or depth. Empty array if none.`,
      },
      {
        role: "user",
        content: data.goal
          ? `Intended behaviour: ${data.goal}\n\nCircuit:\n${data.circuitCode}`
          : `Circuit:\n${data.circuitCode}`,
      },
    ]);

    const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    try {
      const parsed = JSON.parse(cleaned) as Partial<CircuitAnalysis>;
      return {
        summary: parsed.summary ?? "",
        issues: Array.isArray(parsed.issues) ? parsed.issues : [],
        optimizations: Array.isArray(parsed.optimizations) ? parsed.optimizations : [],
      };
    } catch {
      return { summary: raw, issues: [], optimizations: [] };
    }
  });

/** Natural language -> circuit DSL, ready to load into the lab. */
export const generateCircuit = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input: { prompt: string }) => input)
  .handler(async ({ data }) => {
    const raw = await callGateway([
      {
        role: "system",
        content: `You write quantum circuits in this DSL and nothing else.\n${DSL_SPEC}
Output ONLY the DSL program. No prose, no code fences, no explanation.
Use the smallest number of qubits that satisfies the request.`,
      },
      { role: "user", content: data.prompt.slice(0, 2000) },
    ]);
    const code = raw
      .replace(/```[a-z]*\n?/gi, "")
      .replace(/```/g, "")
      .trim();
    return { code: code + "\n" };
  });

/** Plain-English explanation of the circuit currently in the lab. */
export const explainCircuit = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator(
    (input: { circuitCode: string; level: "beginner" | "intermediate" | "advanced" }) =>
      input,
  )
  .handler(async ({ data }) => {
    const reply = await callGateway([
      { role: "system", content: TUTOR_SYSTEM },
      {
        role: "user",
        content: `Explain this circuit for a ${data.level} learner: what each stage does, the state it prepares, and what the measurement statistics should look like.\n\n${data.circuitCode}`,
      },
    ]);
    return { reply };
  });

export const globalChat = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input: { messages: Array<{ role: "user" | "assistant"; content: string }> }) => input)
  .handler(async ({ data }) => {
    const history = data.messages.slice(-20).map((m) => ({
      role: m.role,
      content: m.content.slice(0, 4000),
    }));
    const reply = await callGateway([
      { role: "system", content: TUTOR_SYSTEM },
      ...history,
    ]);
    return { reply };
  });
