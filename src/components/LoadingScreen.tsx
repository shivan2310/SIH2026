import { Atom } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
  subtext?: string;
  fullPage?: boolean;
}

export function LoadingScreen({
  message = "Loading QuantumLab...",
  subtext = "Initialising quantum statevector & workspace",
  fullPage = true,
}: LoadingScreenProps) {
  const containerClasses = fullPage
    ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-white text-slate-900 font-sans select-none overflow-hidden"
    : "w-full min-h-[360px] py-16 flex flex-col items-center justify-center bg-white text-slate-900 font-sans rounded-2xl border border-orange-100/80 shadow-sm select-none relative overflow-hidden";

  return (
    <div className={containerClasses}>
      {/* Background warm glowing aura & micro dot pattern */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-orange-200/35 via-amber-100/25 to-orange-400/15 blur-[110px] rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] bg-orange-500/10 blur-[60px] rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(#f97316_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.04]" />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-sm px-6 text-center">
        {/* Animated Warm Orange Quantum Atom Loader */}
        <div className="relative flex items-center justify-center w-28 h-28 mb-6">
          {/* Outer dash spin ring */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-orange-400/50 animate-[spin_8s_linear_infinite]" />

          {/* Glowing orbital ring 1 */}
          <div className="absolute inset-2 rounded-full border-2 border-orange-500/30 border-t-orange-600 animate-[spin_3.5s_linear_infinite_reverse]" />

          {/* Glowing orbital ring 2 */}
          <div className="absolute inset-4 rounded-full border-2 border-amber-400/40 border-b-amber-500 animate-[spin_5s_linear_infinite]" />

          {/* Warm Orange Pulsing Core Ring */}
          <div className="absolute inset-6 rounded-full bg-orange-500/20 animate-ping opacity-40" />

          {/* Central Atom Icon badge with warm orange gradient & shadow */}
          <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[#FF8C42] via-[#F47F45] to-[#EA580C] text-white shadow-lg shadow-orange-500/30 border border-orange-200/40">
            <Atom className="w-6 h-6 animate-spin [animation-duration:9s]" />
          </div>
        </div>

        {/* Brand Title */}
        <div className="flex items-center gap-1 mb-2 text-2xl font-extrabold tracking-tight text-slate-900">
          <span>Quantum</span>
          <span className="bg-gradient-to-r from-[#F47F45] via-[#EA580C] to-[#C2410C] bg-clip-text text-transparent">
            Lab
          </span>
        </div>

        {/* Loading Message */}
        <h3 className="text-base font-semibold text-slate-800 mb-1">
          {message}
        </h3>

        {subtext && (
          <p className="text-xs text-slate-500 font-medium max-w-xs mb-6 leading-relaxed">
            {subtext}
          </p>
        )}

        {/* Warm Orange Animated Progress Bar */}
        <div className="w-52 h-1.5 bg-orange-100/80 rounded-full overflow-hidden relative border border-orange-200/40">
          <div className="absolute inset-y-0 bg-gradient-to-r from-[#FF8C42] via-[#F47F45] to-[#EA580C] rounded-full animate-loading-bar shadow-sm shadow-orange-500/50" />
        </div>
      </div>
    </div>
  );
}
