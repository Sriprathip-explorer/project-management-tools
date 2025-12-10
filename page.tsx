"use client";

import { useEffect, useMemo, useState } from "react";
import { Board, Task, User, Workload } from "@/lib/types";
import { dueLabel, formatRelative } from "@/lib/utils";

type BoardPayload = {
  board: Board;
  tasks: Task[];
  users: User[];
  workload: Workload;
  activity: Task["activity"];
  project: {
    id: string;
    name: string;
    description: string;
    due: string;
    status: "on-track" | "at-risk" | "blocked";
  };
};

const labelColors: Record<string, string> = {
  ai: "bg-indigo-100 text-indigo-700",
  ux: "bg-pink-100 text-pink-700",
  realtime: "bg-emerald-100 text-emerald-700",
  platform: "bg-sky-100 text-sky-700",
  communications: "bg-amber-100 text-amber-700",
  security: "bg-rose-100 text-rose-700",
  planning: "bg-purple-100 text-purple-700",
};

export default function Home() {
  const apiBase = (process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:4000").trim();
  const [data, setData] = useState<BoardPayload | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>("t1");
  const [newComment, setNewComment] = useState("");
  const [newProject, setNewProject] = useState({ name: "", description: "", due: "" });
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "medium", due: "" });
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [liveTick, setLiveTick] = useState(0);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`${apiBase}/board`);
      if (!res.ok) return;
      const json = (await res.json()) as BoardPayload;
      setData(json);
    };
    load();
  }, [apiBase]);

  useEffect(() => {
    const id = setInterval(() => setLiveTick((t) => t + 1), 12000);
    return () => clearInterval(id);
  }, []);

  const aiNote = useMemo(() => {
    const prompts = [
      "Shift AI assistant to Review before Friday.",
      "Bundle notifications and presence in the same release.",
      "Balance Leo's load by moving QA to Noah.",
      "Group high-risk cards for Tuesday's sync.",
    ];
    return prompts[liveTick % prompts.length] ?? prompts[0];
  }, [liveTick]);

  const tasksMap = useMemo(() => {
    if (!data) return {};
    return Object.fromEntries(data.tasks.map((t) => [t.id, t]));
  }, [data]);

  const selectedTask = selectedTaskId ? tasksMap[selectedTaskId] : null;

  const handleComment = async () => {
    if (!newComment.trim() || !selectedTask || !data) return;
    const message = newComment.trim();
    setNewComment("");
    const author = data.users[0];
    const res = await fetch(`${apiBase}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: selectedTask.id,
        authorId: author.id,
        message,
      }),
    });
    const json = await res.json();
    if (json.comment) {
      setData((prev) =>
        prev
          ? {
              ...prev,
              tasks: prev.tasks.map((t) =>
                t.id === selectedTask.id
                  ? { ...t, comments: [json.comment, ...t.comments] }
                  : t
              ),
              activity: [
                {
                  id: `a-${Date.now()}`,
                  message: `${author.name} commented: ${json.comment.message}`,
                  createdAt: json.comment.createdAt,
                  kind: "comment",
                },
                ...prev.activity,
              ],
            }
          : prev
      );
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) return;
    const res = await fetch(`${apiBase}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newProject.name.trim(),
        description: newProject.description.trim(),
        due: newProject.due || undefined,
      }),
    });
    const json = await res.json();
    if (json.project) {
      setData((prev) => (prev ? { ...prev, project: json.project } : prev));
      setNewProject({ name: "", description: "", due: "" });
    }
  };

  const handleAssign = async () => {
    if (!assigneeId || !selectedTaskId || !data) return;
    const res = await fetch(`${apiBase}/tasks/${selectedTaskId}/assign`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigneeId }),
    });
    const json = await res.json();
    if (json.task) {
      setData((prev) =>
        prev
          ? {
              ...prev,
              tasks: prev.tasks.map((t) => (t.id === json.task.id ? { ...t, assignees: json.task.assignees, activity: json.task.activity } : t)),
              activity: [
                {
                  id: `a-${Date.now()}`,
                  message: `Assigned ${data.users.find((u) => u.id === assigneeId)?.name ?? "user"} to ${json.task.title}`,
                  createdAt: new Date().toISOString(),
                  kind: "assign",
                },
                ...prev.activity,
              ],
            }
          : prev
      );
      setAssigneeId("");
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTaskId || !data) return;
    const res = await fetch(`${apiBase}/tasks/${selectedTaskId}`, { method: "DELETE" });
    if (res.ok) {
      setData((prev) =>
        prev
          ? {
              ...prev,
              tasks: prev.tasks.filter((t) => t.id !== selectedTaskId),
              board: {
                ...prev.board,
                columns: prev.board.columns.map((c) => ({
                  ...c,
                  taskIds: c.taskIds.filter((id) => id !== selectedTaskId),
                })),
              },
              activity: [
                {
                  id: `a-${Date.now()}`,
                  message: `Deleted task ${selectedTask?.title ?? selectedTaskId}`,
                  createdAt: new Date().toISOString(),
                  kind: "task",
                },
                ...prev.activity,
              ],
            }
          : prev
      );
      setSelectedTaskId(null);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) return;
    const res = await fetch(`${apiBase}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        priority: newTask.priority,
        due: newTask.due || undefined,
      }),
    });
    const json = await res.json();
    if (json.task && json.board) {
      setData((prev) =>
        prev
          ? {
              ...prev,
              tasks: [json.task, ...prev.tasks],
              board: json.board,
              activity: [
                {
                  id: `a-${Date.now()}`,
                  message: `Created ${json.task.title}`,
                  createdAt: new Date().toISOString(),
                  kind: "task",
                },
                ...prev.activity,
              ],
            }
          : prev
      );
      setNewTask({ title: "", description: "", priority: "medium", due: "" });
      setSelectedTaskId(json.task.id);
    }
  };

  const handleCompleteTask = async () => {
    if (!selectedTaskId || !data) return;
    const res = await fetch(`${apiBase}/tasks/${selectedTaskId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    });
    const json = await res.json();
    if (json.task && json.board) {
      setData((prev) =>
        prev
          ? {
              ...prev,
              tasks: prev.tasks.map((t) => (t.id === json.task.id ? { ...t, status: json.task.status, activity: json.task.activity } : t)),
              board: json.board,
              activity: [
                {
                  id: `a-${Date.now()}`,
                  message: `Completed ${json.task.title}`,
                  createdAt: new Date().toISOString(),
                  kind: "status",
                },
                ...prev.activity,
              ],
            }
          : prev
      );
    }
  };

  if (!data) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-900 text-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="mb-4 h-3 w-24 animate-pulse rounded-full bg-white/20" />
          <div className="mb-2 h-10 w-64 animate-pulse rounded-full bg-white/20" />
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-2xl bg-white/10"
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  const { board, project, users, workload, activity } = data;
  const columns = board.columns;
  const dueSoon = data.tasks.filter((t) => new Date(t.due).getTime() - now < 1000 * 60 * 60 * 72);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-900 text-white">
      <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
        <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-indigo-500/10 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-indigo-200">
                Collaborative • AI guided • Realtime
              </p>
              <h1 className="text-3xl font-semibold mt-1">{project.name}</h1>
              <p className="text-sm text-indigo-100/80 mt-1">
                {project.description}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Live presence · {users.length} teammates
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <StatCard label="Tasks due soon" value={`${dueSoon.length}`} hint="Next 72h" />
            <StatCard label="Velocity" value="18.2" hint="story points / wk" />
            <StatCard label="Status" value={project.status === "on-track" ? "On track" : "At risk"} hint={dueLabel(project.due)} />
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Project board</h2>
              <div className="flex gap-2 text-xs text-indigo-100">
                <Badge>Realtime</Badge>
                <Badge>Threaded comments</Badge>
                <Badge>AI hints</Badge>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              {columns.map((column) => (
                <div
                  key={column.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-3"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-indigo-100">
                      {column.title}
                    </p>
                    <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-indigo-100">
                      {column.taskIds.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {column.taskIds.map((taskId) => {
                      const task = tasksMap[taskId];
                      return (
                        <button
                          key={task.id}
                          onClick={() => setSelectedTaskId(task.id)}
                          className={`w-full rounded-xl border border-white/10 bg-white/5 p-3 text-left transition hover:-translate-y-0.5 hover:border-indigo-300/40 hover:bg-white/10 ${
                            selectedTaskId === task.id
                              ? "ring-2 ring-indigo-400/60"
                              : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-white">
                              {task.title}
                            </p>
                            <span
                              className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${
                                task.priority === "high"
                                  ? "bg-rose-100 text-rose-700"
                                  : task.priority === "medium"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {task.priority}
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs text-indigo-100/80">
                            {task.description}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {task.labels.map((label) => (
                              <span
                                key={label}
                                className={`rounded-full px-2 py-1 text-[10px] font-semibold ${labelColors[label] ?? "bg-white/10 text-white"}`}
                              >
                                {label}
                              </span>
                            ))}
                          </div>
                          <div className="mt-3 flex items-center justify-between text-[11px] text-indigo-100/70">
                            <span>{dueLabel(task.due)}</span>
                            <span>{task.comments.length} comments</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">AI copilot</p>
                <span className="text-[11px] text-indigo-100/80">
                  Live hints
                </span>
              </div>
              <p className="mt-2 text-sm text-indigo-100">{aiNote}</p>
              <div className="mt-3 flex gap-2 text-xs text-indigo-100/80">
                <Badge>Conflict alerts</Badge>
                <Badge>Meeting prep</Badge>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Activity</p>
                <span className="text-[10px] uppercase tracking-[0.2em] text-indigo-200">
                  Live
                </span>
              </div>
              <div className="mt-3 space-y-3">
                {activity.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-xl bg-white/5 p-3"
                  >
                    <div className="mt-1 h-2 w-2 rounded-full bg-emerald-400" />
                    <div>
                      <p className="text-sm text-white">{item.message}</p>
                      <p className="text-[11px] text-indigo-100/70">
                        {formatRelative(item.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Task details
              </h3>
              <span className="text-xs text-indigo-100/80">
                Threaded discussion
              </span>
            </div>
            {selectedTask ? (
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-indigo-100">
                    {selectedTask.status}
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-indigo-100">
                    {dueLabel(selectedTask.due)}
                  </span>
                </div>
                <p className="text-base font-semibold text-white">
                  {selectedTask.title}
                </p>
                <p className="text-sm text-indigo-100/90">
                  {selectedTask.description}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteTask}
                    className="rounded-xl bg-rose-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-rose-400"
                  >
                    Delete task
                  </button>
                  <button
                    onClick={handleCompleteTask}
                    className="rounded-xl bg-emerald-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-400"
                  >
                    Mark done
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-indigo-100/80">Assignees:</span>
                  {selectedTask.assignees.map((id) => {
                    const user = users.find((u) => u.id === id);
                    return (
                      <span
                        key={id}
                        className="rounded-full bg-emerald-100/80 px-3 py-1 text-xs font-semibold text-emerald-800"
                      >
                        {user?.name ?? "Unknown"}
                      </span>
                    );
                  })}
                  <select
                    className="rounded-xl border border-white/10 bg-white/5 px-2 py-1 text-xs text-white"
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                  >
                    <option value="">Assign user...</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id} className="text-black">
                        {user.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAssign}
                    className="rounded-xl bg-indigo-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-indigo-400"
                  >
                    Assign
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedTask.assignees.map((id) => {
                    const user = users.find((u) => u.id === id);
                    return (
                      <span
                        key={id}
                        className="rounded-full bg-emerald-100/80 px-3 py-1 text-xs font-semibold text-emerald-800"
                      >
                        {user?.name ?? "Unknown"}
                      </span>
                    );
                  })}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    Comments
                  </p>
                  <div className="mt-2 space-y-2">
                    {selectedTask.comments.map((comment) => {
                      const user = users.find((u) => u.id === comment.authorId);
                      return (
                        <div
                          key={comment.id}
                          className="rounded-2xl border border-white/10 bg-white/5 p-3"
                        >
                          <p className="text-sm font-semibold text-white">
                            {user?.name ?? "Guest"}
                          </p>
                          <p className="text-xs text-indigo-100/80">
                            {comment.message}
                          </p>
                          <p className="text-[11px] text-indigo-100/70">
                            {formatRelative(comment.createdAt)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Drop a quick update…"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-indigo-100/60 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                    <button
                      onClick={handleComment}
                      className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-indigo-100/80">
                Select a card to see details and comments.
              </p>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">
                  Create group project
                </h3>
                <span className="text-xs text-indigo-100/70">
                  Demo (in-memory)
                </span>
              </div>
              <div className="mt-3 grid gap-2">
                <input
                  value={newProject.name}
                  onChange={(e) => setNewProject((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Project name"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-indigo-100/60 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <input
                  value={newProject.description}
                  onChange={(e) => setNewProject((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Description"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-indigo-100/60 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <input
                  type="date"
                  value={newProject.due}
                  onChange={(e) => setNewProject((p) => ({ ...p, due: e.target.value }))}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-indigo-100/60 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <button
                  onClick={handleCreateProject}
                  className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
                >
                  Create project
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">
                  Create task
                </h3>
                <span className="text-xs text-indigo-100/70">
                  Adds to Backlog
                </span>
              </div>
              <div className="mt-3 grid gap-2">
                <input
                  value={newTask.title}
                  onChange={(e) => setNewTask((t) => ({ ...t, title: e.target.value }))}
                  placeholder="Task title"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-indigo-100/60 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask((t) => ({ ...t, description: e.target.value }))}
                  placeholder="Description"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-indigo-100/60 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  rows={3}
                />
                <div className="flex gap-2">
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask((t) => ({ ...t, priority: e.target.value }))}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                  >
                    <option value="low" className="text-black">Low</option>
                    <option value="medium" className="text-black">Medium</option>
                    <option value="high" className="text-black">High</option>
                  </select>
                  <input
                    type="date"
                    value={newTask.due}
                    onChange={(e) => setNewTask((t) => ({ ...t, due: e.target.value }))}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-indigo-100/60 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  />
                </div>
                <button
                  onClick={handleCreateTask}
                  className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-400"
                >
                  Create task
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">
                  Workload heatmap
                </h3>
                <span className="text-xs text-indigo-100/70">
                  Capacity vs bookings
                </span>
              </div>
              <div className="mt-3 space-y-3">
                {users.map((user) => (
                  <div key={user.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-indigo-100">
                      <span>{user.name}</span>
                      <span>{user.capacity}h cap</span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {workload[user.id]?.map((day) => (
                        <div
                          key={day.day}
                          className="flex flex-col items-center gap-1 rounded-xl bg-white/5 px-2 py-2 text-[11px] text-indigo-100"
                        >
                          <span>{day.day}</span>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-indigo-300 to-rose-300"
                              style={{
                                width: `${Math.min(
                                  (day.load / user.capacity) * 100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                          <span className="text-[10px] text-indigo-100/70">
                            {day.load}h
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">
                  Timeline
                </h3>
                <span className="text-xs text-indigo-100/70">
                  Milestones
                </span>
              </div>
              <div className="mt-3 space-y-2">
                {data.activity.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-xl bg-white/5 p-3"
                  >
                    <div className="h-10 w-1 rounded-full bg-gradient-to-b from-indigo-300 to-emerald-300" />
                    <div>
                      <p className="text-sm text-white">{item.message}</p>
                      <p className="text-[11px] text-indigo-100/70">
                        {formatRelative(item.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-indigo-200">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      <p className="text-sm text-indigo-100/80">{hint}</p>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-indigo-100">
      {children}
    </span>
  );
}
