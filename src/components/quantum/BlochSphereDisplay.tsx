import { BlochSphere } from "./BlochSphere";
import { type StateVector } from "@/lib/quantum/simulator";

interface Props {
  state: StateVector | null;
}

export function BlochSphereDisplay({ state }: Props) {
  if (!state) {
    return (
      <div className="flex h-full gap-6">
        <div className="flex-1 rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm flex flex-col items-center justify-center text-[#707070]">
          No data for Bloch Sphere (q0)
        </div>
        <div className="flex-1 rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm flex flex-col items-center justify-center text-[#707070]">
          No data for Bloch Sphere (q1)
        </div>
      </div>
    );
  }

  // Determine how many spheres to show. Let's limit to 2 or 3 to fit the layout.
  const qubitsToShow = Math.min(state.numQubits, 2); 
  // If there are more qubits, we'll just show the first two for this view based on spec "Bloch Sphere (q0)", "Bloch Sphere (q1)".

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
      {Array.from({ length: qubitsToShow }).map((_, q) => (
        <div key={q} className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm flex flex-col">
          <h3 className="mb-4 text-sm font-bold text-[#111111]">Bloch Sphere (q{q})</h3>
          <div className="flex-1 flex items-center justify-center bg-gray-50 rounded-xl border border-[#E5E7EB] p-4">
            <BlochSphere state={state} qubit={q} />
          </div>
        </div>
      ))}
      {qubitsToShow === 0 && (
        <div className="col-span-2 text-center text-[#707070] py-8">
          No qubits to display.
        </div>
      )}
      {qubitsToShow === 1 && (
        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm flex flex-col items-center justify-center">
          <h3 className="mb-4 text-sm font-bold text-[#111111] opacity-50">Bloch Sphere (q1)</h3>
          <p className="text-xs text-[#707070]">Add another qubit to visualize</p>
        </div>
      )}
    </div>
  );
}
