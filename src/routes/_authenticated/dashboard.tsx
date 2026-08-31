import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Flame, GraduationCap, Trophy, Sparkles, Loader2 } from "lucide-react";
import { AppHeader } from "@/components/quantum/AppHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";
import { useProgress } from "@/hooks/useProgress";
import { supabase } from "@/integrations/supabase/client";
import { LESSONS, TRACKS, lessonsOfTrack } from "@/lib/learn/content";
import { CHALLENGES } from "@/lib/learn/challenges";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Learner dashboard — Progress & next steps | QuantumLab" },
      {
        name: "description",
        content:
          "Track lesson mastery, solved challenges, your streak and a recommended next step in your quantum learning path.",
      },
      { property: "og:title", content: "Learner dashboard | QuantumLab" },
      {
        property: "og:description",
        content: "Your quantum learning progress, mastery per topic and next recommended lesson.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

interface AssignmentRow {
  id: string;
  title: string;
  item_type: string;
  item_id: string;
  due_at: string | null;
  cohort_id: string;
}

function DashboardPage() {
  const { user } = useSession();
  const progress = useProgress(user?.id);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinMsg, setJoinMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data } = await supabase
        .from("assignments")
        .select("id, title, item_type, item_id, due_at, cohort_id")
        .order("due_at", { ascending: true });
      setAssignments(data ?? []);
    })();
  }, [user, joinMsg]);

  async function join() {
    if (!user || joinCode.trim().length === 0) return;
    setJoining(true);
    setJoinMsg(null);
    const { data: cohort } = await supabase
      .from("cohorts")
      .select("id, name")
      .eq("join_code", joinCode.trim().toUpperCase())
      .maybeSingle();
    if (!cohort) {
      setJoinMsg("No class found with that code.");
      setJoining(false);
      return;
    }
    const { error } = await supabase
      .from("cohort_members")
      .insert({ cohort_id: cohort.id, user_id: user.id });
    setJoinMsg(error ? "You are already in that class." : `Joined ${cohort.name}.`);
    setJoinCode("");
    setJoining(false);
  }

  const done = new Set(
    progress.lessons.filter((l) => l.completed).map((l) => l.lesson_id),
  );
  const nextLesson = LESSONS.find((l) => !done.has(l.id));
  const nextChallenge = CHALLENGES.find((c) => !progress.solvedChallenges.has(c.id));

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Your progress</h1>

        {progress.loading ? (
          <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </p>
        ) : (
          <>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Stat
                icon={<GraduationCap className="h-4 w-4 text-primary" />}
                label="Lessons complete"
                value={`${progress.completedLessons}/${progress.totalLessons}`}
              />
              <Stat
                icon={<Trophy className="h-4 w-4 text-primary" />}
                label="Challenges solved"
                value={`${progress.solvedChallenges.size}/${progress.totalChallenges}`}
              />
              <Stat
                icon={<Flame className="h-4 w-4 text-primary" />}
                label="Day streak"
                value={`${progress.streak}`}
              />
            </div>

            <section className="mt-8">
              <h2 className="mb-3 text-sm font-semibold">Mastery by topic</h2>
              <div className="space-y-3">
                {TRACKS.map((t) => {
                  const items = lessonsOfTrack(t.id);
                  const complete = items.filter((l) => done.has(l.id)).length;
                  const pct = Math.round((complete / items.length) * 100);
                  return (
                    <div key={t.id} className="panel p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <p className="text-sm font-medium">{t.title}</p>
                        <Badge variant="secondary" className="ml-auto font-mono text-[0.6rem]">
                          {pct}%
                        </Badge>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-surface-raised">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="panel p-4">
                <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Sparkles className="h-4 w-4 text-primary" /> Recommended next
                </h2>
                {nextLesson ? (
                  <>
                    <p className="text-sm">{nextLesson.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{nextLesson.blurb}</p>
                    <Button asChild size="sm" className="mt-3">
                      <Link to="/learn/$lessonId" params={{ lessonId: nextLesson.id }}>
                        Start lesson
                      </Link>
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Every lesson is complete — nice work.
                  </p>
                )}
              </div>

              <div className="panel p-4">
                <h2 className="mb-2 text-sm font-semibold">Next challenge</h2>
                {nextChallenge ? (
                  <>
                    <p className="text-sm">{nextChallenge.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{nextChallenge.blurb}</p>
                    <Button asChild size="sm" variant="outline" className="mt-3">
                      <Link
                        to="/challenges/$challengeId"
                        params={{ challengeId: nextChallenge.id }}
                      >
                        Attempt it
                      </Link>
                    </Button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">All challenges solved.</p>
                )}
              </div>
            </section>

            <section className="mt-8">
              <h2 className="mb-3 text-sm font-semibold">Class assignments</h2>
              <div className="panel p-4">
                <div className="flex flex-wrap items-end gap-2">
                  <div className="flex-1">
                    <label
                      htmlFor="joincode"
                      className="mb-1.5 block text-xs text-muted-foreground"
                    >
                      Join a class with a code
                    </label>
                    <input
                      id="joincode"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      placeholder="ABC123"
                      className="w-full rounded-md border border-border bg-surface-raised px-3 py-2 font-mono text-sm uppercase outline-none focus:border-primary"
                    />
                  </div>
                  <Button onClick={() => void join()} disabled={joining}>
                    Join
                  </Button>
                </div>
                {joinMsg && (
                  <p className="mt-2 text-xs text-muted-foreground">{joinMsg}</p>
                )}

                {assignments.length > 0 ? (
                  <ul className="mt-4 space-y-2">
                    {assignments.map((a) => (
                      <li
                        key={a.id}
                        className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-surface-raised p-3"
                      >
                        <span className="text-sm">{a.title}</span>
                        <Badge variant="secondary" className="font-mono text-[0.6rem]">
                          {a.item_type}
                        </Badge>
                        {a.due_at && (
                          <span className="font-mono text-[0.65rem] text-muted-foreground">
                            due {new Date(a.due_at).toLocaleDateString()}
                          </span>
                        )}
                        <Button asChild size="sm" variant="ghost" className="ml-auto">
                          {a.item_type === "lesson" ? (
                            <Link to="/learn/$lessonId" params={{ lessonId: a.item_id }}>
                              Open
                            </Link>
                          ) : (
                            <Link
                              to="/challenges/$challengeId"
                              params={{ challengeId: a.item_id }}
                            >
                              Open
                            </Link>
                          )}
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-xs text-muted-foreground">
                    No assignments yet.
                  </p>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="panel p-4">
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon} {label}
      </p>
      <p className="mt-2 font-mono text-2xl">{value}</p>
    </div>
  );
}
