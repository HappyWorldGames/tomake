import { requestNotification } from '../utils/notification.js';
export class SyncProjectListSideUI {
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
    setOnClickListener(exportFun, importFun, authGoogle, syncGoogle) {
        var _a;
        (_a = this.authButton) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
            authGoogle();
        });
        this.syncButton.onclick = () => {
            syncGoogle();
        };
        this.exportButton.addEventListener('click', exportFun);
        this.importButton.addEventListener('click', importFun);
        this.notifyButton.onclick = () => {
            requestNotification();
            const time = Date.now() + 5000;
            chrome.alarms.create('next-task-alarm', {
                when: time
            });
            console.log('Alarm set for:', new Date(time));
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
