import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ExternalLink,
  Globe,
  Loader2,
  Lock,
  Plus,
  Share2,
  Trash2,
} from "lucide-react";
import { AppHeader } from "@/components/quantum/AppHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { circuitDepth, type QCircuit } from "@/lib/quantum/ir";

export const Route = createFileRoute("/_authenticated/circuits")({
  head: () => ({
    meta: [
      { title: "My circuits — Cloud workspace | QuantumLab" },
      {
        name: "description",
        content:
          "Browse, open, share and delete the quantum circuits you have saved to your QuantumLab cloud workspace.",
      },
      { property: "og:title", content: "My circuits | QuantumLab" },
      {
        property: "og:description",
        content: "Your cloud-saved quantum circuits, ready to open and share.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CircuitsPage,
});

interface CircuitRow {
  id: string;
  title: string;
  description: string | null;
  data: unknown;
  is_public: boolean;
  updated_at: string;
}

function CircuitsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<CircuitRow[] | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("circuits")
      .select("id, title, description, data, is_public, updated_at")
      .order("updated_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      setRows([]);
      return;
    }
    setRows((data ?? []) as CircuitRow[]);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleShare(row: CircuitRow, next: boolean) {
    const { error } = await supabase
      .from("circuits")
      .update({ is_public: next })
      .eq("id", row.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((r) =>
      (r ?? []).map((c) => (c.id === row.id ? { ...c, is_public: next } : c)),
    );
    toast.success(next ? "Anyone with the link can view" : "Circuit is private");
  }

  async function copyLink(row: CircuitRow) {
    const url = `${window.location.origin}/c/${row.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied");
    } catch {
      toast.error("Clipboard unavailable in this browser");
    }
  }

  async function remove(row: CircuitRow) {
    const { error } = await supabase.from("circuits").delete().eq("id", row.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setRows((r) => (r ?? []).filter((c) => c.id !== row.id));
    toast.success("Circuit deleted");
  }

  function open(row: CircuitRow) {
    void navigate({ to: "/lab", search: { circuit: row.id } });
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <div className="mb-6 flex items-center gap-3">
          <div className="mr-auto">
            <h1 className="text-xl font-semibold">My circuits</h1>
            <p className="text-sm text-muted-foreground">
              Saved to your cloud workspace and private unless you share them.
            </p>
          </div>
          <Button asChild size="sm">
            <Link to="/lab">
              <Plus className="mr-1.5 h-4 w-4" /> New circuit
            </Link>
          </Button>
        </div>

        {rows === null && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your workspace…
          </div>
        )}

        {rows?.length === 0 && (
          <div className="panel p-10 text-center">
            <p className="text-sm text-muted-foreground">
              No saved circuits yet. Build one in the lab and hit “Save to cloud”.
            </p>
            <Button asChild className="mt-4">
              <Link to="/lab">Open the Circuit Lab</Link>
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {rows?.map((row) => {
            const c = row.data as QCircuit;
            return (
              <div key={row.id} className="panel flex flex-wrap items-center gap-3 p-4">
                <button
                  type="button"
                  onClick={() => open(row)}
                  className="mr-auto text-left"
                >
                  <p className="text-sm font-medium hover:text-primary">{row.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.description || "No description"}
                  </p>
                  <Badge variant="secondary" className="mt-2 font-mono text-[0.65rem]">
                    {c?.numQubits ?? 0} qubits · depth {c ? circuitDepth(c) : 0} ·{" "}
                    {new Date(row.updated_at).toLocaleDateString()}
                  </Badge>
                </button>

                <div className="flex items-center gap-2">
                  {row.is_public ? (
                    <Globe className="h-4 w-4 text-primary" />
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Switch
                    checked={row.is_public}
                    onCheckedChange={(v) => void toggleShare(row, v)}
                    aria-label="Share circuit by link"
                  />
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void copyLink(row)}
                  disabled={!row.is_public}
                  aria-label="Copy share link"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => open(row)} aria-label="Open in lab">
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void remove(row)}
                  aria-label="Delete circuit"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
