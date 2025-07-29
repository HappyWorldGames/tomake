import { requestNotification } from '../utils/notification.js';

export class SyncProjectListSideUI {

    syncSide: HTMLDivElement;

    authButton: HTMLButtonElement;

    themeToggleButton: HTMLButtonElement;

    syncButton: HTMLButtonElement;
    exportButton: HTMLButtonElement;
    importButton: HTMLButtonElement;

    notifyButton: HTMLButtonElement;

    constructor() {
        this.syncSide = document.getElementById('sync-side') as HTMLDivElement;

        this.authButton = document.getElementById('authButton') as HTMLButtonElement;

        this.themeToggleButton = document.getElementById('themeToggleButton') as HTMLButtonElement;

        this.syncButton = document.getElementById('syncButton') as HTMLButtonElement;
        this.exportButton = document.getElementById('exportButton') as HTMLButtonElement;
        this.importButton = document.getElementById('importButton') as HTMLButtonElement;

        this.notifyButton = document.getElementById('notifyButton') as HTMLButtonElement;

        if (window.innerWidth > 500) this.syncSide.classList.add('visible');
    }

    setOnClickListener(
        exportFun: () => void,
        importFun: () => void,
        authGoogle: () => void,
        syncGoogle: () => void
    ) {
        this.authButton?.addEventListener('click', () => {
            authGoogle();
        });
        this.syncButton.onclick = () => {
            syncGoogle();
        }

        this.exportButton.addEventListener('click', exportFun);
        this.importButton.addEventListener('click', importFun);

        this.notifyButton.onclick = () => {
            requestNotification();
        }
    }

    updateStyle() {
        if (window.innerWidth <= 500 && this.syncSide.classList.contains('visible')) {
            this.syncSide.style.position = 'absolute';
            this.syncSide.style.display = 'flex';
        } else {
            this.syncSide.style.position = '';
            this.syncSide.style.display = '';
        }
    }
}
