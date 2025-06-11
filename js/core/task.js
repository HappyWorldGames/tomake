class Task {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate: Date | null;
  priority: "low" | "medium" | "high";
  completed: boolean;
  completedAt: Date | null;
  parentId: string | null;
  tags: string[];

  constructor(data: Partial<Task> = {}) {
    this.id = data.id || crypto.randomUUID();
    this.title = data.title || "Новая задача";
    this.description = data.description || "";
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
    this.dueDate = data.dueDate || null;
    this.priority = data.priority || "medium";
    this.completed = data.completed || false;
    this.completedAt = data.completedAt || null;
    this.parentId = data.parentId || null;
    this.tags = data.tags || [];
  }

  // Обновление свойств задачи
  update(updates: Partial<Task>): void {
    Object.assign(this, updates);
    this.updatedAt = new Date();
    
    if ("completed" in updates) {
      this.completedAt = updates.completed ? new Date() : null;
    }
  }

  // Проверка на наличие подзадач
  hasSubtasks(): boolean {
    // Логика проверки будет в TaskForest
    return false;
  }
}