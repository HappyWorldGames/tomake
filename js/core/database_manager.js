var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _DatabaseManager_instances, _a, _DatabaseManager_initTasksStore, _DatabaseManager_initProjectsStore, _DatabaseManager_downloadFile, _DatabaseManager_selectFile, _DatabaseManager_readFile;
import { Project } from "./project.js";
import { ProjectsManager } from "./projects_manager.js";
import { Task } from "./task.js";
import { TasksManager } from "./tasks_manager.js";
export class DatabaseManager {
    constructor(showError = (text) => { }) {
        _DatabaseManager_instances.add(this);
        this.db = null;
        this.tasksManager = new TasksManager();
        this.projectsManager = new ProjectsManager();
        this.exportData = () => __awaiter(this, void 0, void 0, function* () {
            if (!confirm('Export all tasks to file?'))
                return;
            try {
                const tasks = yield this.tasksManager.getAllTasks();
                const projects = yield this.projectsManager.getAllProjects();
                if (tasks.length === 0 && projects.length === 0) {
                    alert('No data to export!');
                    return;
                }
                __classPrivateFieldGet(this, _DatabaseManager_instances, "m", _DatabaseManager_downloadFile).call(this, JSON.stringify([tasks, projects], null, 2), `tomake_backup_${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
            }
            catch (error) {
                console.error('Export error:', error);
                alert('Export failed!');
            }
        });
        this.importData = () => __awaiter(this, void 0, void 0, function* () {
            if (!confirm('Current data will be replaced. Continue?'))
                return;
            const file = yield __classPrivateFieldGet(this, _DatabaseManager_instances, "m", _DatabaseManager_selectFile).call(this, '.json');
            if (!file)
                return;
            try {
                const readed = yield __classPrivateFieldGet(this, _DatabaseManager_instances, "m", _DatabaseManager_readFile).call(this, file);
                const tasks = readed[0].map(task => Task.fromDB(task));
                const projects = readed[1].map(project => Project.fromDB(project));
                yield this.tasksManager.clear();
                yield this.projectsManager.clear();
                yield Promise.all(tasks.map(task => this.tasksManager.addTask(task, true)));
                yield Promise.all(projects.map(project => this.projectsManager.addProject(project, true)));
                alert('Data imported successfully!');
                return true;
            }
            catch (error) {
                console.error('Import error:', error);
                alert('Invalid file format!');
                return false;
            }
        });
        this.showError = showError;
    }
    initDB() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                let request = indexedDB.open(_a.dbName, 1);
                request.onblocked = (event) => {
                    this.showError('Upgrade blocked - Please close other tabs displaying this site.');
                };
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    db.onerror = reject;
                    __classPrivateFieldGet(this, _DatabaseManager_instances, "m", _DatabaseManager_initTasksStore).call(this, db);
                    __classPrivateFieldGet(this, _DatabaseManager_instances, "m", _DatabaseManager_initProjectsStore).call(this, db);
                };
                request.onsuccess = (event) => {
                    this.db = event.target.result;
                    this.tasksManager.db = this.db;
                    this.projectsManager.db = this.db;
                    resolve(this.db);
                };
                request.onerror = reject;
            });
        });
    }
}
_a = DatabaseManager, _DatabaseManager_instances = new WeakSet(), _DatabaseManager_initTasksStore = function _DatabaseManager_initTasksStore(db) {
    if (!db.objectStoreNames.contains(_a.storeTasksName)) {
        const tasksStore = db.createObjectStore(_a.storeTasksName, { keyPath: 'taskId', autoIncrement: false });
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
}, _DatabaseManager_initProjectsStore = function _DatabaseManager_initProjectsStore(db) {
    if (!db.objectStoreNames.contains(_a.storeProjectsName)) {
        const tasksStore = db.createObjectStore(_a.storeProjectsName, { keyPath: 'id', autoIncrement: false });
        tasksStore.createIndex('name', 'name', { unique: true });
        tasksStore.createIndex('order', 'order', { unique: true });
        tasksStore.createIndex('color', 'color', { unique: false });
        tasksStore.createIndex('createdDate', 'createdDate', { unique: false });
        tasksStore.createIndex('updatedDate', 'updatedDate', { unique: false });
        tasksStore.createIndex('status', 'status', { unique: false });
    }
}, _DatabaseManager_downloadFile = function _DatabaseManager_downloadFile(content, filename, mimeType) {
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
            var _b;
            if (e.target instanceof HTMLInputElement) {
                resolve(((_b = e.target.files) === null || _b === void 0 ? void 0 : _b[0]) || null);
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
            var _b;
            if (!((_b = e.target) === null || _b === void 0 ? void 0 : _b.result)) {
                reject(new Error("Empty file content"));
                return;
            }
            if (typeof e.target.result !== "string") {
                reject(new Error("Unexpected file content type"));
                return;
            }
            try {
                resolve(JSON.parse(e.target.result));
            }
            catch (error) {
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
};
DatabaseManager.dbName = 'ToMake';
DatabaseManager.storeTasksName = 'tasks';
DatabaseManager.storeProjectsName = 'projects';
