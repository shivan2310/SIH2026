import { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BlochSphere } from "./BlochSphere";
import { basisLabel, probabilities, type SimulationResult, type StateVector } from "@/lib/quantum/simulator";

function Histogram({ result }: { result: SimulationResult }) {
  const entries = Object.entries(result.counts).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );
  const max = Math.max(1, ...entries.map(([, v]) => v));
  if (entries.length === 0)
    return <Empty text="Run the circuit to sample measurement outcomes." />;
  return (
    <div className="space-y-2">
      {entries.map(([bits, count]) => (
        <div key={bits} className="flex items-center gap-3">
          <span className="w-20 shrink-0 font-mono text-xs text-muted-foreground">
            |{bits}⟩
          </span>
          <div className="h-6 flex-1 overflow-hidden rounded bg-surface-raised">
            <div
              className="h-full rounded transition-all"
              style={{
                width: `${(count / max) * 100}%`,
                background:
                  "linear-gradient(90deg, var(--color-signal), var(--color-entangle))",
              }}
            />
          </div>
          <span className="w-24 shrink-0 text-right font-mono text-xs">
            {count}{" "}
            <span className="text-muted-foreground">
              {((count / result.shots) * 100).toFixed(1)}%
            </span>
          </span>
        </div>
      ))}
    </div>
  );
}

function Amplitudes({ state }: { state: StateVector }) {
  const rows = useMemo(() => {
    const probs = probabilities(state);
    return Array.from({ length: state.re.length }, (_, i) => ({
      i,
      re: state.re[i]!,
      im: state.im[i]!,
      p: probs[i]!,
      phase: Math.atan2(state.im[i]!, state.re[i]!),
    })).filter((r) => r.p > 1e-10);
  }, [state]);

  return (
    <ScrollArea className="h-72">
      <table className="w-full text-left font-mono text-xs">
        <thead className="sticky top-0 bg-surface text-muted-foreground">
          <tr>
            <th className="py-2 pl-1">Basis</th>
            <th>Amplitude</th>
            <th>Prob.</th>
            <th className="pr-1 text-right">Phase</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.i} className="border-t border-border/60">
              <td className="py-1.5 pl-1">|{basisLabel(r.i, state.numQubits)}⟩</td>
              <td>
                {r.re.toFixed(3)}
                {r.im >= 0 ? " + " : " − "}
                {Math.abs(r.im).toFixed(3)}i
              </td>
              <td>{(r.p * 100).toFixed(2)}%</td>
              <td className="pr-1 text-right">
                <span
                  className="inline-block h-2 w-2 rounded-full align-middle"
                  style={{
                    backgroundColor: `oklch(0.75 0.17 ${((r.phase * 180) / Math.PI + 360) % 360})`,
                  }}
                />{" "}
                {((r.phase * 180) / Math.PI).toFixed(0)}°
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollArea>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
      {text}
    </div>
  );
}

export function ResultsPanel({
  result,
  step,
}: {
  result: SimulationResult | null;
  step: number;
}) {
  if (!result) {
    return (
      <Empty text="No results yet — press Run to simulate the circuit." />
    );
  }
  const viewState = result.steps[Math.min(step, result.steps.length - 1)] ?? result.state;

  return (
    <Tabs defaultValue="counts" className="w-full">
      {result.fallback && (
        <p className="mb-3 rounded-md border border-border bg-surface-raised p-2 text-[0.7rem] text-muted-foreground">
          {result.fallback}
        </p>
      )}
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="counts">Measurements</TabsTrigger>
        <TabsTrigger value="bloch">Bloch spheres</TabsTrigger>
        <TabsTrigger value="state">Statevector</TabsTrigger>
      </TabsList>
      <TabsContent value="counts" className="pt-4">
        <Histogram result={result} />
        <p className="mt-3 font-mono text-[0.65rem] text-muted-foreground">
          {result.shots} shots · measured q[{result.measuredQubits.join("], q[")}] ·
          simulated in {result.durationMs.toFixed(1)} ms
        </p>
      </TabsContent>
      <TabsContent value="bloch" className="pt-4">
        <div className="flex flex-wrap gap-4">
          {Array.from({ length: viewState.numQubits }).map((_, q) => (
            <BlochSphere key={q} state={viewState} qubit={q} />
          ))}
        </div>
      </TabsContent>
      <TabsContent value="state" className="pt-4">
        <Amplitudes state={viewState} />
      </TabsContent>
    </Tabs>
  );
}
