import { useMemo } from "react";
import type { ParseError } from "@/lib/quantum/code";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export function CodePanel({
  code,
  errors,
  onChange,
}: {
  code: string;
  errors: ParseError[];
  onChange: (value: string) => void;
}) {
  const lineCount = useMemo(() => code.split("\n").length, [code]);

  return (
    <div className="flex h-full flex-col">
      <div className="relative flex-1 overflow-hidden rounded-md border border-border bg-surface-raised">
        <div className="flex h-full">
          <div
            aria-hidden
            className="select-none border-r border-border/70 px-2 py-3 text-right font-mono text-xs leading-6 text-muted-foreground/60"
          >
            {Array.from({ length: lineCount }).map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <textarea
            value={code}
            spellCheck={false}
            onChange={(e) => onChange(e.target.value)}
            className="h-full min-h-64 w-full resize-none bg-transparent px-3 py-3 font-mono text-xs leading-6 text-foreground outline-none"
            aria-label="Quantum circuit code"
          />
        </div>
      </div>
      <div className="mt-2 min-h-8 font-mono text-xs">
        {errors.length === 0 ? (
          <p className="flex items-center gap-1.5" style={{ color: "var(--color-success)" }}>
            <CheckCircle2 className="h-3.5 w-3.5" /> Circuit parsed — canvas in sync
          </p>
        ) : (
          <ul className="space-y-1 text-destructive">
            {errors.slice(0, 5).map((e, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  Line {e.line}: {e.message}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
