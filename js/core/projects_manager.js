import { DatabaseManager } from "./database_manager.js";
import { Project } from "./project.js";
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
    updateProject(project) {
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
            const request = projectsStore.put(project.toDB());
            request.onsuccess = () => {
                resolve(project.id);
            };
            request.onerror = (e) => {
                reject(e.target.error);
            };
        });
    }
    addProject(project) {
        return this.updateProject(project);
    }
    deleteProject(projectId) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error("Database not initialized. Call initDB() first."));
                return;
            }
            const transaction = this.db.transaction(DatabaseManager.storeProjectsName, 'readwrite');
            const tasksStore = transaction.objectStore(DatabaseManager.storeProjectsName);
            const taskChildRequest = tasksStore.get(projectId);
            const request = tasksStore.delete(projectId);
            request.onsuccess = () => {
                resolve(projectId);
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
