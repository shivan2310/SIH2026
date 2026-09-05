import { useState } from "react";
import { GATES } from "@/lib/quantum/gates";
import { formatAngle } from "@/lib/quantum/code";
import { circuitDepth, qubitsOf, type GateInstance, type GateType, type QCircuit } from "@/lib/quantum/ir";
import { cn } from "@/lib/utils";
import { X, ZoomIn, ZoomOut, MoreHorizontal } from "lucide-react";

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
    <div className="flex flex-col rounded-2xl border border-[#E5E7EB] bg-white shadow-sm overflow-hidden h-full">
      {/* Canvas Header & Controls */}
      <div className="flex items-center justify-between border-b border-[#E5E7EB] bg-gray-50 px-4 py-3">
        <div>
          <h3 className="text-sm font-bold text-[#111111]">Circuit Canvas</h3>
          <p className="text-xs font-medium text-[#707070]">{circuit.numQubits} qubits Â· Drag gates, connect, and simulate</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-[#707070] hover:bg-gray-200 hover:text-[#111111]">
            <ZoomOut className="h-4 w-4" />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-[#707070] hover:bg-gray-200 hover:text-[#111111]">
            <ZoomIn className="h-4 w-4" />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-[#707070] hover:bg-gray-200 hover:text-[#111111]">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto relative custom-scrollbar bg-[radial-gradient(#E5E7EB_2px,transparent_2px)] [background-size:24px_24px] bg-white">
        <div
          className="relative min-w-full"
          style={{ width: Math.max(width, 600), height: height + 48 }}
        >
          {/* wires + labels */}
          {Array.from({ length: circuit.numQubits }).map((_, q) => (
            <div
              key={q}
              className="absolute flex items-center"
              style={{ top: q * ROW_H + 24, left: 0, width: "100%", minWidth: width, height: ROW_H }}
            >
              <span className="w-[68px] shrink-0 pl-4 font-mono text-xs font-bold text-[#111111]">
                q{q} <span className="text-[#707070] font-medium">|0âŸ©</span>
              </span>
              <span
                className="h-[2px] flex-1 bg-[#E5E7EB]"
              />
            </div>
          ))}

          {/* active step highlight */}
          {activeColumn !== null && activeColumn >= 0 && (
            <div
              className="pointer-events-none absolute rounded-lg border border-[#F47F45]/40 bg-[#F47F45]/10"
              style={{
                left: LABEL_W + activeColumn * COL_W + 4,
                top: 24,
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
                  "absolute rounded-lg transition-all",
                  hover?.q === q && hover.c === c
                    ? "bg-[#F47F45]/20 ring-2 ring-[#F47F45]/40"
                    : "bg-transparent",
                )}
                style={{
                  left: LABEL_W + c * COL_W + 6,
                  top: q * ROW_H + 24 + 6,
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

          {/* Minimap (mock representation as requested) */}
          <div className="absolute bottom-4 right-4 h-24 w-32 rounded-lg border border-[#E5E7EB] bg-white/90 shadow-sm backdrop-blur-sm p-2 hidden lg:block">
            <div className="w-full h-full border border-dashed border-[#E5E7EB] rounded relative">
              <div className="absolute top-2 left-2 w-8 h-4 bg-[#F47F45]/20 rounded border border-[#F47F45]"></div>
              <div className="absolute top-6 left-6 w-8 h-4 bg-[#20B486]/20 rounded border border-[#20B486]"></div>
            </div>
          </div>
        </div>
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

  // Use the gate's color or fallback to primary purple, but make it soft
  const gateColor = def.color || "#F47F45";
  const softBg = `${gateColor}20`; // 20% opacity hex
  const borderCol = gateColor;

  const wrapper = (children: React.ReactNode) => (
    <div
      className="absolute"
      style={{
        left: x - COL_W / 2,
        top: lo * ROW_H + 24,
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
          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-[#E5E7EB] shadow-sm text-[#FF6680] hover:bg-[#FF6680] hover:text-white transition-colors z-10"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );

  const connector =
    hi > lo ? (
      <span
        className="absolute w-[2px]"
        style={{
          left: COL_W / 2 - 1,
          top: ROW_H / 2,
          height: (hi - lo) * ROW_H,
          backgroundColor: borderCol,
        }}
      />
    ) : null;

  const dot = (q: number) => (
    <span
      key={`c${q}`}
      className="absolute h-3 w-3 rounded-full shadow-sm"
      style={{
        left: COL_W / 2 - 6,
        top: (q - lo) * ROW_H + ROW_H / 2 - 6,
        backgroundColor: borderCol,
      }}
    />
  );

  const box = (q: number, label: string) => (
    <div
      key={`t${q}`}
      className={cn(
        "absolute flex items-center justify-center rounded-lg font-mono text-sm font-bold shadow-sm transition-all",
        selected ? "ring-2 ring-offset-2 ring-offset-white ring-[#F47F45]" : "border"
      )}
      style={{
        left: COL_W / 2 - 22,
        top: (q - lo) * ROW_H + ROW_H / 2 - 20,
        width: 44,
        height: 40,
        backgroundColor: softBg,
        borderColor: borderCol,
        color: borderCol,
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
              left: COL_W / 2 - 7,
              top: (q - lo) * ROW_H + ROW_H / 2 - 14,
              color: borderCol,
            }}
          >
            âœ•
          </span>
        ))}
      </div>
    );
  }

  const targetLabel =
    gate.type === "cx" || gate.type === "ccx"
      ? "âŠ•"
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
          className="absolute whitespace-nowrap font-mono text-[10px] font-semibold text-[#707070]"
          style={{
            left: COL_W / 2 - 22,
            top: (gate.targets[0]! - lo) * ROW_H + ROW_H / 2 + 22,
            width: 44,
            textAlign: "center",
          }}
        >
          {paramLabel}
        </span>
      )}
    </div>
  );
}
