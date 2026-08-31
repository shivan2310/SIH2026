import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, CheckCircle2, Clock } from "lucide-react";
import { AppHeader } from "@/components/quantum/AppHeader";
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
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold">Learning tracks</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
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
                  <h2 className="text-lg font-semibold">{track.title}</h2>
                  <Badge variant="secondary" className="font-mono text-[0.65rem]">
                    {complete}/{items.length}
                  </Badge>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">{track.blurb}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {items.map((lesson) => (
                    <Link
                      key={lesson.id}
                      to="/learn/$lessonId"
                      params={{ lessonId: lesson.id }}
                      className="panel block p-4 transition-colors hover:border-primary/60"
                    >
                      <div className="flex items-start gap-2">
                        {done.has(lesson.id) ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        ) : (
                          <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{lesson.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {lesson.blurb}
                          </p>
                          <p className="mt-2 flex items-center gap-1 font-mono text-[0.65rem] text-muted-foreground">
                            <Clock className="h-3 w-3" /> {lesson.minutes} min
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
