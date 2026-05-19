import type { DayInfo, Task } from "@/types/gantt";
import {
  formatDateText,
  getDelayDays,
  getTaskScheduleSegments,
  isWorkingDay,
} from "@/utils/date";

type Props = {
  projectName: string;
  tasks: Task[];
  days: DayInfo[];
  dayWidth: number;
  rowHeight: number;
  onEditTask: (task: Task) => void;
};

export default function GanttChart({
  projectName,
  tasks,
  days,
  dayWidth,
  rowHeight,
  onEditTask,
}: Props) {
  const todayText = formatDateText(new Date());
  const todayIndex = days.findIndex((day) => day.dateText === todayText);

  const barHeight = Math.max(rowHeight - 10, 28);

  return (
    <section className="max-h-[calc(100vh-220px)] overflow-auto rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-bold">
        ガントチャート：{projectName}
      </h2>

      <div
        className="relative"
        style={{
          minWidth: `${days.length * dayWidth}px`,
        }}
      >
        {todayIndex !== -1 && (
          <div
            className="pointer-events-none absolute bottom-0 top-0 z-10 bg-red-50/30"
            style={{
              left: `${todayIndex * dayWidth}px`,
              width: `${dayWidth}px`,
            }}
          />
        )}

        <div
          className="relative z-20 grid border-b border-slate-200 text-center text-sm text-slate-500"
          style={{
            gridTemplateColumns: `repeat(${days.length}, ${dayWidth}px)`,
          }}
        >
          {days.map((day) => {
            const isToday = day.dateText === todayText;

            return (
              <div
                key={day.dateText}
                className={`border-r border-slate-200 py-2 ${
                  isToday
                    ? "bg-red-50/40"
                    : day.isSaturday
                    ? "bg-blue-50"
                    : day.isSunday
                    ? "bg-red-50"
                    : "bg-white"
                }`}
              >
                <div className="font-bold">{day.label}</div>
                <div className="text-xs">{day.dayName}</div>

                {isToday && (
                  <div className="text-xs font-bold text-red-500">今日</div>
                )}
              </div>
            );
          })}
        </div>

        <div className="relative z-20 space-y-2 pt-3">
          {tasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              このプロジェクトにはまだガントバーがありません。
            </div>
          ) : (
            tasks.map((task) => {
              const segments = getTaskScheduleSegments(days, task);
              const delayDays = getDelayDays(days, task);

              const lastSegment = segments[segments.length - 1];

              return (
                <div
                  key={task.id}
                  className="relative grid items-center border-b border-slate-100"
                  style={{
                    height: `${rowHeight}px`,
                    gridTemplateColumns: `repeat(${days.length}, ${dayWidth}px)`,
                  }}
                >
                  {days.map((day) => {
                    const working = isWorkingDay(
                      day,
                      task.workdayMode,
                      task.customWorkdays,
                      task.customHolidays
                    );

                    return (
                      <div
                        key={day.dateText}
                        className={`h-full border-r border-slate-200 ${
                          !working
                            ? "bg-slate-100"
                            : day.isSaturday
                            ? "bg-blue-50"
                            : day.isSunday
                            ? "bg-red-50"
                            : "bg-white"
                        }`}
                      />
                    );
                  })}

                  {segments.map((segment, index) => (
                    <button
                      key={`${task.id}-${segment.startIndex}`}
                      onClick={() => onEditTask(task)}
                      className={`absolute z-20 flex items-center overflow-hidden rounded-md ${task.color} text-left text-sm font-bold text-white shadow-sm hover:brightness-95`}
                      style={{
                        left: `${segment.startIndex * dayWidth}px`,
                        width: `${segment.length * dayWidth}px`,
                        height: `${barHeight}px`,
                      }}
                    >
                      <div
                        className="absolute inset-y-0 left-0 bg-white/25"
                        style={{
                          width: `${task.progress}%`,
                        }}
                      />

                      <div className="relative z-10 flex w-full items-center justify-between gap-2 px-3">
                        <div className="min-w-0">
                          {index === 0 && (
                            <>
                              <div className="truncate">{task.name}</div>

                              {rowHeight >= 56 && (
                                <div className="truncate text-[10px] font-normal text-white/80">
                                  {task.assignee || "未設定"}
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {index === 0 && (
                          <span className="shrink-0 text-xs">
                            {task.progress}%
                          </span>
                        )}
                      </div>
                    </button>
                  ))}

                  {segments.length > 1 &&
                    segments.slice(0, -1).map((segment, index) => {
                      const next = segments[index + 1];

                      return (
                        <div
                          key={`gap-${task.id}-${index}`}
                          className="pointer-events-none absolute z-10 border-t-2 border-dashed border-slate-400"
                          style={{
                            left: `${(segment.endIndex + 1) * dayWidth}px`,
                            width: `${
                              (next.startIndex - segment.endIndex - 1) *
                              dayWidth
                            }px`,
                          }}
                        />
                      );
                    })}

                  {delayDays > 0 && lastSegment && (
                    <div
                      className="absolute z-10 flex items-center rounded-r-md border-2 border-red-400 bg-red-300/70"
                      style={{
                        left: `${(lastSegment.endIndex + 1) * dayWidth}px`,
                        width: `${delayDays * dayWidth}px`,
                        height: `${barHeight}px`,
                      }}
                    >
                      <div className="px-2 text-xs font-bold text-red-800">
                        +{delayDays}日
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {todayIndex !== -1 && (
          <div
            className="pointer-events-none absolute bottom-0 top-0 z-40 border-l-2 border-r-2 border-red-400"
            style={{
              left: `${todayIndex * dayWidth}px`,
              width: `${dayWidth}px`,
            }}
          />
        )}
      </div>
    </section>
  );
}