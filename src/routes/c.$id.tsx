import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AppHeader } from "@/components/quantum/AppHeader";
import { CircuitComments } from "@/components/quantum/CircuitComments";
import { CircuitCanvas } from "@/components/quantum/CircuitCanvas";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { circuitToCode } from "@/lib/quantum/code";
import { circuitDepth, type QCircuit } from "@/lib/quantum/ir";

export const Route = createFileRoute("/c/$id")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Shared quantum circuit | QuantumLab" },
      {
        name: "description",
        content:
          "View a quantum circuit shared from QuantumLab: gates, qubit wires and the equivalent circuit code.",
      },
      { property: "og:title", content: "Shared quantum circuit | QuantumLab" },
      {
        property: "og:description",
        content: "Someone shared a quantum circuit built in QuantumLab.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SharedCircuitPage,
});

interface SharedRow {
  title: string;
  description: string | null;
  data: QCircuit;
  updated_at: string;
}

function SharedCircuitPage() {
  const { id } = Route.useParams();
  const [row, setRow] = useState<SharedRow | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data, error } = await supabase
        .from("circuits")
        .select("title, description, data, updated_at")
        .eq("id", id)
        .eq("is_public", true)
        .maybeSingle();
      if (!active) return;
      if (error || !data) {
        setState("missing");
        return;
      }
      setRow(data as unknown as SharedRow);
      setState("ready");
    })();
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        {state === "loading" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading circuit…
          </div>
        )}

        {state === "missing" && (
          <div className="panel p-10 text-center">
            <h1 className="text-lg font-semibold">Circuit not available</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This circuit doesn't exist or is no longer shared publicly.
            </p>
            <Button asChild className="mt-4">
              <Link to="/lab">Build your own</Link>
            </Button>
          </div>
        )}

        {state === "ready" && row && (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl font-semibold">{row.title}</h1>
              {row.description && (
                <p className="mt-1 text-sm text-muted-foreground">{row.description}</p>
              )}
              <Badge variant="secondary" className="mt-3 font-mono text-[0.65rem]">
                {row.data.numQubits} qubits · depth {circuitDepth(row.data)} ·{" "}
                {row.data.gates.length} gates
              </Badge>
            </div>

            <div className="panel p-4">
              <CircuitCanvas
                circuit={row.data}
                selectedId={null}
                onSelect={() => {}}
                onPlace={() => {}}
                onMove={() => {}}
                onDelete={() => {}}
                activeColumn={null}
              />
            </div>

            <div className="panel p-4">
              <h2 className="mb-3 text-sm font-semibold">Circuit code</h2>
              <pre className="overflow-auto rounded-md bg-surface-raised p-3 font-mono text-xs text-muted-foreground">
                {circuitToCode(row.data)}
              </pre>
            </div>

            <div className="panel p-4">
              <CircuitComments circuitId={id} />
            </div>

            <Button asChild>
              <Link to="/lab">Open the Circuit Lab</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
