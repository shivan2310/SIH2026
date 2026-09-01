import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, MessageSquare, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getCircuitComments, postCircuitComment, deleteCircuitComment } from "@/lib/circuits/actions";
import { useSession } from "@/hooks/useSession";

interface CommentRow {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  author: string;
}

export function CircuitComments({ circuitId }: { circuitId: string }) {
  const { user } = useSession();
  const [rows, setRows] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getCircuitComments({ data: { circuitId } });
      setRows(data);
    } catch (err) {
      console.error(err);
      setRows([]);
    }
    setLoading(false);
  }, [circuitId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function post() {
    if (!user || body.trim().length === 0) return;
    setPosting(true);
    try {
      await postCircuitComment({ data: { circuitId, body: body.trim() } });
      setBody("");
      await load();
    } catch (err) {
      console.error(err);
    }
    setPosting(false);
  }

  async function remove(id: string) {
    try {
      await deleteCircuitComment({ data: { id } });
      await load();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div>
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <MessageSquare className="h-4 w-4 text-primary" /> Discussion
      </h2>

      {loading ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading comments…
        </p>
      ) : rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">No comments yet.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((c) => (
            <li key={c.id} className="rounded-md border border-border bg-surface-raised p-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">{c.author}</span>
                <span className="font-mono text-[0.6rem] text-muted-foreground">
                  {new Date(c.created_at).toLocaleString()}
                </span>
                {user?.id === c.user_id && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-auto h-6 px-2"
                    onClick={() => void remove(c.id)}
                    aria-label="Delete comment"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm">{c.body}</p>
            </li>
          ))}
        </ul>
      )}

      {user ? (
        <div className="mt-3 space-y-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Ask a question or leave feedback…"
            rows={3}
          />
          <Button size="sm" onClick={() => void post()} disabled={posting}>
            <Send className="mr-1.5 h-3.5 w-3.5" /> Post comment
          </Button>
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          <Link to="/auth" className="text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>{" "}
          to join the discussion.
        </p>
      )}
    </div>
  );
}
