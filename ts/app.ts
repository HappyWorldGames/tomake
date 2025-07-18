import { SyncProjectListSideUI } from "./ui/sync-project-list-side.js";
import { MainSideUI } from "./ui/main-side.js";

import { DatabaseManager } from "./core/database_manager.js";
import { TaskViewSideUI } from "./ui/task-view-side.js";
import { ThemeManager } from "./ui/theme_manager.js";
import { ProjectListSideUI, SysProjectId } from "./ui/project-list-side.js";

export class App {

    syncProjectListSideUI: SyncProjectListSideUI;
    projectListSideUI: ProjectListSideUI;
    mainSideUI: MainSideUI;
    taskViewSideUI: TaskViewSideUI;

    themreManager: ThemeManager;

    dbManager: DatabaseManager;

    constructor() {
        this.dbManager = new DatabaseManager();

        this.syncProjectListSideUI = new SyncProjectListSideUI();
        this.taskViewSideUI = new TaskViewSideUI(this.dbManager.tasksManager);
        this.mainSideUI = new MainSideUI(this.taskViewSideUI);
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

        /*this.mainSideUI.addTaskListName('test');
        this.dbManager.getAllTasks().then( tasks => {
            for (const task of tasks)
                this.mainSideUI.addItem(task);
        });*/

        window.onbeforeunload = () => {
            this.taskViewSideUI.saveTask(this.dbManager.tasksManager);
        };
    }
}

// Start app
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});