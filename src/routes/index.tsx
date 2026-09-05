import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardNavbar as AppHeader } from "@/components/dashboard/DashboardNavbar";
import { Button } from "@/components/ui/button";
import {
  Binary,
  CircuitBoard,
  GaugeCircle,
  Orbit,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QuantumLab â€” Learn, Build & Simulate Quantum Circuits" },
      {
        name: "description",
        content:
          "An interactive quantum computing platform: drag-and-drop circuit design, a synchronized code editor, in-browser simulation and live quantum state visualization.",
      },
      {
        property: "og:title",
        content: "QuantumLab â€” Learn, Build & Simulate Quantum Circuits",
      },
      {
        property: "og:description",
        content:
          "Design quantum circuits visually or in code, run them instantly in your browser, and see Bloch spheres, amplitudes and measurement statistics update live.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const PHASE1 = [
  {
    icon: CircuitBoard,
    title: "Drag-and-drop builder",
    body: "Compose circuits on a wire grid with controls, targets, rotations and measurements.",
  },
  {
    icon: Binary,
    title: "Two-way code editor",
    body: "Canvas and code share one internal representation â€” edit either, both stay in sync.",
  },
  {
    icon: GaugeCircle,
    title: "Browser simulation",
    body: "A pure-TypeScript statevector engine with seeded shot sampling. No setup, no server.",
  },
  {
    icon: Orbit,
    title: "State visualization",
    body: "Bloch spheres, probability histograms, amplitude and phase tables, step-by-step playback.",
  },
];

function Home() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main>
        <section className="mx-auto max-w-5xl px-4 pb-16 pt-20 text-center">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.3em] text-primary">
            Interactive quantum education
          </p>
          <h1 className="text-balance text-4xl font-bold leading-tight sm:text-6xl">
            Stop reading about qubits.
            <br />
            <span className="text-primary">Start moving them.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            QuantumLab turns superposition, entanglement and quantum algorithms
            into something you can build, run and watch â€” a circuit lab in your
            browser with no installs and no hardware queue.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/lab">Open the Circuit Lab</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/lab" hash="examples">
                Try the Bell state
              </Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PHASE1.map((f) => (
              <article key={f.title} className="panel p-5">
                <f.icon className="mb-3 h-5 w-5 text-primary" />
                <h2 className="mb-1.5 text-sm font-semibold">{f.title}</h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </article>
            ))}
          </div>
        </section>


      </main>
      <footer className="border-t border-border py-8 text-center font-mono text-xs text-muted-foreground">
        QuantumLab Â· built for a quantum-ready workforce
      </footer>
    </div>
  );
}
