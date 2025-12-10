export type User = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  capacity: number; // weekly hours
};

export type Comment = {
  id: string;
  authorId: string;
  message: string;
  createdAt: string;
};

export type Activity = {
  id: string;
  message: string;
  createdAt: string;
  kind: "task" | "comment" | "assign" | "status" | "milestone";
};

export type Task = {
  id: string;
  title: string;
  description: string;
  labels: string[];
  status: "backlog" | "in-progress" | "review" | "done";
  priority: "low" | "medium" | "high";
  due: string;
  assignees: string[];
  comments: Comment[];
  activity: Activity[];
};

export type Column = {
  id: string;
  title: string;
  taskIds: string[];
};

export type Board = {
  id: string;
  projectId: string;
  columns: Column[];
};

export type Project = {
  id: string;
  name: string;
  description: string;
  due: string;
  status: "on-track" | "at-risk" | "blocked";
  team: string[];
};

export type WorkloadDay = {
  day: string;
  load: number; // hours booked
};

export type Workload = Record<string, WorkloadDay[]>;

