import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Cloud, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
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

  useEffect(() => {
    if (!circuitId || !user) return;
    let active = true;
    void (async () => {
      const { data } = await supabase
        .from("circuits")
        .select("title, description, is_public")
        .eq("id", circuitId)
        .maybeSingle();
      if (!active || !data) return;
      setTitle(data.title);
      setDescription(data.description ?? "");
      setIsPublic(data.is_public);
    })();
    return () => {
      active = false;
    };
  }, [circuitId, user]);

  if (loading) return null;

  if (!user) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Sign in to save circuits to the cloud and share them by link. Your work
          is autosaved in this browser meanwhile.
        </p>
        <Button asChild size="sm" className="w-full">
          <Link to="/auth">Sign in to save</Link>
        </Button>
      </div>
    );
  }

  async function save() {
    setBusy(true);
    const payload = {
      user_id: user!.id,
      title: title.trim() || "Untitled circuit",
      description: description.trim() || null,
      data: JSON.parse(JSON.stringify(circuit)) as never,
      is_public: isPublic,
    };
    const query = circuitId
      ? supabase.from("circuits").update(payload).eq("id", circuitId).select("id").single()
      : supabase.from("circuits").insert(payload).select("id").single();
    const { data, error } = await query;
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    onSaved(data.id);
    toast.success(circuitId ? "Circuit updated" : "Circuit saved to cloud");
  }

  async function copyLink() {
    if (!circuitId) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/c/${circuitId}`);
      toast.success("Share link copied");
    } catch {
      toast.error("Clipboard unavailable in this browser");
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="circuit-title" className="mb-1.5 block text-xs text-muted-foreground">
          Title
        </Label>
        <Input
          id="circuit-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div>
        <Label
          htmlFor="circuit-desc"
          className="mb-1.5 block text-xs text-muted-foreground"
        >
          Description
        </Label>
        <Input
          id="circuit-desc"
          value={description}
          placeholder="What does this circuit demonstrate?"
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="flex items-center justify-between rounded-md border border-border bg-surface-raised px-3 py-2">
        <span className="text-xs text-muted-foreground">Shareable by link</span>
        <Switch checked={isPublic} onCheckedChange={setIsPublic} />
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" size="sm" onClick={() => void save()} disabled={busy}>
          {busy ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
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
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
