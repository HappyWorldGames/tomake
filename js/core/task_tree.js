interface TaskTree {
  task: Task;
  children: TaskTree[];
  stats: {
    totalSubtasks: number;
    completedSubtasks: number;
    progress: number;
  };
}