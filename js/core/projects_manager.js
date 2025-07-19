import { getUUID } from "../utils/uuid.js";
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
    getProjectFromId(id) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error("Database not initialized. Call initDB() first."));
                return;
            }
            const transaction = this.db.transaction(DatabaseManager.storeProjectsName);
            const tasksStore = transaction.objectStore(DatabaseManager.storeProjectsName);
            const request = tasksStore.get(id);
            request.onsuccess = (event) => {
                const projectRes = event.target.result;
                resolve(projectRes ? Project.fromDB(projectRes) : null);
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
            if (project.id === '')
                project.id = getUUID();
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
    async deleteProject(projectId, tasksManager, permanently = false) {
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
                const project = Project.fromDB(projectRequest.result);
                if (project instanceof Project) {
                    project.status = ProjectStatus.Deleted;
                    tasksManager.getTasksFromIndex('listNameId', IDBKeyRange.only(projectId)).then(projectTasks => {
                        for (const task of projectTasks) {
                            tasksManager.deleteTask(task.id, permanently);
                        }
                    });
                    if (permanently)
                        projectStore.delete(projectId);
                    else
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
    }
    garbageCleaner(tasksManager) {
        this.getProjectsFromIndex('status', IDBKeyRange.only(ProjectStatus.Deleted)).then(projects => {
            if (projects.length === 0)
                return;
            for (const project of projects) {
                const diffDays = (Date.now() - project.updatedDate.getTime()) / (1000 * 60 * 60 * 24);
                if (diffDays > 30) {
                    this.deleteProject(project.id, tasksManager, true);
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
