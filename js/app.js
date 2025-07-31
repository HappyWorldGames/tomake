import { SyncProjectListSideUI } from "./ui/sync-project-list-side.js";
import { MainSideUI } from "./ui/main-side.js";
import { DatabaseManager } from "./core/database_manager.js";
import { TaskViewSideUI } from "./ui/task-view-side.js";
import { ThemeManager } from "./ui/theme_manager.js";
import { ProjectListSideUI, SysProjectId } from "./ui/project-list-side.js";
import { CustomContextMenuUI } from "./ui/custom-context-menu.js";
import { GoogleSyncManager } from "./sync/google.js";
export class App {
    constructor() {
        this.dbManager = new DatabaseManager();
        this.googleSyncManager = new GoogleSyncManager(this.dbManager);
        this.customContextMenuUI = new CustomContextMenuUI(this.dbManager.tasksManager, this.dbManager.projectsManager);
        this.syncProjectListSideUI = new SyncProjectListSideUI();
        this.taskViewSideUI = new TaskViewSideUI(this.dbManager.tasksManager, this.dbManager.projectsManager, this.customContextMenuUI);
        this.mainSideUI = new MainSideUI(this.taskViewSideUI, this.customContextMenuUI, () => {
            this.projectListSideUI.projectListSide.style.visibility = this.projectListSideUI.projectListSide.style.visibility === 'visible' ? 'hidden' : 'visible';
            this.projectListSideUI.updateStyle();
            this.syncProjectListSideUI.syncSide.classList.toggle('visible');
            this.syncProjectListSideUI.updateStyle();
        });
        this.projectListSideUI = new ProjectListSideUI(this.mainSideUI, this.dbManager.tasksManager, this.dbManager.projectsManager, () => {
            this.syncProjectListSideUI.syncSide.classList.remove('visible');
            this.syncProjectListSideUI.updateStyle();
        });
        this.themreManager = new ThemeManager(this.syncProjectListSideUI.themeToggleButton);
    }
    async init() {
        this.syncProjectListSideUI.setOnClickListener(this.dbManager.exportDataToFile, this.dbManager.importDataFromFile, this.googleSyncManager.initAuth, this.googleSyncManager.sync);
        this.mainSideUI.setOnTaskAddButtonClickListener(this.dbManager.tasksManager, this.dbManager.projectsManager);
        this.mainSideUI.clearAll();
        await this.dbManager.initDB();
        this.projectListSideUI.renderProjectListSide(this.dbManager.tasksManager, this.dbManager.projectsManager);
        this.mainSideUI.renderMainSide(this.dbManager.tasksManager, this.dbManager.projectsManager, SysProjectId.ToDay);
        window.onbeforeunload = () => {
            this.taskViewSideUI.saveTask(this.dbManager.tasksManager);
        };
        document.onclick = (event) => {
            this.customContextMenuUI.globalClick(event);
        };
        window.onresize = () => {
            this.updateWidthStyle();
        };
        if (navigator.serviceWorker) {
            navigator.serviceWorker.register('/tomake/sw.js', { scope: '/tomake/' }).catch(err => {
                throw new Error('ServiceWorker error: ' + err);
            });
        }
        this.updateWidthStyle();
        if (navigator.storage && navigator.storage.persist) {
            navigator.storage.persist().then((persistent) => {
                if (!persistent) {
                    alert('Storage may be cleared by the UA under storage pressure.');
                }
            });
        }
    }
    updateWidthStyle() {
        this.projectListSideUI.updateStyle();
        this.taskViewSideUI.updateStyle();
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});
