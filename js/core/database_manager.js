var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _DatabaseManager_instances, _DatabaseManager_downloadFile, _DatabaseManager_selectFile, _DatabaseManager_readFile;
import { SysProjectId } from "../ui/project-list-side.js";
import { showSnackbar } from "../utils/notification.js";
import { Project } from "./project.js";
import { ProjectsManager } from "./projects_manager.js";
import { Task } from "./task.js";
import { TasksManager } from "./tasks_manager.js";
export class DatabaseManager {
    constructor() {
        _DatabaseManager_instances.add(this);
        this.db = null;
        this.tasksManager = new TasksManager();
        this.projectsManager = new ProjectsManager();
        this.merge = (jsonString) => {
            const [remoteTasksData, remoteProjectsData] = DatabaseManager.convertFromJsonStringToArray(jsonString);
            this.garbageCleaner();
            this.tasksManager.merge(remoteTasksData);
            this.projectsManager.merge(remoteProjectsData);
        };
        this.exportDataToJsonString = async () => {
            this.garbageCleaner();
            const tasks = await this.tasksManager.getAllTasks();
            const projects = await this.projectsManager.getAllProjects();
            return JSON.stringify([
                tasks.map(task => task.toDB()),
                projects.map(project => project.toDB())
            ], null, 2);
        };
        this.importDataFromJsonString = (jsonString) => {
            const [tasks, projects] = DatabaseManager.convertFromJsonStringToArray(jsonString);
            this.tasksManager.clear().then(() => Promise.all(tasks.map(task => this.tasksManager.addTask(task, true))).then(() => this.tasksManager.garbageCleaner()));
            this.projectsManager.clear().then(() => Promise.all(projects.map(project => this.projectsManager.addProject(project, true))).then(() => this.projectsManager.garbageCleaner(this.tasksManager)));
        };
        this.exportDataToFile = async () => {
            if (!confirm('Export all tasks to file?'))
                return;
            try {
                __classPrivateFieldGet(this, _DatabaseManager_instances, "m", _DatabaseManager_downloadFile).call(this, await this.exportDataToJsonString(), `tomake_backup_${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
            }
            catch (error) {
                console.error('Export error:', error);
                showSnackbar('Export failed!');
            }
        };
        this.importDataFromFile = async () => {
            if (!confirm('Current data will be replaced. Continue?'))
                return;
            const file = await __classPrivateFieldGet(this, _DatabaseManager_instances, "m", _DatabaseManager_selectFile).call(this, '.json');
            if (!file)
                return;
            try {
                this.importDataFromJsonString(await __classPrivateFieldGet(this, _DatabaseManager_instances, "m", _DatabaseManager_readFile).call(this, file));
                showSnackbar('Data imported successfully!');
                return true;
            }
            catch (error) {
                console.error('Import error:', error);
                showSnackbar('Invalid file format!');
                return false;
            }
        };
    }
    async initDB() {
        return new Promise((resolve, reject) => {
            let request = indexedDB.open(DatabaseManager.dbName, DatabaseManager.version);
            request.onblocked = (event) => {
                showSnackbar('Upgrade blocked - Please close other tabs displaying this site.');
                console.log('Upgrade blocked - Please close other tabs displaying this site.');
            };
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                const transaction = event.target.transaction;
                if (!transaction)
                    return;
                db.onerror = reject;
                this.initTasksStore(db, transaction, event.oldVersion);
                this.initProjectsStore(db);
            };
            request.onsuccess = (event) => {
                this.db = event.target.result;
                this.tasksManager.db = this.db;
                this.projectsManager.db = this.db;
                this.addSysProject();
                resolve(this.db);
            };
            request.onerror = reject;
        });
    }
    initTasksStore(db, transaction, oldVersion) {
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
        if (oldVersion < DatabaseManager.version) {
            const tasksStore = transaction.objectStore(DatabaseManager.storeTasksName);
            if (!tasksStore.indexNames.contains('order'))
                tasksStore.createIndex('order', 'order', { unique: false });
            if (!tasksStore.indexNames.contains('tags'))
                tasksStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
            if (!tasksStore.indexNames.contains('isAllDay'))
                tasksStore.createIndex('isAllDay', 'isAllDay', { unique: false });
        }
    }
    initProjectsStore(db) {
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
    addSysProject() {
        if (!this.db)
            return;
        const projectsStore = this.db.transaction(DatabaseManager.storeProjectsName, 'readwrite').objectStore(DatabaseManager.storeProjectsName);
        projectsStore.get(SysProjectId.Inbox).onsuccess = (event) => {
            const project = event.target.result;
            if (project)
                return;
            const inboxProject = new Project('Inbox', -2, '', SysProjectId.Inbox);
            projectsStore.put(inboxProject);
        };
    }
    garbageCleaner() {
        this.projectsManager.garbageCleaner(this.tasksManager);
        this.tasksManager.garbageCleaner();
    }
    static convertFromJsonStringToArray(jsonString) {
        const jsonArrayObj = JSON.parse(jsonString);
        return [
            jsonArrayObj[0].map(task => Task.fromDB(task)),
            jsonArrayObj[1].map(project => Project.fromDB(project))
        ];
    }
}
_DatabaseManager_instances = new WeakSet(), _DatabaseManager_downloadFile = function _DatabaseManager_downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}, _DatabaseManager_selectFile = function _DatabaseManager_selectFile(accept) {
    return new Promise(resolve => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;
        input.onchange = (e) => {
            var _a;
            if (e.target instanceof HTMLInputElement) {
                resolve(((_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0]) || null);
            }
            else {
                resolve(null);
            }
        };
        input.click();
    });
}, _DatabaseManager_readFile = function _DatabaseManager_readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            var _a;
            if (!((_a = e.target) === null || _a === void 0 ? void 0 : _a.result)) {
                reject(new Error("Empty file content"));
                return;
            }
            if (typeof e.target.result !== "string") {
                reject(new Error("Unexpected file content type"));
                return;
            }
            try {
                resolve(e.target.result);
            }
            catch (error) {
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
};
DatabaseManager.version = 3;
DatabaseManager.dbName = 'ToMake';
DatabaseManager.storeTasksName = 'tasks';
DatabaseManager.storeProjectsName = 'projects';
