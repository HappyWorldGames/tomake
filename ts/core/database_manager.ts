import { Task } from "./task.js";

export class DatabaseManager {
    static dbName: string = 'ToMake';
    static storeName: string = 'tasks';
    db: IDBDatabase | null = null;

    showError: (text: string) => void

    constructor(showError = (text: string) => {}) {
        this.showError = showError
    }

    async initDB(): Promise<IDBDatabase> { return new Promise((resolve, reject) => {
        let request = indexedDB.open(DatabaseManager.dbName, 1);

        request.onblocked = (event) => {
            this.showError('Upgrade blocked - Please close other tabs displaying this site.');
        }
        
        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

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
        }

        request.onsuccess = (event) => {
            this.db = (event.target as IDBOpenDBRequest).result;
            resolve(this.db);
        }

        request.onerror = reject;
    });}

    async getAllTasks(): Promise<Array<Task>> { return new Promise((resolve, reject) => {
        if (!this.db) {
            reject(new Error("Database not initialized. Call initDB() first."));
            return;
        }

        const transaction = this.db.transaction(DatabaseManager.storeName);
        const store = transaction.objectStore(DatabaseManager.storeName);
        let request = store.getAll();

        request.onsuccess = (event) => { 
            resolve(((event.target as IDBRequest).result as any[]).map(taskObj => Task.fromDB(taskObj)));
        }
        request.onerror = (e) => { reject((e.target as IDBTransaction).error); }
    });}

    async updateTask(task: Task) { return new Promise((resolve, reject) => {
        if (!this.db) {
            reject(new Error("Database not initialized. Call initDB() first."));
            return;
        }

        const transaction = this.db.transaction(DatabaseManager.storeName, 'readwrite');
        const tasks = transaction.objectStore(DatabaseManager.storeName);

        if (task.id == '') {
            if (typeof self.crypto.randomUUID !== 'function') {
                alert("UUID generate error cant find self.crypto.randomUUID()");
            }

            task.id = self.crypto.randomUUID(); // Генерируем UUID с помощью встроенного API
        }

        const request = tasks.put(task.toDB());

        request.onsuccess = (event) => {
            const taskId = task.id;
            resolve(taskId);
        };

        request.onerror = (e) => {
            reject((e.target as IDBTransaction).error);
        };
    });}

    async addTask(updatedTaskData: Task) {
        return this.updateTask(updatedTaskData);
    }

    async removeTask(taskId: string): Promise<string> { return new Promise((resolve, reject) => {
        if (!this.db) {
            reject(new Error("Database not initialized. Call initDB() first."));
            return;
        }

        const transaction = this.db.transaction(DatabaseManager.storeName, 'readwrite');
        const store = transaction.objectStore(DatabaseManager.storeName);

        const request = store.delete(taskId);

        request.onsuccess = (event) => {
            resolve(taskId);
        };

        request.onerror = (e) => {
            reject((e.target as IDBTransaction).error);
        };
    });}

}