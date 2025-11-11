// constants/TaskConstants.ts
export enum TaskStatus {
  TODO = "To Do",
  IN_PROGRESS = "In Progress",
  DONE = "Done",
}

// You can add more task-related constants here
export const TASK_PRIORITY = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
} as const;
