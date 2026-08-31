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
    <figure className="panel space-y-4 p-4">
      <CircuitCanvas
        circuit={circuit}
        selectedId={null}
        onSelect={() => {}}
        onPlace={() => {}}
        onMove={() => {}}
        onDelete={() => {}}
        activeColumn={null}
      />

      <div className="space-y-1.5">
        {bars.map(([label, p]) => (
          <div key={label} className="flex items-center gap-2">
            <span className="w-16 font-mono text-[0.65rem] text-muted-foreground">
              |{label}&gt;
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-raised">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${Math.round(p * 100)}%` }}
              />
            </div>
            <span className="w-12 text-right font-mono text-[0.65rem] text-muted-foreground">
              {(p * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>

      <figcaption className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="flex-1">{caption}</span>
        <Button asChild size="sm" variant="outline">
          <Link to="/lab" search={{ code }}>
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Open in Lab
          </Link>
        </Button>
      </figcaption>
    </figure>
  );
}
