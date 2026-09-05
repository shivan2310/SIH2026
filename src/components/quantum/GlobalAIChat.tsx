import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { globalChat } from "@/lib/ai/tutor.functions";
import { useSession } from "@/hooks/useSession";
import { cn } from "@/lib/utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function GlobalAIChat() {
  const { user } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi! I'm the QuantumLab AI tutor. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const mutation = useMutation({
    mutationFn: async (msgs: ChatMessage[]) => {
      const res = await globalChat({ data: { messages: msgs } });
      return res.reply;
    },
    onSuccess: (reply) => {
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    },
    onError: (err) => {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error answering your question." }
      ]);
    }
  });

  if (!user) return null; // Only show for logged in users

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || mutation.isPending) return;
    
    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    
    mutation.mutate(newMessages);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans text-[#111111]">
      {/* Chat Bubble Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F47F45] text-white shadow-lg transition-all hover:scale-105 hover:bg-[#E3692E]"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {/* Chat Window */}
      <div
        className={cn(
          "absolute bottom-0 right-0 w-[350px] sm:w-[400px] h-[500px] max-h-[80vh] flex flex-col bg-white border border-[#E5E7EB] rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 origin-bottom-right",
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB] bg-white">
          <div className="flex items-center gap-2 font-bold text-[#111111]">
            <Bot className="h-5 w-5 text-[#F47F45]" />
            AI Tutor
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#707070] transition-colors hover:bg-gray-100 hover:text-[#111111]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              )}
            >
              <div
                className={cn(
                  "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs shadow-sm",
                  msg.role === "user"
                    ? "bg-[#F47F45] text-white"
                    : "bg-white border border-[#E5E7EB] text-[#707070]"
                )}
              >
                {msg.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div
                className={cn(
                  "rounded-2xl px-4 py-2.5 max-w-[75%] text-sm font-medium shadow-sm",
                  msg.role === "user"
                    ? "bg-[#F47F45] text-white rounded-tr-none"
                    : "bg-white border border-[#E5E7EB] text-[#111111] rounded-tl-none"
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {mutation.isPending && (
            <div className="flex gap-3 flex-row">
              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center text-[#707070] shadow-sm">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl rounded-tl-none bg-white border border-[#E5E7EB] px-4 py-3 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin text-[#707070]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-[#E5E7EB] bg-white">
          <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything..."
              className="min-h-[44px] max-h-32 resize-none py-3 pr-10 rounded-xl bg-gray-50 border-[#E5E7EB] text-sm font-medium text-[#111111] focus:bg-white focus:border-[#F47F45]"
              rows={1}
            />
            <button
              type="submit"
              disabled={!input.trim() || mutation.isPending}
              className="absolute right-2 bottom-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#F47F45] text-white transition-colors hover:bg-[#E3692E] disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
