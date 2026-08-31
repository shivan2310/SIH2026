import { useState } from "react";
import { GATES } from "@/lib/quantum/gates";
import { formatAngle } from "@/lib/quantum/code";
import { circuitDepth, qubitsOf, type GateInstance, type GateType, type QCircuit } from "@/lib/quantum/ir";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

const COL_W = 64;
const ROW_H = 60;
const LABEL_W = 68;

interface Props {
  circuit: QCircuit;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onPlace: (type: GateType, qubit: number, column: number) => void;
  onMove: (id: string, qubit: number, column: number) => void;
  onDelete: (id: string) => void;
  activeColumn?: number | null;
}

export function CircuitCanvas({
  circuit,
  selectedId,
  onSelect,
  onPlace,
  onMove,
  onDelete,
  activeColumn = null,
}: Props) {
  const [hover, setHover] = useState<{ q: number; c: number } | null>(null);
  const columns = Math.max(circuitDepth(circuit) + 2, 8);
  const width = LABEL_W + columns * COL_W;
  const height = circuit.numQubits * ROW_H;

  function handleDrop(e: React.DragEvent, qubit: number, column: number) {
    e.preventDefault();
    setHover(null);
    const moveId = e.dataTransfer.getData("application/x-gate-id");
    if (moveId) {
      onMove(moveId, qubit, column);
      return;
    }
    const type = e.dataTransfer.getData("application/x-gate") as GateType;
    if (type && GATES[type]) onPlace(type, qubit, column);
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface/60 grid-dots">
      <div
        className="relative"
        style={{ width, height: height + 24, minWidth: "100%" }}
      >
        {/* wires + labels */}
        {Array.from({ length: circuit.numQubits }).map((_, q) => (
          <div
            key={q}
            className="absolute flex items-center"
            style={{ top: q * ROW_H + 12, left: 0, width, height: ROW_H }}
          >
            <span className="w-[68px] shrink-0 pl-3 font-mono text-xs text-muted-foreground">
              q[{q}] <span className="text-foreground/60">|0⟩</span>
            </span>
            <span
              className="h-px flex-1"
              style={{ backgroundColor: "var(--color-wire)" }}
            />
          </div>
        ))}

        {/* active step highlight */}
        {activeColumn !== null && activeColumn >= 0 && (
          <div
            className="pointer-events-none absolute rounded-md border border-primary/60 bg-primary/10"
            style={{
              left: LABEL_W + activeColumn * COL_W + 4,
              top: 12,
              width: COL_W - 8,
              height,
            }}
          />
        )}

        {/* drop cells */}
        {Array.from({ length: circuit.numQubits }).map((_, q) =>
          Array.from({ length: columns }).map((__, c) => (
            <div
              key={`${q}-${c}`}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "copy";
                setHover({ q, c });
              }}
              onDragLeave={() => setHover((h) => (h?.q === q && h.c === c ? null : h))}
              onDrop={(e) => handleDrop(e, q, c)}
              onClick={() => onSelect(null)}
              className={cn(
                "absolute rounded-md transition-colors",
                hover?.q === q && hover.c === c
                  ? "bg-primary/20 ring-1 ring-primary/60"
                  : "bg-transparent",
              )}
              style={{
                left: LABEL_W + c * COL_W + 6,
                top: q * ROW_H + 12 + 6,
                width: COL_W - 12,
                height: ROW_H - 12,
              }}
            />
          )),
        )}

        {/* gates */}
        {circuit.gates.map((gate) => (
          <GateNode
            key={gate.id}
            gate={gate}
            selected={selectedId === gate.id}
            onSelect={onSelect}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

function GateNode({
  gate,
  selected,
  onSelect,
  onDelete,
}: {
  gate: GateInstance;
  selected: boolean;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
}) {
  const def = GATES[gate.type];
  const qs = qubitsOf(gate);
  const lo = Math.min(...qs);
  const hi = Math.max(...qs);
  const x = LABEL_W + gate.column * COL_W + COL_W / 2;

  const wrapper = (children: React.ReactNode) => (
    <div
      className="absolute"
      style={{
        left: x - COL_W / 2,
        top: lo * ROW_H + 12,
        width: COL_W,
        height: (hi - lo + 1) * ROW_H,
      }}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/x-gate-id", gate.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(selected ? null : gate.id);
      }}
    >
      {children}
      {selected && (
        <button
          type="button"
          aria-label="Remove gate"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(gate.id);
          }}
          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );

  const connector =
    hi > lo ? (
      <span
        className="absolute w-0.5"
        style={{
          left: COL_W / 2 - 1,
          top: ROW_H / 2,
          height: (hi - lo) * ROW_H,
          backgroundColor: def.color,
        }}
      />
    ) : null;

  const dot = (q: number) => (
    <span
      key={`c${q}`}
      className="absolute h-3 w-3 rounded-full"
      style={{
        left: COL_W / 2 - 6,
        top: (q - lo) * ROW_H + ROW_H / 2 - 6,
        backgroundColor: def.color,
      }}
    />
  );

  const box = (q: number, label: string) => (
    <div
      key={`t${q}`}
      className={cn(
        "absolute flex items-center justify-center rounded-md font-mono text-xs font-bold text-background shadow-lg",
        selected && "ring-2 ring-offset-2 ring-offset-background ring-foreground",
      )}
      style={{
        left: COL_W / 2 - 19,
        top: (q - lo) * ROW_H + ROW_H / 2 - 17,
        width: 38,
        height: 34,
        backgroundColor: def.color,
      }}
    >
      {label}
    </div>
  );

  if (gate.type === "swap") {
    return wrapper(
      <div className="relative h-full w-full cursor-grab">
        {connector}
        {gate.targets.map((q) => (
          <span
            key={q}
            className="absolute font-mono text-lg font-bold"
            style={{
              left: COL_W / 2 - 6,
              top: (q - lo) * ROW_H + ROW_H / 2 - 14,
              color: def.color,
            }}
          >
            ✕
          </span>
        ))}
      </div>,
    );
  }

  const targetLabel =
    gate.type === "cx" || gate.type === "ccx"
      ? "⊕"
      : gate.type === "cz"
        ? "Z"
        : gate.type === "measure"
          ? "M"
          : def.label;

  const paramLabel =
    gate.params.length > 0 ? formatAngle(gate.params[0] ?? 0) : null;

  return wrapper(
    <div className="relative h-full w-full cursor-grab">
      {connector}
      {gate.controls.map((q) => dot(q))}
      {gate.targets.map((q) => box(q, targetLabel))}
      {paramLabel && (
        <span
          className="absolute whitespace-nowrap font-mono text-[0.6rem] text-muted-foreground"
          style={{
            left: COL_W / 2 - 19,
            top: (gate.targets[0]! - lo) * ROW_H + ROW_H / 2 + 18,
            width: 38,
            textAlign: "center",
          }}
        >
          {paramLabel}
        </span>
      )}
    </div>,
  );
}
