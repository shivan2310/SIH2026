import { useState } from "react";
import { ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { analyzeCircuit, type CircuitAnalysis } from "@/lib/ai/tutor.functions";
import type { SimulationResult } from "@/lib/quantum/simulator";

export function CircuitInsights({ circuitCode, result }: { circuitCode: string, result?: SimulationResult | null }) {
  const [analysis, setAnalysis] = useState<CircuitAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const analyze = useServerFn(analyzeCircuit);

  async function runAnalyze() {
    setLoading(true);
    try {
      const simData = result ? {
        probabilities: Array.from(result.probabilities),
        counts: result.counts,
        shots: result.shots,
        backend: result.backendId || "browser-statevector"
      } : undefined;
      
      const res = await analyze({ 
        data: { 
          circuitCode, 
          simulation: simData 
        } 
      });
      setAnalysis(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm h-full">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-[#F47F45]" />
        <h2 className="text-lg font-bold text-[#111111]">Circuit Insights</h2>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {!analysis && !loading ? (
          <div className="text-center">
            <p className="text-sm font-medium text-[#707070] mb-4">
              Get AI-powered insights about entanglement, phase changes, and expected outcomes.
            </p>
            <button
              onClick={runAnalyze}
              className="rounded-lg bg-[#F47F45] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#E3692E]"
            >
              Analyze Circuit
            </button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-6 w-6 animate-spin text-[#F47F45]" />
            <span className="text-sm font-medium text-[#707070]">Analyzing...</span>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <p className="text-sm font-medium text-[#111111] leading-relaxed mb-4">
              {analysis?.summary}
            </p>
            
            <ul className="space-y-3 mb-6">
              {analysis?.optimizations.map((opt, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#F47F45]" />
                  <span className="text-[#707070]">{opt}</span>
                </li>
              ))}
              {analysis?.issues.map((issue, i) => (
                <li key={`issue-${i}`} className="flex gap-3 text-sm">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#FF6680]" />
                  <span className="text-[#707070]">{issue.message}</span>
                </li>
              ))}
            </ul>
            
            <div className="mt-auto">
              <button
                onClick={runAnalyze}
                className="flex items-center gap-2 text-sm font-bold text-[#F47F45] hover:text-[#E3692E]"
              >
                Refresh Insights <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
