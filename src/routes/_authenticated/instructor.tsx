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
import { useSession } from "@/hooks/useSession";
import { LESSONS } from "@/lib/learn/content";
import { CHALLENGES } from "@/lib/learn/challenges";
import { getInstructorCohorts, getInstructorCohortDetails, createCohort as createCohortAction, addAssignment as addAssignmentAction, removeAssignment as removeAssignmentAction } from "@/lib/cohorts/actions";

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
    try {
      const data = await getInstructorCohorts();
      setCohorts(data ?? []);
      setActiveId((prev) => prev ?? data?.[0]?.id ?? null);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, []);

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
    try {
      const data = await getInstructorCohortDetails({ data: { cohortId: activeId } });
      setMembers(data.members);
      setAssignments(data.assignments);
      setStats(data.stats);
    } catch (err) {
      console.error(err);
      setMembers([]);
      setAssignments([]);
      setStats([]);
    }
  }, [activeId]);

  useEffect(() => {
    void loadCohort();
  }, [loadCohort]);

  async function createCohort() {
    if (!name.trim()) return;
    try {
      const data = await createCohortAction({ data: { name: name.trim() } });
      setName("");
      setCohorts((c) => [...c, data]);
      setActiveId(data.id);
      toast.success(`Class created — join code ${data.join_code}`);
    } catch (err) {
      toast.error("Couldn't create the class");
    }
  }

  async function addAssignment() {
    if (!activeId || !item) return;
    const [type, id] = item.split(":");
    if (!type || !id) return;
    const label =
      type === "lesson"
        ? LESSONS.find((l) => l.id === id)?.title
        : CHALLENGES.find((c) => c.id === id)?.title;
    try {
      await addAssignmentAction({ data: { cohortId: activeId, itemType: type, itemId: id, title: label ?? "Assignment" }});
      await loadCohort();
    } catch (err) {
      toast.error("Couldn't add the assignment");
    }
  }

  async function removeAssignment(id: string) {
    try {
      await removeAssignmentAction({ data: { id } });
      await loadCohort();
    } catch (err) {
      toast.error("Failed to remove assignment");
    }
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
