import { useState } from "react";
import { AIPanel } from "./AIPanel";
import { CodePanel } from "./CodePanel";
import { Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  code: string;
  codeErrors: any[];
  onCodeChange: (code: string) => void;
  onCopyQiskit: () => void;
  onDownloadJson: () => void;
}

export function LabRightSidebar({ code, codeErrors, onCodeChange, onCopyQiskit, onDownloadJson }: Props) {
  const [activeTab, setActiveTab] = useState<"ai" | "code">("ai");

  return (
    <div className="flex h-full flex-col rounded-2xl border border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
      {/* Tabs */}
      <div className="flex w-full border-b border-[#E5E7EB] bg-gray-50">
        <button
          onClick={() => setActiveTab("ai")}
          className={`flex-1 py-3 text-sm font-bold transition-colors ${
            activeTab === "ai"
              ? "bg-white text-[#F47F45] border-b-2 border-[#F47F45]"
              : "text-[#707070] hover:text-[#111111]"
          }`}
        >
          AI Tutor
        </button>
        <button
          onClick={() => setActiveTab("code")}
          className={`flex-1 py-3 text-sm font-bold transition-colors ${
            activeTab === "code"
              ? "bg-white text-[#F47F45] border-b-2 border-[#F47F45]"
              : "text-[#707070] hover:text-[#111111]"
          }`}
        >
          Code
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {activeTab === "ai" ? (
          <AIPanel code={code} onApplyCode={onCodeChange} />
        ) : (
          <div className="flex flex-col h-full">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[#111111]">Qiskit Generated Code</h3>
              <div className="flex gap-2">
                <button onClick={onCopyQiskit} className="flex h-8 items-center rounded-lg border border-[#E5E7EB] bg-white px-3 text-xs font-semibold text-[#707070] transition-colors hover:bg-gray-50 hover:text-[#111111]">
                  <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
                </button>
                <button onClick={onDownloadJson} className="flex h-8 items-center rounded-lg border border-[#E5E7EB] bg-white px-3 text-xs font-semibold text-[#707070] transition-colors hover:bg-gray-50 hover:text-[#111111]">
                  <Download className="mr-1.5 h-3.5 w-3.5" /> JSON
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden rounded-lg border border-[#E5E7EB]">
              <CodePanel code={code} errors={codeErrors} onChange={onCodeChange} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
