import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Lightbulb, Play, XCircle } from "lucide-react";
import { AppHeader } from "@/components/quantum/AppHeader";
import { CircuitCanvas } from "@/components/quantum/CircuitCanvas";
import { CodePanel } from "@/components/quantum/CodePanel";
import { Button } from "@/components/ui/button";
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
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-lg font-semibold">Challenge unavailable</h1>
        <Button asChild className="mt-4">
          <Link to="/challenges">Back to challenges</Link>
        </Button>
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
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <Link
          to="/challenges"
          className="mb-4 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" /> All challenges
        </Link>

        <header className="mb-6 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">{challenge.title}</h1>
          <Badge variant="secondary" className="font-mono text-[0.65rem]">
            {challenge.difficulty}
          </Badge>
          {challenge.lessonId && (
            <Button asChild size="sm" variant="ghost">
              <Link to="/learn/$lessonId" params={{ lessonId: challenge.lessonId }}>
                Review the lesson
              </Link>
            </Button>
          )}
        </header>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="space-y-4">
            <div className="panel p-5">
              <h2 className="mb-2 text-sm font-semibold">Brief</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {challenge.prompt.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              {challenge.maxGates !== undefined && (
                <p className="mt-3 font-mono text-[0.65rem] text-muted-foreground">
                  gate budget: {challenge.maxGates}
                </p>
              )}
            </div>

            <div className="panel p-4">
              <h2 className="mb-3 text-sm font-semibold">Your circuit</h2>
              <CodePanel code={code} errors={errors} onChange={onChange} />
            </div>

            {circuit && (
              <div className="panel p-4">
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

          <aside className="space-y-4">
            <div className="panel space-y-3 p-4">
              <Button className="w-full" onClick={() => void submit()}>
                Submit for grading
              </Button>
              <Button className="w-full" variant="outline" onClick={run}>
                <Play className="mr-1.5 h-4 w-4" /> Run only
              </Button>
              {!user && (
                <p className="text-xs text-muted-foreground">
                  <Link to="/auth" className="text-primary underline">
                    Sign in
                  </Link>{" "}
                  to record your solved challenges.
                </p>
              )}
            </div>

            {grade && (
              <div
                className={`panel p-4 ${grade.passed ? "border-primary/60" : "border-destructive/60"}`}
              >
                <p className="flex items-start gap-2 text-sm">
                  {grade.passed ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  )}
                  {grade.message}
                </p>
                {grade.detail && (
                  <p className="mt-2 font-mono text-[0.65rem] text-muted-foreground">
                    {grade.detail}
                  </p>
                )}
              </div>
            )}

            {bars.length > 0 && (
              <div className="panel space-y-1.5 p-4">
                <h2 className="mb-2 text-sm font-semibold">Outcome probabilities</h2>
                {bars.map(([label, p]) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="w-16 font-mono text-[0.65rem] text-muted-foreground">
                      |{label}&gt;
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-raised">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.round(p * 100)}%` }}
                      />
                    </div>
                    <span className="w-12 text-right font-mono text-[0.65rem] text-muted-foreground">
                      {(p * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="panel p-4">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowHint((s) => !s)}
                className="w-full justify-start"
              >
                <Lightbulb className="mr-1.5 h-4 w-4" />
                {showHint ? "Hide hint" : "Show hint"}
              </Button>
              {showHint && (
                <p className="mt-2 text-xs text-muted-foreground">{challenge.hint}</p>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
