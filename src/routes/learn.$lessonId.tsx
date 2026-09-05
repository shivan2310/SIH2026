import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { DashboardNavbar as AppHeader } from "@/components/dashboard/DashboardNavbar";
import { LessonCircuit } from "@/components/learn/LessonCircuit";
import { LessonAITutor } from "@/components/learn/LessonAITutor";
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
    <div className="min-h-screen bg-[#F5F5F5] font-sans text-[#111111]">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Lesson unavailable</h1>
        <p className="mt-2 text-sm font-medium text-[#707070]">
          That lesson doesn't exist yet.
        </p>
        <Link to="/learn" className="mt-6 inline-block rounded-lg bg-[#F47F45] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#E3692E]">
          Back to the curriculum
        </Link>
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
    <div className="min-h-screen bg-[#F5F5F5] font-sans text-[#111111]">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Link
          to="/learn"
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#707070] transition-colors hover:text-[#111111]"
        >
          <ArrowLeft className="h-4 w-4" /> {track?.title ?? "Curriculum"}
        </Link>

        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-[#111111]">{lesson.title}</h1>
            {record?.completed && (
              <Badge className="font-mono text-[0.7rem] bg-[#F47F45]/10 text-[#F47F45] border border-[#F47F45]/20 font-bold">
                completed
              </Badge>
            )}
          </div>
          <p className="mt-3 text-base font-medium text-[#707070] leading-relaxed">{lesson.blurb}</p>
        </header>

        <article className="space-y-6">
          {lesson.body.map((block, i) => (
            <LessonBlock key={i} block={block} />
          ))}

          {lesson.circuit && (
            <div className="mt-8">
              <LessonCircuit code={lesson.circuit.code} caption={lesson.circuit.caption} />
            </div>
          )}
        </article>

        <div className="mt-10">
          <LessonAITutor lesson={lesson} />
        </div>

        <section className="rounded-2xl border border-[#E5E7EB] bg-white mt-10 p-6 md:p-8 shadow-sm">
          <h2 className="mb-6 text-lg font-bold text-[#111111]">Check your understanding</h2>
          <div className="space-y-8">
            {lesson.quiz.map((q) => {
              const picked = answers[q.id];
              const correct = picked === q.answer;
              return (
                <div key={q.id}>
                  <p className="mb-4 text-base font-medium text-[#111111] leading-relaxed">{q.prompt}</p>
                  <div className="grid gap-3">
                    {q.options.map((opt, idx) => {
                      const active = picked === idx;
                      const state =
                        checked && active
                          ? correct
                            ? "border-[#20B486] bg-[#20B486]/5 text-[#111111]"
                            : "border-[#FF6680] bg-[#FF6680]/5 text-[#111111]"
                          : active
                            ? "border-[#F47F45] ring-1 ring-[#F47F45] bg-[#F47F45]/5 text-[#111111]"
                            : "border-[#E5E7EB] bg-gray-50 text-[#707070]";
                      return (
                         <button
                           key={opt}
                           type="button"
                           onClick={() =>
                             setAnswers((a) => ({ ...a, [q.id]: idx }))
                           }
                           className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-all hover:border-[#F47F45] ${state}`}
                         >
                           {opt}
                         </button>
                      );
                    })}
                  </div>
                  {checked && picked !== undefined && (
                    <div className="mt-3 flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-sm font-medium text-[#707070] border border-[#E5E7EB]">
                      {correct ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#20B486]" />
                      ) : (
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#FF6680]" />
                      )}
                      <span>{q.explain}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4 border-t border-[#E5E7EB] pt-6">
            <button
              onClick={() => setChecked(true)}
              disabled={!allAnswered}
              className="rounded-lg border border-[#E5E7EB] bg-white px-5 py-2.5 text-sm font-bold text-[#111111] transition-colors hover:bg-gray-50 disabled:opacity-50"
            >
              Check answers
            </button>
            {checked && (
              <span className="font-mono text-sm font-bold text-[#707070]">
                <span className={score === lesson.quiz.length ? "text-[#20B486]" : "text-[#FF6680]"}>
                  {score}
                </span>
                /{lesson.quiz.length} correct
              </span>
            )}
            <button
              className="ml-auto rounded-lg bg-[#F47F45] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#E3692E] disabled:opacity-70"
              onClick={() => void complete()}
              disabled={saving}
            >
              {record?.completed ? "Update progress" : "Mark complete"}
            </button>
          </div>
        </section>

        <nav className="mt-12 flex items-center justify-between border-t border-[#E5E7EB] pt-8">
          {prev ? (
            <Link
              to="/learn/$lessonId"
              params={{ lessonId: prev.id }}
              className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-bold text-[#111111] transition-colors hover:bg-gray-50 hover:border-[#F47F45]"
            >
              <ArrowLeft className="h-4 w-4 text-[#F47F45]" /> {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link
              to="/learn/$lessonId"
              params={{ lessonId: next.id }}
              className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm font-bold text-[#111111] transition-colors hover:bg-gray-50 hover:border-[#F47F45]"
            >
              {next.title} <ArrowRight className="h-4 w-4 text-[#F47F45]" />
            </Link>
          )}
        </nav>
      </main>
    </div>
  );
}

function LessonBlock({ block }: { block: Lesson["body"][number] }) {
  switch (block.kind) {
    case "h":
      return <h2 className="pt-4 text-xl font-bold text-[#111111]">{block.text}</h2>;
    case "p":
      return <p className="text-base font-medium leading-relaxed text-[#707070]">{block.text}</p>;
    case "math":
      return (
        <pre className="overflow-auto rounded-xl border border-[#E5E7EB] bg-white p-4 font-mono text-sm font-bold text-[#111111] shadow-sm">
          {block.text}
        </pre>
      );
    case "list":
      return (
        <ul className="list-disc space-y-2 pl-6 text-base font-medium text-[#707070]">
          {block.items.map((item) => (
            <li key={item} className="leading-relaxed">{item}</li>
          ))}
        </ul>
      );
  }
}
