import { getUUID } from "../utils/uuid.js";
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

    getTaskFromId(id: string): Promise<Task> { return new Promise((resolve, reject) => {
        if (!this.db) {
            reject(new Error("Database not initialized. Call initDB() first."));
            return;
        }

        const transaction = this.db.transaction(DatabaseManager.storeTasksName);
        const tasksStore = transaction.objectStore(DatabaseManager.storeTasksName);

        const request = tasksStore.get(id);

        request.onsuccess = (event) => {
            if (event.target instanceof IDBRequest) {
                if (event.target.result) resolve(Task.fromDB((event.target as IDBRequest).result));
                else reject(new Error('Target is undefined'));
            } else {
                reject(new Error('Target not IDBRequest'));
            }
        }
        request.onerror = (e) => { reject((e.target as IDBTransaction).error); }
    });}

    getTasksFromIndex(index: string, keyRange: IDBKeyRange | null): Promise<Array<Task>> { return new Promise((resolve, reject) => {
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

        if (task.id == '') task.id = getUUID();

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

    addSubTask(parentId: string, task: Task): Promise<string> { return new Promise((resolve, reject) => {
        if (!this.db) {
            reject(new Error("Database not initialized. Call initDB() first."));
            return;
        }

        this.getTaskFromId(parentId).then( parentTask => {
            if (!parentTask) reject(new Error(`No parent with parentId: ${parentId}.`));

            // Remove childIdList from previous parentId
            if (task.parentId !== '') {
                this.getTaskFromId(task.parentId).then(oldParentTask => {
                    if (!oldParentTask) return;
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
            this.getTaskFromId(task.id).then( () => {
                this.updateTask(task).then( () => {
                    resolve(task.id);
                });
            }, () => {
                this.addTask(task).then( () => {
                    resolve(task.id);
                });
            });
        });
    });}

    // TODO If you delete, then during synchronization, the deleted ones will be restored,
    // + the solution is to set the status of the deleted and fix the date of the change, +
    // after 30 days after the change, delete. When displaying, check the status if deleted, then do not display.
    // Also add a check during synchronization, if more than 30 days have passed, do not download the deleted object.
    // + Add a cleaner, from time to time the cleaner will run and check deleted objects and if more than 30 days have passed, delete them from the database. +
    deleteTask(taskId: string, permanently = false): Promise<string> { return new Promise((resolve, reject) => {
        if (!this.db) {
            reject(new Error("Database not initialized. Call initDB() first."));
            return;
        }

        const transaction = this.db.transaction(DatabaseManager.storeTasksName, 'readwrite');
        const tasksStore = transaction.objectStore(DatabaseManager.storeTasksName);

        const taskRequest = tasksStore.get(taskId);

        taskRequest.onsuccess = () => {
            if (taskRequest.result === undefined) return;
            const task = Task.fromDB(taskRequest.result);

            if (task instanceof Task) {
                task.status = TaskStatus.Deleted;

                if (task.childIdList.length > 0) {
                    for (const taskId of task.childIdList) {
                        this.getTaskFromId(taskId).then( task => {
                            this.deleteTask(task.id, permanently);
                        })
                    }
                }

                if (permanently) tasksStore.delete(taskId);
                else this.updateTask(task);

                resolve(taskId);
            } else reject(new Error('is not a Task class.'));
        };

        taskRequest.onerror = (e) => {
            reject((e.target as IDBTransaction).error);
        };
    });}

    garbageCleaner() {
        this.getTasksFromIndex('status', IDBKeyRange.only(TaskStatus.Deleted)).then( tasks => {
            if (tasks.length === 0) return;

            for (const task of tasks) {
                const diffDays = (Date.now() - task.updatedDate.getTime()) / 86400000;

                if (diffDays > 30) {
                    this.deleteTask(task.id, true);
                }
            }
        });
    }

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

    async merge(remoteData: Task[]) {
        const taskMap = new Map<string, Task>();

        [...await this.getAllTasks(), ...remoteData].forEach( task => {
            const existing = taskMap.get(task.id);
            if (!existing || task.updatedDate > existing.updatedDate)
                taskMap.set(task.id, task);
        });

        await this.clear();
        Array.from(taskMap.values()).forEach(task => {
            this.addTask(task, true);
        });
    }

}