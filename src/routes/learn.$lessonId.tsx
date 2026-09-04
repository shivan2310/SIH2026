import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { AppHeader } from "@/components/quantum/AppHeader";
import { LessonCircuit } from "@/components/learn/LessonCircuit";
import { LessonAITutor } from "@/components/learn/LessonAITutor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/hooks/useSession";
import { saveLessonProgress, useProgress } from "@/hooks/useProgress";
import { getLesson, neighbours, trackOf, type Lesson } from "@/lib/learn/content";

export const Route = createFileRoute("/learn/$lessonId")({
  loader: ({ params }) => {
    const lesson = getLesson(params.lessonId);
    if (!lesson) throw notFound();
    return { lesson };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Lesson not found | QuantumLab" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { lesson } = loaderData;
    const title = `${lesson.title} — Quantum lesson | QuantumLab`;
    return {
      meta: [
        { title },
        { name: "description", content: lesson.blurb },
        { property: "og:title", content: title },
        { property: "og:description", content: lesson.blurb },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  errorComponent: () => <LessonMissing />,
  notFoundComponent: () => <LessonMissing />,
  component: LessonPage,
});

function LessonMissing() {
  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-lg font-semibold">Lesson unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          That lesson doesn't exist yet.
        </p>
        <Button asChild className="mt-4">
          <Link to="/learn">Back to the curriculum</Link>
        </Button>
      </main>
    </div>
  );
}

function LessonPage() {
  const { lesson } = Route.useLoaderData();
  const { user } = useSession();
  const { lessons, reload } = useProgress(user?.id);
  const track = trackOf(lesson);
  const { prev, next } = neighbours(lesson.id);

  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setAnswers({});
    setChecked(false);
  }, [lesson.id]);

  const record = lessons.find((l) => l.lesson_id === lesson.id);
  const score = lesson.quiz.filter((q) => answers[q.id] === q.answer).length;
  const allAnswered = lesson.quiz.every((q) => answers[q.id] !== undefined);

  async function complete() {
    if (!user) {
      toast.error("Sign in to save your progress");
      return;
    }
    setSaving(true);
    try {
      await saveLessonProgress({
        userId: user.id,
        lessonId: lesson.id,
        completed: true,
        quizScore: score,
        quizTotal: lesson.quiz.length,
      });
      await reload();
      toast.success("Lesson marked complete");
    } catch {
      toast.error("Couldn't save your progress");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Link
          to="/learn"
          className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> {track?.title ?? "Curriculum"}
        </Link>

        <header className="mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">{lesson.title}</h1>
            {record?.completed && (
              <Badge className="font-mono text-[0.65rem]">completed</Badge>
            )}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{lesson.blurb}</p>
        </header>

        <article className="space-y-4">
          {lesson.body.map((block, i) => (
            <LessonBlock key={i} block={block} />
          ))}

          {lesson.circuit && (
            <LessonCircuit code={lesson.circuit.code} caption={lesson.circuit.caption} />
          )}
        </article>

        <LessonAITutor lesson={lesson} />

        <section className="panel mt-8 p-5">
          <h2 className="mb-4 text-sm font-semibold">Check your understanding</h2>
          <div className="space-y-5">
            {lesson.quiz.map((q) => {
              const picked = answers[q.id];
              const correct = picked === q.answer;
              return (
                <div key={q.id}>
                  <p className="mb-2 text-sm">{q.prompt}</p>
                  <div className="grid gap-2">
                    {q.options.map((opt, idx) => {
                      const active = picked === idx;
                      const state =
                        checked && active
                          ? correct
                            ? "border-primary text-foreground"
                            : "border-destructive text-foreground"
                          : active
                            ? "border-primary/70"
                            : "border-border";
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setAnswers((a) => ({ ...a, [q.id]: idx }))
                          }
                          className={`rounded-md border bg-surface-raised px-3 py-2 text-left text-sm transition-colors hover:border-primary/60 ${state}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {checked && picked !== undefined && (
                    <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                      {correct ? (
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-primary" />
                      ) : (
                        <XCircle className="mt-0.5 h-3.5 w-3.5 text-destructive" />
                      )}
                      {q.explain}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setChecked(true)}
              disabled={!allAnswered}
            >
              Check answers
            </Button>
            {checked && (
              <span className="font-mono text-xs text-muted-foreground">
                {score}/{lesson.quiz.length} correct
              </span>
            )}
            <Button className="ml-auto" onClick={() => void complete()} disabled={saving}>
              {record?.completed ? "Update progress" : "Mark complete"}
            </Button>
          </div>
        </section>

        <nav className="mt-8 flex items-center justify-between gap-3">
          {prev ? (
            <Button asChild variant="ghost" size="sm">
              <Link to="/learn/$lessonId" params={{ lessonId: prev.id }}>
                <ArrowLeft className="mr-1.5 h-4 w-4" /> {prev.title}
              </Link>
            </Button>
          ) : (
            <span />
          )}
          {next && (
            <Button asChild variant="ghost" size="sm">
              <Link to="/learn/$lessonId" params={{ lessonId: next.id }}>
                {next.title} <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          )}
        </nav>
      </main>
    </div>
  );
}

function LessonBlock({ block }: { block: Lesson["body"][number] }) {
  switch (block.kind) {
    case "h":
      return <h2 className="pt-2 text-lg font-semibold">{block.text}</h2>;
    case "p":
      return <p className="text-sm leading-relaxed text-muted-foreground">{block.text}</p>;
    case "math":
      return (
        <pre className="overflow-auto rounded-md border border-border bg-surface-raised p-3 font-mono text-xs text-foreground">
          {block.text}
        </pre>
      );
    case "list":
      return (
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
  }
}
