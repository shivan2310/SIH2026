import { useProfile, useSession } from "@/hooks/useSession";

export function DashboardHeader() {
  const { user } = useSession();
  const profile = useProfile(user?.id);
  const name = profile?.displayName ?? user?.email ?? "Shivank";
  
  // A simple function to get greeting based on time of day could be added here, 
  // but we'll hardcode "GOOD AFTERNOON" to match the spec or make it dynamic.
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "GOOD MORNING" : hour < 18 ? "GOOD AFTERNOON" : "GOOD EVENING";

  return (
    <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
      <div>
        <p className="mb-2 text-sm font-bold tracking-wider text-[#F89864] uppercase">
          {greeting}, {name}
        </p>
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-[#111111] md:text-4xl">
          Keep building your quantum intuition.
        </h1>
        <p className="text-[#707070]">
          Explore. Experiment. Learn. One circuit at a time.
        </p>
      </div>

      <div className="max-w-xs rounded-2xl border border-[#E7E7E7] bg-white p-4 shadow-sm">
        <p className="text-sm font-medium italic leading-relaxed text-[#111111]">
          "The future belongs to those who understand the strange beauty of the quantum world."
        </p>
        <p className="mt-2 text-xs font-semibold text-[#707070]">
          — Michio Kaku
        </p>
      </div>
    </div>
  );
}
