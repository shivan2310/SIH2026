import { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Bot, Loader2, Send, Sparkles, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/useSession";
import { lessonChat } from "@/lib/ai/tutor.functions";
import { serializeLesson } from "@/lib/ai/context";
import type { Lesson } from "@/lib/learn/content";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "../quantum/MarkdownRenderer";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  lesson: Lesson;
}

export function LessonAITutor({ lesson }: Props) {
  const { user, loading } = useSession();
  const chat = useServerFn(lessonChat);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);



  if (loading) return null;

  if (!user) {
    return (
      <section className="mt-8 rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-2 text-base font-bold text-[#111111]">
          <Sparkles className="h-5 w-5 text-[#F47F45]" />
          Discuss this lesson with AI
        </div>
        <p className="mb-6 text-sm font-medium text-[#707070]">
          Sign in to ask our AI tutor questions specifically about this lesson material.
        </p>
        <Link to="/auth" className="inline-block rounded-lg bg-[#F47F45] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#E3692E]">
          Sign in to ask questions
        </Link>
      </section>
    );
  }

  async function send() {
    const text = input.trim();
    if (!text || thinking) return;
    
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setThinking(true);
    
    try {
      const { reply } = await chat({
        data: {
          messages: next,
          lessonContext: serializeLesson(lesson),
        },
      });
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to get AI response.");
      setMessages(next.slice(0, -1)); // Revert on failure
    } finally {
      setThinking(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-gray-50"
      >
        <div className="flex items-center gap-2 text-base font-bold text-[#111111]">
          <Sparkles className="h-5 w-5 text-[#F47F45]" />
          Discuss this lesson with AI
        </div>
        <div className="text-sm text-[#707070] font-semibold">
          {isOpen ? "Hide chat" : "Ask a question"}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-[#E5E7EB] p-6 pt-4 bg-gray-50/50">
          <div className="mb-4 max-h-[400px] space-y-4 overflow-y-auto rounded-xl bg-white border border-[#E5E7EB] p-5">
            {messages.length === 0 && (
              <p className="text-center text-sm font-medium text-[#707070] py-6">
                Ask anything about {lesson.title}. The tutor knows what you're reading!
              </p>
            )}
            
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-3",
                  m.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div
                  className={cn(
                    "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs shadow-sm",
                    m.role === "user"
                      ? "bg-[#F47F45] text-white"
                      : "bg-gray-100 border border-[#E5E7EB] text-[#707070]"
                  )}
                >
                  {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3 max-w-[85%] text-sm font-medium leading-relaxed shadow-sm",
                    m.role === "user"
                      ? "bg-[#F47F45] text-white rounded-tr-none whitespace-pre-wrap"
                      : "bg-gray-100 border border-[#E5E7EB] text-[#111111] rounded-tl-none w-full"
                  )}
                >
                  {m.role === "user" ? (
                    m.content
                  ) : (
                    <MarkdownRenderer content={m.content} />
                  )}
                </div>
              </div>
            ))}
            
            {thinking && (
              <div className="flex gap-3 flex-row">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 border border-[#E5E7EB] flex items-center justify-center text-[#707070] shadow-sm">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl rounded-tl-none bg-gray-100 border border-[#E5E7EB] px-5 py-3 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-[#707070]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-3">
            <Textarea
              value={input}
              rows={1}
              placeholder="E.g. Can you explain the equation for the superposition state?"
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              className="min-h-12 resize-none text-sm py-3.5 bg-white border-[#E5E7EB] font-medium text-[#111111]"
            />
            <button
              onClick={() => void send()}
              disabled={thinking || !input.trim()}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F47F45] text-white shadow-sm transition-colors hover:bg-[#E3692E] disabled:opacity-50"
              aria-label="Send"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
