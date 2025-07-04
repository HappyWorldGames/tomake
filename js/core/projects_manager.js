var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { DatabaseManager } from "./database_manager.js";
import { Project, ProjectStatus } from "./project.js";
export class ProjectsManager {
    constructor() {
        this.db = null;
    }
    getAllProjects() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error("Database not initialized. Call initDB() first."));
                return;
            }
            const transaction = this.db.transaction(DatabaseManager.storeProjectsName);
            const tasksStore = transaction.objectStore(DatabaseManager.storeProjectsName);
            let request = tasksStore.getAll();
            request.onsuccess = (event) => {
                resolve(event.target.result.map(projectObj => Project.fromDB(projectObj)));
            };
            request.onerror = (e) => { reject(e.target.error); };
        });
    }
    getProjectsFromIndex(index, keyRange) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error("Database not initialized. Call initDB() first."));
                return;
            }
            const transaction = this.db.transaction(DatabaseManager.storeProjectsName);
            const tasksStore = transaction.objectStore(DatabaseManager.storeProjectsName);
            const requestIndex = tasksStore.index(index);
            const request = requestIndex.getAll(keyRange);
            request.onsuccess = (event) => {
                resolve(event.target.result.map(projectObj => Project.fromDB(projectObj)));
            };
            request.onerror = (e) => { reject(e.target.error); };
        });
    }
    updateProject(project, isImportData = false) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error("Database not initialized. Call initDB() first."));
                return;
            }
            const transaction = this.db.transaction(DatabaseManager.storeProjectsName, 'readwrite');
            const projectsStore = transaction.objectStore(DatabaseManager.storeProjectsName);
            if (project.id == '') {
                if (typeof self.crypto.randomUUID !== 'function') {
                    alert("UUID generate error cant find self.crypto.randomUUID()");
                }
                project.id = self.crypto.randomUUID();
            }
            if (!isImportData)
                project.updatedDate = new Date();
            const request = projectsStore.put(project.toDB());
            request.onsuccess = () => {
                resolve(project.id);
            };
            request.onerror = (e) => {
                reject(e.target.error);
            };
        });
    }
    addProject(project, isImportData = false) {
        if (!isImportData)
            project.createdDate = new Date();
        return this.updateProject(project, isImportData);
    }
    deleteProject(projectId, dbManager) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (!this.db) {
                    reject(new Error("Database not initialized. Call initDB() first."));
                    return;
                }
                const transaction = this.db.transaction(DatabaseManager.storeProjectsName, 'readwrite');
                const projectStore = transaction.objectStore(DatabaseManager.storeProjectsName);
                const projectRequest = projectStore.get(projectId);
                projectRequest.onsuccess = () => {
                    if (projectRequest.result === undefined)
                        return;
                    const project = projectRequest.result;
                    if (project instanceof Project) {
                        project.status = ProjectStatus.Deleted;
                        dbManager.tasksManager.getTasksFromIndex('listNameId', IDBKeyRange.only(projectId)).then(projectTasks => {
                            for (const task of projectTasks) {
                                dbManager.tasksManager.deleteTask(task.id);
                            }
                        });
                        this.updateProject(project);
                        resolve(projectId);
                    }
                    else
                        resolve('');
                };
                projectRequest.onerror = (e) => {
                    reject(e.target.error);
                };
            });
        });
    }
    clear() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error("Database not initialized. Call initDB() first."));
                return;
            }
            const transaction = this.db.transaction(DatabaseManager.storeProjectsName, 'readwrite');
            const projectsStore = transaction.objectStore(DatabaseManager.storeProjectsName);
            const request = projectsStore.clear();
            request.onsuccess = () => {
                resolve(true);
            };
            request.onerror = (e) => {
                reject(e.target.error);
            };
        });
    }
}
