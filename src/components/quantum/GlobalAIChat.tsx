import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Loader2,
  Plus,
  History,
  Trash2,
  ChevronLeft,
  Sparkles,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/hooks/useSession";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "./MarkdownRenderer";
import {
  listConversations,
  getConversation,
  deleteConversation,
  sendChatMessage,
  type StoredChatMessage,
  type ConversationSummary,
} from "@/lib/ai/chat.actions";

function formatRelativeTime(dateStr: string): string {
  try {
    const d = new Date(dateStr.endsWith("Z") ? dateStr : dateStr + "Z");
    const diffSec = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function GlobalAIChat() {
  const { user } = useSession();
  const queryClient = useQueryClient();

  const [isOpen, setIsOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Optimistic local messages while sending or when active conversation is selected
  const [localMessages, setLocalMessages] = useState<StoredChatMessage[]>([]);

  // 1. Fetch conversations list
  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ["ai_conversations"],
    queryFn: () => listConversations(),
    enabled: !!user && isOpen,
  });

  // 2. Fetch messages for active conversation
  const { data: activeConvData, isLoading: loadingMessages } = useQuery({
    queryKey: ["ai_conversation", activeConversationId],
    queryFn: () => getConversation({ data: { conversationId: activeConversationId! } }),
    enabled: !!activeConversationId && isOpen,
  });

  // Sync loaded messages to local state
  useEffect(() => {
    if (activeConvData?.messages) {
      setLocalMessages(activeConvData.messages);
    } else if (!activeConversationId) {
      setLocalMessages([]);
    }
  }, [activeConvData, activeConversationId]);

  const hasAutoSelectedRef = useRef(false);

  // Auto-select the latest conversation ONLY once on initial mount/open
  useEffect(() => {
    if (isOpen && !hasAutoSelectedRef.current && conversations.length > 0) {
      hasAutoSelectedRef.current = true;
      const firstConv = conversations[0];
      if (firstConv) {
        setActiveConversationId(firstConv.id);
      }
    }
  }, [isOpen, conversations]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && !showHistory) {
      scrollToBottom();
    }
  }, [localMessages, isOpen, showHistory]);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async ({ text, convId }: { text: string; convId?: string | undefined }) => {
      const res = await sendChatMessage({
        data: {
          conversationId: convId,
          message: text,
        },
      });
      return res;
    },
    onSuccess: (res) => {
      setActiveConversationId(res.conversation.id);
      setLocalMessages((prev) => [
        ...prev.filter((m) => m.id !== "temp-user"),
        res.userMessage,
        res.assistantMessage,
      ]);
      queryClient.invalidateQueries({ queryKey: ["ai_conversations"] });
      queryClient.setQueryData(["ai_conversation", res.conversation.id], (old: any) => {
        const prevMsgs = old?.messages ? old.messages.filter((m: any) => m.id !== "temp-user") : [];
        return {
          conversation: res.conversation,
          messages: [
            ...prevMsgs,
            res.userMessage,
            res.assistantMessage,
          ],
        };
      });
    },
    onError: (err) => {
      console.error("Failed to send message:", err);
      setLocalMessages((prev) => [
        ...prev.filter((m) => m.id !== "temp-user"),
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, I encountered an error answering your question. Please check that Ollama is accessible and try again.",
          createdAt: new Date().toISOString(),
        },
      ]);
    },
  });

  // Delete conversation mutation
  const deleteMutation = useMutation({
    mutationFn: async (convId: string) => {
      await deleteConversation({ data: { conversationId: convId } });
      return convId;
    },
    onSuccess: (deletedId) => {
      if (activeConversationId === deletedId) {
        setActiveConversationId(null);
        setLocalMessages([]);
      }
      queryClient.invalidateQueries({ queryKey: ["ai_conversations"] });
    },
  });

  if (!user) return null; // Only available for logged in users

  const handleStartNewChat = () => {
    setActiveConversationId(null);
    setLocalMessages([]);
    setShowHistory(false);
    setInput("");
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleSelectConversation = (conv: ConversationSummary) => {
    setActiveConversationId(conv.id);
    setShowHistory(false);
  };

  const handleDeleteConversation = (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    deleteMutation.mutate(convId);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sendMutation.isPending) return;

    // Optimistically add user message
    const tempMsg: StoredChatMessage = {
      id: "temp-user",
      role: "user",
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setLocalMessages((prev) => [...prev, tempMsg]);
    setInput("");

    sendMutation.mutate({
      text: trimmed,
      convId: activeConversationId ?? undefined,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const activeTitle = activeConversationId
    ? conversations.find((c) => c.id === activeConversationId)?.title || "Chat"
    : "New Chat";

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans text-[#111111]">
      {/* Chat Bubble Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F47F45] text-white shadow-xl transition-all hover:scale-105 hover:bg-[#E3692E]"
          aria-label="Open AI Tutor Chat"
        >
          <MessageSquare className="h-6 w-6" />
        </button>
      )}

      {/* Main Chat Dialog */}
      <div
        className={cn(
          "absolute bottom-0 right-0 w-[360px] sm:w-[440px] h-[560px] max-h-[85vh] flex flex-col bg-white border border-[#E5E7EB] rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 origin-bottom-right",
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
        )}
      >
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E7EB] bg-white shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {showHistory ? (
              <button
                onClick={() => setShowHistory(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#707070] transition-colors hover:bg-gray-100 hover:text-[#111111]"
                title="Back to conversation"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={() => setShowHistory(true)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
                  showHistory
                    ? "bg-[#F47F45]/10 text-[#F47F45]"
                    : "text-[#707070] hover:bg-gray-100 hover:text-[#111111]"
                )}
                title="View chat history (Gemini style)"
              >
                <History className="h-4 w-4" />
              </button>
            )}

            <div className="flex items-center gap-2 min-w-0">
              <Bot className="h-5 w-5 shrink-0 text-[#F47F45]" />
              <div className="truncate font-bold text-sm text-[#111111]">
                {showHistory ? "Chat History" : activeTitle}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* New Chat Button */}
            <button
              onClick={handleStartNewChat}
              className="flex h-8 items-center gap-1 px-2.5 rounded-lg text-xs font-semibold text-[#F47F45] bg-[#F47F45]/10 hover:bg-[#F47F45]/20 transition-colors"
              title="Start a new chat"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New</span>
            </button>

            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#707070] transition-colors hover:bg-gray-100 hover:text-[#111111]"
              title="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Sliding History Drawer / Chat View */}
        {showHistory ? (
          /* Gemini-style History Panel */
          <div className="flex-1 flex flex-col min-h-0 bg-gray-50/50">
            <div className="p-3 border-b border-[#E5E7EB] bg-white flex items-center justify-between">
              <span className="text-xs font-semibold text-[#707070] uppercase tracking-wider">
                Recent Chats ({conversations.length})
              </span>
              <button
                onClick={handleStartNewChat}
                className="text-xs font-bold text-[#F47F45] hover:text-[#E3692E] flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> New Chat
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {loadingConversations ? (
                <div className="flex h-32 items-center justify-center text-[#707070]">
                  <Loader2 className="h-5 w-5 animate-spin text-[#F47F45]" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center p-4">
                  <Sparkles className="h-8 w-8 text-[#F47F45]/40 mb-2" />
                  <p className="text-sm font-semibold text-[#111111]">No chat history yet</p>
                  <p className="text-xs text-[#707070] mt-1">
                    Ask a question to start your first quantum conversation!
                  </p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const isActive = conv.id === activeConversationId;
                  return (
                    <div
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv)}
                      className={cn(
                        "group relative flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all text-sm",
                        isActive
                          ? "bg-white text-[#111111] font-semibold shadow-sm border border-[#E5E7EB]"
                          : "text-[#707070] hover:bg-gray-100 hover:text-[#111111]"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                        <MessageSquare
                          className={cn(
                            "h-4 w-4 shrink-0",
                            isActive ? "text-[#F47F45]" : "text-[#707070]"
                          )}
                        />
                        <div className="truncate text-xs sm:text-sm">{conv.title}</div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-gray-400 group-hover:hidden">
                          {formatRelativeTime(conv.updatedAt)}
                        </span>
                        <button
                          onClick={(e) => handleDeleteConversation(e, conv.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-[#707070] hover:text-red-500 rounded transition-opacity"
                          title="Delete chat"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* Active Chat Message View */
          <div className="flex-1 flex flex-col min-h-0 bg-white">
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/40">
              {loadingMessages ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-[#F47F45]" />
                </div>
              ) : localMessages.length === 0 ? (
                /* Welcome Greeting when no messages in active session */
                <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-[#F47F45]/10 flex items-center justify-center text-[#F47F45]">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-[#111111]">
                    Welcome to QuantumLab AI Tutor
                  </h3>
                  <p className="text-xs font-medium text-[#707070] max-w-xs leading-relaxed">
                    Ask me anything about quantum mechanics, superposition, logic gates, or circuits. Your chats will be saved in your history automatically!
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center pt-2">
                    {[
                      "Explain superposition",
                      "How does a CNOT gate work?",
                      "What is quantum entanglement?",
                    ].map((sug) => (
                      <button
                        key={sug}
                        onClick={() => {
                          setInput(sug);
                          inputRef.current?.focus();
                        }}
                        className="rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-medium text-[#707070] hover:border-[#F47F45] hover:text-[#F47F45] transition-colors"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                localMessages.map((msg, i) => (
                  <div
                    key={msg.id || i}
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
                      {msg.role === "user" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-2.5 max-w-[80%] text-sm font-medium shadow-sm",
                        msg.role === "user"
                          ? "bg-[#F47F45] text-white rounded-tr-none"
                          : "bg-white border border-[#E5E7EB] text-[#111111] rounded-tl-none w-full"
                      )}
                    >
                      {msg.role === "user" ? (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <MarkdownRenderer content={msg.content} />
                      )}
                    </div>
                  </div>
                ))
              )}

              {sendMutation.isPending && (
                <div className="flex gap-3 flex-row">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center text-[#707070] shadow-sm">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl rounded-tl-none bg-white border border-[#E5E7EB] px-4 py-3 shadow-sm flex items-center gap-2 text-xs text-[#707070]">
                    <Loader2 className="h-4 w-4 animate-spin text-[#F47F45]" />
                    <span>Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-3 border-t border-[#E5E7EB] bg-white shrink-0">
              <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything..."
                  className="min-h-[44px] max-h-32 resize-none py-3 pr-10 rounded-xl bg-gray-50 border-[#E5E7EB] text-sm font-medium text-[#111111] focus:bg-white focus:border-[#F47F45]"
                  rows={1}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sendMutation.isPending}
                  className="absolute right-2 bottom-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#F47F45] text-white transition-colors hover:bg-[#E3692E] disabled:opacity-50"
                  aria-label="Send message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
