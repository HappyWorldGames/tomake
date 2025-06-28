var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Task } from "./task.js";
export class DatabaseManager {
    constructor(showError = (text) => { }) {
        this.db = null;
        this.showError = showError;
    }
    initDB() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                let request = indexedDB.open(DatabaseManager.dbName, 1);
                request.onblocked = (event) => {
                    this.showError('Upgrade blocked - Please close other tabs displaying this site.');
                };
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    db.onerror = reject;
                    if (!db.objectStoreNames.contains(DatabaseManager.storeName)) {
                        const store = db.createObjectStore(DatabaseManager.storeName, { keyPath: 'taskId', autoIncrement: false });
                        store.createIndex('parentId', 'parentId', { unique: false });
                        store.createIndex('childIdList', 'childIdList', { unique: false, multiEntry: true });
                        store.createIndex('listName', 'listName', { unique: false });
                        store.createIndex('title', 'title', { unique: false });
                        store.createIndex('description', 'description', { unique: false });
                        store.createIndex('createdDate', 'createdDate', { unique: false });
                        store.createIndex('updatedDate', 'updatedDate', { unique: false });
                        store.createIndex('completedDate', 'completedDate', { unique: false });
                        store.createIndex('startDate', 'startDate', { unique: false });
                        store.createIndex('dueDate', 'dueDate', { unique: false });
                        store.createIndex('reminder', 'reminder', { unique: false, multiEntry: true });
                        store.createIndex('repeat', 'repeat', { unique: false, multiEntry: true });
                        store.createIndex('priority', 'priority', { unique: false });
                        store.createIndex('status', 'status', { unique: false });
                    }
                };
                request.onsuccess = (event) => {
                    this.db = event.target.result;
                    resolve(this.db);
                };
                request.onerror = reject;
            });
        });
    }
    getAllTasks() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (!this.db) {
                    reject(new Error("Database not initialized. Call initDB() first."));
                    return;
                }
                const transaction = this.db.transaction(DatabaseManager.storeName);
                const tasksStore = transaction.objectStore(DatabaseManager.storeName);
                let request = tasksStore.getAll();
                request.onsuccess = (event) => {
                    resolve(event.target.result.map(taskObj => Task.fromDB(taskObj)));
                };
                request.onerror = (e) => { reject(e.target.error); };
            });
        });
    }
    getTasksFromIndex(index, keyRange) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (!this.db) {
                    reject(new Error("Database not initialized. Call initDB() first."));
                    return;
                }
                const transaction = this.db.transaction(DatabaseManager.storeName);
                const tasksStore = transaction.objectStore(DatabaseManager.storeName);
                const requestIndex = tasksStore.index(index);
                const request = requestIndex.getAll(keyRange);
                request.onsuccess = (event) => {
                    resolve(event.target.result.map(taskObj => Task.fromDB(taskObj)));
                };
                request.onerror = (e) => { reject(e.target.error); };
            });
        });
    }
    updateTask(task) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (!this.db) {
                    reject(new Error("Database not initialized. Call initDB() first."));
                    return;
                }
                const transaction = this.db.transaction(DatabaseManager.storeName, 'readwrite');
                const tasksStore = transaction.objectStore(DatabaseManager.storeName);
                if (task.id == '') {
                    if (typeof self.crypto.randomUUID !== 'function') {
                        alert("UUID generate error cant find self.crypto.randomUUID()");
                    }
                    task.id = self.crypto.randomUUID();
                }
                const request = tasksStore.put(task.toDB());
                request.onsuccess = () => {
                    const taskId = task.id;
                    resolve(taskId);
                };
                request.onerror = (e) => {
                    reject(e.target.error);
                };
            });
        });
    }
    addTask(task) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.updateTask(task);
        });
    }
    removeTask(taskId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (!this.db) {
                    reject(new Error("Database not initialized. Call initDB() first."));
                    return;
                }
                const transaction = this.db.transaction(DatabaseManager.storeName, 'readwrite');
                const tasksStore = transaction.objectStore(DatabaseManager.storeName);
                const request = tasksStore.delete(taskId);
                request.onsuccess = () => {
                    resolve(taskId);
                };
                request.onerror = (e) => {
                    reject(e.target.error);
                };
            });
        });
    }
}
DatabaseManager.dbName = 'ToMake';
DatabaseManager.storeName = 'tasks';
