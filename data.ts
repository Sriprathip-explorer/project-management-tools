import { Activity, Board, Comment, Project, Task, User, Workload } from "./types";

const users: User[] = [
  {
    id: "u1",
    name: "Amara Patel",
    role: "Product Lead",
    avatar: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=60",
    capacity: 32,
  },
  {
    id: "u2",
    name: "Leo Müller",
    role: "Engineering",
    avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=200&q=60",
    capacity: 28,
  },
  {
    id: "u3",
    name: "Mina Solis",
    role: "Design",
    avatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=60",
    capacity: 30,
  },
  {
    id: "u4",
    name: "Noah Idris",
    role: "QA",
    avatar: "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=200&q=60",
    capacity: 24,
  },
];

const comments: Comment[] = [
  {
    id: "c1",
    authorId: "u1",
    message: "Can we keep the dark mode toggle prominent on mobile?",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  },
  {
    id: "c2",
    authorId: "u3",
    message: "Updated the handoff links; see Figma v7.2.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
];

const activity: Activity[] = [
  {
    id: "a1",
    message: "Leo moved \"Realtime presence\" to Review",
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    kind: "status",
  },
  {
    id: "a2",
    message: "Mina uploaded new board cover illustrations",
    createdAt: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    kind: "task",
  },
  {
    id: "a3",
    message: "Amara added a milestone for the showcase demo",
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    kind: "milestone",
  },
  {
    id: "a4",
    message: "Noah commented on QA scenarios",
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    kind: "comment",
  },
];

const tasks: Task[] = [
  {
    id: "t1",
    title: "Realtime presence",
    description: "Show active cursors + typing indicators on cards.",
    labels: ["realtime", "platform"],
    status: "review",
    priority: "high",
    due: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
    assignees: ["u2", "u3"],
    comments,
    activity,
  },
  {
    id: "t2",
    title: "AI task assistant",
    description: "Summaries + next steps for each card.",
    labels: ["ai", "ux"],
    status: "in-progress",
    priority: "high",
    due: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(),
    assignees: ["u1"],
    comments: [],
    activity: [],
  },
  {
    id: "t3",
    title: "Notification inbox",
    description: "Threaded updates, filters, quiet hours.",
    labels: ["communications"],
    status: "backlog",
    priority: "medium",
    due: new Date(Date.now() + 1000 * 60 * 60 * 96).toISOString(),
    assignees: ["u4"],
    comments: [],
    activity: [],
  },
  {
    id: "t4",
    title: "Access model",
    description: "Role-based sharing for guests vs members.",
    labels: ["security"],
    status: "in-progress",
    priority: "medium",
    due: new Date(Date.now() + 1000 * 60 * 60 * 120).toISOString(),
    assignees: ["u2", "u1"],
    comments: [],
    activity: [],
  },
  {
    id: "t5",
    title: "Timeline + workload",
    description: "Visual capacity map with conflicts detection.",
    labels: ["planning"],
    status: "review",
    priority: "high",
    due: new Date(Date.now() + 1000 * 60 * 60 * 36).toISOString(),
    assignees: ["u3"],
    comments: [],
    activity: [],
  },
];

const board: Board = {
  id: "b1",
  projectId: "p1",
  columns: [
    { id: "backlog", title: "Backlog", taskIds: ["t3"] },
    { id: "in-progress", title: "In Progress", taskIds: ["t2", "t4"] },
    { id: "review", title: "Review", taskIds: ["t1", "t5"] },
    { id: "done", title: "Done", taskIds: [] },
  ],
};

const project: Project = {
  id: "p1",
  name: "Nebula Boards",
  description: "A collaborative, AI-assisted project OS for product teams.",
  due: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
  status: "on-track",
  team: ["u1", "u2", "u3", "u4"],
};

const workload: Workload = {
  u1: [
    { day: "Mon", load: 6 },
    { day: "Tue", load: 5 },
    { day: "Wed", load: 7 },
    { day: "Thu", load: 6 },
    { day: "Fri", load: 4 },
  ],
  u2: [
    { day: "Mon", load: 7 },
    { day: "Tue", load: 6 },
    { day: "Wed", load: 5 },
    { day: "Thu", load: 6 },
    { day: "Fri", load: 5 },
  ],
  u3: [
    { day: "Mon", load: 4 },
    { day: "Tue", load: 5 },
    { day: "Wed", load: 6 },
    { day: "Thu", load: 4 },
    { day: "Fri", load: 3 },
  ],
  u4: [
    { day: "Mon", load: 3 },
    { day: "Tue", load: 4 },
    { day: "Wed", load: 4 },
    { day: "Thu", load: 5 },
    { day: "Fri", load: 6 },
  ],
};

export const db = {
  users,
  tasks,
  board,
  project,
  workload,
  activity,
};

