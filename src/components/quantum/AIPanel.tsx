import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";
import {
  tutorChat,
  explainCircuit,
} from "@/lib/ai/tutor.functions";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  code: string;
  onApplyCode: (code: string) => void;
}

function errMessage(e: unknown): string {
  return e instanceof Error ? e.message : "The AI request failed.";
}

export function AIPanel({ code, onApplyCode }: Props) {
  const { user, loading } = useSession();
  
  const chat = useServerFn(tutorChat);
  const explain = useServerFn(explainCircuit);

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);

  const SUGGESTIONS = [
    "Explain this circuit",
    "Why use a CNOT gate?",
    "Show the expected output",
    "Suggest an experiment",
    "Explain entanglement"
  ];

  if (loading) return null;

  if (!user) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center space-y-4">
        <Sparkles className="h-10 w-10 text-[#F47F45]" />
        <h3 className="text-lg font-bold text-[#111111]">Quantum AI Tutor</h3>
        <p className="text-sm font-medium text-[#707070]">
          Sign in to ask the AI tutor about your circuit, get optimization suggestions, and build circuits from a plain-English description.
        </p>
        <Button asChild className="w-full bg-[#F47F45] hover:bg-[#E3692E] text-white">
          <Link to="/auth">Sign in</Link>
        </Button>
      </div>
    );
  }

  async function send(question?: string) {
    const text = (question ?? input).trim();
    if (!text || thinking) return;
    
    // Special case for "Explain this circuit"
    if (text === "Explain this circuit") {
      return runExplain();
    }

    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setThinking(true);
    try {
      const { reply } = await chat({
        data: { messages: next, circuitCode: code, level: "intermediate" },
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
    const next: Msg[] = [...messages, { role: "user", content: "Explain this circuit" }];
    setMessages(next);
    try {
      const { reply } = await explain({ data: { circuitCode: code, level: "intermediate" } });
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      toast.error(errMessage(e));
    } finally {
      setThinking(false);
    }
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {messages.length === 0 ? (
        <div className="flex flex-1 flex-col p-2">
          <h3 className="mb-2 text-base font-bold text-[#111111]">Hi! I'm your Quantum AI Tutor</h3>
          <p className="mb-6 text-sm font-medium text-[#707070] leading-relaxed">
            Ask me anything â€” from gate explanations to debugging your circuit. I can also suggest experiments, explain results, and help you learn step by step.
          </p>
          
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((sug) => (
              <button
                key={sug}
                onClick={() => send(sug)}
                disabled={thinking}
                className="rounded-full border border-[#F47F45]/30 bg-[#F47F45]/5 px-3 py-1.5 text-[11px] font-semibold text-[#F47F45] transition-colors hover:bg-[#F47F45]/20 disabled:opacity-50"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-2 space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex w-full ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm ${
                  m.role === "user"
                    ? "bg-[#F47F45] text-white"
                    : "bg-gray-50 text-[#111111] border border-[#E5E7EB]"
                }`}
              >
                <div className="whitespace-pre-wrap leading-relaxed">{m.content}</div>
              </div>
            </div>
          ))}
          {thinking && (
            <div className="flex w-full justify-start">
              <div className="flex items-center gap-2 rounded-2xl border border-[#E5E7EB] bg-gray-50 px-4 py-3 text-sm text-[#707070]">
                <Loader2 className="h-4 w-4 animate-spin text-[#F47F45]" />
                Thinking...
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input Area */}
      <div className="mt-4 pt-3 border-t border-[#E5E7EB]">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            placeholder="Ask me anything..."
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            className="w-full rounded-full border border-[#E5E7EB] bg-gray-50 py-3 pl-4 pr-12 text-sm outline-none transition-colors focus:border-[#F47F45] focus:bg-white focus:ring-1 focus:ring-[#F47F45]/20"
          />
          <button
            onClick={() => void send()}
            disabled={thinking || !input.trim()}
            className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#F47F45] text-white transition-colors hover:bg-[#E3692E] disabled:opacity-50"
          >
            <Send className="h-4 w-4 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
