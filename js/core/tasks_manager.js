import { DatabaseManager } from "./database_manager.js";
import { Task } from "./task.js";
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
    updateTask(task) {
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
            const request = tasksStore.put(task.toDB());
            request.onsuccess = () => {
                resolve(task.id);
            };
            request.onerror = (e) => {
                reject(e.target.error);
            };
        });
    }
    addTask(task) {
        return this.updateTask(task);
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
            const taskChildRequest = tasksStore.get(taskId);
            const request = tasksStore.delete(taskId);
            request.onsuccess = () => {
                resolve(taskId);
            };
            request.onerror = (e) => {
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
