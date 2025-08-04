import { requestNotification, showSnackbar } from '../utils/notification.js';
export class SyncProjectListSideUI {
    get getSyncSide() {
        return this.syncSide;
    }
    constructor() {
        this.syncSide = document.getElementById('sync-side');
        this.authButton = document.getElementById('authButton');
        this.themeToggleButton = document.getElementById('themeToggleButton');
        this.syncButton = document.getElementById('syncButton');
        this.exportButton = document.getElementById('exportButton');
        this.importButton = document.getElementById('importButton');
        this.notifyButton = document.getElementById('notifyButton');
        if (window.innerWidth > 500)
            this.syncSide.classList.add('visible');
    }
    setOnClickListener(exportFun, importFun, authGoogleFun, syncGoogleFun, themeToggleFun) {
        this.authButton.onclick = () => {
            authGoogleFun();
        };
        this.syncButton.onclick = () => {
            syncGoogleFun();
        };
        this.exportButton.addEventListener('click', exportFun);
        this.importButton.addEventListener('click', importFun);
        this.themeToggleButton.onclick = () => {
            themeToggleFun();
        };
        this.notifyButton.onclick = () => {
            if (!navigator.serviceWorker.controller) {
                showSnackbar(`Please install app before.`);
                return;
            }
            requestNotification();
            navigator.serviceWorker.controller.postMessage({
                type: 'schedule-alarm'
            });
        };
    }
    updateStyle() {
        if (window.innerWidth <= 500 && this.syncSide.classList.contains('visible')) {
            this.syncSide.style.position = 'absolute';
            this.syncSide.style.display = 'flex';
        }
        else {
            this.syncSide.style.position = '';
            this.syncSide.style.display = '';
        }
    }
}
