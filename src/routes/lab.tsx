import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { getCircuit } from "@/lib/circuits/actions";
import { SaveCircuitPanel } from "@/components/quantum/SaveCircuitPanel";
import { AIPanel } from "@/components/quantum/AIPanel";
import { AppHeader } from "@/components/quantum/AppHeader";
import { GatePalette } from "@/components/quantum/GatePalette";
import { CircuitCanvas } from "@/components/quantum/CircuitCanvas";
import { CodePanel } from "@/components/quantum/CodePanel";
import { ResultsPanel } from "@/components/quantum/ResultsPanel";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Minus,
  Play,
  Sparkles,
  Plus,
  Redo2,
  Trash2,
  Undo2,
} from "lucide-react";
import { useCircuitLab } from "@/hooks/useCircuitLab";
import { BACKENDS } from "@/lib/quantum/backend";
import { EXAMPLES } from "@/lib/quantum/examples";
import { circuitToQiskit, formatAngle } from "@/lib/quantum/code";
import { GATES } from "@/lib/quantum/gates";
import { circuitDepth, MAX_QUBITS, type QCircuit } from "@/lib/quantum/ir";

export const Route = createFileRoute("/lab")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { circuit?: string; code?: string } => ({
    ...(typeof search['circuit'] === "string" ? { circuit: search['circuit'] } : {}),
    ...(typeof search['code'] === "string" ? { code: search['code'] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Quantum Circuit Lab — Build & Simulate | QuantumLab" },
      {
        name: "description",
        content:
          "Design quantum circuits by drag-and-drop or code, simulate them instantly in your browser, and inspect Bloch spheres, amplitudes and measurement statistics.",
      },
      { property: "og:title", content: "Quantum Circuit Lab — Build & Simulate" },
      {
        property: "og:description",
        content:
          "Drag-and-drop quantum circuit builder with a synchronized code editor, browser statevector simulation and live state visualization.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LabPage,
});

function LabPage() {
  const lab = useCircuitLab();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [circuitId, setCircuitId] = useState<string | null>(search.circuit ?? null);
  const loadedRef = useRef<string | null>(null);

  // Adopt a circuit passed in from a lesson or challenge via ?code=
  const codeParam = search.code;
  useEffect(() => {
    if (!codeParam || loadedRef.current === codeParam) return;
    loadedRef.current = codeParam;
    lab.onCodeChange(codeParam);
  }, [codeParam, lab]);

  // Open a cloud-saved circuit when arriving with ?circuit=<id>
  useEffect(() => {
    const id = search.circuit;
    if (!id || loadedRef.current === id) return;
    loadedRef.current = id;
    void (async () => {
      try {
        const data = await getCircuit({ data: { id } });
        if (!data) {
          toast.error("Couldn't open that circuit");
          return;
        }
        lab.loadCircuit(data.data as unknown as QCircuit);
        setCircuitId(id);
      } catch (err) {
        toast.error("Couldn't open that circuit");
      }
    })();
  }, [search.circuit, lab]);


  const {
    circuit,
    result,
    step,
    setStep,
    run,
    running,
    runError,
    undo,
    redo,
    canUndo,
    canRedo,
  } = lab;

  const selectedGate = circuit.gates.find((g) => g.id === lab.selectedId) ?? null;
  const maxStep = result ? result.steps.length - 1 : 0;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void run();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [redo, run, undo]);

  const copyQiskit = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(circuitToQiskit(circuit));
      toast.success("Qiskit code copied to clipboard");
    } catch {
      toast.error("Clipboard unavailable in this browser");
    }
  }, [circuit]);

  const downloadJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(circuit, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "circuit.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [circuit]);

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-[1600px] px-4 py-6">
        <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)_380px]">
          {/* Palette */}
          <aside className="panel h-fit p-4">
            <h2 className="mb-4 text-sm font-semibold">Gate palette</h2>
            <GatePalette
              onPick={(def) =>
                lab.placeGate(def.type, 0, circuitDepth(circuit))
              }
            />
          </aside>

          {/* Canvas + code */}
          <section className="space-y-4">
            <div className="panel p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h2 className="mr-auto text-sm font-semibold">Circuit</h2>
                <Badge variant="secondary" className="font-mono text-[0.65rem]">
                  {circuit.numQubits} qubits · depth {circuitDepth(circuit)} ·{" "}
                  {circuit.gates.length} gates
                </Badge>
                <Button size="sm" variant="ghost" onClick={undo} disabled={!canUndo} aria-label="Undo">
                  <Undo2 className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={redo} disabled={!canRedo} aria-label="Redo">
                  <Redo2 className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={lab.removeQubit}
                  disabled={circuit.numQubits <= 1}
                  aria-label="Remove qubit"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={lab.addQubit}
                  disabled={circuit.numQubits >= MAX_QUBITS}
                  aria-label="Add qubit"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={lab.clear} aria-label="Clear circuit">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <CircuitCanvas
                circuit={circuit}
                selectedId={lab.selectedId}
                onSelect={lab.setSelectedId}
                onPlace={lab.placeGate}
                onMove={lab.moveGate}
                onDelete={lab.deleteGate}
                activeColumn={result && step > 0 ? step - 1 : null}
              />

              {selectedGate && GATES[selectedGate.type].params.length > 0 && (
                <div className="mt-4 rounded-md border border-border bg-surface-raised p-3">
                  <p className="mb-2 font-mono text-xs text-muted-foreground">
                    {GATES[selectedGate.type].name} parameter
                  </p>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[selectedGate.params[0] ?? 0]}
                      min={-Math.PI * 2}
                      max={Math.PI * 2}
                      step={Math.PI / 16}
                      onValueChange={([v]) =>
                        lab.setGateParam(selectedGate.id, 0, v ?? 0)
                      }
                      className="flex-1"
                    />
                    <span className="w-20 text-right font-mono text-xs">
                      {formatAngle(selectedGate.params[0] ?? 0)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="panel p-4">
              <div className="mb-3 flex items-center gap-2">
                <h2 className="mr-auto text-sm font-semibold">Code editor</h2>
                <Button size="sm" variant="outline" onClick={copyQiskit}>
                  <Copy className="mr-1.5 h-3.5 w-3.5" /> Qiskit
                </Button>
                <Button size="sm" variant="outline" onClick={downloadJson}>
                  <Download className="mr-1.5 h-3.5 w-3.5" /> JSON
                </Button>
              </div>
              <CodePanel
                code={lab.code}
                errors={lab.codeErrors}
                onChange={lab.onCodeChange}
              />
            </div>
          </section>

          {/* Run + results */}
          <aside className="space-y-4">
            <div className="panel p-4">
              <h2 className="mb-3 text-sm font-semibold">Execution</h2>
              <div className="space-y-3">
                <div>
                  <Label className="mb-1.5 block text-xs text-muted-foreground">
                    Backend
                  </Label>
                  <Select value={lab.backendId} onValueChange={lab.setBackendId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BACKENDS.map((b) => (
                        <SelectItem key={b.id} value={b.id} disabled={!b.available}>
                          {b.name}
                          {b.available ? "" : " — coming soon"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="shots" className="mb-1.5 block text-xs text-muted-foreground">
                      Shots
                    </Label>
                    <Input
                      id="shots"
                      type="number"
                      min={1}
                      max={100000}
                      value={lab.shots}
                      onChange={(e) => lab.setShots(Number(e.target.value) || 1)}
                      className="font-mono"
                    />
                  </div>
                  <div>
                    <Label htmlFor="seed" className="mb-1.5 block text-xs text-muted-foreground">
                      Seed
                    </Label>
                    <Input
                      id="seed"
                      type="number"
                      value={lab.seed}
                      onChange={(e) => lab.setSeed(Number(e.target.value) || 0)}
                      className="font-mono"
                    />
                  </div>
                </div>
                <Button className="w-full" onClick={() => void run()} disabled={running}>
                  <Play className="mr-1.5 h-4 w-4" />
                  {running ? "Simulating…" : "Run circuit"}
                </Button>
                {runError && (
                  <p className="font-mono text-xs text-destructive">{runError}</p>
                )}
                {result && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setStep(Math.max(0, step - 1))}
                      disabled={step <= 0}
                      aria-label="Previous step"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Slider
                      value={[step]}
                      min={0}
                      max={maxStep}
                      step={1}
                      onValueChange={([v]) => setStep(v ?? 0)}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setStep(Math.min(maxStep, step + 1))}
                      disabled={step >= maxStep}
                      aria-label="Next step"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <span className="w-16 text-right font-mono text-[0.65rem] text-muted-foreground">
                      step {step}/{maxStep}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="panel p-4">
              <h2 className="mb-3 text-sm font-semibold">Save & share</h2>
              <SaveCircuitPanel
                circuit={circuit}
                circuitId={circuitId}
                onSaved={(id) => {
                  setCircuitId(id);
                  loadedRef.current = id;
                  void navigate({ to: "/lab", search: { circuit: id }, replace: true });
                }}
              />
            </div>

            <div className="panel p-4">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Sparkles className="h-4 w-4 text-primary" /> AI tutor
              </h2>
              <AIPanel code={lab.code} onApplyCode={lab.onCodeChange} />
            </div>

            <div className="panel p-4">
              <h2 className="mb-3 text-sm font-semibold">Results</h2>
              <ResultsPanel result={result} step={step} />
            </div>

            <div className="panel p-4">
              <h2 className="mb-3 text-sm font-semibold">Example circuits</h2>
              <div className="space-y-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => lab.loadExample(ex.id)}
                    className="w-full rounded-md border border-border bg-surface-raised p-3 text-left transition-colors hover:border-primary/60"
                  >
                    <p className="text-sm font-medium">{ex.title}</p>
                    <p className="text-xs text-muted-foreground">{ex.blurb}</p>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
