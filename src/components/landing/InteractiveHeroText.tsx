import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Sparkles, Atom, Zap } from "lucide-react";
import { Link } from "@tanstack/react-router";

const ROTATING_WORDS = ["qubits.", "circuits.", "statevectors.", "algorithms."];

export function InteractiveHeroText() {
  const [wordIndex, setWordIndex] = useState(0);
  const [activeConcept, setActiveConcept] = useState<string | null>(null);

  // Mouse tracking for magnetic font & background movement
  const heroRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for cursor follow
  const springX = useSpring(mouseX, { stiffness: 150, damping: 15 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 15 });

  // Rotating target word timer
  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    mouseX.set(x * 0.15);
    mouseY.set(y * 0.15);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const line1Text = "Stop reading about ";
  const line2Start = "Start moving ";

  return (
    <section
      ref={heroRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full overflow-hidden bg-[#FAFAFA] select-none py-16"
    >
      {/* FULL-WIDTH QUANTUM MECHANICS BACKGROUND IMAGE LAYER WITH 3D PARALLAX */}
      <motion.div
        style={{
          x: useTransform(springX, (val) => val * -0.6),
          y: useTransform(springY, (val) => val * -0.6),
        }}
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden opacity-75 md:opacity-85 transition-all duration-300"
      >
        <img
          src="/quantum-bg.jpg"
          alt="Quantum Mechanics Wavefunction & Atomic Orbits"
          className="h-full w-full object-cover object-center scale-110 filter saturate-150 contrast-110"
        />
        {/* Soft edge blend & radial vignetting overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAFAFA]/30 via-transparent to-[#FAFAFA]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_25%,#FAFAFA_85%)]" />
      </motion.div>

      {/* Background Interactive Floating Warm Radial Glow */}
      <motion.div
        style={{ x: springX, y: springY }}
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[550px] w-[550px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-orange-400/30 via-amber-300/25 to-orange-500/20 blur-[100px]"
      />

      {/* MAIN HERO CONTENT CONTAINER */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 text-center">
        {/* Interactive Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-orange-300/80 bg-white/90 px-4 py-1.5 backdrop-blur-md transition-all hover:border-orange-500 hover:bg-orange-50/90 shadow-sm"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-500 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-600"></span>
          </span>
          <span className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-[#EA580C]">
            Interactive Quantum Education
          </span>
          <Atom className="h-3.5 w-3.5 text-orange-600 animate-spin [animation-duration:6s]" />
        </motion.div>

        {/* MAIN KINETIC MOVING TITLE */}
        <h1 className="text-balance text-5xl font-black tracking-tight leading-[1.1] sm:text-7xl lg:text-8xl text-[#111111] font-sans">
          {/* Line 1: Stop reading about */}
          <span className="inline-block">
            {line1Text.split("").map((char, index) => (
              <motion.span
                key={index}
                className="inline-block transition-colors duration-200 hover:text-orange-600 cursor-pointer"
                whileHover={{
                  y: -12,
                  scale: 1.15,
                  rotate: (index % 2 === 0 ? 1 : -1) * 8,
                  color: "#EA580C",
                }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            ))}
          </span>

          {/* Dynamic Slot-Machine Rotating Word */}
          <span className="relative inline-block overflow-hidden align-bottom text-[#F47F45] font-extrabold pb-2">
            <motion.span
              key={wordIndex}
              initial={{ y: 50, opacity: 0, rotateX: -90 }}
              animate={{ y: 0, opacity: 1, rotateX: 0 }}
              exit={{ y: -50, opacity: 0, rotateX: 90 }}
              transition={{ duration: 0.5, ease: "backOut" }}
              className="inline-block bg-gradient-to-r from-[#FF8C42] via-[#F47F45] to-[#EA580C] bg-clip-text text-transparent underline decoration-orange-300/40 decoration-wavy underline-offset-8"
            >
              {ROTATING_WORDS[wordIndex]}
            </motion.span>
          </span>

          <br />

          {/* Line 2: Start moving them. */}
          <motion.div
            style={{ x: useTransform(springX, (val) => val * -0.4) }}
            className="mt-2 inline-block font-black"
          >
            <span className="inline-block text-[#111111]">
              {line2Start.split("").map((char, index) => (
                <motion.span
                  key={`l2-${index}`}
                  className="inline-block cursor-pointer hover:text-orange-600"
                  whileHover={{
                    y: -14,
                    scale: 1.2,
                    rotate: (index % 2 === 0 ? -1 : 1) * 10,
                    color: "#EA580C",
                  }}
                  transition={{ type: "spring", stiffness: 450, damping: 12 }}
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </span>

            {/* Glowing Animated Warm Orange Kinetic Floating Text "them." */}
            <span className="relative inline-flex items-center text-[#F47F45]">
              {"them.".split("").map((char, index) => (
                <motion.span
                  key={`them-${index}`}
                  className="inline-block bg-gradient-to-r from-[#FF7A00] via-[#F47F45] to-[#DC2626] bg-clip-text text-transparent cursor-pointer font-black drop-shadow-sm"
                  animate={{
                    y: [0, -7, 0],
                    scale: [1, 1.06, 1],
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    delay: index * 0.15,
                    ease: "easeInOut",
                  }}
                  whileHover={{
                    y: -18,
                    scale: 1.3,
                    rotate: [0, 12, -12, 0],
                    color: "#EA580C",
                  }}
                >
                  {char}
                </motion.span>
              ))}
            </span>
          </motion.div>
        </h1>

        {/* INTERACTIVE SUBTITLE WITH HOVERABLE QUANTUM CONCEPTS */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-8 max-w-2xl text-pretty text-lg font-medium text-[#444444] sm:text-xl leading-relaxed bg-white/60 p-3 rounded-2xl backdrop-blur-xs border border-white/80 shadow-xs"
        >
          QuantumLab turns{" "}
          <span
            onMouseEnter={() => setActiveConcept("superposition")}
            onMouseLeave={() => setActiveConcept(null)}
            className={`cursor-pointer rounded-lg px-2 py-0.5 font-bold transition-all ${
              activeConcept === "superposition"
                ? "bg-orange-500 text-white shadow-md shadow-orange-500/30 scale-105 inline-block"
                : "bg-orange-100/90 text-orange-900 hover:bg-orange-200"
            }`}
          >
            |ψ⟩ superposition
          </span>
          ,{" "}
          <span
            onMouseEnter={() => setActiveConcept("entanglement")}
            onMouseLeave={() => setActiveConcept(null)}
            className={`cursor-pointer rounded-lg px-2 py-0.5 font-bold transition-all ${
              activeConcept === "entanglement"
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/30 scale-105 inline-block"
                : "bg-amber-100/90 text-amber-950 hover:bg-amber-200"
            }`}
          >
            entanglement ⚛️
          </span>{" "}
          and{" "}
          <span
            onMouseEnter={() => setActiveConcept("algorithms")}
            onMouseLeave={() => setActiveConcept(null)}
            className={`cursor-pointer rounded-lg px-2 py-0.5 font-bold transition-all ${
              activeConcept === "algorithms"
                ? "bg-orange-600 text-white shadow-md shadow-orange-600/30 scale-105 inline-block"
                : "bg-orange-100/90 text-orange-950 hover:bg-orange-200"
            }`}
          >
            quantum algorithms
          </span>{" "}
          into something you can build, run and watch — a live circuit lab in your
          browser with no installs and no hardware queue.
        </motion.p>

        {/* CONCEPT INFO CARD POPUP ON HOVER */}
        {activeConcept && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5 }}
            className="mx-auto mt-4 max-w-md rounded-xl border border-orange-200/90 bg-white/95 backdrop-blur-md p-3 text-xs font-semibold text-slate-800 shadow-lg shadow-orange-500/10 text-center"
          >
            {activeConcept === "superposition" && (
              <p>✨ <strong>Superposition:</strong> Qubits exist in linear combinations of |0⟩ and |1⟩ until measured!</p>
            )}
            {activeConcept === "entanglement" && (
              <p>🔗 <strong>Entanglement:</strong> Two qubits share quantum correlation regardless of distance!</p>
            )}
            {activeConcept === "algorithms" && (
              <p>⚡ <strong>Quantum Algorithms:</strong> Grover's search, Bell states, and QFT built with visual gates!</p>
            )}
          </motion.div>
        )}

        {/* INTERACTIVE CALL TO ACTION BUTTONS WITH MAGNETIC HOVER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10 flex flex-wrap justify-center gap-4 relative z-20"
        >
          <motion.div
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              to="/lab"
              className="group relative inline-flex h-14 items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[#FF8C42] via-[#F47F45] to-[#EA580C] px-8 text-base font-bold text-white shadow-lg shadow-orange-500/25 transition-all hover:shadow-orange-500/40"
            >
              <span className="relative z-10 flex items-center gap-2">
                Open the Circuit Lab
                <Zap className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            </Link>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              to="/lab"
              hash="examples"
              className="inline-flex h-14 items-center justify-center gap-2 rounded-xl border-2 border-orange-200 bg-white px-8 text-base font-bold text-[#111111] transition-all hover:border-orange-500 hover:bg-orange-50/50 shadow-sm"
            >
              <Sparkles className="h-4 w-4 text-orange-500" />
              Try the Bell state
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
