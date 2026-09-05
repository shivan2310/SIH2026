import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { getCircuit } from "@/lib/circuits/actions";
import { toast } from "sonner";
import { useCircuitLab } from "@/hooks/useCircuitLab";
import { circuitDepth, MAX_QUBITS, type QCircuit } from "@/lib/quantum/ir";
import { circuitToQiskit } from "@/lib/quantum/code";

import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";
import { GatePalette } from "@/components/quantum/GatePalette";
import { CircuitCanvas } from "@/components/quantum/CircuitCanvas";
import { LabRightSidebar } from "@/components/quantum/LabRightSidebar";
import { ResultsPanel } from "@/components/quantum/ResultsPanel";
import { BlochSphereDisplay } from "@/components/quantum/BlochSphereDisplay";
import { CircuitInsights } from "@/components/quantum/CircuitInsights";
import { SaveCircuitPanel } from "@/components/quantum/SaveCircuitPanel";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export const Route = createFileRoute("/lab")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { circuit?: string; code?: string } => ({
    ...(typeof search['circuit'] === "string" ? { circuit: search['circuit'] } : {}),
    ...(typeof search['code'] === "string" ? { code: search['code'] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Circuit Lab | QuantumLab" },
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

  const codeParam = search.code;
  useEffect(() => {
    if (!codeParam || loadedRef.current === codeParam) return;
    loadedRef.current = codeParam;
    lab.onCodeChange(codeParam);
  }, [codeParam, lab]);

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
    run,
    running,
    undo,
    redo,
  } = lab;

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

  const viewState = result ? (result.steps[Math.min(step, result.steps.length - 1)] ?? result.state) : null;

  return (
    <div className="flex h-screen bg-[#F5F5F5] font-sans text-[#111111] overflow-hidden">


      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navigation */}
        <DashboardNavbar />

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          
          {/* Page Header */}
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-[#111111]">Build Quantum Circuits</h1>
              <p className="mt-2 text-sm font-medium text-[#707070]">
                Drag and drop gates, run simulations, and explore the strange world of quantum mechanics.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={lab.clear}
                className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#111111] transition-colors hover:bg-gray-50"
              >
                Clear
              </button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <button className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-[#111111] transition-colors hover:bg-gray-50">
                    Save / Share
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="end">
                  <SaveCircuitPanel
                    circuit={circuit}
                    circuitId={circuitId}
                    onSaved={(id) => {
                      setCircuitId(id);
                      loadedRef.current = id;
                      void navigate({ to: "/lab", search: { circuit: id }, replace: true });
                    }}
                  />
                </PopoverContent>
              </Popover>
              
              <button
                onClick={() => void run()}
                disabled={running}
                className="rounded-lg bg-[#F47F45] px-6 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#E3692E] disabled:opacity-70"
              >
                {running ? "Simulating..." : "Run Simulation"}
              </button>
            </div>
          </div>

          {/* Builder Area: 3 Columns */}
          <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[280px_minmax(600px,_1fr)_380px]">
            
            {/* Left Col: Gate Palette */}
            <div className="h-[550px] rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm">
              <GatePalette
                onPick={(def) =>
                  lab.placeGate(def.type, 0, circuitDepth(circuit))
                }
              />
            </div>

            {/* Center Col: Canvas */}
            <div className="h-[550px]">
              <CircuitCanvas
                circuit={circuit}
                selectedId={lab.selectedId}
                onSelect={lab.setSelectedId}
                onPlace={lab.placeGate}
                onMove={lab.moveGate}
                onDelete={lab.deleteGate}
                activeColumn={result && step > 0 ? step - 1 : null}
              />
            </div>

            {/* Right Col: AI & Code */}
            <div className="h-[550px]">
              <LabRightSidebar
                code={lab.code}
                codeErrors={lab.codeErrors}
                onCodeChange={lab.onCodeChange}
                onCopyQiskit={copyQiskit}
                onDownloadJson={downloadJson}
              />
            </div>
          </div>

          {/* Bottom Analytics Area */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_1fr_380px]">
            {/* Simulation Results */}
            <div className="h-[400px]">
              <ResultsPanel result={result} step={step} />
            </div>

            {/* Bloch Spheres */}
            <div className="h-[400px]">
              <BlochSphereDisplay state={viewState} />
            </div>

            {/* Circuit Insights */}
            <div className="h-[400px]">
              <CircuitInsights circuitCode={lab.code} />
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
