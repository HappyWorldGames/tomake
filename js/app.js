var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { SyncProjectListSideUI } from "./ui/sync-project-list-side.js";
import { MainSideUI } from "./ui/main-side.js";
import { DatabaseManager } from "./core/database_manager.js";
import { ThemeManager } from "./ui/theme_manager.js";
export class App {
    constructor() {
        this.syncProjectListSideUI = new SyncProjectListSideUI();
        this.mainSideUI = new MainSideUI();
        this.themreManager = new ThemeManager(this.syncProjectListSideUI.themeToggleButton);
        this.dbManager = new DatabaseManager();
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            this.syncProjectListSideUI.setOnClickListener(this.dbManager.exportData, this.dbManager.importData);
            this.mainSideUI.setOnTaskAddButtonClickListener(this.dbManager.tasksManager, this.dbManager.projectsManager);
            this.mainSideUI.clearAll();
            yield this.dbManager.initDB();
            this.mainSideUI.renderMainSide(this.dbManager.tasksManager, this.dbManager.projectsManager);
        });
    }
}
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});
