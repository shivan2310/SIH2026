import { createFileRoute, Link } from "@tanstack/react-router";
import { Cpu, Wifi, WifiOff } from "lucide-react";
import { DashboardNavbar as AppHeader } from "@/components/dashboard/DashboardNavbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BACKENDS, remoteServiceConfigured } from "@/lib/quantum/backend";

export const Route = createFileRoute("/backends")({
  head: () => ({
    meta: [
      { title: "Simulator backends â€” Qiskit, PennyLane, Cirq, qBraid | QuantumLab" },
      {
        name: "description",
        content:
          "QuantumLab runs circuits on a built-in browser statevector engine and can dispatch to Qiskit Aer, PennyLane, Cirq and qBraid through one pluggable adapter interface.",
      },
      { property: "og:title", content: "Simulator backends | QuantumLab" },
      {
        property: "og:description",
        content:
          "One adapter interface, many engines: browser statevector plus Qiskit Aer, PennyLane, Cirq and qBraid.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BackendsPage,
});

function BackendsPage() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Cpu className="h-5 w-5 text-primary" /> Simulator backends
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Every engine implements the same <span className="font-mono">SimulatorBackend</span>{" "}
          contract, so the lab, the challenges and the AI tools work identically whichever you
          pick. External SDK engines are served by a compute service; when it is offline the
          adapter transparently falls back to the browser engine and tells you it did.
        </p>

        <div className="mt-4 flex items-center gap-2 text-xs">
          {remoteServiceConfigured ? (
            <>
              <Wifi className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">
                External compute service configured.
              </span>
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">
                No external compute service configured â€” SDK backends fall back locally.
              </span>
            </>
          )}
        </div>

        <div className="mt-6 space-y-3">
          {BACKENDS.map((b) => (
            <article key={b.id} className="panel p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold">{b.name}</h2>
                <Badge variant="secondary" className="font-mono text-[0.6rem]">
                  {b.vendor}
                </Badge>
                <Badge
                  variant={b.available ? "default" : "outline"}
                  className="font-mono text-[0.6rem]"
                >
                  {b.available ? "available" : "fallback only"}
                </Badge>
                <span className="ml-auto font-mono text-[0.65rem] text-muted-foreground">
                  up to {b.maxQubits} qubits
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{b.description}</p>
            </article>
          ))}
        </div>

        <Button asChild className="mt-6">
          <Link to="/lab">Choose a backend in the lab</Link>
        </Button>
      </main>
    </div>
  );
}
