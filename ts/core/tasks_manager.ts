import { DatabaseManager } from "./database_manager.js";
import { Task, TaskStatus } from "./task.js";

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

    updateTask(task: Task, isImportData = false) { return new Promise((resolve, reject) => {
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

        if (!isImportData) task.updatedDate = new Date();
        const request = tasksStore.put(task.toDB());

        request.onsuccess = () => {
            resolve(task.id);
        };

        request.onerror = (e) => {
            reject((e.target as IDBTransaction).error);
        };
    });}

    addTask(task: Task, isImportData = false) {
        if (!isImportData) task.createdDate = new Date();
        return this.updateTask(task, isImportData);
    }

    addSubTask(parentId: string, task: Task) { return new Promise((resolve, reject) => {
        if (!this.db) {
            reject(new Error("Database not initialized. Call initDB() first."));
            return;
        }

        this.getTasksFromIndex('taskId', IDBKeyRange.only(parentId)).then( tasks => {
            if (tasks.length === 0) reject(new Error(`No parent with parentId: ${parentId}.`));
            const parentTask = tasks[0];

            // Remove childIdList from previous parentId
            if (task.parentId !== '') {
                this.getTasksFromIndex('taskId', IDBKeyRange.only(task.parentId)).then(tasks => {
                    if (tasks.length === 0) return;
                    const oldParentTask = tasks[0];
                    const index = oldParentTask.childIdList.indexOf(task.id);
                    if (index > -1) {
                        oldParentTask.childIdList = oldParentTask.childIdList.slice(index, 1);
                        this.updateTask(oldParentTask);
                    }
                })
            }

            // Set new parentId and update parentTask
            task.parentId = parentId;
            parentTask.childIdList.push(task.id);
            this.updateTask(parentTask);

            // Check if a task exists in the database
            this.getTasksFromIndex('taskId', IDBKeyRange.only(task.id)).then( tasks => {
                if (tasks.length === 0) this.addTask(task);
                resolve(task.id);
            });
        });
    });}

    // TODO If you delete, then during synchronization, the deleted ones will be restored,
    // + the solution is to set the status of the deleted and fix the date of the change, +
    // after 30 days after the change, delete. When displaying, check the status if deleted, then do not display.
    // Also add a check during synchronization, if more than 30 days have passed, do not download the deleted object.
    // Add a cleaner, from time to time the cleaner will run and check deleted objects and if more than 30 days have passed, delete them from the database.
    deleteTask(taskId: string): Promise<string> { return new Promise((resolve, reject) => {
        if (!this.db) {
            reject(new Error("Database not initialized. Call initDB() first."));
            return;
        }

        const transaction = this.db.transaction(DatabaseManager.storeTasksName, 'readwrite');
        const tasksStore = transaction.objectStore(DatabaseManager.storeTasksName);

        const taskRequest = tasksStore.get(taskId);

        taskRequest.onsuccess = () => {
            if (taskRequest.result === undefined) return;
            const task = taskRequest.result;

            if (task instanceof Task) {
                task.status = TaskStatus.Deleted;

                if (task.parentId !== '') {
                    this.getTasksFromIndex('taskId', IDBKeyRange.only(task.parentId)).then( tasks => {
                        this.deleteTask(tasks[0].id);
                    });
                }
                if (task.childIdList.length > 0) {
                    for (const taskId of task.childIdList) {
                        this.getTasksFromIndex('taskId', IDBKeyRange.only(taskId)).then( tasks => {
                            this.deleteTask(tasks[0].id);
                        })
                    }
                }
            }

            this.updateTask(task);

            resolve(taskId);
        };

        taskRequest.onerror = (e) => {
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