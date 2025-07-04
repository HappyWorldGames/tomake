import { DatabaseManager } from "./database_manager.js";
import { Project, ProjectStatus } from "./project.js";
import { TasksManager } from "./tasks_manager.js";

export class ProjectsManager {

    db: IDBDatabase | null = null;

    constructor() {}

    getAllProjects(): Promise<Array<Project>> { return new Promise((resolve, reject) => {
        if (!this.db) {
            reject(new Error("Database not initialized. Call initDB() first."));
            return;
        }

        const transaction = this.db.transaction(DatabaseManager.storeProjectsName);
        const tasksStore = transaction.objectStore(DatabaseManager.storeProjectsName);
        let request = tasksStore.getAll();

        request.onsuccess = (event) => {
            resolve(((event.target as IDBRequest).result as any[]).map(projectObj => Project.fromDB(projectObj)));
        }
        request.onerror = (e) => { reject((e.target as IDBTransaction).error); }
    });}

    getProjectsFromIndex(index: string, keyRange: IDBKeyRange): Promise<Array<Project>> { return new Promise((resolve, reject) => {
        if (!this.db) {
            reject(new Error("Database not initialized. Call initDB() first."));
            return;
        }

        const transaction = this.db.transaction(DatabaseManager.storeProjectsName);
        const tasksStore = transaction.objectStore(DatabaseManager.storeProjectsName);
        const requestIndex = tasksStore.index(index);

        const request = requestIndex.getAll(keyRange);

        request.onsuccess = (event) => {
            resolve(((event.target as IDBRequest).result as any[]).map(projectObj => Project.fromDB(projectObj)));
        }
        request.onerror = (e) => { reject((e.target as IDBTransaction).error); }
    });}

    updateProject(project: Project, isImportData = false) { return new Promise((resolve, reject) => {
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

        if (!isImportData) project.updatedDate = new Date();
        const request = projectsStore.put(project.toDB());

        request.onsuccess = () => {
            resolve(project.id);
        };

        request.onerror = (e) => {
            reject((e.target as IDBTransaction).error);
        };
    });}

    addProject(project: Project, isImportData = false) {
        if (!isImportData) project.createdDate = new Date();
        return this.updateProject(project, isImportData);
    }

    // TODO If you delete, then during synchronization, the deleted ones will be restored,
    // + the solution is to set the status of the deleted and fix the date of the change, +
    // after 30 days after the change, delete. When displaying, check the status if deleted, then do not display.
    // Also add a check during synchronization, if more than 30 days have passed, do not download the deleted object.
    // + Add a cleaner, from time to time the cleaner will run and check deleted objects and if more than 30 days have passed, delete them from the database. +
    async deleteProject(projectId: string, tasksManager: TasksManager, permanently = false): Promise<string> { return new Promise((resolve, reject) => {
        if (!this.db) {
            reject(new Error("Database not initialized. Call initDB() first."));
            return;
        }

        const transaction = this.db.transaction(DatabaseManager.storeProjectsName, 'readwrite');
        const projectStore = transaction.objectStore(DatabaseManager.storeProjectsName);

        const projectRequest = projectStore.get(projectId);

        projectRequest.onsuccess = () => {
            if (projectRequest.result === undefined) return;
            const project = projectRequest.result;

            if (project instanceof Project) {
                project.status = ProjectStatus.Deleted;

                tasksManager.getTasksFromIndex('listNameId', IDBKeyRange.only(projectId)).then( projectTasks => {
                    for (const task of projectTasks) {
                        tasksManager.deleteTask(task.id, permanently);
                    }
                });

                if (permanently) projectStore.delete(projectId);
                else this.updateProject(project);

                resolve(projectId);
            } else resolve('')
        };

        projectRequest.onerror = (e) => {
            reject((e.target as IDBTransaction).error);
        };
    });}

    garbageCleaner(tasksManager: TasksManager) {
        this.getProjectsFromIndex('status', IDBKeyRange.only(ProjectStatus.Deleted)).then( projects => {
            if (projects.length === 0) return;

            for (const project of projects) {
                const diffDays = (Date.now() - project.updatedDate.getTime()) / (1000 * 60 * 60 * 24);

                if (diffDays > 30) {
                    this.deleteProject(project.id, tasksManager, true);
                }
            }
        });
    }

    clear() { return new Promise((resolve, reject) => {
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
            reject((e.target as IDBTransaction).error);
        };
    });}

}