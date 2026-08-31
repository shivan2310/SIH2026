import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Trophy } from "lucide-react";
import { AppHeader } from "@/components/quantum/AppHeader";
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
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <header className="mb-8">
          <h1 className="flex items-center gap-2 text-2xl font-semibold">
            <Trophy className="h-5 w-5 text-primary" /> Coding challenges
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Write circuit code, run it, and get graded instantly against the target
            state. Solved challenges are recorded on your learner dashboard.
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          {CHALLENGES.map((c) => (
            <Link
              key={c.id}
              to="/challenges/$challengeId"
              params={{ challengeId: c.id }}
              className="panel block p-4 transition-colors hover:border-primary/60"
            >
              <div className="flex items-start gap-2">
                {solvedChallenges.has(c.id) && (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{c.title}</p>
                    <Badge variant="secondary" className="font-mono text-[0.6rem]">
                      {DIFFICULTY_LABEL[c.difficulty]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{c.blurb}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
