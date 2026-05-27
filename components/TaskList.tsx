import type { DayInfo, Task } from "@/types/gantt";
import { getDelayDays, getTaskEndDate } from "@/utils/date";

function getWorkdayModeLabel(mode: Task["workdayMode"]) {
  if (mode === "all") return "すべての日";
  if (mode === "weekdays") return "平日のみ";
  if (mode === "weekends") return "土日だけ";
  return "カスタム";
}

type Props = {
  tasks: Task[];
  days: DayInfo[];
  onEditTask: (task: Task) => void;
};

export default function TaskList({ tasks, days, onEditTask }: Props) {
  return (
    <aside className="max-h-[calc(100vh-220px)] overflow-y-auto rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-bold">タスク一覧</h2>

      {tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
          まだタスクがありません。
          <br />
          右上の「＋タスク追加」から追加できます。
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const startDay = days.find((day) => day.dateText === task.startDate);
            const endDay = getTaskEndDate(days, task);
            const delayDays = getDelayDays(days, task);

            return (
              <button
                key={task.id}
                onClick={() => onEditTask(task)}
                className={`w-full rounded-xl border p-3 text-left hover:bg-slate-50 ${delayDays > 0
                    ? "border-red-300 bg-red-50/40"
                    : "border-slate-200"
                  }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-bold">{task.name}</div>

                  {delayDays > 0 && (
                    <div className="rounded-full bg-red-100 px-2 py-1 text-xs font-bold text-red-600">
                      ⚠ {delayDays}日遅延
                    </div>
                  )}
                </div>

                <div className="mt-1 text-sm text-slate-500">
                  {task.category} / {startDay?.label ?? "-"}〜
                  {endDay?.label ?? "-"} / 実働{task.duration}日
                </div>

                <div className="mt-2 text-xs text-slate-500">
                  実働日設定：{getWorkdayModeLabel(task.workdayMode)}
                </div>

                <div className="mt-1 text-xs text-slate-500">
                  担当：{task.assignees.join(" / ") || "未設定"}
                </div>

                <div className="mt-2">
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                    <span>進捗</span>
                    <span className="font-bold">{task.progress}%</span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full ${delayDays > 0 ? "bg-red-500" : "bg-slate-700"
                        }`}
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-2 flex flex-col gap-1 text-xs text-slate-400">
                  <div>
                    最終更新：{task.updatedBy || "未設定"}
                    {task.updatedAt ? ` / ${task.updatedAt}` : ""}
                  </div>

                  <div>クリックで編集</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
}