import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Trophy } from "lucide-react";
import { DashboardNavbar as AppHeader } from "@/components/dashboard/DashboardNavbar";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/hooks/useSession";
import { useProgress } from "@/hooks/useProgress";
import { CHALLENGES } from "@/lib/learn/challenges";

export const Route = createFileRoute("/challenges/")({
  head: () => ({
    meta: [
      { title: "Quantum coding challenges — Auto-graded | QuantumLab" },
      {
        name: "description",
        content:
          "Solve quantum circuit puzzles from balanced coins to Grover search and teleportation, graded automatically against the target state.",
      },
      { property: "og:title", content: "Quantum coding challenges | QuantumLab" },
      {
        property: "og:description",
        content:
          "Auto-graded circuit puzzles across superposition, entanglement, interference and algorithms.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChallengesIndex,
});

const DIFFICULTY_LABEL: Record<string, string> = {
  intro: "intro",
  core: "core",
  advanced: "advanced",
};

function ChallengesIndex() {
  const { user } = useSession();
  const { solvedChallenges } = useProgress(user?.id);

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans text-[#111111]">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <header className="mb-8">
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-[#111111]">
            <Trophy className="h-7 w-7 text-[#F47F45]" /> Coding challenges
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-medium text-[#707070]">
            Write circuit code, run it, and get graded instantly against the target
            state. Solved challenges are recorded on your learner dashboard.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {CHALLENGES.map((c) => (
            <Link
              key={c.id}
              to="/challenges/$challengeId"
              params={{ challengeId: c.id }}
              className="block rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm transition-all hover:border-[#F47F45] hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                {solvedChallenges.has(c.id) ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#F47F45]" />
                ) : (
                  <div className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-[#E5E7EB]" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-bold text-[#111111]">{c.title}</p>
                    <Badge variant="secondary" className="font-mono text-[0.7rem] bg-white border border-[#E5E7EB] text-[#707070]">
                      {DIFFICULTY_LABEL[c.difficulty]}
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-sm font-medium text-[#707070] leading-relaxed">{c.blurb}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
