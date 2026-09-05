import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import { callGateway, TUTOR_SYSTEM } from "./tutor.functions";

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

/**
 * List all conversations for the authenticated user, ordered by most recently updated.
 */
export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }): Promise<ConversationSummary[]> => {
    const rows = db
      .prepare(
        "SELECT id, title, created_at as createdAt, updated_at as updatedAt FROM ai_conversations WHERE user_id = ? ORDER BY updated_at DESC"
      )
      .all(context.userId) as ConversationSummary[];

    return rows;
  });

/**
 * Retrieve a specific conversation and all its messages.
 */
export const getConversation = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .validator((input: { conversationId: string }) => input)
  .handler(async ({ context, data: { conversationId } }) => {
    const conversation = db
      .prepare(
        "SELECT id, title, created_at as createdAt, updated_at as updatedAt FROM ai_conversations WHERE id = ? AND user_id = ?"
      )
      .get(conversationId, context.userId) as ConversationSummary | undefined;

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const messages = db
      .prepare(
        "SELECT id, role, content, created_at as createdAt FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC"
      )
      .all(conversationId) as StoredChatMessage[];

    return {
      conversation,
      messages,
    };
  });

/**
 * Create a new empty conversation session.
 */
export const createConversation = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input?: { title?: string | undefined } | undefined) => input ?? {})
  .handler(async ({ context, data }): Promise<ConversationSummary> => {
    const id = crypto.randomUUID();
    const title = data?.title?.trim() || "New Chat";

    db.prepare(
      "INSERT INTO ai_conversations (id, user_id, title) VALUES (?, ?, ?)"
    ).run(id, context.userId, title);

    const created = db
      .prepare(
        "SELECT id, title, created_at as createdAt, updated_at as updatedAt FROM ai_conversations WHERE id = ?"
      )
      .get(id) as ConversationSummary;

    return created;
  });

/**
 * Delete a conversation and its messages.
 */
export const deleteConversation = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator((input: { conversationId: string }) => input)
  .handler(async ({ context, data: { conversationId } }) => {
    db.prepare(
      "DELETE FROM ai_conversations WHERE id = ? AND user_id = ?"
    ).run(conversationId, context.userId);

    return { success: true };
  });

/**
 * Send a chat message:
 * - Creates or references conversation session
 * - Saves user message in SQLite
 * - Queries LLM gateway with context
 * - Saves assistant reply in SQLite
 * - Updates conversation timestamp
 */
export const sendChatMessage = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .validator(
    (input: {
      conversationId?: string | undefined;
      message: string;
      systemPrompt?: string | undefined;
    }) => input
  )
  .handler(async ({ context, data }) => {
    const userMessageText = data.message.trim();
    if (!userMessageText) {
      throw new Error("Message content cannot be empty.");
    }

    let conversationId = data.conversationId;

    if (conversationId) {
      const existing = db
        .prepare("SELECT id FROM ai_conversations WHERE id = ? AND user_id = ?")
        .get(conversationId, context.userId);
      if (!existing) {
        conversationId = undefined;
      }
    }

    if (!conversationId) {
      conversationId = crypto.randomUUID();
      const firstLine = userMessageText.split("\n")[0] ?? "";
      const titleCandidate = firstLine.replace(/[#*`_~]/g, "").trim();
      const title =
        (titleCandidate.length > 36
          ? titleCandidate.slice(0, 36) + "..."
          : titleCandidate) || "New Chat";

      db.prepare(
        "INSERT INTO ai_conversations (id, user_id, title) VALUES (?, ?, ?)"
      ).run(conversationId, context.userId, title);
    }

    // Save user message to database
    const userMsgId = crypto.randomUUID();
    db.prepare(
      "INSERT INTO ai_messages (id, conversation_id, role, content) VALUES (?, ?, 'user', ?)"
    ).run(userMsgId, conversationId, userMessageText);

    // Fetch conversation history for LLM context (up to last 16 messages)
    const historyRows = db
      .prepare(
        "SELECT role, content FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC"
      )
      .all(conversationId) as Array<{
      role: "user" | "assistant";
      content: string;
    }>;

    const gatewayMessages = [
      {
        role: "system" as const,
        content: data.systemPrompt || TUTOR_SYSTEM,
      },
      ...historyRows.slice(-16).map((m) => ({
        role: m.role,
        content: m.content.slice(0, 4000),
      })),
    ];

    // Call Ollama gateway
    const reply = await callGateway(gatewayMessages);

    // Save assistant reply to database
    const assistantMsgId = crypto.randomUUID();
    db.prepare(
      "INSERT INTO ai_messages (id, conversation_id, role, content) VALUES (?, ?, 'assistant', ?)"
    ).run(assistantMsgId, conversationId, reply);

    // Update conversation timestamp
    db.prepare(
      "UPDATE ai_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).run(conversationId);

    const conversation = db
      .prepare(
        "SELECT id, title, created_at as createdAt, updated_at as updatedAt FROM ai_conversations WHERE id = ?"
      )
      .get(conversationId) as ConversationSummary;

    return {
      conversation,
      userMessage: {
        id: userMsgId,
        role: "user" as const,
        content: userMessageText,
        createdAt: new Date().toISOString(),
      },
      assistantMessage: {
        id: assistantMsgId,
        role: "assistant" as const,
        content: reply,
        createdAt: new Date().toISOString(),
      },
    };
  });
