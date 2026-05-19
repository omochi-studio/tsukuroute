import type { WorkdayMode } from "@/types/gantt";

type TaskModalMode = "add" | "edit";

type Props = {
  mode: TaskModalMode;
  projectName: string;
  taskName: string;
  category: string;
  startDate: string;
  duration: number;
  progress: number;
  workdayMode: WorkdayMode;
  projectStartDate: string;
  projectEndDate: string;
  maxDuration: number;
  customWorkdays: number[];
  assignee: string;
  onChangeAssignee: (value: string) => void;
  onChangeTaskName: (value: string) => void;
  onChangeCategory: (value: string) => void;
  onChangeStartDate: (value: string) => void;
  onChangeDuration: (value: number) => void;
  onChangeProgress: (value: number) => void;
  onChangeWorkdayMode: (value: WorkdayMode) => void;
  onClose: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
  onToggleCustomWorkday: (day: number) => void;
};

export default function TaskModal({
  mode,
  projectName,
  taskName,
  category,
  startDate,
  duration,
  progress,
  workdayMode,
  projectStartDate,
  projectEndDate,
  maxDuration,
  customWorkdays,
  assignee,
  onChangeAssignee,
  onToggleCustomWorkday,
  onChangeTaskName,
  onChangeCategory,
  onChangeStartDate,
  onChangeDuration,
  onChangeProgress,
  onChangeWorkdayMode,
  onClose,
  onSubmit,
  onDelete,

}: Props) {
  const isEdit = mode === "edit";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">
              {isEdit ? "タスク編集" : "タスク追加"}
            </h2>
            <p className="text-sm text-slate-500">
              {isEdit
                ? "タスク内容を変更できます"
                : `${projectName} に新しいタスクを追加します`}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-slate-500 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-bold text-slate-600">
              タスク名
            </label>
            <input
              type="text"
              value={taskName}
              onChange={(e) => onChangeTaskName(e.target.value)}
              placeholder="例：ボス実装"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-slate-600">
              カテゴリ
            </label>
            <select
              value={category}
              onChange={(e) => onChangeCategory(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="未分類">未分類</option>
              <option value="企画">企画</option>
              <option value="プログラム">プログラム</option>
              <option value="モデル">モデル</option>
              <option value="UI">UI</option>
              <option value="サウンド">サウンド</option>
              <option value="デバッグ">デバッグ</option>
              <option value="custom">カスタム</option>
            </select>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-600">
                担当者
              </label>
              <input
                type="text"
                value={assignee}
                onChange={(e) => onChangeAssignee(e.target.value)}
                placeholder="例：田中　太郎"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-bold text-slate-600">
                開始日
              </label>
              <input
                type="date"
                value={startDate}
                min={projectStartDate}
                max={projectEndDate}
                onChange={(e) => onChangeStartDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-600">
                実働日数
              </label>
              <input
                type="number"
                min={1}
                max={maxDuration}
                value={duration}
                onChange={(e) => onChangeDuration(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-slate-600">
              実働日設定
            </label>
            <select
              value={workdayMode}
              onChange={(e) => onChangeWorkdayMode(e.target.value as WorkdayMode)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="all">すべての日</option>
              <option value="weekdays">平日のみ</option>
              <option value="weekends">土日だけ</option>
              <option value="custom">カスタム</option>
            </select>
          </div>

          {workdayMode === "custom" && (
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-600">
                作業曜日
              </label>

              <div className="flex flex-wrap gap-2">
                {[
                  { label: "日", value: 0 },
                  { label: "月", value: 1 },
                  { label: "火", value: 2 },
                  { label: "水", value: 3 },
                  { label: "木", value: 4 },
                  { label: "金", value: 5 },
                  { label: "土", value: 6 },
                ].map((day) => {
                  const active = customWorkdays.includes(day.value);

                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => onToggleCustomWorkday(day.value)}
                      className={`rounded-lg border px-3 py-2 text-sm font-bold transition ${active
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-300 bg-white text-slate-600 hover:bg-slate-100"
                        }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-bold text-slate-600">
              進捗率 ({progress}%)
            </label>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={progress}
              onChange={(e) => onChangeProgress(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-2">
          {isEdit && onDelete ? (
            <button
              onClick={onDelete}
              className="rounded-xl border border-red-300 px-4 py-2 text-red-600 hover:bg-red-50"
            >
              削除
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-100"
            >
              キャンセル
            </button>

            <button
              onClick={onSubmit}
              className="rounded-xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
            >
              {isEdit ? "保存" : "追加"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}