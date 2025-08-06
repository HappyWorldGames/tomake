import { SyncProjectListSideUI } from "./ui/sync-project-list-side.js";
import { MainSideUI } from "./ui/main-side.js";

import { DatabaseManager } from "./core/database_manager.js";
import { TaskViewSideUI } from "./ui/task-view-side.js";
import { ThemeManager } from "./utils/theme_manager.js";
import { ProjectListSideUI, SysProjectId } from "./ui/project-list-side.js";
import { CustomContextMenuUI } from "./ui/custom-context-menu.js";
import { GoogleSyncManager } from "./sync/google.js";
import { showSnackbar } from "./utils/notification.js";
import { Task } from "./core/task.js";
import { Project } from "./core/project.js";

export class App {

    syncProjectListSideUI: SyncProjectListSideUI;
    projectListSideUI: ProjectListSideUI;
    mainSideUI: MainSideUI;
    taskViewSideUI: TaskViewSideUI;

    customContextMenuUI: CustomContextMenuUI;

    themreManager: ThemeManager;
    dbManager: DatabaseManager;
    googleSyncManager: GoogleSyncManager;

    constructor() {
        this.dbManager = new DatabaseManager();
        this.googleSyncManager = new GoogleSyncManager(this.dbManager);

        this.themreManager = new ThemeManager();
        this.customContextMenuUI = new CustomContextMenuUI(this.dbManager.tasksManager, this.dbManager.projectsManager);

        // UI init
        this.syncProjectListSideUI = new SyncProjectListSideUI();
        this.projectListSideUI = new ProjectListSideUI(
            this.dbManager.tasksManager,
            this.dbManager.projectsManager,
            () => {
                this.syncProjectListSideUI.getSyncSide.classList.remove('visible');
                this.syncProjectListSideUI.updateStyle();
            },
            (projectId: string) => this.mainSideUI.renderMainSide(projectId)
        );
        this.mainSideUI = new MainSideUI(
            this.customContextMenuUI,
            this.dbManager.tasksManager,
            this.dbManager.projectsManager,
            (task: Task | null, closeTaskButtonFun?: Function) => this.taskViewSideUI.renderTaskViewSide(task, closeTaskButtonFun),
            (project: Project) => this.projectListSideUI.selectProject(project)
        );
        this.taskViewSideUI = new TaskViewSideUI(this.dbManager.tasksManager, this.dbManager.projectsManager, this.customContextMenuUI);
    }

    async init() {
        await this.dbManager.initDB();

        this.projectListSideUI.renderProjectListSide();
        this.mainSideUI.renderMainSide(SysProjectId.ToDay);

        window.onbeforeunload = () => {
            // save before close
            this.taskViewSideUI.saveTask();
        };
        document.onclick = (event) => {
            this.mainSideUI.globalClick(event);
            this.customContextMenuUI.globalClick(event);
        }

        window.onresize = () => {
            this.updateWidthStyle();
        }

        // register ServiceWorker
        if (navigator.serviceWorker) {
            navigator.serviceWorker.register(
                '/tomake/sw.js', { scope: '/tomake/', type: 'module' }
            ).catch(err => {
                throw new Error('ServiceWorker error: ' + err);
            })
        }

        this.updateWidthStyle();

        if (navigator.storage && navigator.storage.persist) {
            navigator.storage.persist().then((persistent) => {
                if (!persistent) {
                    showSnackbar('Storage may be cleared by the UA under storage pressure.')
                }
            });
        }

        this.syncProjectListSideUI.setOnClickListener(
            this.dbManager.exportDataToFile,
            this.dbManager.importDataFromFile,
            this.googleSyncManager.initAuth,
            this.googleSyncManager.sync,
            this.themreManager.toggleTheme
        );

        this.mainSideUI.setOnTaskAddButtonClickListener(
            () => {
                this.projectListSideUI.getProjectListSide.style.visibility = this.projectListSideUI.getProjectListSide.style.visibility === 'visible' ? 'hidden' : 'visible';
                this.projectListSideUI.updateStyle();

                this.syncProjectListSideUI.getSyncSide.classList.toggle('visible');
                this.syncProjectListSideUI.updateStyle();
            }
        );
    }

    updateWidthStyle() {
        this.projectListSideUI.updateStyle();
        this.taskViewSideUI.updateStyle();
    }
}

// Start app
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});