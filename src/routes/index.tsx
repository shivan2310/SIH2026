import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardNavbar as AppHeader } from "@/components/dashboard/DashboardNavbar";
import {
  Binary,
  CircuitBoard,
  GaugeCircle,
  Orbit,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QuantumLab — Learn, Build & Simulate Quantum Circuits" },
      {
        name: "description",
        content:
          "An interactive quantum computing platform: drag-and-drop circuit design, a synchronized code editor, in-browser simulation and live quantum state visualization.",
      },
      {
        property: "og:title",
        content: "QuantumLab — Learn, Build & Simulate Quantum Circuits",
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
    body: "Canvas and code share one internal representation — edit either, both stay in sync.",
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
    <div className="min-h-screen bg-[#F5F5F5] font-sans text-[#111111]">
      <AppHeader />
      <main>
        <section className="mx-auto max-w-5xl px-4 pb-20 pt-24 text-center">
          <p className="mb-6 font-mono text-xs font-bold uppercase tracking-[0.3em] text-[#F47F45]">
            Interactive quantum education
          </p>
          <h1 className="text-balance text-5xl font-extrabold tracking-tight leading-tight sm:text-7xl text-[#111111]">
            Stop reading about qubits.
            <br />
            <span className="text-[#F47F45]">Start moving them.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-pretty text-lg font-medium text-[#707070] sm:text-xl leading-relaxed">
            QuantumLab turns superposition, entanglement and quantum algorithms
            into something you can build, run and watch — a circuit lab in your
            browser with no installs and no hardware queue.
          </p>
          <div className="mt-12 flex flex-wrap justify-center gap-4">
            <Link
              to="/lab"
              className="inline-flex h-14 items-center justify-center rounded-xl bg-[#F47F45] px-8 text-base font-bold text-white shadow-sm transition-colors hover:bg-[#E3692E]"
            >
              Open the Circuit Lab
            </Link>
            <Link
              to="/lab"
              hash="examples"
              className="inline-flex h-14 items-center justify-center rounded-xl border-2 border-[#E5E7EB] bg-white px-8 text-base font-bold text-[#111111] transition-colors hover:border-[#F47F45] hover:bg-gray-50"
            >
              Try the Bell state
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PHASE1.map((f) => (
              <article key={f.title} className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md hover:border-[#F47F45]">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#F47F45]/10">
                  <f.icon className="h-6 w-6 text-[#F47F45]" />
                </div>
                <h2 className="mb-2 text-lg font-bold text-[#111111]">{f.title}</h2>
                <p className="text-sm font-medium leading-relaxed text-[#707070]">
                  {f.body}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <footer className="border-t border-[#E5E7EB] bg-white py-10 text-center font-mono text-xs font-bold text-[#707070]">
        QuantumLab · built for a quantum-ready workforce
      </footer>
    </div>
  );
}
