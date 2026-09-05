import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, CheckCircle2, Clock } from "lucide-react";
import { DashboardNavbar as AppHeader } from "@/components/dashboard/DashboardNavbar";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/hooks/useSession";
import { useProgress } from "@/hooks/useProgress";
import { TRACKS, lessonsOfTrack } from "@/lib/learn/content";

export const Route = createFileRoute("/learn/")({
  head: () => ({
    meta: [
      { title: "Learn quantum computing — Interactive curriculum | QuantumLab" },
      {
        name: "description",
        content:
          "Work through quantum fundamentals, gates and circuits, and the standard algorithms with interactive circuits and quizzes at every step.",
      },
      { property: "og:title", content: "Learn quantum computing | QuantumLab" },
      {
        property: "og:description",
        content:
          "Three tracks of interactive lessons: fundamentals, gates and circuits, and quantum algorithms.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LearnIndex,
});

function LearnIndex() {
  const { user } = useSession();
  const { lessons } = useProgress(user?.id);
  const done = new Set(lessons.filter((l) => l.completed).map((l) => l.lesson_id));

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans text-[#111111]">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-[#111111]">Learning tracks</h1>
          <p className="mt-2 max-w-2xl text-sm font-medium text-[#707070]">
            Every lesson carries a live circuit you can run and open in the lab, plus a
            short quiz. Progress is saved to your account when you are signed in.
          </p>
        </header>

        <div className="space-y-8">
          {TRACKS.map((track) => {
            const items = lessonsOfTrack(track.id);
            const complete = items.filter((l) => done.has(l.id)).length;
            return (
              <section key={track.id}>
                <div className="mb-3 flex items-baseline gap-3">
                  <h2 className="text-xl font-bold text-[#111111]">{track.title}</h2>
                  <Badge variant="secondary" className="font-mono text-[0.7rem] bg-white border border-[#E5E7EB] text-[#707070]">
                    {complete}/{items.length}
                  </Badge>
                </div>
                <p className="mb-4 text-sm font-medium text-[#707070]">{track.blurb}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  {items.map((lesson) => (
                    <Link
                      key={lesson.id}
                      to="/learn/$lessonId"
                      params={{ lessonId: lesson.id }}
                      className="block rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm transition-all hover:border-[#F47F45] hover:shadow-md"
                    >
                      <div className="flex items-start gap-3">
                        {done.has(lesson.id) ? (
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#F47F45]" />
                        ) : (
                          <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-[#707070]" />
                        )}
                        <div>
                          <p className="text-base font-bold text-[#111111]">{lesson.title}</p>
                          <p className="mt-1 text-sm font-medium text-[#707070] leading-relaxed">
                            {lesson.blurb}
                          </p>
                          <p className="mt-3 flex items-center gap-1.5 font-mono text-xs font-semibold text-[#707070]">
                            <Clock className="h-3.5 w-3.5" /> {lesson.minutes} min
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
