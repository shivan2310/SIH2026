import { useState } from "react";
import { GATE_LIST, type GateDef } from "@/lib/quantum/gates";

export function GatePalette({
  onPick,
}: {
  onPick?: (def: GateDef) => void;
}) {
  const [activeTab, setActiveTab] = useState<"single" | "multi" | "custom">("single");

  // Grouping logic based on existing GATE_LIST categories
  const singleGates = GATE_LIST.filter(g => ["single", "phase", "rotation"].includes(g.category));
  const multiGates = GATE_LIST.filter(g => ["multi", "meta"].includes(g.category));
  const customGates = GATE_LIST.filter(g => (g.category as string) === "custom" || (g.type as string) === "custom");

  const renderGates = (gates: GateDef[]) => (
    <div className="flex flex-col gap-3">
      {gates.map((def) => (
        <button
          key={def.type}
          type="button"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("application/x-gate", def.type);
            e.dataTransfer.effectAllowed = "copy";
          }}
          onClick={() => onPick?.(def)}
          className="group flex cursor-grab items-center gap-4 rounded-xl border border-[#E5E7EB] bg-white p-3 text-left shadow-sm transition-all hover:border-[#F47F45] hover:shadow-md active:cursor-grabbing"
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold text-white shadow-inner"
            style={{ backgroundColor: def.color || "#F47F45" }}
          >
            {def.label}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-[#111111]">{def.name}</span>
            <span className="text-xs font-medium text-[#707070] line-clamp-1">{def.description}</span>
          </div>
        </button>
      ))}
      {gates.length === 0 && (
        <div className="text-center text-xs text-[#707070] py-4">No gates available in this category.</div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-[#111111]">Quantum Gates</h2>
        <p className="text-sm font-medium text-[#707070]">Drag and drop gates to build your circuit</p>
      </div>

      <div className="mb-4 flex rounded-lg bg-gray-50 p-1">
        <button
          onClick={() => setActiveTab("single")}
          className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${
            activeTab === "single" ? "bg-white text-[#111111] shadow-sm" : "text-[#707070] hover:text-[#111111]"
          }`}
        >
          Single Qubit
        </button>
        <button
          onClick={() => setActiveTab("multi")}
          className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${
            activeTab === "multi" ? "bg-white text-[#111111] shadow-sm" : "text-[#707070] hover:text-[#111111]"
          }`}
        >
          Multi Qubit
        </button>
        <button
          onClick={() => setActiveTab("custom")}
          className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${
            activeTab === "custom" ? "bg-white text-[#111111] shadow-sm" : "text-[#707070] hover:text-[#111111]"
          }`}
        >
          Custom
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
        {activeTab === "single" && renderGates(singleGates)}
        {activeTab === "multi" && renderGates(multiGates)}
        {activeTab === "custom" && renderGates(customGates)}
      </div>

      <div className="mt-4 pt-4 border-t border-[#E5E7EB]">
        <div className="space-y-2">
          <button className="w-full rounded-lg bg-gray-50 py-2 text-sm font-semibold text-[#111111] hover:bg-gray-100 transition-colors">
            + Add Qubit
          </button>
          <button className="w-full rounded-lg bg-gray-50 py-2 text-sm font-semibold text-[#111111] hover:bg-gray-100 transition-colors">
            + Common Circuits
          </button>
        </div>
      </div>
    </div>
  );
}
