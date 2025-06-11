class ToMake {
  private dbName: string;
  private dbVersion: number;
  private db: IDBDatabase | null = null;

  constructor(dbName: string = "TaskDB", version: number = 1) {
    this.dbName = dbName;
    this.dbVersion = version;
  }

  // Инициализация базы данных
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onupgradeneeded = (event) => {
        const db = request.result;
        
        // Создание хранилища задач
        if (!db.objectStoreNames.contains("tasks")) {
          const tasksStore = db.createObjectStore("tasks", { keyPath: "id" });
          tasksStore.createIndex("parentId", "parentId", { unique: false });
          tasksStore.createIndex("tags", "tags", { multiEntry: true });
          tasksStore.createIndex("completed", "completed");
        }
        
        // Создание хранилища меток
        if (!db.objectStoreNames.contains("tags")) {
          const tagsStore = db.createObjectStore("tags", { keyPath: "id" });
          tagsStore.createIndex("name", "name", { unique: true });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Основные методы работы с задачами
  async createTask(taskData: Partial<Task>): Promise<Task> { /*...*/ }
  async getTask(id: string): Promise<Task | null> { /*...*/ }
  async updateTask(id: string, updates: Partial<Task>): Promise<boolean> { /*...*/ }
  async deleteTask(id: string): Promise<boolean> { /*...*/ }

  // Методы для работы с иерархией
  async addSubtask(parentId: string, taskData: Partial<Task>): Promise<Task> { /*...*/ }
  async getSubtasks(parentId: string): Promise<Task[]> { /*...*/ }
  async moveTask(taskId: string, newParentId: string | null): Promise<boolean> { /*...*/ }
  async getTaskTree(rootId: string, depth: number = 5): Promise<TaskTree> { /*...*/ }

  // Методы для работы с метками
  async createTag(name: string): Promise<Tag> { /*...*/ }
  async assignTag(taskId: string, tagId: string): Promise<void> { /*...*/ }

  // Экспорт/импорт
  async exportData(): Promise<string> { /*...*/ }
  async importData(json: string): Promise<boolean> { /*...*/ }

  // Статистика
  async getTaskStats(taskId: string): Promise<TaskStats> { /*...*/ }
}