import { Project } from "./project.js";
import { ProjectsManager } from "./projects_manager.js";
import { Task } from "./task.js";
import { TasksManager } from "./tasks_manager.js";

export class DatabaseManager {

    static dbName: string = 'ToMake';
    static storeTasksName: string = 'tasks';
    static storeProjectsName: string = 'projects';

    db: IDBDatabase | null = null;

    tasksManager: TasksManager = new TasksManager();
    projectsManager: ProjectsManager = new ProjectsManager();

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

            this.#initTasksStore(db);
            this.#initProjectsStore(db);
        }

        request.onsuccess = (event) => {
            this.db = (event.target as IDBOpenDBRequest).result;
            this.tasksManager.db = this.db;
            this.projectsManager.db = this.db;

            resolve(this.db);
        }

        request.onerror = reject;
    });}

    #initTasksStore(db: IDBDatabase) {
        if (!db.objectStoreNames.contains(DatabaseManager.storeTasksName)) {
            const tasksStore = db.createObjectStore(DatabaseManager.storeTasksName, { keyPath: 'taskId', autoIncrement: false });

            tasksStore.createIndex('parentId', 'parentId', { unique: false });
            tasksStore.createIndex('childIdList', 'childIdList', { unique: false, multiEntry: true });
            tasksStore.createIndex('listNameId', 'listNameId', { unique: false });

            tasksStore.createIndex('title', 'title', { unique: false });
            tasksStore.createIndex('description', 'description', { unique: false });

            tasksStore.createIndex('createdDate', 'createdDate', { unique: false });
            tasksStore.createIndex('updatedDate', 'updatedDate', { unique: false });
            tasksStore.createIndex('completedDate', 'completedDate', { unique: false });

            tasksStore.createIndex('startDate', 'startDate', { unique: false });
            tasksStore.createIndex('dueDate', 'dueDate', { unique: false });

            tasksStore.createIndex('reminder', 'reminder', { unique: false, multiEntry: true });
            tasksStore.createIndex('repeat', 'repeat', { unique: false, multiEntry: true });

            tasksStore.createIndex('priority', 'priority', { unique: false });
            tasksStore.createIndex('status', 'status', { unique: false });
        }
    }

    #initProjectsStore(db: IDBDatabase) {
        if (!db.objectStoreNames.contains(DatabaseManager.storeProjectsName)) {
            const tasksStore = db.createObjectStore(DatabaseManager.storeProjectsName, { keyPath: 'id', autoIncrement: false });

            tasksStore.createIndex('name', 'name', { unique: true });
            tasksStore.createIndex('order', 'order', { unique: true });
            tasksStore.createIndex('color', 'color', { unique: false });

            tasksStore.createIndex('createdDate', 'createdDate', { unique: false });
            tasksStore.createIndex('updatedDate', 'updatedDate', { unique: false });

            tasksStore.createIndex('status', 'status', { unique: false });
        }
    }

    garbageCleaner() {
        this.projectsManager.garbageCleaner(this.tasksManager);
        this.tasksManager.garbageCleaner();
    }

    exportData = async () => {
        if (!confirm('Export all tasks to file?')) return;

        try {
            this.garbageCleaner();

            const tasks = await this.tasksManager.getAllTasks();
            const projects = await this.projectsManager.getAllProjects();

            if (tasks.length === 0 && projects.length === 0) {
                alert('No data to export!');
                return;
            }

            this.#downloadFile(
                JSON.stringify([tasks, projects], null, 2),
                `tomake_backup_${new Date().toISOString().slice(0,10)}.json`,
                'application/json'
            );
        } catch (error) {
            console.error('Export error:', error);
            alert('Export failed!');
        }
    }
    // FIXME import or export bad work, broke data time
    importData = async () => {
        if (!confirm('Current data will be replaced. Continue?')) return;

        const file = await this.#selectFile('.json');
        if (!file) return;

        try {
            const readed = await this.#readFile(file);

            const tasks = readed[0].map(task => Task.fromDB(task));
            const projects = readed[1].map(project => Project.fromDB(project));

            await this.tasksManager.clear();
            await this.projectsManager.clear();

            await Promise.all(tasks.map(task => this.tasksManager.addTask(task, true)));
            await Promise.all(projects.map(project => this.projectsManager.addProject(project, true)));

            this.garbageCleaner();

            alert('Data imported successfully!');
            return true; // For potential chaining
        } catch (error) {
            console.error('Import error:', error);
            alert('Invalid file format!');
            return false;
        }
    }

    #downloadFile(content: string, filename: string, mimeType: string) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    #selectFile(accept: string): Promise<File | null> {
        return new Promise(resolve => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = accept;

            input.onchange = (e) => {
                if (e.target instanceof HTMLInputElement) {
                    resolve(e.target.files?.[0] || null);
                } else {
                    resolve(null);
                }
            };

            input.click();
        });
    }

    #readFile(file: File): Promise<Array<Task[] | Project[]>> { return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (!e.target?.result) {
                reject(new Error("Empty file content"));
                return;
            }

            if (typeof e.target.result !== "string") {
                reject(new Error("Unexpected file content type"));
                return;
            }

            try {
                resolve(JSON.parse(e.target.result));
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });}

}