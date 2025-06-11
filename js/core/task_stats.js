interface TaskStats {
  totalSubtasks: number;
  completedSubtasks: number;
  progress: number;
  depth: number;
  earliestDueDate: Date | null;
}