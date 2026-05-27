"use client";

import type { WorkdayMode } from "@/types/gantt";

type Props = {
  mode: "add" | "edit";
  projectName: string;

  taskName: string;
  category: string;

  assignee1: string;
  assignee2: string;
  assignee3: string;

  startDate: string;
  duration: number;
  progress: number;

  workdayMode: WorkdayMode;
  customWorkdays: number[];

  projectStartDate: string;
  projectEndDate: string;
  maxDuration: number;

  onChangeTaskName: (value: string) => void;
  onChangeCategory: (value: string) => void;

  onChangeAssignee1: (value: string) => void;
  onChangeAssignee2: (value: string) => void;
  onChangeAssignee3: (value: string) => void;

  onChangeStartDate: (value: string) => void;
  onChangeDuration: (value: number) => void;
  onChangeProgress: (value: number) => void;

  onChangeWorkdayMode: (value: WorkdayMode) => void;
  onToggleCustomWorkday: (day: number) => void;

  onClose: () => void;
  onSubmit: () => void;
  onDelete?: () => void;
};

const WEEKDAYS = [
  { label: "月", value: 1 },
  { label: "火", value: 2 },
  { label: "水", value: 3 },
  { label: "木", value: 4 },
  { label: "金", value: 5 },
  { label: "土", value: 6 },
  { label: "日", value: 0 },
];

export default function TaskModal({
  mode,
  projectName,

  taskName,
  category,

  assignee1,
  assignee2,
  assignee3,

  startDate,
  duration,
  progress,

  workdayMode,
  customWorkdays,

  projectStartDate,
  projectEndDate,
  maxDuration,

  onChangeTaskName,
  onChangeCategory,

  onChangeAssignee1,
  onChangeAssignee2,
  onChangeAssignee3,

  onChangeStartDate,
  onChangeDuration,
  onChangeProgress,

  onChangeWorkdayMode,
  onToggleCustomWorkday,

  onClose,
  onSubmit,
  onDelete,
}: Props) {
  const title = mode === "add" ? "タスク追加" : "タスク編集";
  const submitText = mode === "add" ? "追加" : "保存";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{title}</h2>
            <p className="text-sm text-slate-500">{projectName}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-slate-500 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="grid gap-4">
          <div>
            <label className="mb-1 block text-sm font-bold text-slate-600">
              タスク名
            </label>
            <input
              type="text"
              value={taskName}
              onChange={(e) => onChangeTaskName(e.target.value)}
              placeholder="例：キャラクターモデル作成"
              className="w-full rounded-xl border border-slate-300 px-4 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-slate-600">
              カテゴリ
            </label>
            <select
              value={category}
              onChange={(e) => onChangeCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2"
            >
              <option value="未分類">未分類</option>
              <option value="プログラム">プログラム</option>
              <option value="UI">UI</option>
              <option value="モデル">モデル</option>
              <option value="サウンド">サウンド</option>
              <option value="企画">企画</option>
              <option value="その他">その他</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-slate-600">
              担当者 最大3人
            </label>

            <div className="grid gap-2 sm:grid-cols-3">
              <input
                type="text"
                value={assignee1}
                onChange={(e) => onChangeAssignee1(e.target.value)}
                placeholder="担当者1"
                className="w-full rounded-xl border border-slate-300 px-4 py-2"
              />

              <input
                type="text"
                value={assignee2}
                onChange={(e) => onChangeAssignee2(e.target.value)}
                placeholder="担当者2"
                className="w-full rounded-xl border border-slate-300 px-4 py-2"
              />

              <input
                type="text"
                value={assignee3}
                onChange={(e) => onChangeAssignee3(e.target.value)}
                placeholder="担当者3"
                className="w-full rounded-xl border border-slate-300 px-4 py-2"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
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
                className="w-full rounded-xl border border-slate-300 px-4 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-bold text-slate-600">
                実働日数
              </label>
              <input
                type="number"
                min={1}
                max={Math.max(maxDuration, 1)}
                value={duration}
                onChange={(e) =>
                  onChangeDuration(Math.max(Number(e.target.value), 1))
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-2"
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
              className="w-full rounded-xl border border-slate-300 px-4 py-2"
            >
              <option value="all">すべての日</option>
              <option value="weekdays">平日のみ</option>
              <option value="weekends">土日だけ</option>
              <option value="custom">カスタム</option>
            </select>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-sm font-bold text-slate-600">
                進捗率
              </label>
              <span className="text-sm font-bold text-slate-700">
                {progress}%
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => onChangeProgress(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {workdayMode === "custom" && (
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-600">
                作業する曜日
              </label>

              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => {
                  const active = customWorkdays.includes(day.value);

                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => onToggleCustomWorkday(day.value)}
                      className={`rounded-xl border px-4 py-2 text-sm font-bold ${active
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
        </div>

        <div className="mt-6 flex flex-wrap justify-between gap-2">
          <div>
            {mode === "edit" && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="rounded-xl border border-red-300 bg-white px-4 py-2 text-red-600 hover:bg-red-50"
              >
                削除
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 hover:bg-slate-100"
            >
              キャンセル
            </button>

            <button
              type="button"
              onClick={onSubmit}
              className="rounded-xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
            >
              {submitText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
