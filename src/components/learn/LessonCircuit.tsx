import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CircuitCanvas } from "@/components/quantum/CircuitCanvas";
import { parseCode } from "@/lib/quantum/code";
import { basisLabel, simulate } from "@/lib/quantum/simulator";

interface Props {
  code: string;
  caption: string;
}

/** Read-only embedded circuit with its outcome distribution. */
export function LessonCircuit({ code, caption }: Props) {
  const { circuit, bars } = useMemo(() => {
    const parsed = parseCode(code).circuit;
    if (!parsed) return { circuit: null, bars: [] as Array<[string, number]> };
    const res = simulate(parsed, { shots: 1, trace: false });
    const list: Array<[string, number]> = [];
    for (let i = 0; i < res.probabilities.length; i++) {
      const p = res.probabilities[i]!;
      if (p > 1e-6) list.push([basisLabel(i, parsed.numQubits), p]);
    }
    list.sort((a, b) => b[1] - a[1]);
    return { circuit: parsed, bars: list.slice(0, 8) };
  }, [code]);

  if (!circuit) return null;

  return (
    <figure className="rounded-2xl border border-[#E5E7EB] bg-white space-y-4 p-5 shadow-sm">
      <CircuitCanvas
        circuit={circuit}
        selectedId={null}
        onSelect={() => {}}
        onPlace={() => {}}
        onMove={() => {}}
        onDelete={() => {}}
        activeColumn={null}
      />

      <div className="space-y-2 mt-4 pt-4 border-t border-[#E5E7EB]">
        {bars.map(([label, p]) => (
          <div key={label} className="flex items-center gap-3">
            <span className="w-16 font-mono text-xs font-bold text-[#111111]">
              |{label}&gt;
            </span>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-[#F47F45]"
                style={{ width: `${Math.round(p * 100)}%` }}
              />
            </div>
            <span className="w-12 text-right font-mono text-xs font-bold text-[#707070]">
              {(p * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>

      <figcaption className="flex flex-wrap items-center gap-3 text-sm font-medium text-[#707070] mt-4 pt-4 border-t border-[#E5E7EB]">
        <span className="flex-1">{caption}</span>
        <Link to="/lab" search={{ code }} className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-bold text-[#111111] transition-colors hover:bg-gray-50 hover:border-[#F47F45]">
          <ExternalLink className="h-4 w-4 text-[#F47F45]" /> Open in Lab
        </Link>
      </figcaption>
    </figure>
  );
}
