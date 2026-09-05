import { Play, ArrowRight, BookOpen } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface ContinueLessonProps {
  lessonId: string | null;
  lessonTitle: string;
  courseTitle: string;
  progressPercent: number;
}

export function ContinueLesson({
  lessonId,
  lessonTitle,
  courseTitle,
  progressPercent,
}: ContinueLessonProps) {
  if (!lessonId) {
    return (
      <div className="flex h-full flex-col rounded-2xl border border-[#E7E7E7] bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-[#111111]">Continue Where You Left Off</h2>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
            <BookOpen className="h-6 w-6 text-[#707070]" />
          </div>
          <p className="text-sm font-medium text-[#111111]">You're all caught up!</p>
          <p className="mt-1 text-xs text-[#707070]">Every lesson is complete.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-[#E7E7E7] bg-white p-6 shadow-sm h-full">
      <div>
        <h2 className="mb-5 text-lg font-bold text-[#111111]">Continue Where You Left Off</h2>
        
        <div className="flex gap-4">
          {/* Thumbnail placeholder */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#F5F5F5] to-[#E7E7E7]">
            <BookOpen className="h-8 w-8 text-[#707070]" />
          </div>
          
          <div className="flex-1 overflow-hidden">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#F89864]">
              {courseTitle}
            </p>
            <h3 className="truncate text-base font-bold text-[#111111]" title={lessonTitle}>
              {lessonTitle}
            </h3>
            
            <div className="mt-3 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#F5F5F5]">
                <div 
                  className="h-full rounded-full bg-[#F89864]" 
                  style={{ width: `${progressPercent}%` }} 
                />
              </div>
              <span className="text-xs font-semibold text-[#707070]">{progressPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Link 
          to="/learn/$lessonId" 
          params={{ lessonId }}
          className="flex items-center gap-2 rounded-xl bg-[#F47F45] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#d66a33]"
        >
          <Play className="h-4 w-4 fill-current" />
          Resume Lesson
        </Link>
        <Link 
          to="/learn" 
          className="flex items-center gap-1 text-sm font-semibold text-[#707070] transition-colors hover:text-[#111111]"
        >
          Go to Course <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
