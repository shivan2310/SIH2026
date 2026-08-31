import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Info, Loader2, Send, Sparkles, Wand2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "@/hooks/useSession";
import {
  analyzeCircuit,
  explainCircuit,
  generateCircuit,
  tutorChat,
  type CircuitAnalysis,
} from "@/lib/ai/tutor.functions";

type Level = "beginner" | "intermediate" | "advanced";
interface Msg {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  /** Current circuit as DSL source — the AI's grounding context. */
  code: string;
  /** Replace the lab circuit with AI-generated DSL. */
  onApplyCode: (code: string) => void;
}

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : "The AI request failed.";
}

/** AI tutor, circuit analysis and natural-language circuit generation. */
export function AIPanel({ code, onApplyCode }: Props) {
  const { user, loading } = useSession();
  const [level, setLevel] = useState<Level>("beginner");

  const chat = useServerFn(tutorChat);
  const analyze = useServerFn(analyzeCircuit);
  const generate = useServerFn(generateCircuit);
  const explain = useServerFn(explainCircuit);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  const [analysis, setAnalysis] = useState<CircuitAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);

  if (loading) return null;

  if (!user) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Sign in to ask the AI tutor about your circuit, get optimization
          suggestions, and build circuits from a plain-English description.
        </p>
        <Button asChild size="sm" className="w-full">
          <Link to="/auth">Sign in to use the tutor</Link>
        </Button>
      </div>
    );
  }

  async function send(question?: string) {
    const text = (question ?? input).trim();
    if (!text || thinking) return;
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setThinking(true);
    try {
      const { reply } = await chat({
        data: { messages: next, circuitCode: code, level },
      });
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      toast.error(errMessage(e));
      setMessages(next);
    } finally {
      setThinking(false);
    }
  }

  async function runExplain() {
    setThinking(true);
    try {
      const { reply } = await explain({ data: { circuitCode: code, level } });
      setMessages((m) => [
        ...m,
        { role: "user", content: "Explain my current circuit." },
        { role: "assistant", content: reply },
      ]);
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setThinking(false);
    }
  }

  async function runAnalyze() {
    setAnalyzing(true);
    try {
      setAnalysis(await analyze({ data: { circuitCode: code } }));
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setAnalyzing(false);
    }
  }

  async function runGenerate() {
    if (!prompt.trim()) return;
    setGenerating(true);
    try {
      const { code: generated } = await generate({ data: { prompt } });
      onApplyCode(generated);
      toast.success("Circuit generated — check the canvas");
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Tabs defaultValue="tutor" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="tutor">Tutor</TabsTrigger>
        <TabsTrigger value="analyze">Analyze</TabsTrigger>
        <TabsTrigger value="build">Build</TabsTrigger>
      </TabsList>

      <TabsContent value="tutor" className="mt-3 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Depth</span>
          <Select value={level} onValueChange={(v) => setLevel(v as Level)}>
            <SelectTrigger className="h-8 flex-1 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="max-h-80 space-y-2 overflow-y-auto rounded-md border border-border bg-surface-raised p-3">
          {messages.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Ask anything about quantum computing or the circuit on the canvas —
              superposition, entanglement, why your amplitudes look like that.
            </p>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "ml-6 rounded-md bg-primary/10 px-3 py-2 text-sm"
                  : "mr-2 whitespace-pre-wrap text-sm leading-relaxed"
              }
            >
              {m.content}
            </div>
          ))}
          {thinking && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Thinking…
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => void runExplain()} disabled={thinking}>
            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Explain my circuit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void send("What is quantum entanglement?")}
            disabled={thinking}
          >
            Entanglement?
          </Button>
        </div>

        <div className="flex gap-2">
          <Textarea
            value={input}
            rows={2}
            placeholder="Ask the tutor…"
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            className="min-h-0 resize-none text-sm"
          />
          <Button size="sm" onClick={() => void send()} disabled={thinking} aria-label="Send">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="analyze" className="mt-3 space-y-3">
        <Button size="sm" className="w-full" onClick={() => void runAnalyze()} disabled={analyzing}>
          {analyzing ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-1.5 h-4 w-4" />
          )}
          Analyze circuit
        </Button>
        {analysis && (
          <div className="space-y-3">
            <p className="text-sm leading-relaxed">{analysis.summary}</p>
            {analysis.issues.length > 0 && (
              <ul className="space-y-1.5">
                {analysis.issues.map((issue, i) => (
                  <li key={i} className="flex gap-2 text-xs">
                    {issue.severity === "error" ? (
                      <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive" />
                    ) : issue.severity === "warning" ? (
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    ) : (
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    )}
                    <span>{issue.message}</span>
                  </li>
                ))}
              </ul>
            )}
            {analysis.optimizations.length > 0 && (
              <div>
                <p className="mb-1 font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
                  Optimizations
                </p>
                <ul className="list-disc space-y-1 pl-4 text-xs">
                  {analysis.optimizations.map((o, i) => (
                    <li key={i}>{o}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </TabsContent>

      <TabsContent value="build" className="mt-3 space-y-3">
        <Textarea
          value={prompt}
          rows={3}
          placeholder="Describe a circuit: “3-qubit GHZ state with measurements”"
          onChange={(e) => setPrompt(e.target.value)}
          className="resize-none text-sm"
        />
        <Button
          size="sm"
          className="w-full"
          onClick={() => void runGenerate()}
          disabled={generating || !prompt.trim()}
        >
          {generating ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-1.5 h-4 w-4" />
          )}
          Generate circuit
        </Button>
        <p className="text-xs text-muted-foreground">
          The generated program replaces the code editor contents and the canvas.
          Undo restores your previous circuit.
        </p>
      </TabsContent>
    </Tabs>
  );
}
