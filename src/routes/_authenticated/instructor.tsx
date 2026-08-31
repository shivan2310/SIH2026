import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Users } from "lucide-react";
import { AppHeader } from "@/components/quantum/AppHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { LESSONS } from "@/lib/learn/content";
import { CHALLENGES } from "@/lib/learn/challenges";

export const Route = createFileRoute("/_authenticated/instructor")({
  head: () => ({
    meta: [
      { title: "Instructor dashboard — Cohorts & analytics | QuantumLab" },
      {
        name: "description",
        content:
          "Create classes, invite students with a join code, assign lessons and challenges, and review completion and scores per student.",
      },
      { property: "og:title", content: "Instructor dashboard | QuantumLab" },
      {
        property: "og:description",
        content: "Cohorts, assignments and per-student analytics for QuantumLab classes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InstructorPage,
});

interface Cohort {
  id: string;
  name: string;
  description: string | null;
  join_code: string;
}
interface Member {
  user_id: string;
  display_name: string | null;
}
interface Assignment {
  id: string;
  title: string;
  item_type: string;
  item_id: string;
}
interface StudentStats {
  userId: string;
  name: string;
  lessonsDone: number;
  quizAvg: number;
  challengesSolved: number;
  attempts: number;
}

const ITEMS = [
  ...LESSONS.map((l) => ({ value: `lesson:${l.id}`, label: `Lesson — ${l.title}` })),
  ...CHALLENGES.map((c) => ({ value: `challenge:${c.id}`, label: `Challenge — ${c.title}` })),
];

function InstructorPage() {
  const { user } = useSession();
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [stats, setStats] = useState<StudentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [item, setItem] = useState(ITEMS[0]?.value ?? "");

  const loadCohorts = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("cohorts")
      .select("id, name, description, join_code")
      .eq("instructor_id", user.id)
      .order("created_at", { ascending: true });
    setCohorts(data ?? []);
    setActiveId((prev) => prev ?? data?.[0]?.id ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void loadCohorts();
  }, [loadCohorts]);

  const loadCohort = useCallback(async () => {
    if (!activeId) {
      setMembers([]);
      setAssignments([]);
      setStats([]);
      return;
    }
    const [{ data: mem }, { data: asg }] = await Promise.all([
      supabase.from("cohort_members").select("user_id").eq("cohort_id", activeId),
      supabase
        .from("assignments")
        .select("id, title, item_type, item_id")
        .eq("cohort_id", activeId),
    ]);
    const ids = (mem ?? []).map((m) => m.user_id);
    setAssignments(asg ?? []);

    if (ids.length === 0) {
      setMembers([]);
      setStats([]);
      return;
    }
    const [{ data: profiles }, { data: lessonRows }, { data: attemptRows }] =
      await Promise.all([
        supabase.from("profiles").select("id, display_name").in("id", ids),
        supabase
          .from("lesson_progress")
          .select("user_id, completed, quiz_score, quiz_total")
          .in("user_id", ids),
        supabase
          .from("challenge_attempts")
          .select("user_id, challenge_id, passed")
          .in("user_id", ids),
      ]);

    const nameOf = new Map(
      (profiles ?? []).map((p) => [p.id, p.display_name] as const),
    );
    setMembers(ids.map((id) => ({ user_id: id, display_name: nameOf.get(id) ?? null })));

    setStats(
      ids.map((id) => {
        const ls = (lessonRows ?? []).filter((r) => r.user_id === id);
        const at = (attemptRows ?? []).filter((r) => r.user_id === id);
        const scored = ls.filter((r) => r.quiz_total > 0);
        const quizAvg =
          scored.length === 0
            ? 0
            : Math.round(
                (scored.reduce((s, r) => s + r.quiz_score / r.quiz_total, 0) /
                  scored.length) *
                  100,
              );
        return {
          userId: id,
          name: nameOf.get(id) ?? id.slice(0, 8),
          lessonsDone: ls.filter((r) => r.completed).length,
          quizAvg,
          challengesSolved: new Set(
            at.filter((r) => r.passed).map((r) => r.challenge_id),
          ).size,
          attempts: at.length,
        };
      }),
    );
  }, [activeId]);

  useEffect(() => {
    void loadCohort();
  }, [loadCohort]);

  async function createCohort() {
    if (!user || name.trim().length === 0) return;
    const { data, error } = await supabase
      .from("cohorts")
      .insert({ instructor_id: user.id, name: name.trim() })
      .select("id, name, description, join_code")
      .single();
    if (error || !data) {
      toast.error("Couldn't create the class");
      return;
    }
    setName("");
    setCohorts((c) => [...c, data]);
    setActiveId(data.id);
    toast.success(`Class created — join code ${data.join_code}`);
  }

  async function addAssignment() {
    if (!activeId || !item) return;
    const [type, id] = item.split(":");
    const label =
      type === "lesson"
        ? LESSONS.find((l) => l.id === id)?.title
        : CHALLENGES.find((c) => c.id === id)?.title;
    const { error } = await supabase.from("assignments").insert({
      cohort_id: activeId,
      item_type: type as string,
      item_id: id as string,
      title: label ?? "Assignment",
    });
    if (error) {
      toast.error("Couldn't add the assignment");
      return;
    }
    await loadCohort();
  }

  async function removeAssignment(id: string) {
    await supabase.from("assignments").delete().eq("id", id);
    await loadCohort();
  }

  const active = cohorts.find((c) => c.id === activeId) ?? null;

  return (
    <div className="min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="flex items-center gap-2 text-2xl font-semibold">
          <Users className="h-5 w-5 text-primary" /> Instructor dashboard
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Create a class, share its join code, assign work and follow progress.
        </p>

        <div className="panel mt-6 p-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-48">
              <Label htmlFor="cohort" className="mb-1.5 block text-xs text-muted-foreground">
                New class name
              </Label>
              <Input
                id="cohort"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Intro to Quantum, Fall 2026"
              />
            </div>
            <Button onClick={() => void createCohort()}>
              <Plus className="mr-1.5 h-4 w-4" /> Create class
            </Button>
          </div>
        </div>

        {loading ? (
          <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading classes…
          </p>
        ) : cohorts.length === 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            No classes yet — create one above.
          </p>
        ) : (
          <>
            <div className="mt-6 flex flex-wrap gap-2">
              {cohorts.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveId(c.id)}
                  className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                    c.id === activeId
                      ? "border-primary text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {active && (
              <div className="mt-6 space-y-4">
                <div className="panel flex flex-wrap items-center gap-3 p-4">
                  <span className="text-sm">Join code</span>
                  <Badge className="font-mono tracking-widest">{active.join_code}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {members.length} student{members.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="panel p-4">
                  <h2 className="mb-3 text-sm font-semibold">Assignments</h2>
                  <div className="flex flex-wrap items-end gap-2">
                    <div className="min-w-64 flex-1">
                      <Select value={item} onValueChange={setItem}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ITEMS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button variant="outline" onClick={() => void addAssignment()}>
                      Assign
                    </Button>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {assignments.map((a) => (
                      <li
                        key={a.id}
                        className="flex items-center gap-2 rounded-md border border-border bg-surface-raised p-2.5"
                      >
                        <span className="text-sm">{a.title}</span>
                        <Badge variant="secondary" className="font-mono text-[0.6rem]">
                          {a.item_type}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="ml-auto"
                          onClick={() => void removeAssignment(a.id)}
                          aria-label="Remove assignment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                    {assignments.length === 0 && (
                      <li className="text-xs text-muted-foreground">Nothing assigned yet.</li>
                    )}
                  </ul>
                </div>

                <div className="panel p-4">
                  <h2 className="mb-3 text-sm font-semibold">Student analytics</h2>
                  {stats.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Share the join code to add students.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="text-xs text-muted-foreground">
                            <th className="py-2 pr-4 font-normal">Student</th>
                            <th className="py-2 pr-4 font-normal">Lessons</th>
                            <th className="py-2 pr-4 font-normal">Quiz avg</th>
                            <th className="py-2 pr-4 font-normal">Solved</th>
                            <th className="py-2 font-normal">Attempts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.map((s) => (
                            <tr key={s.userId} className="border-t border-border">
                              <td className="py-2 pr-4">{s.name}</td>
                              <td className="py-2 pr-4 font-mono text-xs">{s.lessonsDone}</td>
                              <td className="py-2 pr-4 font-mono text-xs">{s.quizAvg}%</td>
                              <td className="py-2 pr-4 font-mono text-xs">
                                {s.challengesSolved}
                              </td>
                              <td className="py-2 font-mono text-xs">{s.attempts}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
