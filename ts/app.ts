import { SyncProjectListSideUI } from "./ui/sync-project-list-side.js";
import { MainSideUI } from "./ui/main-side.js";

import { DatabaseManager } from "./core/database_manager.js";
import { TaskViewSideUI } from "./ui/task-view-side.js";
import { ThemeManager } from "./ui/theme_manager.js";
import { ProjectListSideUI, SysProjectId } from "./ui/project-list-side.js";
import { CustomContextMenuUI } from "./ui/custom-context-menu.js";

export class App {

    syncProjectListSideUI: SyncProjectListSideUI;
    projectListSideUI: ProjectListSideUI;
    mainSideUI: MainSideUI;
    taskViewSideUI: TaskViewSideUI;

    themreManager: ThemeManager;
    customContextMenuUI: CustomContextMenuUI;

    dbManager: DatabaseManager;

    constructor() {
        this.dbManager = new DatabaseManager();

        this.customContextMenuUI = new CustomContextMenuUI(this.dbManager.tasksManager, this.dbManager.projectsManager);

        this.syncProjectListSideUI = new SyncProjectListSideUI();
        this.taskViewSideUI = new TaskViewSideUI(this.dbManager.tasksManager, this.dbManager.projectsManager, this.customContextMenuUI);
        this.mainSideUI = new MainSideUI(this.taskViewSideUI, this.customContextMenuUI);
        this.projectListSideUI = new ProjectListSideUI(this.mainSideUI, this.dbManager.tasksManager, this.dbManager.projectsManager);

        this.themreManager = new ThemeManager(this.syncProjectListSideUI.themeToggleButton);
    }

    async init() {
        this.syncProjectListSideUI.setOnClickListener(this.dbManager.exportData, this.dbManager.importData);

        this.mainSideUI.setOnTaskAddButtonClickListener(this.dbManager.tasksManager, this.dbManager.projectsManager);
        this.mainSideUI.clearAll();
        await this.dbManager.initDB();

        this.projectListSideUI.renderProjectListSide(this.dbManager.tasksManager, this.dbManager.projectsManager);
        this.mainSideUI.renderMainSide(this.dbManager.tasksManager, this.dbManager.projectsManager, SysProjectId.ToDay);

        window.onbeforeunload = () => {
            // save before close
            this.taskViewSideUI.saveTask(this.dbManager.tasksManager);
        };
        document.onclick = () => {
            if (this.customContextMenuUI.isOpen())
                this.customContextMenuUI.dismiss();
        }

        // register ServiceWorker
        navigator.serviceWorker.register(
            '/sw.js'
        ).catch(err => {
            throw new Error('ServiceWorker error: ' + err);
        })
    }
}

// Start app
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});