import { SysProjectId } from "../ui/project-list-side.js";
import { showSnackbar } from "../utils/notification.js";
import { Project } from "./project.js";
import { ProjectsManager } from "./projects_manager.js";
import { Task } from "./task.js";
import { TasksManager } from "./tasks_manager.js";

export class DatabaseManager {

    static version = 2;
    static dbName: string = 'ToMake';
    static storeTasksName: string = 'tasks';
    static storeProjectsName: string = 'projects';

    db: IDBDatabase | null = null;

    tasksManager: TasksManager = new TasksManager();
    projectsManager: ProjectsManager = new ProjectsManager();

    constructor() {}

    async initDB(): Promise<IDBDatabase> { return new Promise((resolve, reject) => {
        let request = indexedDB.open(DatabaseManager.dbName, DatabaseManager.version);

        request.onblocked = (event) => {
            showSnackbar('Upgrade blocked - Please close other tabs displaying this site.');
            console.log('Upgrade blocked - Please close other tabs displaying this site.');
        }

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            db.onerror = reject;

            this.initTasksStore(db);
            this.initProjectsStore(db);
        }

        request.onsuccess = (event) => {
            this.db = (event.target as IDBOpenDBRequest).result;
            this.tasksManager.db = this.db;
            this.projectsManager.db = this.db;

            this.addSysProject();

            resolve(this.db);
        }

        request.onerror = reject;
    });}

    private initTasksStore(db: IDBDatabase) {
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
        if (db.version < DatabaseManager.version) {
            const tasksStore = db.transaction(DatabaseManager.storeTasksName, 'readwrite').objectStore(DatabaseManager.storeTasksName);
            if (db.version < 2) {
                tasksStore.createIndex('order', 'order', { unique: false });
                tasksStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
            }
        }
    }

    private initProjectsStore(db: IDBDatabase) {
        if (!db.objectStoreNames.contains(DatabaseManager.storeProjectsName)) {
            const projectsStore = db.createObjectStore(DatabaseManager.storeProjectsName, { keyPath: 'id', autoIncrement: false });

            projectsStore.createIndex('name', 'name', { unique: false });
            projectsStore.createIndex('order', 'order', { unique: false });
            projectsStore.createIndex('color', 'color', { unique: false });

            projectsStore.createIndex('createdDate', 'createdDate', { unique: false });
            projectsStore.createIndex('updatedDate', 'updatedDate', { unique: false });

            projectsStore.createIndex('status', 'status', { unique: false });
        }
    }

    private addSysProject() {
        if (!this.db) return;
        const projectsStore = this.db.transaction(DatabaseManager.storeProjectsName, 'readwrite').objectStore(DatabaseManager.storeProjectsName);

        // Create 'inbox', if not
        projectsStore.get(SysProjectId.Inbox).onsuccess = (event) => {
            const project = (event.target as IDBRequest).result;
            if (project) return;

            const inboxProject = new Project('Inbox', -2, '', SysProjectId.Inbox);
            projectsStore.put(inboxProject);
        }
    }

    garbageCleaner() {
        this.projectsManager.garbageCleaner(this.tasksManager);
        this.tasksManager.garbageCleaner();
    }

    merge = (jsonString: string) => {
        const [remoteTasksData, remoteProjectsData] = DatabaseManager.convertFromJsonStringToArray(jsonString);
        this.garbageCleaner();

        this.tasksManager.merge(remoteTasksData);
        this.projectsManager.merge(remoteProjectsData);
    }

    exportDataToJsonString = async (): Promise<string> => {
        this.garbageCleaner();

        const tasks = await this.tasksManager.getAllTasks();
        const projects = await this.projectsManager.getAllProjects();

        return JSON.stringify([
            tasks.map(task => task.toDB()),
            projects.map(project => project.toDB())
        ], null, 2);
    }

    importDataFromJsonString = (jsonString: string) => {
        const [tasks, projects] = DatabaseManager.convertFromJsonStringToArray(jsonString);

        this.tasksManager.clear().then(() =>
            Promise.all(tasks.map(task => this.tasksManager.addTask(task, true))).then(() =>
                this.tasksManager.garbageCleaner()
            )
        );
        this.projectsManager.clear().then(() =>
            Promise.all(projects.map(project => this.projectsManager.addProject(project, true))).then(() =>
                this.projectsManager.garbageCleaner(this.tasksManager)
            )
        );
    }

    static convertFromJsonStringToArray(jsonString: string): [Task[], Project[]] {
        const jsonArrayObj = JSON.parse(jsonString) as Array<Object[]>;

        return [
            jsonArrayObj[0].map(task => Task.fromDB(task)),
            jsonArrayObj[1].map(project => Project.fromDB(project))
        ]
    }

    exportDataToFile = async () => {
        if (!confirm('Export all tasks to file?')) return;

        try {
            this.#downloadFile(
                await this.exportDataToJsonString(),
                `tomake_backup_${new Date().toISOString().slice(0,10)}.json`,
                'application/json'
            );
        } catch (error) {
            console.error('Export error:', error);
            showSnackbar('Export failed!');
        }
    }

    importDataFromFile = async () => {
        // TODO Make choose sync or replace
        if (!confirm('Current data will be replaced. Continue?')) return;

        const file = await this.#selectFile('.json');
        if (!file) return;

        try {
            this.importDataFromJsonString(await this.#readFile(file));

            showSnackbar('Data imported successfully!');
            return true;
        } catch (error) {
            console.error('Import error:', error);
            showSnackbar('Invalid file format!');
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

    #readFile(file: File): Promise<string> { return new Promise((resolve, reject) => {
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
                resolve(e.target.result);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });}

}