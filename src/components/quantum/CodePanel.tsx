import { useMemo, useRef } from "react";
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
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  return (
    <div className="flex h-full min-h-[280px] flex-col overflow-hidden rounded-xl border border-slate-800 bg-[#0c1322] shadow-sm">
      <div className="relative flex flex-1 min-h-0 overflow-hidden">
        <div
          ref={lineNumbersRef}
          aria-hidden
          className="select-none overflow-hidden border-r border-slate-800/80 bg-[#070b14] px-2.5 py-3 text-right font-mono text-xs leading-6 text-slate-500 shrink-0 min-w-[38px]"
        >
          {Array.from({ length: Math.max(lineCount, 1) }).map((_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <textarea
          value={code}
          spellCheck={false}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          className="h-full min-h-64 w-full resize-none bg-transparent px-3.5 py-3 font-mono text-xs font-medium leading-6 text-slate-100 placeholder:text-slate-600 outline-none selection:bg-cyan-500/30 selection:text-cyan-100 caret-cyan-400 custom-scrollbar"
          aria-label="Quantum circuit code"
        />
      </div>
      <div className="shrink-0 border-t border-slate-800/80 bg-[#090e1a] px-3.5 py-2 font-mono text-xs">
        {errors.length === 0 ? (
          <p className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" /> Circuit parsed — canvas in sync
          </p>
        ) : (
          <ul className="space-y-1 text-rose-400">
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
