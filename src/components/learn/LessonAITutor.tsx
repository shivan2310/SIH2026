import { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Bot, Loader2, Send, Sparkles, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/useSession";
import { lessonChat } from "@/lib/ai/tutor.functions";
import type { Lesson } from "@/lib/learn/content";
import { cn } from "@/lib/utils";

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

  const serializeLesson = (l: Lesson) => {
    const parts = [`Title: ${l.title}`, `Description: ${l.blurb}`, "Body:"];
    l.body.forEach((b: any) => {
      if (b.kind === "h") parts.push(`## ${b.text}`);
      if (b.kind === "p") parts.push(b.text);
      if (b.kind === "math") parts.push(b.text);
      if (b.kind === "list") parts.push("- " + b.items.join("\n- "));
    });
    return parts.join("\n\n");
  };

  if (loading) return null;

  if (!user) {
    return (
      <section className="mt-8 rounded-lg border border-border bg-surface-raised p-5">
        <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          Discuss this lesson with AI
        </div>
        <p className="mb-4 text-xs text-muted-foreground">
          Sign in to ask our AI tutor questions specifically about this lesson material.
        </p>
        <Button asChild size="sm">
          <Link to="/auth">Sign in to ask questions</Link>
        </Button>
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
    <section className="mt-8 rounded-lg border border-border bg-surface-raised overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-surface"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          Discuss this lesson with AI
        </div>
        <div className="text-xs text-muted-foreground font-medium">
          {isOpen ? "Hide chat" : "Ask a question"}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-border p-5 pt-4">
          <div className="mb-4 max-h-[400px] space-y-4 overflow-y-auto rounded-md bg-surface p-4">
            {messages.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-4">
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
                    "flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-surface-raised border border-border"
                  )}
                >
                  {m.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                </div>
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2 max-w-[85%] text-sm whitespace-pre-wrap leading-relaxed",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-surface-raised border border-border rounded-tl-none"
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}
            
            {thinking && (
              <div className="flex gap-3 flex-row">
                <div className="flex-shrink-0 h-7 w-7 rounded-full bg-surface-raised border border-border flex items-center justify-center">
                  <Bot className="h-3.5 w-3.5" />
                </div>
                <div className="rounded-2xl rounded-tl-none bg-surface-raised border border-border px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-2">
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
              className="min-h-11 resize-none text-sm py-3"
            />
            <Button
              size="icon"
              onClick={() => void send()}
              disabled={thinking || !input.trim()}
              className="h-11 w-11 shrink-0"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
