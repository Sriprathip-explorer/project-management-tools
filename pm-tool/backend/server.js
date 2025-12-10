import express from "express";
import cors from "cors";
import { db } from "./data.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/board", (_req, res) => {
  res.json({
    board: db.board,
    tasks: db.tasks,
    project: db.projects[0] ?? db.project,
    users: db.users,
    workload: db.workload,
    activity: db.activity,
  });
});

app.post("/projects", (req, res) => {
  const { name, description, due } = req.body ?? {};
  if (!name) return res.status(400).json({ error: "Name required" });
  const project = {
    id: `p-${Date.now()}`,
    name,
    description: description ?? "",
    due: due ?? new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    status: "on-track",
    team: [...db.users.map((u) => u.id)],
  };
  db.projects.unshift(project);
  db.project = project;
  res.json({ project });
});

app.post("/tasks", (req, res) => {
  const { title, description, labels, priority, due } = req.body ?? {};
  if (!title) return res.status(400).json({ error: "title required" });
  const task = {
    id: `t-${Date.now()}`,
    title,
    description: description ?? "",
    labels: Array.isArray(labels) ? labels : [],
    status: "backlog",
    priority: priority ?? "medium",
    due: due ?? new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(),
    assignees: [],
    comments: [],
    activity: [],
  };
  db.tasks.unshift(task);
  const backlog = db.board.columns.find((c) => c.id === "backlog");
  if (backlog && !backlog.taskIds.includes(task.id)) backlog.taskIds.unshift(task.id);
  db.activity.unshift({
    id: `a-${Date.now()}`,
    message: `Created task ${task.title}`,
    createdAt: new Date().toISOString(),
    kind: "task",
  });
  res.json({ task, board: db.board });
});

app.patch("/tasks/:id/assign", (req, res) => {
  const { id } = req.params;
  const { assigneeId } = req.body ?? {};
  if (!assigneeId) return res.status(400).json({ error: "assigneeId required" });
  const task = db.tasks.find((t) => t.id === id);
  if (!task) return res.status(404).json({ error: "Task not found" });
  if (!db.users.find((u) => u.id === assigneeId)) {
    return res.status(404).json({ error: "User not found" });
  }
  if (!task.assignees.includes(assigneeId)) {
    task.assignees.push(assigneeId);
    task.activity.unshift({
      id: `a-${Date.now()}`,
      message: `${db.users.find((u) => u.id === assigneeId)?.name ?? "User"} was assigned`,
      createdAt: new Date().toISOString(),
      kind: "assign",
    });
  }
  res.json({ task });
});

app.patch("/tasks/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body ?? {};
  const allowed = ["backlog", "in-progress", "review", "done"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  const task = db.tasks.find((t) => t.id === id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  task.status = status;
  db.board.columns.forEach((col) => {
    col.taskIds = col.taskIds.filter((tid) => tid !== id);
  });
  const targetCol = db.board.columns.find((c) => c.id === (status === "done" ? "done" : status));
  if (targetCol && !targetCol.taskIds.includes(id)) {
    targetCol.taskIds.push(id);
  }
  task.activity.unshift({
    id: `a-${Date.now()}`,
    message: `Marked ${task.title} as ${status}`,
    createdAt: new Date().toISOString(),
    kind: "status",
  });

  res.json({ task, board: db.board });
});

app.delete("/tasks/:id", (req, res) => {
  const { id } = req.params;
  const taskIdx = db.tasks.findIndex((t) => t.id === id);
  if (taskIdx === -1) return res.status(404).json({ error: "Task not found" });

  db.tasks.splice(taskIdx, 1);
  db.board.columns.forEach((col) => {
    col.taskIds = col.taskIds.filter((tid) => tid !== id);
  });
  db.activity.unshift({
    id: `a-${Date.now()}`,
    message: `Deleted task ${id}`,
    createdAt: new Date().toISOString(),
    kind: "task",
  });

  res.json({ ok: true });
});

app.post("/comments", (req, res) => {
  const { taskId, authorId, message } = req.body ?? {};
  if (!taskId || !authorId || !message) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const task = db.tasks.find((t) => t.id === taskId);
  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  const comment = {
    id: `c-${Date.now()}`,
    authorId,
    message,
    createdAt: new Date().toISOString(),
  };

  task.comments.unshift(comment);
  task.activity.unshift({
    id: `a-${Date.now()}`,
    message: `${db.users.find((u) => u.id === authorId)?.name ?? "Someone"} commented: ${message}`,
    createdAt: comment.createdAt,
    kind: "comment",
  });

  res.json({ comment });
});

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

