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
                resolve(Task.fromDB(event.target.result));
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
                this.getTaskFromId(task.id).then(subTask => {
                    if (!subTask)
                        this.addTask(task);
                    resolve(task.id);
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
                    if (task.parentId !== '') {
                        this.getTaskFromId(task.parentId).then(task => {
                            this.deleteTask(task.id, permanently);
                        });
                    }
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
                const diffDays = (Date.now() - task.updatedDate.getTime()) / (1000 * 60 * 60 * 24);
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
}
