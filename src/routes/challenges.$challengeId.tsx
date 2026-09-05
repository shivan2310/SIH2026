import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Lightbulb, Play, XCircle } from "lucide-react";
import { DashboardNavbar as AppHeader } from "@/components/dashboard/DashboardNavbar";
import { CircuitCanvas } from "@/components/quantum/CircuitCanvas";
import { CodePanel } from "@/components/quantum/CodePanel";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/hooks/useSession";
import { saveAttempt } from "@/hooks/useProgress";
import { getChallenge, gradeChallenge, type GradeResult } from "@/lib/learn/challenges";
import { parseCode, type ParseError } from "@/lib/quantum/code";
import { basisLabel, simulate } from "@/lib/quantum/simulator";
import type { QCircuit } from "@/lib/quantum/ir";

export const Route = createFileRoute("/challenges/$challengeId")({
  loader: ({ params }) => {
    const challenge = getChallenge(params.challengeId);
    if (!challenge) throw notFound();
    return { challenge };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Challenge not found | QuantumLab" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { challenge } = loaderData;
    const title = `${challenge.title} — Quantum challenge | QuantumLab`;
    return {
      meta: [
        { title },
        { name: "description", content: challenge.blurb },
        { property: "og:title", content: title },
        { property: "og:description", content: challenge.blurb },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  errorComponent: () => <ChallengeMissing />,
  notFoundComponent: () => <ChallengeMissing />,
  component: ChallengePage,
});

function ChallengeMissing() {
  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans text-[#111111]">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Challenge unavailable</h1>
        <Link to="/challenges" className="mt-6 inline-block rounded-lg bg-[#F47F45] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#E3692E]">
          Back to challenges
        </Link>
      </main>
    </div>
  );
}

function ChallengePage() {
  const { challenge } = Route.useLoaderData();
  const { user } = useSession();
  const [code, setCode] = useState(challenge.starter);
  const [errors, setErrors] = useState<ParseError[]>([]);
  const [circuit, setCircuit] = useState<QCircuit | null>(null);
  const [bars, setBars] = useState<Array<[string, number]>>([]);
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setCode(challenge.starter);
    setGrade(null);
    setShowHint(false);
  }, [challenge.starter]);

  const onChange = useCallback((text: string) => {
    setCode(text);
    const parsed = parseCode(text);
    setErrors(parsed.errors);
    setCircuit(parsed.circuit);
    setGrade(null);
  }, []);

  useEffect(() => {
    const parsed = parseCode(code);
    setCircuit(parsed.circuit);
    setErrors(parsed.errors);
  }, [code]);

  const run = useCallback(() => {
    const parsed = parseCode(code).circuit;
    if (!parsed) {
      toast.error("Fix the parse errors first");
      return;
    }
    const res = simulate(parsed, { shots: 1024, trace: false });
    const list: Array<[string, number]> = [];
    for (let i = 0; i < res.probabilities.length; i++) {
      const p = res.probabilities[i]!;
      if (p > 1e-6) list.push([basisLabel(i, parsed.numQubits), p]);
    }
    list.sort((a, b) => b[1] - a[1]);
    setBars(list.slice(0, 8));
  }, [code]);

  const submit = useCallback(async () => {
    const result = gradeChallenge(challenge, code);
    setGrade(result);
    run();
    if (user) {
      try {
        await saveAttempt({
          userId: user.id,
          challengeId: challenge.id,
          passed: result.passed,
          code,
          feedback: result.message,
        });
      } catch {
        /* attempt logging is best-effort */
      }
    }
    if (result.passed) toast.success("Challenge solved");
  }, [challenge, code, run, user]);

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans text-[#111111]">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <Link
          to="/challenges"
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-bold text-[#707070] transition-colors hover:text-[#111111]"
        >
          <ArrowLeft className="h-4 w-4" /> All challenges
        </Link>

        <header className="mb-8 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-[#111111]">{challenge.title}</h1>
          <Badge variant="secondary" className="font-mono text-[0.7rem] bg-white border border-[#E5E7EB] text-[#707070]">
            {challenge.difficulty}
          </Badge>
          {challenge.lessonId && (
            <Link
              to="/learn/$lessonId"
              params={{ lessonId: challenge.lessonId }}
              className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-1.5 text-sm font-semibold text-[#111111] transition-colors hover:bg-gray-50 hover:border-[#F47F45]"
            >
              Review the lesson
            </Link>
          )}
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-6">
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-lg font-bold text-[#111111]">Brief</h2>
              <ul className="space-y-2 text-base font-medium text-[#707070]">
                {challenge.prompt.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              {challenge.maxGates !== undefined && (
                <p className="mt-4 font-mono text-sm font-semibold text-[#707070]">
                  Gate budget: <span className="text-[#111111]">{challenge.maxGates}</span>
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-[#111111]">Your circuit code</h2>
              <div className="overflow-hidden rounded-xl border border-[#E5E7EB]">
                <CodePanel code={code} errors={errors} onChange={onChange} />
              </div>
            </div>

            {circuit && (
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm overflow-x-auto custom-scrollbar">
                <CircuitCanvas
                  circuit={circuit}
                  selectedId={null}
                  onSelect={() => {}}
                  onPlace={() => {}}
                  onMove={() => {}}
                  onDelete={() => {}}
                  activeColumn={null}
                />
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm space-y-4">
              <button
                onClick={() => void submit()}
                className="w-full rounded-lg bg-[#F47F45] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#E3692E]"
              >
                Submit for grading
              </button>
              <button
                onClick={run}
                className="flex w-full items-center justify-center rounded-lg border border-[#E5E7EB] bg-white px-6 py-2.5 text-sm font-bold text-[#111111] transition-colors hover:bg-gray-50"
              >
                <Play className="mr-1.5 h-4 w-4" /> Run only
              </button>
              {!user && (
                <p className="text-xs font-medium text-[#707070] text-center">
                  <Link to="/auth" className="text-[#F47F45] hover:underline font-bold">
                    Sign in
                  </Link>{" "}
                  to record your solved challenges.
                </p>
              )}
            </div>

            {grade && (
              <div
                className={`rounded-2xl border p-5 shadow-sm ${
                  grade.passed ? "border-[#20B486] bg-[#20B486]/5" : "border-[#FF6680] bg-[#FF6680]/5"
                }`}
              >
                <p className={`flex items-start gap-2 text-sm font-bold ${grade.passed ? "text-[#20B486]" : "text-[#FF6680]"}`}>
                  {grade.passed ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  )}
                  {grade.message}
                </p>
                {grade.detail && (
                  <p className="mt-3 font-mono text-xs font-semibold text-[#707070] bg-white p-3 rounded-lg border border-[#E5E7EB]/50">
                    {grade.detail}
                  </p>
                )}
              </div>
            )}

            {bars.length > 0 && (
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm space-y-4">
                <h2 className="mb-2 text-sm font-bold text-[#111111]">Outcome probabilities</h2>
                {bars.map(([label, p]) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="w-16 font-mono text-xs font-bold text-[#111111]">
                      |{label}&gt;
                    </span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-[#F47F45]"
                        style={{ width: `${Math.round(p * 100)}%` }}
                      />
                    </div>
                    <span className="w-12 text-right font-mono text-xs font-bold text-[#707070]">
                      {(p * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
              <button
                onClick={() => setShowHint((s) => !s)}
                className="flex w-full items-center justify-start rounded-lg bg-gray-50 px-4 py-2 text-sm font-bold text-[#111111] transition-colors hover:bg-gray-100"
              >
                <Lightbulb className="mr-2 h-4 w-4 text-[#F47F45]" />
                {showHint ? "Hide hint" : "Show hint"}
              </button>
              {showHint && (
                <p className="mt-4 text-sm font-medium text-[#707070] leading-relaxed px-2">{challenge.hint}</p>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
