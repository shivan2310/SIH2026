import { useMemo, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { basisLabel, probabilities, type SimulationResult, type StateVector } from "@/lib/quantum/simulator";

function Histogram({ result }: { result: SimulationResult }) {
  const entries = Object.entries(result.counts).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );
  const max = Math.max(1, ...entries.map(([, v]) => v));
  if (entries.length === 0)
    return <Empty text="Run the circuit to sample measurement outcomes." />;
  return (
    <div className="space-y-3">
      {entries.map(([bits, count]) => (
        <div key={bits} className="flex items-center gap-4">
          <span className="w-16 shrink-0 font-mono text-sm font-bold text-[#111111]">
            |{bits}>
          </span>
          <div className="h-4 flex-1 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full transition-all bg-[#F47F45]"
              style={{
                width: `${(count / max) * 100}%`,
              }}
            />
          </div>
          <span className="w-20 shrink-0 text-right font-mono text-sm font-semibold text-[#111111]">
            {((count / result.shots) * 100).toFixed(1)}%
          </span>
        </div>
      ))}
      <p className="mt-4 font-mono text-xs text-[#707070] text-center border-t border-[#E5E7EB] pt-3">
        {result.shots} shots · measured q[{result.measuredQubits.join("], q[")}]
      </p>
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
    <ScrollArea className="h-64">
      <table className="w-full text-left font-mono text-sm">
        <thead className="sticky top-0 bg-white text-[#707070] shadow-sm">
          <tr>
            <th className="py-3 pl-2 font-semibold">Basis</th>
            <th className="py-3 font-semibold">Amplitude</th>
            <th className="py-3 font-semibold">Prob.</th>
            <th className="py-3 pr-2 text-right font-semibold">Phase</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.i} className="border-t border-[#E5E7EB] text-[#111111]">
              <td className="py-2.5 pl-2 font-bold">|{basisLabel(r.i, state.numQubits)}></td>
              <td>
                {r.re.toFixed(3)}
                {r.im >= 0 ? " + " : " - "}
                {Math.abs(r.im).toFixed(3)}i
              </td>
              <td className="font-semibold">{(r.p * 100).toFixed(2)}%</td>
              <td className="pr-2 text-right">
                <span
                  className="mr-2 inline-block h-3 w-3 rounded-full align-middle shadow-sm"
                  style={{
                    backgroundColor: `oklch(0.75 0.17 ${((r.phase * 180) / Math.PI + 360) % 360})`,
                  }}
                />
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
    <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-[#E5E7EB] bg-gray-50 text-sm text-[#707070] font-medium">
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
  const [activeTab, setActiveTab] = useState<"probability" | "statevector" | "density">("probability");

  if (!result) {
    return (
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm h-full">
        <h2 className="mb-4 text-lg font-bold text-[#111111]">Simulation Results</h2>
        <Empty text="No results yet â€” press Run Simulation to start." />
      </div>
    );
  }

  const viewState = result.steps[Math.min(step, result.steps.length - 1)] ?? result.state;

  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm h-full flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#111111]">Simulation Results</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-[#707070]">Shots:</span>
          <select className="rounded-lg border border-[#E5E7EB] bg-gray-50 px-3 py-1.5 text-xs font-bold text-[#111111] outline-none">
            <option>1024</option>
            <option>2048</option>
            <option>4096</option>
          </select>
        </div>
      </div>

      {result.fallback && (
        <p className="mb-4 rounded-lg bg-orange-50 border border-orange-200 p-3 text-xs font-medium text-orange-800">
          {result.fallback}
        </p>
      )}

      {/* Tabs */}
      <div className="mb-6 flex space-x-1 rounded-lg bg-gray-50 p-1 w-full max-w-sm">
        <button
          onClick={() => setActiveTab("probability")}
          className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-colors ${
            activeTab === "probability" ? "bg-white text-[#111111] shadow-sm" : "text-[#707070] hover:text-[#111111]"
          }`}
        >
          Probability
        </button>
        <button
          onClick={() => setActiveTab("statevector")}
          className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-colors ${
            activeTab === "statevector" ? "bg-white text-[#111111] shadow-sm" : "text-[#707070] hover:text-[#111111]"
          }`}
        >
          State Vector
        </button>
        <button
          onClick={() => setActiveTab("density")}
          className={`flex-1 rounded-md py-1.5 text-xs font-bold transition-colors ${
            activeTab === "density" ? "bg-white text-[#111111] shadow-sm" : "text-[#707070] hover:text-[#111111]"
          }`}
        >
          Density Matrix
        </button>
      </div>

      <div className="flex-1">
        {activeTab === "probability" && <Histogram result={result} />}
        {activeTab === "statevector" && <Amplitudes state={viewState} />}
        {activeTab === "density" && <Empty text="Density matrix view coming soon." />}
      </div>
    </div>
  );
}
