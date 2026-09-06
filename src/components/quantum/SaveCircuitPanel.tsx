import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Cloud, Loader2, Share2, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getCircuit, saveCircuit } from "@/lib/circuits/actions";
import { useSession } from "@/hooks/useSession";
import type { QCircuit } from "@/lib/quantum/ir";

interface Props {
  circuit: QCircuit;
  circuitId: string | null;
  onSaved: (id: string) => void;
}

/** Cloud save / share controls for the circuit currently open in the lab. */
export function SaveCircuitPanel({ circuit, circuitId, onSaved }: Props) {
  const { user, loading } = useSession();
  const [title, setTitle] = useState("Untitled circuit");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!circuitId || !user) return;
    let active = true;
    void (async () => {
      try {
        const data = await getCircuit({ data: { id: circuitId } });
        if (!active || !data) return;
        setTitle(data.title);
        setDescription(data.description ?? "");
        setIsPublic(data.isPublic);
      } catch (err) {
        console.error(err);
      }
    })();
    return () => {
      active = false;
    };
  }, [circuitId, user]);

  if (loading) return null;

  if (!user) {
    return (
      <div className="space-y-3 bg-white p-4 rounded-xl text-slate-900 border border-orange-100 shadow-xl">
        <div className="flex items-center gap-2 text-orange-600 font-bold text-sm">
          <Cloud className="w-4 h-4" />
          Save to Quantum Cloud
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Sign in to save your quantum circuits to your private cloud workspace and generate shareable links.
        </p>
        <Button asChild size="sm" className="w-full bg-[#F47F45] hover:bg-[#E3692E] text-white font-bold shadow-md shadow-orange-500/20 border-0">
          <Link to="/auth">Sign in to save</Link>
        </Button>
      </div>
    );
  }

  async function save() {
    setBusy(true);
    try {
      const { id } = await saveCircuit({
        data: {
          ...(circuitId ? { id: circuitId } : {}),
          title: title.trim() || "Untitled circuit",
          description: description.trim() || null,
          data: circuit,
          isPublic,
        }
      });
      setBusy(false);
      onSaved(id);
      toast.success(circuitId ? "Circuit updated" : "Circuit saved to cloud");
    } catch (err: any) {
      setBusy(false);
      toast.error(err.message || "Failed to save circuit");
    }
  }

  async function copyLink() {
    if (!circuitId) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/c/${circuitId}`);
      setCopied(true);
      toast.success("Share link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Clipboard unavailable in this browser");
    }
  }

  return (
    <div className="space-y-4 bg-white text-slate-900">
      <div className="flex items-center justify-between pb-2 border-b border-orange-100">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
            <Cloud className="h-4 w-4" />
          </div>
          <span className="font-bold text-sm text-slate-900">Save & Share Circuit</span>
        </div>
        <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-orange-100 text-orange-800">
          {circuitId ? "Cloud Synced" : "Draft"}
        </span>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="circuit-title" className="text-xs font-semibold text-slate-700">
          Title
        </Label>
        <Input
          id="circuit-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:ring-orange-500/20 text-xs font-medium"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="circuit-desc" className="text-xs font-semibold text-slate-700">
          Description
        </Label>
        <Input
          id="circuit-desc"
          value={description}
          placeholder="What does this circuit demonstrate?"
          onChange={(e) => setDescription(e.target.value)}
          className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-orange-500 focus:ring-orange-500/20 text-xs"
        />
      </div>

      <div className="flex items-center justify-between rounded-xl border border-orange-200/80 bg-orange-50/60 px-3 py-2.5">
        <div className="flex flex-col">
          <span className="text-xs font-bold text-slate-800">Shareable by link</span>
          <span className="text-[10px] text-slate-500">Anyone with link can view</span>
        </div>
        <Switch 
          checked={isPublic} 
          onCheckedChange={setIsPublic}
          className="data-[state=checked]:bg-[#F47F45]"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button 
          className="flex-1 bg-gradient-to-r from-[#FF8C42] via-[#F47F45] to-[#EA580C] text-white font-bold hover:opacity-95 shadow-md shadow-orange-500/20 border-0" 
          size="sm" 
          onClick={() => void save()} 
          disabled={busy}
        >
          {busy ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin text-white" />
          ) : (
            <Cloud className="mr-1.5 h-4 w-4" />
          )}
          {circuitId ? "Update" : "Save to cloud"}
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => void copyLink()}
          disabled={!circuitId || !isPublic}
          aria-label="Copy share link"
          className="border-slate-200 text-slate-700 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50 disabled:opacity-40"
        >
          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Share2 className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
