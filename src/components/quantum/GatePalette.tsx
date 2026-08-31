import { CATEGORY_LABELS, GATE_LIST, type GateDef } from "@/lib/quantum/gates";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const CATEGORIES: Array<GateDef["category"]> = [
  "single",
  "phase",
  "rotation",
  "multi",
  "meta",
];

export function GatePalette({
  onPick,
}: {
  onPick?: (def: GateDef) => void;
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-5">
        {CATEGORIES.map((cat) => (
          <div key={cat}>
            <h3 className="mb-2 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
              {CATEGORY_LABELS[cat]}
            </h3>
            <div className="flex flex-wrap gap-2">
              {GATE_LIST.filter((g) => g.category === cat).map((def) => (
                <Tooltip key={def.type}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("application/x-gate", def.type);
                        e.dataTransfer.effectAllowed = "copy";
                      }}
                      onClick={() => onPick?.(def)}
                      className="flex h-11 min-w-11 cursor-grab items-center justify-center rounded-md border px-2 font-mono text-sm font-semibold text-background transition-transform active:cursor-grabbing hover:-translate-y-0.5"
                      style={{
                        backgroundColor: def.color,
                        borderColor: def.color,
                      }}
                    >
                      {def.label}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-56">
                    <p className="font-semibold">{def.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {def.description}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        ))}
        <p className="rounded-md border border-dashed border-border/70 p-3 text-xs leading-relaxed text-muted-foreground">
          Drag a gate onto the circuit grid, or click it to drop it at the end
          of the first wire.
        </p>
      </div>
    </TooltipProvider>
  );
}
