import { SyncProjectListSideUI } from "./ui/sync-project-list-side.js";
import { MainSideUI } from "./ui/main-side.js";

import { DatabaseManager } from "./core/database_manager.js";

export class App {

    syncProjectListSideUI: SyncProjectListSideUI;
    mainSideUI: MainSideUI;

    dbManager: DatabaseManager;

    constructor() {
        this.syncProjectListSideUI = new SyncProjectListSideUI();
        this.mainSideUI = new MainSideUI();

        this.dbManager = new DatabaseManager();
    }

    async init() {
        this.syncProjectListSideUI.setOnClickListener(this.dbManager.exportData, this.dbManager.importData);

        this.mainSideUI.setOnTaskAddButtonClickListener(this.dbManager.tasksManager);
        this.mainSideUI.clearAll();
        await this.dbManager.initDB();

        await this.mainSideUI.addToDay(this.dbManager.tasksManager);

        /*this.mainSideUI.addTaskListName('test');
        this.dbManager.getAllTasks().then( tasks => {
            for (const task of tasks)
                this.mainSideUI.addItem(task);
        });*/
    }
}

// Start app
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});