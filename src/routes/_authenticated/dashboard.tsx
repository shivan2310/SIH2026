import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useSession } from "@/hooks/useSession";
import { useProgress } from "@/hooks/useProgress";
import { getAssignments } from "@/lib/cohorts/actions";
import { LESSONS, TRACKS, lessonsOfTrack, type Track } from "@/lib/learn/content";
// New Dashboard Components
import { DashboardNavbar } from "@/components/dashboard/DashboardNavbar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { OverallProgress } from "@/components/dashboard/OverallProgress";
import { ContinueLesson } from "@/components/dashboard/ContinueLesson";
import { CalendarStudyTime } from "@/components/dashboard/CalendarStudyTime";
import { UpcomingSchedule, ScheduleItem } from "@/components/dashboard/UpcomingSchedule";
import { CourseProgress, CourseData } from "@/components/dashboard/CourseProgress";
import { Mastery, MasteryItem } from "@/components/dashboard/Mastery";
import { NextMilestone } from "@/components/dashboard/NextMilestone";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Learner dashboard | QuantumLab" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useSession();
  const progress = useProgress(user?.id);
  const [assignments, setAssignments] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      try {
        const data = await getAssignments();
        setAssignments(data ?? []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [user]);

  const done = new Set(
    progress.lessons.filter((l) => l.completed).map((l) => l.lesson_id),
  );
  const nextLesson = LESSONS.find((l) => !done.has(l.id));
  const nextLessonTrack = nextLesson ? TRACKS.find(t => t.id === nextLesson.trackId) : null;
  const courseTitle = nextLessonTrack?.title ?? "Quantum Fundamentals";
  
  // Lesson progress - mock 0 since we don't have partial lesson progress in DB
  const lessonProgressPercent = 0; 

  // Course Progress & Mastery Data
  const courseData: CourseData[] = [];
  const masteryData: MasteryItem[] = [];
  
  let activeTrack: Track | null = null;
  let nextTrack: Track | null = null;

  TRACKS.forEach((t, idx) => {
    const items = lessonsOfTrack(t.id);
    const complete = items.filter((l) => done.has(l.id)).length;
    const pct = items.length > 0 ? Math.round((complete / items.length) * 100) : 0;
    
    let status = "Not Started";
    if (pct === 100) status = "Completed";
    else if (pct > 0) status = "In Progress";
    
    if (idx > 0 && (courseData[idx - 1]?.progress ?? 0) < 100 && pct === 0) {
      status = "Locked";
    }

    courseData.push({
      id: t.id,
      title: t.title,
      completed: complete,
      total: items.length,
      progress: pct,
      status
    });

    masteryData.push({
      topic: t.title,
      progress: pct
    });

    if (status === "In Progress" || (status === "Not Started" && !activeTrack)) {
      if (!activeTrack) activeTrack = t;
    }
  });

  if (activeTrack) {
    const activeIndex = TRACKS.findIndex(t => t.id === activeTrack?.id);
    if (activeIndex >= 0 && activeIndex < TRACKS.length - 1) {
      nextTrack = TRACKS[activeIndex + 1] ?? null;
    }
  }

  // Active Dates for Calendar
  const activeDates = new Set<string>();
  progress.lessons.forEach(l => {
    if (l.updated_at) activeDates.add(new Date(l.updated_at).toISOString().slice(0, 10));
  });
  progress.attempts.forEach(a => {
    if (a.created_at) activeDates.add(new Date(a.created_at).toISOString().slice(0, 10));
  });

  // Upcoming Schedule from assignments
  const scheduleData: ScheduleItem[] = assignments.map(a => {
    let dateStr = "";
    let timeStr = "";
    if (a.due_at) {
      const d = new Date(a.due_at);
      dateStr = `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
      timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return {
      id: a.id,
      date: dateStr,
      time: timeStr,
      title: a.title,
      itemType: a.item_type,
      itemId: a.item_id
    };
  });

  let milestoneTrack = activeTrack || TRACKS[0] || null;
  let milestoneCourse = courseData.find(c => c.id === milestoneTrack?.id);
  let lessonsAway = milestoneCourse ? milestoneCourse.total - milestoneCourse.completed : 0;
  let milestoneMessage = nextTrack 
    ? `You're ${lessonsAway} lessons away from unlocking ${nextTrack.title}!` 
    : `You're ${lessonsAway} lessons away from completing the curriculum!`;
    
  if (lessonsAway === 0) {
    milestoneMessage = "You've completed everything! Great job!";
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#111111] font-sans">
      <DashboardNavbar />
      
      <main className="mx-auto max-w-[1500px] px-4 py-8 md:px-8 md:py-12">
        <DashboardHeader />

        {progress.loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#F47F45]" />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            
            {/* TOP DASHBOARD ROW */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <OverallProgress 
                  completedLessons={progress.completedLessons}
                  totalLessons={progress.totalLessons}
                  solvedChallenges={progress.solvedChallenges.size}
                  totalChallenges={progress.totalChallenges}
                  conceptsMastered={done.size}
                  streak={progress.streak || 0}
                />
              </div>
              <div className="lg:col-span-1">
                <ContinueLesson 
                  lessonId={nextLesson?.id ?? null}
                  lessonTitle={nextLesson?.title ?? ""}
                  courseTitle={courseTitle}
                  progressPercent={lessonProgressPercent}
                />
              </div>
              <div className="lg:col-span-1">
                <CalendarStudyTime activeDates={activeDates} />
              </div>
            </div>

            {/* SECOND ROW */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <UpcomingSchedule schedule={scheduleData} />
              </div>
              <div className="lg:col-span-2">
                <CourseProgress courses={courseData} />
              </div>
            </div>

            {/* THIRD ROW */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Mastery masteryData={masteryData} />
              </div>
              <div className="lg:col-span-1">
                <NextMilestone 
                  trackTitle={milestoneTrack?.title || "Quantum"}
                  completedLessons={milestoneCourse?.completed || 0}
                  totalLessons={milestoneCourse?.total || 0}
                  message={milestoneMessage}
                />
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
