class Task {
/**
 * 
 * @param {number} id 
 * @param {number} parentId 
 * @param {string} listName 
 * @param {string} title 
 * @param {string} type set "text", "checkbox"
 * @param {string} tags 
 * @param {string} content 
 * @param {Date|null} startDate 
 * @param {Date|null} dueDate 
 * @param {*} reminder 
 * @param {*} repeat 
 * @param {number} priority set 0 = "nope", 1 = "Low", 2 = "Medium", 3 = "High"
 * @param {number} status set 0 = "Normal", 1 = "Completed", 2 = "Archived"
 * @param {number} createdTime 
 * @param {number} updatedTime
 * @param {number|null} completedTime 
 * @param {string} timezone 
 * @param {string} viewMode set "list", "kanban"
 */
  constructor(
    id,
    parentId = -1,
    listName = "inbox",
    title,
    type = "text",
    tags = [],
    content = "",
    startDate = null,
    dueDate = null,
    reminder = [],
    repeat = null,
    priority = 0,
    status = 0,
    createdTime = Data.now(),
    updatedTime = Data.now(),
    completedTime = null,
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone,
    viewMode = "list"
  ) {
    this.id = id;
    this.parentId = parentId;
    this.listName = listName;
    this.title = title;
    this.type = type;
    this.tags = tags;
    this.content = content;
    this.startDate = startDate;
    this.dueDate = dueDate;
    this.reminder = reminder;
    this.repeat = repeat;
    this.priority = priority;
    this.status = status;
    this.createdTime = createdTime;
    this.updatedTime = updatedTime;
    this.completedTime = completedTime;
    this.timezone = timezone;
    this.viewMode = viewMode;
  }

  constructor(data) {
    this(
      data.id,
      data.parentId,
      data.listName,
      data.title,
      data.type,
      data.tags,
      data.content,
      data.startDate,
      data.dueDate,
      data.reminder,
      data.repeat,
      data.priority,
      data.status,
      data.createdTime,
      data.updatedTime,
      data.completedTime,
      data.timezone,
      data.viewMode
    )
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