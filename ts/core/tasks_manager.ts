import { DatabaseManager } from "./database_manager.js";
import { Task } from "./task.js";

export class TasksManager {

    db: IDBDatabase | null = null;

    constructor() {}

    getAllTasks(): Promise<Array<Task>> { return new Promise((resolve, reject) => {
        if (!this.db) {
            reject(new Error("Database not initialized. Call initDB() first."));
            return;
        }

        const transaction = this.db.transaction(DatabaseManager.storeTasksName);
        const tasksStore = transaction.objectStore(DatabaseManager.storeTasksName);
        let request = tasksStore.getAll();

        request.onsuccess = (event) => {
            resolve(((event.target as IDBRequest).result as any[]).map(taskObj => Task.fromDB(taskObj)));
        }
        request.onerror = (e) => { reject((e.target as IDBTransaction).error); }
    });}

    getTasksFromIndex(index: string, keyRange: IDBKeyRange): Promise<Array<Task>> { return new Promise((resolve, reject) => {
        if (!this.db) {
            reject(new Error("Database not initialized. Call initDB() first."));
            return;
        }

        const transaction = this.db.transaction(DatabaseManager.storeTasksName);
        const tasksStore = transaction.objectStore(DatabaseManager.storeTasksName);
        const requestIndex = tasksStore.index(index);

        const request = requestIndex.getAll(keyRange);

        request.onsuccess = (event) => { 
            resolve(((event.target as IDBRequest).result as any[]).map(taskObj => Task.fromDB(taskObj)));
        }
        request.onerror = (e) => { reject((e.target as IDBTransaction).error); }
    });}

    updateTask(task: Task) { return new Promise((resolve, reject) => {
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
            reject((e.target as IDBTransaction).error);
        };
    });}

    addTask(task: Task) {
        return this.updateTask(task);
    }

    addSubTask(task: Task, parentId: string) {
        // TODO check has parent after add child to parent
    }

    // TODO If you delete, then during synchronization, the deleted ones will be restored, 
    // the solution is to set the status of the deleted and fix the date of the change, 
    // after 30 days after the change, delete. When displaying, check the status if deleted, then do not display.
    deleteTask(taskId: string): Promise<string> { return new Promise((resolve, reject) => {
        if (!this.db) {
            reject(new Error("Database not initialized. Call initDB() first."));
            return;
        }

        const transaction = this.db.transaction(DatabaseManager.storeTasksName, 'readwrite');
        const tasksStore = transaction.objectStore(DatabaseManager.storeTasksName);

        const taskChildRequest = tasksStore.get(taskId);
        const request = tasksStore.delete(taskId);

        request.onsuccess = () => {
            // TODO check and delete child and update database
            // TODO check and delete parent and update database
            resolve(taskId);
        };

        request.onerror = (e) => {
            reject((e.target as IDBTransaction).error);
        };
    });}

    clear() { return new Promise((resolve, reject) => {
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
            reject((e.target as IDBTransaction).error);
        };
    });}

}