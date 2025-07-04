import { DatabaseManager } from "./database_manager.js";
import { Task, TaskStatus } from "./task.js";
export class TasksManager {
    constructor() {
        this.db = null;
    }
    getAllTasks() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error("Database not initialized. Call initDB() first."));
                return;
            }
            const transaction = this.db.transaction(DatabaseManager.storeTasksName);
            const tasksStore = transaction.objectStore(DatabaseManager.storeTasksName);
            let request = tasksStore.getAll();
            request.onsuccess = (event) => {
                resolve(event.target.result.map(taskObj => Task.fromDB(taskObj)));
            };
            request.onerror = (e) => { reject(e.target.error); };
        });
    }
    getTasksFromIndex(index, keyRange) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error("Database not initialized. Call initDB() first."));
                return;
            }
            const transaction = this.db.transaction(DatabaseManager.storeTasksName);
            const tasksStore = transaction.objectStore(DatabaseManager.storeTasksName);
            const requestIndex = tasksStore.index(index);
            const request = requestIndex.getAll(keyRange);
            request.onsuccess = (event) => {
                resolve(event.target.result.map(taskObj => Task.fromDB(taskObj)));
            };
            request.onerror = (e) => { reject(e.target.error); };
        });
    }
    updateTask(task, isImportData = false) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error("Database not initialized. Call initDB() first."));
                return;
            }
            const transaction = this.db.transaction(DatabaseManager.storeTasksName, 'readwrite');
            const tasksStore = transaction.objectStore(DatabaseManager.storeTasksName);
            if (task.id == '') {
                if (typeof self.crypto.randomUUID !== 'function') {
                    alert("UUID generate error cant find self.crypto.randomUUID()");
                }
                task.id = self.crypto.randomUUID();
            }
            if (!isImportData)
                task.updatedDate = new Date();
            const request = tasksStore.put(task.toDB());
            request.onsuccess = () => {
                resolve(task.id);
            };
            request.onerror = (e) => {
                reject(e.target.error);
            };
        });
    }
    addTask(task, isImportData = false) {
        if (!isImportData)
            task.createdDate = new Date();
        return this.updateTask(task, isImportData);
    }
    addSubTask(task, parentId) {
    }
    deleteTask(taskId) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error("Database not initialized. Call initDB() first."));
                return;
            }
            const transaction = this.db.transaction(DatabaseManager.storeTasksName, 'readwrite');
            const tasksStore = transaction.objectStore(DatabaseManager.storeTasksName);
            const taskRequest = tasksStore.get(taskId);
            taskRequest.onsuccess = () => {
                if (taskRequest.result === undefined)
                    return;
                const task = taskRequest.result;
                if (task instanceof Task) {
                    task.status = TaskStatus.Deleted;
                    if (task.parentId !== -1) {
                        this.getTasksFromIndex('taskId', IDBKeyRange.only(task.parentId)).then(tasks => {
                            this.deleteTask(tasks[0].id);
                        });
                    }
                    if (task.childIdList.length > 0) {
                        for (const taskId of task.childIdList) {
                            this.getTasksFromIndex('taskId', IDBKeyRange.only(taskId)).then(tasks => {
                                this.deleteTask(tasks[0].id);
                            });
                        }
                    }
                }
                this.updateTask(task);
                resolve(taskId);
            };
            taskRequest.onerror = (e) => {
                reject(e.target.error);
            };
        });
    }
    clear() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error("Database not initialized. Call initDB() first."));
                return;
            }
            const transaction = this.db.transaction(DatabaseManager.storeTasksName, 'readwrite');
            const tasksStore = transaction.objectStore(DatabaseManager.storeTasksName);
            const request = tasksStore.clear();
            request.onsuccess = () => {
                resolve(true);
            };
            request.onerror = (e) => {
                reject(e.target.error);
            };
        });
    }
}
