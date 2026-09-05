import { ArrowRight, BookOpen, Layers, Zap, Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";

export interface CourseData {
  id: string;
  title: string;
  completed: number;
  total: number;
  progress: number;
  status: string;
}

export function CourseProgress({ courses }: { courses: CourseData[] }) {
  const getIcon = (id: string, index: number) => {
    switch (index % 4) {
      case 0:
        return { icon: <BookOpen className="h-5 w-5 text-[#20B486]" />, bg: "bg-[#20B486]/10" };
      case 1:
        return { icon: <Layers className="h-5 w-5 text-[#F47F45]" />, bg: "bg-[#F47F45]/10" };
      case 2:
        return { icon: <Zap className="h-5 w-5 text-[#FF6680]" />, bg: "bg-[#FF6680]/10" };
      default:
        return { icon: <Lock className="h-5 w-5 text-[#707070]" />, bg: "bg-gray-100" };
    }
  };

  const getStatusColor = (status: string) => {
    if (status === "Completed") return "bg-[#20B486]/10 text-[#20B486]";
    if (status === "In Progress") return "bg-[#F89864]/10 text-[#F47F45]";
    return "bg-gray-100 text-[#707070]"; // Not Started or Locked
  };

  return (
    <div className="flex flex-col rounded-2xl border border-[#E7E7E7] bg-white p-6 shadow-sm h-full">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#111111]">Course Progress</h2>
        <Link to="/learn" className="flex items-center gap-1 text-sm font-semibold text-[#707070] hover:text-[#111111] transition-colors">
          View All <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="flex flex-col gap-6">
        {courses.map((course, index) => {
          const { icon, bg } = getIcon(course.id, index);
          return (
            <div key={course.id} className="flex items-center gap-4">
              {/* Thumbnail */}
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                {icon}
              </div>

              {/* Info */}
              <div className="flex flex-1 flex-col justify-center">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-bold text-[#111111]">{course.title}</h3>
                  <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusColor(course.status)}`}>
                    {course.status}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium text-[#707070] w-20 shrink-0">
                    {course.completed} / {course.total} lessons
                  </span>
                  
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#F5F5F5]">
                    <div
                      className={`h-full rounded-full ${course.progress > 0 ? "bg-[#F89864]" : "bg-transparent"}`}
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                  
                  <span className="text-xs font-semibold text-[#111111] w-8 text-right">
                    {course.progress}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {courses.length === 0 && (
          <p className="text-sm text-[#707070]">No courses available.</p>
        )}
      </div>
    </div>
  );
}
