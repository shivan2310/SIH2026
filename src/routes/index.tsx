import { createFileRoute } from "@tanstack/react-router";
import { DashboardNavbar as AppHeader } from "@/components/dashboard/DashboardNavbar";
import { InteractiveHeroText } from "@/components/landing/InteractiveHeroText";
import { motion } from "framer-motion";
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
    <div className="min-h-screen bg-[#FAFAFA] font-sans text-[#111111] selection:bg-orange-500 selection:text-white">
      <AppHeader />
      <main>
        {/* INTERACTIVE MOVING TYPOGRAPHY HERO SECTION */}
        <InteractiveHeroText />

        {/* FEATURE CARDS SECTION WITH STAGGER & HOVER MOTION */}
        <section className="mx-auto max-w-6xl px-4 pb-24 relative z-10">
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.12,
                },
              },
            }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
          >
            {PHASE1.map((f, idx) => (
              <motion.article
                key={f.title}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                }}
                whileHover={{
                  y: -8,
                  scale: 1.03,
                  borderColor: "#F47F45",
                  boxShadow: "0 20px 25px -5px rgba(244, 127, 69, 0.2), 0 8px 10px -6px rgba(244, 127, 69, 0.15)",
                }}
                className="group rounded-2xl border border-orange-200/60 bg-white/85 backdrop-blur-md p-6 shadow-md transition-all duration-300 relative overflow-hidden"
              >
                {/* Subtle warm orange top border highlight on hover */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100/80 text-[#F47F45] transition-transform duration-300 group-hover:scale-110 group-hover:bg-[#F47F45] group-hover:text-white shadow-xs">
                  <f.icon className="h-6 w-6 transition-colors" />
                </div>
                <h2 className="mb-2 text-lg font-bold text-[#111111] group-hover:text-[#EA580C] transition-colors">
                  {f.title}
                </h2>
                <p className="text-sm font-medium leading-relaxed text-[#555555]">
                  {f.body}
                </p>
              </motion.article>
            ))}
          </motion.div>
        </section>
      </main>
      <footer className="border-t border-[#E5E7EB] bg-white py-10 text-center font-mono text-xs font-bold text-[#707070]">
        QuantumLab · built for a quantum-ready workforce
      </footer>
    </div>
  );
}
