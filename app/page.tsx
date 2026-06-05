"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import ExcelJS from "exceljs";
import GanttChart from "@/components/GanttChart";
import TaskList from "@/components/TaskList";
import TaskModal from "@/components/TaskModal";
import VersionLabel from "@/components/VersionLabel";
import type { Project, Task, WorkdayMode } from "@/types/gantt";
import {
  createDays,
  getDelayDays,
  getTaskEndDate,
  getTaskScheduleSegments,
  isWorkingDay,
} from "@/utils/date";
import HelpMenu from "@/components/HelpMenu";
import LoginButton from "@/components/LoginButton";

import {
  saveProjectJsonToOneDrive,
  loadProjectJsonFromOneDrive,
  loadProjectJsonFromSharedFolder,
  saveProjectJsonToSharedFolder,
  listSharedFolderFiles,
  saveSharedIndexJson,
  saveSharedProjectJson,
} from "@/utils/graph";

import { useRef } from "react";

import { useMsal } from "@azure/msal-react";

import {
  getCurrentUserName,
  getCurrentUserEmail,
} from "@/utils/currentUser";

import {
  INVITE_CODE,
  authorize,
  isAuthorized,
  isAllowedDomain,
} from "@/utils/auth";

/* =========================
   保存用キー・バージョン
   ========================= */
const STORAGE_KEY = "tsukuroute-projects";
const USER_NAME_KEY = "tsukuroute-user-name";
const APP_VERSION = "つくる〜と v1.3.2";

/*const isTgsMode =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("mode") === "tgs";*/

export default function Home() {

  const [lastCloudSavedAt, setLastCloudSavedAt] = useState("");

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sharedFolderUrl, setSharedFolderUrl] = useState("");

  const [isShareSettingsOpen, setIsShareSettingsOpen] = useState(false);

  const [isClientReady, setIsClientReady] = useState(false);
  const [isTgsMode, setIsTgsMode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    setIsTgsMode(params.get("mode") === "tgs");
    setIsClientReady(true);
  }, []);

  const { instance, accounts } = useMsal();

  /* =========================
     プロジェクトデータ
     初期サンプルなし
     ========================= */
  const [projects, setProjects] = useState<Project[]>([]);

  /* =========================
     画面状態
     ========================= */
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null
  );
  const [selectedCategory, setSelectedCategory] = useState("すべて");
  const [sortMode, setSortMode] = useState("created");
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [renameProjectName, setRenameProjectName] = useState("");
  const [searchText, setSearchText] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [authorized, setAuthorized] = useState(false);

  /* =========================
     ユーザー名
     ========================= */
  const [currentUserName, setCurrentUserName] = useState("");

  /* =========================
     ガント表示サイズ
     ========================= */
  const [dayWidth, setDayWidth] = useState(96);
  const [rowHeight, setRowHeight] = useState(48);

  /* =========================
     プロジェクト作成モーダル
     ========================= */
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  /* =========================
     選択中プロジェクト
     ========================= */
  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) ?? null;

  /* =========================
     ユーザー名読み込み
     ========================= */
  useEffect(() => {
    const savedName = localStorage.getItem(USER_NAME_KEY);

    if (savedName) {
      setCurrentUserName(savedName);
    }
  }, []);

  useEffect(() => {
    function refreshUser() {
      const email = getCurrentUserEmail();

      setCurrentUserEmail(email);
      setAuthorized(isAuthorized());

      setIsLoggedIn(accounts.length > 0);
    }

    refreshUser();


    window.addEventListener(
      "tsukuroute-user-updated",
      refreshUser
    );

    return () => {
      window.removeEventListener(
        "tsukuroute-user-updated",
        refreshUser
      );
    };
  }, [accounts]);

  /* =========================
     ユーザー名保存
     ========================= */
  useEffect(() => {
    localStorage.setItem(USER_NAME_KEY, currentUserName);
  }, [currentUserName]);

  /* =========================
     プロジェクト読み込み
     ========================= */

  useEffect(() => {
    const savedUrl = localStorage.getItem("tsukuroute-shared-folder-url");

    if (savedUrl) {
      setSharedFolderUrl(savedUrl);
    }
  }, []);

  useEffect(() => {
    const savedProjects = localStorage.getItem(STORAGE_KEY);

    if (!savedProjects) {
      setIsLoaded(true);
      return;
    }

    try {
      const parsedProjects = JSON.parse(savedProjects) as Project[];

      const fixedProjects = parsedProjects.map((project) => ({
        ...project,
        workdayMode: project.workdayMode ?? "all",
        customWorkdays: project.customWorkdays ?? [1, 2, 3, 4, 5],
        customHolidays: project.customHolidays ?? [],
        tasks: project.tasks.map((task) => ({
          ...task,
          assignees: task.assignees ?? (task.assignee ? [task.assignee] : []),
          progress: task.progress ?? 0,
          updatedBy: task.updatedBy ?? "",
          updatedAt: task.updatedAt ?? "",
          workdayMode: task.workdayMode ?? project.workdayMode ?? "all",
          customWorkdays:
            task.customWorkdays ?? project.customWorkdays ?? [1, 2, 3, 4, 5],
          customHolidays: task.customHolidays ?? project.customHolidays ?? [],
        })),
      }));

      setProjects(fixedProjects);

      if (fixedProjects.length > 0) {
        setSelectedProjectId(fixedProjects[0].id);
      }
    } catch {
      console.error("保存データの読み込みに失敗しました");
    }

    setIsLoaded(true);
  }, []);

  /* =========================
     プロジェクト保存
     ========================= */
  useEffect(() => {
    if (!isLoaded) return;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects, isLoaded]);

  /* =========================
     タスク追加用 state
     ========================= */
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const [newTaskName, setNewTaskName] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("未分類");
  const [newTaskAssignee1, setNewTaskAssignee1] = useState("");
  const [newTaskAssignee2, setNewTaskAssignee2] = useState("");
  const [newTaskAssignee3, setNewTaskAssignee3] = useState("");
  const [newTaskStartDate, setNewTaskStartDate] = useState("");
  const [newTaskDuration, setNewTaskDuration] = useState(3);
  const [newTaskProgress, setNewTaskProgress] = useState(0);
  const [newTaskWorkdayMode, setNewTaskWorkdayMode] =
    useState<WorkdayMode>("all");
  const [newTaskCustomWorkdays, setNewTaskCustomWorkdays] = useState<number[]>([
    1, 2, 3, 4, 5,
  ]);

  /* =========================
     タスク編集用 state
     ========================= */
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);

  const [editTaskName, setEditTaskName] = useState("");
  const [editTaskCategory, setEditTaskCategory] = useState("未分類");
  const [editTaskAssignee1, setEditTaskAssignee1] = useState("");
  const [editTaskAssignee2, setEditTaskAssignee2] = useState("");
  const [editTaskAssignee3, setEditTaskAssignee3] = useState("");
  const [editTaskStartDate, setEditTaskStartDate] = useState("");
  const [editTaskDuration, setEditTaskDuration] = useState(1);
  const [editTaskProgress, setEditTaskProgress] = useState(0);
  const [editTaskWorkdayMode, setEditTaskWorkdayMode] =
    useState<WorkdayMode>("all");
  const [editTaskCustomWorkdays, setEditTaskCustomWorkdays] = useState<
    number[]
  >([1, 2, 3, 4, 5]);

  const editingTask =
    selectedProject?.tasks.find((task) => task.id === editingTaskId) ?? null;

  /* =========================
     ガント用データ
     ========================= */
  const days = selectedProject
    ? createDays(selectedProject.startDate, selectedProject.endDate)
    : [];

  const categories = selectedProject
    ? [
      "すべて",
      ...Array.from(
        new Set(selectedProject.tasks.map((task) => task.category))
      ),
    ]
    : ["すべて"];

  const filteredTasks = selectedProject
    ? [...selectedProject.tasks]
      .filter((task) => {
        const categoryMatch =
          selectedCategory === "すべて"
            ? true
            : task.category ===
            selectedCategory;

        const keyword =
          searchText.toLowerCase();

        const searchMatch =
          keyword === ""
            ? true
            : task.name
              .toLowerCase()
              .includes(keyword) ||
            (
              task.assignees?.join(" / ") ??
              task.assignee ??
              ""
            )
              .toLowerCase()
              .includes(keyword) ||
            task.category
              .toLowerCase()
              .includes(keyword);

        return (
          categoryMatch &&
          searchMatch
        );
      })
      .sort((a, b) => {
        if (sortMode === "created") return a.id - b.id;

        if (sortMode === "startDate") {
          return (
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          );
        }

        if (sortMode === "endDate") {
          const aEnd = getTaskEndDate(days, a);
          const bEnd = getTaskEndDate(days, b);

          if (!aEnd || !bEnd) return 0;

          return aEnd.date.getTime() - bEnd.date.getTime();
        }

        if (sortMode === "assignee") {
          return (
            a.assignees?.join(" / ") ??
            a.assignee ??
            ""
          ).localeCompare(
            b.assignees?.join(" / ") ??
            b.assignee ??
            ""
          );
        }

        if (sortMode === "progress") {
          return a.progress - b.progress;
        }

        if (sortMode === "delay") {
          return getDelayDays(days, b) - getDelayDays(days, a);
        }

        return 0;
      })
    : [];

  /* =========================
     共通関数
     ========================= */
  function getCurrentDateTimeText() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");

    return `${month}/${date} ${hour}:${minute}`;
  }

  function getUpdaterName() {
    return getCurrentUserName() || currentUserName || "未ログイン";
  }

  function updateSelectedProject(updatedProject: Project) {
    setProjects(
      projects.map((project) =>
        project.id === updatedProject.id ? updatedProject : project
      )
    );
  }

  function updateProjectWorkdayMode(mode: WorkdayMode) {
    if (!selectedProject) return;

    updateSelectedProject({
      ...selectedProject,
      workdayMode: mode,
    });
  }

  function moveTask(taskId: number, diffDays: number) {
    if (!selectedProject) return;

    const updatedTasks = selectedProject.tasks.map((task) => {
      if (task.id !== taskId) return task;

      const currentDate = new Date(task.startDate);

      currentDate.setDate(currentDate.getDate() + diffDays);

      const newDate = currentDate.toISOString().slice(0, 10);

      return {
        ...task,
        startDate: newDate,
        updatedBy: getUpdaterName(),
        updatedAt: getCurrentDateTimeText(),
      };
    });

    updateSelectedProject({
      ...selectedProject,
      tasks: updatedTasks,
    });
  }

  function resizeTask(taskId: number, diffDays: number) {
    if (!selectedProject) return;

    const updatedTasks = selectedProject.tasks.map((task) => {
      if (task.id !== taskId) return task;

      const newDuration = Math.max(1, task.duration + diffDays);

      return {
        ...task,
        duration: newDuration,
        updatedBy: getUpdaterName(),
        updatedAt: getCurrentDateTimeText(),
      };
    });

    updateSelectedProject({
      ...selectedProject,
      tasks: updatedTasks,
    });
  }


  /* =========================
     カスタム曜日切り替え
     ========================= */
  function toggleNewTaskCustomWorkday(day: number) {
    setNewTaskCustomWorkdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  function toggleEditTaskCustomWorkday(day: number) {
    setEditTaskCustomWorkdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  }

  /* =========================
     表示サイズ変更
     ========================= */
  function setDisplaySize(size: "small" | "medium" | "large") {
    if (size === "small") {
      setDayWidth(64);
      setRowHeight(36);
    }

    if (size === "medium") {
      setDayWidth(96);
      setRowHeight(48);
    }

    if (size === "large") {
      setDayWidth(128);
      setRowHeight(64);
    }
  }

  function decreaseDayWidth() {
    setDayWidth((prev) => Math.max(prev - 8, 32));
  }

  function increaseDayWidth() {
    setDayWidth((prev) => Math.min(prev + 8, 200));
  }

  function decreaseRowHeight() {
    setRowHeight((prev) => Math.max(prev - 4, 28));
  }

  function increaseRowHeight() {
    setRowHeight((prev) => Math.min(prev + 4, 96));
  }

  /* =========================
     プロジェクト作成
     ========================= */
  function openProjectModal() {
    setNewProjectName("");
    setIsProjectModalOpen(true);
  }

  function addProject() {
    if (newProjectName.trim() === "") {
      alert("プロジェクト名を入力してください");
      return;
    }

    const newProjectId = Date.now();

    const today = new Date();
    const startDate = today.toISOString().slice(0, 10);

    const end = new Date(today);
    end.setDate(end.getDate() + 14);
    const endDate = end.toISOString().slice(0, 10);

    const newProject: Project = {
      id: newProjectId,
      name: newProjectName,

      updatedBy: getUpdaterName(),
      updatedAt: getCurrentDateTimeText(),

      startDate,
      endDate,

      workdayMode: "all",
      customWorkdays: [1, 2, 3, 4, 5],
      customHolidays: [],

      tasks: [],
    };

    setProjects([...projects, newProject]);
    setSelectedProjectId(newProjectId);
    setSelectedCategory("すべて");
    setNewTaskStartDate(newProject.startDate);
    setNewTaskWorkdayMode(newProject.workdayMode);
    setNewTaskCustomWorkdays(newProject.customWorkdays);
    setNewProjectName("");
    setIsProjectModalOpen(false);
  }

  function deleteProject() {
    if (!selectedProject) return;

    const ok = confirm(
      `「${selectedProject.name}」を削除しますか？`
    );

    if (!ok) return;

    const updatedProjects =
      projects.filter(
        (project) =>
          project.id !==
          selectedProject.id
      );

    setProjects(updatedProjects);

    if (updatedProjects.length > 0) {
      setSelectedProjectId(
        updatedProjects[0].id
      );
    } else {
      setSelectedProjectId(null);
    }
  }

  function renameProject() {
    if (!selectedProject) return;

    if (renameProjectName.trim() === "") {
      alert("プロジェクト名を入力してください");
      return;
    }

    updateSelectedProject({
      ...selectedProject,
      name: renameProjectName,
      updatedBy: getUpdaterName(),
      updatedAt: getCurrentDateTimeText(),
    });

    setIsRenameModalOpen(false);
  }

  /* =========================
     タスク追加
     ========================= */
  function openTaskModal() {
    if (!selectedProject) return;

    setNewTaskName("");
    setNewTaskCategory("未分類");
    setNewTaskAssignee1("");
    setNewTaskAssignee2("");
    setNewTaskAssignee3("");
    setNewTaskStartDate(selectedProject.startDate);
    setNewTaskDuration(3);
    setNewTaskProgress(0);
    setNewTaskWorkdayMode(selectedProject.workdayMode);
    setNewTaskCustomWorkdays(selectedProject.customWorkdays);
    setIsTaskModalOpen(true);
  }

  function addTask() {
    if (!selectedProject) return;

    if (newTaskName.trim() === "") {
      alert("タスク名を入力してください");
      return;
    }

    const colors = [
      "bg-blue-500",
      "bg-purple-500",
      "bg-green-500",
      "bg-amber-500",
      "bg-pink-500",
      "bg-slate-500",
    ];

    const newTask: Task = {
      id: Date.now(),
      name: newTaskName,
      category: newTaskCategory,
      assignees: [newTaskAssignee1, newTaskAssignee2, newTaskAssignee3,].filter((name) => name.trim() !== ""),
      startDate: newTaskStartDate,
      duration: newTaskDuration,
      progress: newTaskProgress,
      color: colors[selectedProject.tasks.length % colors.length],
      updatedBy: getUpdaterName(),
      updatedAt: getCurrentDateTimeText(),
      workdayMode: newTaskWorkdayMode,
      customWorkdays: newTaskCustomWorkdays,
      customHolidays: selectedProject.customHolidays,
    };

    updateSelectedProject({
      ...selectedProject,
      tasks: [...selectedProject.tasks, newTask],
    });

    setSelectedCategory("すべて");
    setIsTaskModalOpen(false);
  }

  /* =========================
     タスク編集
     ========================= */
  function openEditTaskModal(task: Task) {
    if (!selectedProject) return;

    const assignees = task.assignees ?? (task.assignee ? [task.assignee] : []);

    setEditingTaskId(task.id);
    setEditTaskName(task.name);
    setEditTaskCategory(task.category);
    setEditTaskAssignee1(task.assignees[0] || "");
    setEditTaskAssignee2(task.assignees[1] || "");
    setEditTaskAssignee3(task.assignees[2] || "");
    setEditTaskStartDate(task.startDate);
    setEditTaskDuration(task.duration);
    setEditTaskProgress(task.progress ?? 0);
    setEditTaskWorkdayMode(task.workdayMode ?? selectedProject.workdayMode);
    setEditTaskCustomWorkdays(task.customWorkdays ?? [1, 2, 3, 4, 5]);
  }

  function saveEditedTask() {
    if (!selectedProject) return;
    if (editingTaskId === null) return;

    if (editTaskName.trim() === "") {
      alert("タスク名を入力してください");
      return;
    }

    const updatedTasks = selectedProject.tasks.map((task) => {
      if (task.id !== editingTaskId) return task;

      return {
        ...task,
        name: editTaskName,
        category: editTaskCategory,
        assignees: [editTaskAssignee1, editTaskAssignee2, editTaskAssignee3,].filter((name) => name.trim() !== ""),
        startDate: editTaskStartDate,
        duration: editTaskDuration,
        progress: editTaskProgress,
        updatedBy: getUpdaterName(),
        updatedAt: getCurrentDateTimeText(),
        workdayMode: editTaskWorkdayMode,
        customWorkdays: editTaskCustomWorkdays,
      };
    });

    updateSelectedProject({
      ...selectedProject,
      tasks: updatedTasks,
    });

    setEditingTaskId(null);
  }

  function deleteEditingTask() {
    if (!selectedProject) return;
    if (editingTaskId === null) return;

    const ok = confirm("このタスクを削除しますか？");
    if (!ok) return;

    updateSelectedProject({
      ...selectedProject,
      tasks: selectedProject.tasks.filter((task) => task.id !== editingTaskId),
    });

    setEditingTaskId(null);
  }

  /* =========================
    ========================= */
  function exportProjectsJson() {
    const exportData = {
      appName: "つくる〜と",
      version: APP_VERSION,
      exportedAt: getCurrentDateTimeText(),
      projects,
    };

    const jsonText = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `tsukuroute-backup-${Date.now()}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }

  async function saveCloudProjects() {
    try {
      if (!sharedFolderUrl) {
        alert("共有フォルダリンクを設定してください");
        return;
      }

      const cloudData = await loadProjectJsonFromSharedFolder(
        instance,
        sharedFolderUrl
      );

      if (
        cloudData.savedAt &&
        lastCloudSavedAt &&
        cloudData.savedAt !== lastCloudSavedAt
      ) {
        const overwrite = confirm(
          `他のユーザーが先に更新しています。\n\n` +
          `クラウド更新時刻：${cloudData.savedAt}\n` +
          `自分が最後に読み込んだ時刻：${lastCloudSavedAt}\n\n` +
          `上書きしますか？`
        );

        if (!overwrite) {
          alert("保存をキャンセルしました。先に共有クラウド読込をしてください。");
          return;
        }
      }

      const savedAt = getCurrentDateTimeText();

      const data = {
        appName: "つくる〜と",
        version: APP_VERSION,
        savedAt,
        savedBy: getUpdaterName(),
        projects,
      };

      await saveProjectJsonToSharedFolder(
        instance,
        sharedFolderUrl,
        data
      );

      setLastCloudSavedAt(savedAt);

      alert("共有クラウドに保存しました！");
    } catch (error) {
      console.error("Shared Cloud Save Error:", error);
      alert("共有クラウド保存に失敗しました");
    }
  }

  async function loadCloudProjects() {
    try {
      if (!sharedFolderUrl) {
        alert("共有フォルダリンクを設定してください");
        return;
      }

      const data = await loadProjectJsonFromSharedFolder(
        instance,
        sharedFolderUrl
      );

      if (!data.projects) {
        alert("共有クラウドデータが不正です");
        return;
      }

      setProjects(data.projects);
      setLastCloudSavedAt(data.savedAt ?? "");

      if (data.projects.length > 0) {
        setSelectedProjectId(data.projects[0].id);
        setSelectedCategory("すべて");
      }

      alert("共有クラウドから読み込みました！");
    } catch (error) {
      console.error("Shared Cloud Load Error:", error);
      alert("共有クラウド読込に失敗しました");
    }
  }

  async function savePersonalCloudProjects() {
    try {
      const data = {
        appName: "つくる〜と",
        version: APP_VERSION,
        savedAt: getCurrentDateTimeText(),
        savedBy: getUpdaterName(),
        projects,
      };

      await saveProjectJsonToOneDrive(instance, data);

      alert("個人クラウドに保存しました！");
    } catch (error) {
      console.error("Personal Cloud Save Error:", error);
      alert("個人クラウド保存に失敗しました");
    }
  }

  async function migrateSharedProjectsToSplitFiles() {
    try {
      if (!sharedFolderUrl) {
        alert("共有フォルダリンクを設定してください");
        return;
      }

      if (projects.length === 0) {
        alert("移行するプロジェクトがありません");
        return;
      }

      const result = confirm(
        `現在の ${projects.length} 件のプロジェクトを分割保存します。\n\n` +
        `共有フォルダに index.json と project-xxx.json を作成します。\n` +
        `実行しますか？`
      );

      if (!result) return;

      const savedAt = getCurrentDateTimeText();
      const savedBy = getUpdaterName();

      const indexData = {
        appName: "つくる〜と",
        version: APP_VERSION,
        format: "split-projects",
        savedAt,
        savedBy,
        projects: projects.map((project) => ({
          id: project.id,
          name: project.name,
          startDate: project.startDate,
          endDate: project.endDate,
          updatedBy: project.updatedBy || savedBy,
          updatedAt: project.updatedAt || savedAt,
          fileName: `project-${project.id}.json`,
        })),
      };

      await saveSharedIndexJson(instance, sharedFolderUrl, indexData);

      for (const project of projects) {
        const projectData = {
          ...project,
          updatedBy: project.updatedBy || savedBy,
          updatedAt: project.updatedAt || savedAt,
        };

        await saveSharedProjectJson(
          instance,
          sharedFolderUrl,
          project.id,
          projectData
        );
      }

      alert("分割保存への移行が完了しました！");
    } catch (error) {
      console.error("Split Migration Error:", error);
      alert("分割保存への移行に失敗しました");
    }
  }

  async function loadPersonalCloudProjects() {
    try {
      const data = await loadProjectJsonFromOneDrive(instance);

      if (!data.projects) {
        alert("個人クラウドデータが不正です");
        return;
      }

      setProjects(data.projects);

      if (data.projects.length > 0) {
        setSelectedProjectId(data.projects[0].id);
        setSelectedCategory("すべて");
      }

      alert("個人クラウドから読み込みました！");
    } catch (error) {
      console.error("Personal Cloud Load Error:", error);
      alert("個人クラウド読込に失敗しました");
    }
  }

  function importProjectsJson(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const importedData = JSON.parse(text);

        if (!importedData.projects) {
          alert("不正なバックアップファイルです");
          return;
        }

        const importedProjects = importedData.projects as Project[];

        const baseProjectId = Date.now();

        const importedProjectsWithNewIds = importedProjects.map(
          (project, projectIndex) => ({
            ...project,
            id: baseProjectId + projectIndex,
            tasks: project.tasks.map((task, taskIndex) => ({
              ...task,
              id: baseProjectId + projectIndex * 10000 + taskIndex + 1,
            })),
          })
        );

        setProjects((prev) => [
          ...prev,
          ...importedProjectsWithNewIds,
        ]);

        if (importedProjectsWithNewIds.length > 0) {
          setSelectedProjectId(importedProjectsWithNewIds[0].id);
          setSelectedCategory("すべて");
        }

        alert("プロジェクトを追加読み込みしました！");
      } catch {
        alert("JSON読み込みに失敗しました");
      }
    };

    reader.readAsText(file);
    event.target.value = "";
  }

  /* =========================
     Excel出力
     ========================= */
  async function exportProjectExcel() {
    if (!selectedProject) {
      alert("出力するプロジェクトがありません");
      return;
    }

    const workbook = new ExcelJS.Workbook();

    workbook.creator = "つくる〜と";
    workbook.created = new Date();

    const thinBorder = {
      top: { style: "thin" as const, color: { argb: "FFD1D5DB" } },
      left: { style: "thin" as const, color: { argb: "FFD1D5DB" } },
      bottom: { style: "thin" as const, color: { argb: "FFD1D5DB" } },
      right: { style: "thin" as const, color: { argb: "FFD1D5DB" } },
    };

    const darkFill = {
      type: "pattern" as const,
      pattern: "solid" as const,
      fgColor: { argb: "FF4B5563" },
    };

    const whiteFont = {
      color: { argb: "FFFFFFFF" },
      bold: true,
    };

    const phaseColors = [
      "FFD9EAF7",
      "FFF4CCCC",
      "FFE2F0D9",
      "FFEADCF8",
      "FFFFF2CC",
      "FFDDEBF7",
    ];

    const taskBarFill = {
      type: "pattern" as const,
      pattern: "solid" as const,
      fgColor: { argb: "FF7C3AED" },
    };

    const progressFill = {
      type: "pattern" as const,
      pattern: "solid" as const,
      fgColor: { argb: "FFA3A3A3" },
    };

    const delayFill = {
      type: "pattern" as const,
      pattern: "solid" as const,
      fgColor: { argb: "FFFFC7C7" },
    };

    const saturdayFill = {
      type: "pattern" as const,
      pattern: "solid" as const,
      fgColor: { argb: "FFDDEBFF" },
    };

    const sundayFill = {
      type: "pattern" as const,
      pattern: "solid" as const,
      fgColor: { argb: "FFFFE1E1" },
    };

    const holidayFill = {
      type: "pattern" as const,
      pattern: "solid" as const,
      fgColor: { argb: "FFF3F4F6" },
    };

    /* =========================
       シート1：タスク一覧
       ========================= */
    const listSheet = workbook.addWorksheet("タスク一覧");

    listSheet.columns = [
      { header: "プロジェクト名", key: "projectName", width: 20 },
      { header: "タスク名", key: "taskName", width: 24 },
      { header: "担当者", key: "assignee", width: 16 },
      { header: "カテゴリ", key: "category", width: 16 },
      { header: "開始日", key: "startDate", width: 14 },
      { header: "終了予定日", key: "endDate", width: 14 },
      { header: "実働日数", key: "duration", width: 12 },
      { header: "進捗率", key: "progress", width: 10 },
      { header: "遅延日数", key: "delay", width: 12 },
      { header: "実働日設定", key: "workdayMode", width: 14 },
      { header: "最終更新者", key: "updatedBy", width: 16 },
      { header: "最終更新日時", key: "updatedAt", width: 18 },
    ];

    selectedProject.tasks.forEach((task) => {
      const endDay = getTaskEndDate(days, task);
      const delayDays = getDelayDays(days, task);

      listSheet.addRow({
        projectName: selectedProject.name,
        taskName: task.name,
        assignee: task.assignees?.join(" / ") || task.assignee || "未設定",
        category: task.category,
        startDate: task.startDate,
        endDate: endDay?.dateText ?? "",
        duration: task.duration,
        progress: `${task.progress}%`,
        delay: delayDays > 0 ? `${delayDays}日` : "",
        workdayMode: task.workdayMode,
        updatedBy: getUpdaterName(),
        updatedAt: task.updatedAt || "",
      });
    });

    listSheet.getRow(1).font = whiteFont;
    listSheet.getRow(1).fill = darkFill;

    listSheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = thinBorder;
        cell.alignment = { vertical: "middle" };
      });
    });

    /* =========================
       シート2：ガントチャート
       ========================= */
    const ganttSheet = workbook.addWorksheet("ガントチャート");

    const leftColumnCount = 5;
    const timelineStartCol = leftColumnCount + 1;

    const titleRow = 1;
    const infoRow = 2;
    const monthRow = 4;
    const dayRow = 5;
    const weekRow = 6;
    const startRow = 7;

    ganttSheet.views = [
      {
        state: "frozen",
        xSplit: leftColumnCount,
        ySplit: weekRow,
      },
    ];

    ganttSheet.getColumn(1).width = 28;
    ganttSheet.getColumn(2).width = 16;
    ganttSheet.getColumn(3).width = 11;
    ganttSheet.getColumn(4).width = 13;
    ganttSheet.getColumn(5).width = 13;

    days.forEach((_, index) => {
      ganttSheet.getColumn(timelineStartCol + index).width = 3.2;
    });

    ganttSheet.mergeCells(titleRow, 1, titleRow, 5);
    ganttSheet.getCell(titleRow, 1).value = `${selectedProject.name} ガントチャート`;
    ganttSheet.getCell(titleRow, 1).font = { bold: true, size: 18 };

    ganttSheet.getCell(infoRow, 1).value = "出力日時";
    ganttSheet.getCell(infoRow, 2).value = getCurrentDateTimeText();
    ganttSheet.getCell(infoRow, 4).value = "期間";
    ganttSheet.getCell(infoRow, 5).value = `${selectedProject.startDate} 〜 ${selectedProject.endDate}`;

    let monthStartIndex = 0;

    for (let i = 0; i < days.length; i++) {
      const current = days[i];
      const next = days[i + 1];

      const currentMonth = current.date.getMonth();
      const nextMonth = next?.date.getMonth();

      if (i === days.length - 1 || currentMonth !== nextMonth) {
        const startCol = timelineStartCol + monthStartIndex;
        const endCol = timelineStartCol + i;

        ganttSheet.mergeCells(monthRow, startCol, monthRow, endCol);

        const cell = ganttSheet.getCell(monthRow, startCol);
        cell.value = `${current.date.getFullYear()}/${current.date.getMonth() + 1}`;
        cell.font = { bold: true };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFE5E7EB" },
        };
        cell.border = thinBorder;

        monthStartIndex = i + 1;
      }
    }

    const leftHeaders = ["タスク", "担当者", "進捗状況", "開始", "終了"];

    leftHeaders.forEach((header, index) => {
      const cell = ganttSheet.getCell(weekRow, index + 1);
      cell.value = header;
      cell.font = whiteFont;
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.fill = darkFill;
      cell.border = thinBorder;
    });

    days.forEach((day, index) => {
      const col = timelineStartCol + index;

      const dayCell = ganttSheet.getCell(dayRow, col);
      dayCell.value = day.date.getDate();
      dayCell.font = { bold: true, size: 8 };
      dayCell.alignment = { horizontal: "center", vertical: "middle" };
      dayCell.border = thinBorder;

      const weekCell = ganttSheet.getCell(weekRow, col);
      weekCell.value = day.dayName;
      weekCell.font = { ...whiteFont, size: 8 };
      weekCell.alignment = { horizontal: "center", vertical: "middle" };
      weekCell.fill = darkFill;
      weekCell.border = thinBorder;

      if (day.isSaturday) {
        dayCell.fill = saturdayFill;
        weekCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF60A5FA" },
        };
      }

      if (day.isSunday) {
        dayCell.fill = sundayFill;
        weekCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF87171" },
        };
      }
    });

    ganttSheet.getRow(monthRow).height = 22;
    ganttSheet.getRow(dayRow).height = 18;
    ganttSheet.getRow(weekRow).height = 22;

    const categoryMap = new Map<string, Task[]>();

    selectedProject.tasks.forEach((task) => {
      const category = task.category || "未分類";

      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }

      categoryMap.get(category)?.push(task);
    });

    let currentRow = startRow;
    let categoryIndex = 0;

    categoryMap.forEach((tasks, category) => {
      const phaseColor = phaseColors[categoryIndex % phaseColors.length];

      ganttSheet.mergeCells(currentRow, 1, currentRow, 5);

      const phaseCell = ganttSheet.getCell(currentRow, 1);
      phaseCell.value = category;
      phaseCell.font = { bold: true };
      phaseCell.alignment = { vertical: "middle" };
      phaseCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: phaseColor },
      };

      for (let col = 1; col <= timelineStartCol + days.length - 1; col++) {
        const cell = ganttSheet.getCell(currentRow, col);
        cell.border = thinBorder;

        if (col >= timelineStartCol) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFFFFF" },
          };
        }
      }

      currentRow++;

      tasks.forEach((task) => {
        const endDay = getTaskEndDate(days, task);
        const delayDays = getDelayDays(days, task);
        const segments = getTaskScheduleSegments(days, task);
        const lastSegment = segments[segments.length - 1];

        ganttSheet.getRow(currentRow).height = 22;

        const leftValues = [
          task.name,
          task.assignees?.join(" / ") || task.assignee || "未設定",
          `${task.progress}%`,
          task.startDate,
          endDay?.dateText ?? "",
        ];

        leftValues.forEach((value, index) => {
          const cell = ganttSheet.getCell(currentRow, index + 1);
          cell.value = value;
          cell.border = thinBorder;
          cell.alignment = {
            vertical: "middle",
            horizontal: index >= 2 ? "center" : "left",
          };

          if (index === 0) {
            cell.font = { bold: true };
          }

          if (index <= 1) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: phaseColor },
            };
          }
        });

        ganttSheet.getCell(currentRow, 3).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: {
            argb:
              task.progress >= 100
                ? "FFD1FAE5"
                : task.progress >= 50
                  ? "FFE5E7EB"
                  : "FFF3F4F6",
          },
        };

        days.forEach((day, dayIndex) => {
          const col = timelineStartCol + dayIndex;
          const cell = ganttSheet.getCell(currentRow, col);

          cell.border = thinBorder;

          const working = isWorkingDay(
            day,
            task.workdayMode,
            task.customWorkdays,
            task.customHolidays
          );

          if (!working) {
            cell.fill = holidayFill;
          } else if (day.isSaturday) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFEFF6FF" },
            };
          } else if (day.isSunday) {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFFFF1F2" },
            };
          }
        });

        segments.forEach((segment) => {
          const startCol = timelineStartCol + segment.startIndex;
          const endCol = timelineStartCol + segment.endIndex;

          if (startCol <= endCol) {
            ganttSheet.mergeCells(currentRow, startCol, currentRow, endCol);

            const mergedCell = ganttSheet.getCell(currentRow, startCol);
            mergedCell.value = "";
            mergedCell.fill = task.progress >= 100 ? progressFill : taskBarFill;
            mergedCell.border = thinBorder;
          }
        });

        if (delayDays > 0 && lastSegment) {
          const start = lastSegment.endIndex + 1;
          const end = Math.min(start + delayDays - 1, days.length - 1);

          if (start <= end) {
            const startCol = timelineStartCol + start;
            const endCol = timelineStartCol + end;

            ganttSheet.mergeCells(currentRow, startCol, currentRow, endCol);

            const delayCell = ganttSheet.getCell(currentRow, startCol);
            delayCell.value = `遅延 ${delayDays}日`;
            delayCell.font = {
              color: { argb: "FFB91C1C" },
              bold: true,
              size: 8,
            };
            delayCell.alignment = {
              horizontal: "center",
              vertical: "middle",
            };
            delayCell.fill = delayFill;
            delayCell.border = thinBorder;
          }
        }

        currentRow++;
      });

      categoryIndex++;
    });

    for (let row = 1; row < currentRow; row++) {
      for (let col = 1; col <= timelineStartCol + days.length - 1; col++) {
        const cell = ganttSheet.getCell(row, col);

        if (!cell.border) {
          cell.border = thinBorder;
        }
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();

    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `tsukuroute-${selectedProject.name}-${Date.now()}.xlsx`;
    a.click();

    URL.revokeObjectURL(url);
  }

  /* =========================
     プロジェクトなし画面
     ========================= */

  if (!isClientReady) {
    return null;
  }

  if (
    isTgsMode &&
    (!currentUserEmail || !isAllowedDomain(currentUserEmail) || !authorized)
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-slate-900">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="mb-2 text-3xl font-bold">つくる〜と</h1>
          <p className="mb-6 text-sm text-slate-500">
            TGSメンバー専用ページです。
          </p>

          {currentUserEmail && !isAllowedDomain(currentUserEmail) && (
            <p className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
              このアカウントは利用できません。
            </p>
          )}

          {!isLoggedIn && (
            <div className="mb-6 flex justify-center">
              <LoginButton />
            </div>
          )}

          {isLoggedIn && !authorized && (
            <div className="space-y-3">
              <input
                type="password"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="招待コード"
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />

              <button
                onClick={() => {
                  if (inviteCode.trim() === INVITE_CODE) {
                    authorize();
                    setAuthorized(true);
                  } else {
                    alert("招待コードが違います");
                  }
                }}
                className="w-full rounded-xl bg-slate-900 px-4 py-3 text-white"
              >
                利用開始
              </button>
            </div>
          )}
        </div>

        <VersionLabel version={APP_VERSION} />
      </main>
    );
  }

  if (!selectedProject) {
    return (

      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-slate-900">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <h1 className="mb-2 text-3xl font-bold">つくる〜と</h1>
          <p className="mb-6 text-sm text-slate-500">
            プロジェクトを作成するか、
            読み込みを行ってください。
          </p>

          <div className="flex flex-col gap-3">

            <button
              onClick={openProjectModal}
              className="rounded-xl bg-slate-900 px-5 py-3 text-white hover:bg-slate-700"
            >
              ＋ 新規プロジェクト作成

            </button>

            <button
              onClick={() => {
                console.log("JSON読込ボタン");
                fileInputRef.current?.click();
              }}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 hover:bg-slate-100"
            >
              📂 JSON読込
            </button>

            {isTgsMode && (
              <button
                onClick={() => {
                  console.log("共有クラウド読込");
                  loadCloudProjects();
                }}
                className="rounded-xl border border-blue-300 bg-blue-50 px-5 py-3 hover:bg-blue-100"
              >
                ☁️ 共有クラウド読込
              </button>
            )}

            {isTgsMode && (
              <button
                type="button"
                onClick={() => setIsShareSettingsOpen(true)}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 hover:bg-slate-100"
              >
                ⚙️ 共有設定
              </button>

            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={importProjectsJson}
              className="hidden"
            />

          </div>



        </div>

        {isProjectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h2 className="mb-4 text-xl font-bold">新規プロジェクト</h2>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-600">
                  プロジェクト名
                </label>

                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="例：MMO制作"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={() => setIsProjectModalOpen(false)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 hover:bg-slate-100"
                >
                  キャンセル
                </button>

                <button
                  onClick={addProject}
                  className="rounded-xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
                >
                  作成
                </button>
              </div>
            </div>
          </div>
        )}

        <VersionLabel version={APP_VERSION} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <header className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">つくる〜と</h1>

                <LoginButton />
              </div>

              <p className="text-sm text-slate-500">
                ゲーム制作向け・かんたんガント管理ツール
              </p>
            </div>

            <div className="flex flex-wrap gap-2">

              <button
                onClick={openProjectModal}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-100"
              >
                ＋ 新規プロジェクト
              </button>

              <div className="relative">
                <button
                  onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-100"
                >
                  入出力
                </button>

                {isExportMenuOpen && (
                  <div className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-slate-200 bg-white shadow-xl">
                    <button
                      onClick={() => {
                        exportProjectsJson();
                        setIsExportMenuOpen(false);
                      }}
                      className="block w-full border-b border-slate-100 px-4 py-3 text-left text-sm hover:bg-slate-100"
                    >
                      JSON出力
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        migrateSharedProjectsToSplitFiles();
                        setIsExportMenuOpen(false);
                      }}
                      className="block w-full border-b border-slate-100 px-4 py-3 text-left text-sm hover:bg-slate-100"
                    >
                      分割保存へ移行
                    </button>

                    <label className="block cursor-pointer border-b border-slate-100 px-4 py-3 text-sm hover:bg-slate-100">
                      JSON読込

                      <input
                        type="file"
                        accept=".json"
                        onChange={(e) => {
                          importProjectsJson(e);
                          setIsExportMenuOpen(false);
                        }}
                        className="hidden"
                      />
                    </label>

                    {isTgsMode ? (
                      <>
                        <button
                          onClick={() => {
                            saveCloudProjects();
                            setIsExportMenuOpen(false);
                          }}
                          className="block w-full border-b border-slate-100 px-4 py-3 text-left text-sm hover:bg-slate-100"
                        >
                          共有クラウド保存
                        </button>

                        <button
                          onClick={() => {
                            loadCloudProjects();
                            setIsExportMenuOpen(false);
                          }}
                          className="block w-full border-b border-slate-100 px-4 py-3 text-left text-sm hover:bg-slate-100"
                        >
                          共有クラウド読込
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsShareSettingsOpen(true);
                            setIsExportMenuOpen(false);
                          }}
                          className="block w-full border-b border-slate-100 px-4 py-3 text-left text-sm hover:bg-slate-100"
                        >
                          共有設定
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            savePersonalCloudProjects();
                            setIsExportMenuOpen(false);
                          }}
                          className="block w-full border-b border-slate-100 px-4 py-3 text-left text-sm hover:bg-slate-100"
                        >
                          個人クラウド保存
                        </button>

                        <button
                          onClick={() => {
                            loadPersonalCloudProjects();
                            setIsExportMenuOpen(false);
                          }}
                          className="block w-full border-b border-slate-100 px-4 py-3 text-left text-sm hover:bg-slate-100"
                        >
                          個人クラウド読込
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => {
                        exportProjectExcel();
                        setIsExportMenuOpen(false);
                      }}
                      className="block w-full px-4 py-3 text-left text-sm hover:bg-slate-100"
                    >
                      Excel出力
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={openTaskModal}
                className="rounded-xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
              >
                ＋ タスク追加
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-slate-600">
              プロジェクト：
              <span className="font-bold">{selectedProject.name}</span>
              ／ 総日数：
              <span className="font-bold">{days.length}</span>日 ／ 表示中：
              <span className="font-bold">{filteredTasks.length}</span>件
            </div>

            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-slate-100"
            >
              {isSettingsOpen ? "設定を閉じる" : "設定を開く"}
            </button>
          </div>

          {isSettingsOpen && (
            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              <div className="grid gap-6">
                <div>
                  <h2 className="mb-3 text-sm font-bold text-slate-500">
                    プロジェクト設定
                  </h2>

                  <div className="flex flex-wrap items-end gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-bold text-slate-600">
                        あなたの名前
                      </label>
                      <input
                        type="text"
                        value={currentUserName}
                        onChange={(e) => setCurrentUserName(e.target.value)}
                        placeholder="例：田中　太郎"
                        className="min-w-40 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-bold text-slate-600">
                        現在のプロジェクト
                      </label>
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedProjectId ?? ""}
                          onChange={(e) => {
                            const projectId = Number(e.target.value);
                            const project = projects.find((p) => p.id === projectId);

                            setSelectedProjectId(projectId);
                            setSelectedCategory("すべて");

                            if (project) {
                              setNewTaskStartDate(project.startDate);
                              setNewTaskWorkdayMode(project.workdayMode);
                              setNewTaskCustomWorkdays(project.customWorkdays);
                            }
                          }}
                          className="min-w-56 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                        >
                          {projects.map((project) => (
                            <option key={project.id} value={project.id}>
                              {project.name}
                            </option>
                          ))}
                        </select>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100"
                          >
                            …
                          </button>

                          {isProjectMenuOpen && (
                            <div className="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-slate-200 bg-white shadow-xl">

                              <button
                                type="button"
                                onClick={() => {
                                  setRenameProjectName(
                                    selectedProject.name
                                  );

                                  setIsRenameModalOpen(true);

                                  setIsProjectMenuOpen(false);
                                }}
                                className="block w-full border-b border-slate-100 px-4 py-3 text-left text-sm hover:bg-slate-100"
                              >
                                プロジェクト名変更
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  deleteProject();
                                  setIsProjectMenuOpen(false);
                                }}
                                className="block w-full px-4 py-3 text-left text-sm text-red-500 hover:bg-red-50"
                              >
                                プロジェクト削除
                              </button>

                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-bold text-slate-600">
                        プロジェクト開始日
                      </label>
                      <input
                        type="date"
                        value={selectedProject.startDate}
                        onChange={(e) => {
                          updateSelectedProject({
                            ...selectedProject,
                            startDate: e.target.value,
                          });

                          setNewTaskStartDate(e.target.value);
                        }}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-bold text-slate-600">
                        プロジェクト終了日
                      </label>
                      <input
                        type="date"
                        value={selectedProject.endDate}
                        onChange={(e) =>
                          updateSelectedProject({
                            ...selectedProject,
                            endDate: e.target.value,
                          })
                        }
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-bold text-slate-600">
                        新規タスク初期実働
                      </label>
                      <select
                        value={selectedProject.workdayMode}
                        onChange={(e) =>
                          updateProjectWorkdayMode(
                            e.target.value as WorkdayMode
                          )
                        }
                        className="min-w-44 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                      >
                        <option value="all">すべての日</option>
                        <option value="weekdays">平日のみ</option>
                        <option value="weekends">土日だけ</option>
                        <option value="custom">カスタム</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="mb-3 text-sm font-bold text-slate-500">
                    表示設定
                  </h2>

                  <div className="flex flex-wrap items-end gap-4">
                    <div>
                      <label className="mb-1 block text-sm font-bold text-slate-600">
                        カテゴリ絞り込み
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="min-w-44 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                      >
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-bold text-slate-600">
                        並び替え
                      </label>
                      <select
                        value={sortMode}
                        onChange={(e) => setSortMode(e.target.value)}
                        className="min-w-44 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                      >
                        <option value="created">追加順</option>
                        <option value="startDate">開始日順</option>
                        <option value="endDate">終了日順</option>
                        <option value="assignee">担当者順</option>
                        <option value="progress">進捗低い順</option>
                        <option value="delay">遅延多い順</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-bold text-slate-600">
                        検索
                      </label>

                      <input
                        type="text"
                        value={searchText}
                        onChange={(e) =>
                          setSearchText(
                            e.target.value
                          )
                        }
                        placeholder="タスク名・担当者"
                        className="min-w-56 rounded-lg border border-slate-300 px-3 py-1.5 text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-bold text-slate-600">
                        表示サイズ
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setDisplaySize("small")}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100"
                        >
                          小
                        </button>

                        <button
                          onClick={() => setDisplaySize("medium")}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100"
                        >
                          中
                        </button>

                        <button
                          onClick={() => setDisplaySize("large")}
                          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-100"
                        >
                          大
                        </button>

                        <div className="ml-2 flex items-center gap-1 text-sm text-slate-600">
                          <span>横</span>
                          <button
                            onClick={decreaseDayWidth}
                            className="rounded border border-slate-300 bg-white px-2 py-1 hover:bg-slate-100"
                          >
                            －
                          </button>
                          <span className="min-w-12 text-center">
                            {dayWidth}px
                          </span>
                          <button
                            onClick={increaseDayWidth}
                            className="rounded border border-slate-300 bg-white px-2 py-1 hover:bg-slate-100"
                          >
                            ＋
                          </button>
                        </div>

                        <div className="flex items-center gap-1 text-sm text-slate-600">
                          <span>縦</span>
                          <button
                            onClick={decreaseRowHeight}
                            className="rounded border border-slate-300 bg-white px-2 py-1 hover:bg-slate-100"
                          >
                            －
                          </button>
                          <span className="min-w-12 text-center">
                            {rowHeight}px
                          </span>
                          <button
                            onClick={increaseRowHeight}
                            className="rounded border border-slate-300 bg-white px-2 py-1 hover:bg-slate-100"
                          >
                            ＋
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </header>

        <section className="grid grid-cols-[320px_1fr] gap-4">
          <TaskList
            tasks={filteredTasks}
            days={days}
            onEditTask={openEditTaskModal}
          />

          <GanttChart
            projectName={selectedProject.name}
            tasks={filteredTasks}
            days={days}
            dayWidth={dayWidth}
            rowHeight={rowHeight}
            onEditTask={openEditTaskModal}
            onMoveTask={moveTask}
            onResizeTask={resizeTask}
          />
        </section>
      </div>

      {isTaskModalOpen && (
        <TaskModal
          mode="add"
          projectName={selectedProject.name}
          taskName={newTaskName}
          category={newTaskCategory}
          assignee1={newTaskAssignee1}
          assignee2={newTaskAssignee2}
          assignee3={newTaskAssignee3}
          startDate={newTaskStartDate}
          duration={newTaskDuration}
          progress={newTaskProgress}
          workdayMode={newTaskWorkdayMode}
          customWorkdays={newTaskCustomWorkdays}
          projectStartDate={selectedProject.startDate}
          projectEndDate={selectedProject.endDate}
          maxDuration={days.length}
          onChangeTaskName={setNewTaskName}
          onChangeCategory={setNewTaskCategory}
          onChangeAssignee1={setNewTaskAssignee1}
          onChangeAssignee2={setNewTaskAssignee2}
          onChangeAssignee3={setNewTaskAssignee3}
          onChangeStartDate={setNewTaskStartDate}
          onChangeDuration={setNewTaskDuration}
          onChangeProgress={setNewTaskProgress}
          onChangeWorkdayMode={setNewTaskWorkdayMode}
          onToggleCustomWorkday={toggleNewTaskCustomWorkday}
          onClose={() => setIsTaskModalOpen(false)}
          onSubmit={addTask}
        />
      )}

      {editingTask && (
        <TaskModal
          mode="edit"
          projectName={selectedProject.name}
          taskName={editTaskName}
          category={editTaskCategory}
          assignee1={editTaskAssignee1}
          assignee2={editTaskAssignee2}
          assignee3={editTaskAssignee3}
          startDate={editTaskStartDate}
          duration={editTaskDuration}
          progress={editTaskProgress}
          workdayMode={editTaskWorkdayMode}
          customWorkdays={editTaskCustomWorkdays}
          projectStartDate={selectedProject.startDate}
          projectEndDate={selectedProject.endDate}
          maxDuration={days.length}
          onChangeTaskName={setEditTaskName}
          onChangeCategory={setEditTaskCategory}
          onChangeAssignee1={setEditTaskAssignee1}
          onChangeAssignee2={setEditTaskAssignee2}
          onChangeAssignee3={setEditTaskAssignee3}
          onChangeStartDate={setEditTaskStartDate}
          onChangeDuration={setEditTaskDuration}
          onChangeProgress={setEditTaskProgress}
          onChangeWorkdayMode={setEditTaskWorkdayMode}
          onToggleCustomWorkday={toggleEditTaskCustomWorkday}
          onClose={() => setEditingTaskId(null)}
          onSubmit={saveEditedTask}
          onDelete={deleteEditingTask}
        />
      )}

      {isProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">新規プロジェクト</h2>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-600">
                プロジェクト名
              </label>

              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="例：RPGゲーム制作"
                className="w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setIsProjectModalOpen(false)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 hover:bg-slate-100"
              >
                キャンセル
              </button>

              <button
                onClick={addProject}
                className="rounded-xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
              >
                作成
              </button>
            </div>
          </div>
        </div>
      )}

      {isRenameModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold">
              プロジェクト名変更
            </h2>

            <input
              type="text"
              value={renameProjectName}
              onChange={(e) =>
                setRenameProjectName(
                  e.target.value
                )
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
            />

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() =>
                  setIsRenameModalOpen(false)
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 hover:bg-slate-100"
              >
                キャンセル
              </button>

              <button
                onClick={renameProject}
                className="rounded-xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {isShareSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-2 text-xl font-bold">共有設定</h2>

            <p className="mb-4 text-sm text-slate-500">
              TGS共同編集で使用するOneDrive共有フォルダのリンクを設定します。
            </p>

            <label className="mb-2 block text-sm font-bold text-slate-600">
              共有フォルダリンク
            </label>

            <input
              type="text"
              value={sharedFolderUrl}
              onChange={(e) => setSharedFolderUrl(e.target.value)}
              placeholder="https://..."
              className="mb-4 w-full rounded-xl border border-slate-300 px-4 py-3"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsShareSettingsOpen(false)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 hover:bg-slate-100"
              >
                閉じる
              </button>

              <button
                type="button"
                onClick={() => {
                  localStorage.setItem(
                    "tsukuroute-shared-folder-url",
                    sharedFolderUrl
                  );

                  alert("共有設定を保存しました");
                  setIsShareSettingsOpen(false);
                }}
                className="rounded-xl bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      <HelpMenu feedbackUrl=
        "https://docs.google.com/forms/d/e/1FAIpQLSdfd8H-WeQlqviXlfpa91sZ60uU2RO0g53Rhk_tNgVWHIREsg/viewform?usp=publish-editor" />
      <VersionLabel version={APP_VERSION} />
    </main>
  );
}