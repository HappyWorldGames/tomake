import { getUUID } from "../utils/uuid.js";
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
    getTaskFromId(id) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error("Database not initialized. Call initDB() first."));
                return;
            }
            const transaction = this.db.transaction(DatabaseManager.storeTasksName);
            const tasksStore = transaction.objectStore(DatabaseManager.storeTasksName);
            const request = tasksStore.get(id);
            request.onsuccess = (event) => {
                if (event.target instanceof IDBRequest) {
                    if (event.target.result)
                        resolve(Task.fromDB(event.target.result));
                    else
                        reject(new Error('Target is undefined'));
                }
                else {
                    reject(new Error('Target not IDBRequest'));
                }
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
            if (task.id == '')
                task.id = getUUID();
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
    addSubTask(parentId, task) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error("Database not initialized. Call initDB() first."));
                return;
            }
            this.getTaskFromId(parentId).then(parentTask => {
                if (!parentTask)
                    reject(new Error(`No parent with parentId: ${parentId}.`));
                if (task.parentId !== '') {
                    this.getTaskFromId(task.parentId).then(oldParentTask => {
                        if (!oldParentTask)
                            return;
                        const index = oldParentTask.childIdList.indexOf(task.id);
                        if (index > -1) {
                            oldParentTask.childIdList = oldParentTask.childIdList.slice(index, 1);
                            this.updateTask(oldParentTask);
                        }
                    });
                }
                task.parentId = parentId;
                parentTask.childIdList.push(task.id);
                this.updateTask(parentTask);
                this.getTaskFromId(task.id).then(() => {
                    this.updateTask(task).then(() => {
                        resolve(task.id);
                    });
                }, () => {
                    this.addTask(task).then(() => {
                        resolve(task.id);
                    });
                });
            });
        });
    }
    deleteTask(taskId, permanently = false) {
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
                const task = Task.fromDB(taskRequest.result);
                if (task instanceof Task) {
                    task.status = TaskStatus.Deleted;
                    if (task.childIdList.length > 0) {
                        for (const taskId of task.childIdList) {
                            this.getTaskFromId(taskId).then(task => {
                                this.deleteTask(task.id, permanently);
                            });
                        }
                    }
                    if (permanently)
                        tasksStore.delete(taskId);
                    else
                        this.updateTask(task);
                    resolve(taskId);
                }
                else
                    reject(new Error('is not a Task class.'));
            };
            taskRequest.onerror = (e) => {
                reject(e.target.error);
            };
        });
    }
    garbageCleaner() {
        this.getTasksFromIndex('status', IDBKeyRange.only(TaskStatus.Deleted)).then(tasks => {
            if (tasks.length === 0)
                return;
            for (const task of tasks) {
                const diffDays = (Date.now() - task.updatedDate.getTime()) / 86400000;
                if (diffDays > 30) {
                    this.deleteTask(task.id, true);
                }
            }
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
    async merge(remoteData) {
        const taskMap = new Map();
        [...await this.getAllTasks(), ...remoteData].forEach(task => {
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
