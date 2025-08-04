import { requestNotification, showSnackbar } from '../utils/notification.js';

export class SyncProjectListSideUI {

    private syncSide: HTMLDivElement;
    public get getSyncSide() : HTMLDivElement {
        return this.syncSide;
    }

    private authButton: HTMLButtonElement;
    private syncButton: HTMLButtonElement;

    private exportButton: HTMLButtonElement;
    private importButton: HTMLButtonElement;

    private themeToggleButton: HTMLButtonElement;

    private notifyButton: HTMLButtonElement;

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
        authGoogleFun: () => void,
        syncGoogleFun: () => void,
        themeToggleFun: () => void
    ) {
        this.authButton.onclick = () => {
            authGoogleFun();
        };
        this.syncButton.onclick = () => {
            syncGoogleFun();
        }

        this.exportButton.addEventListener('click', exportFun);
        this.importButton.addEventListener('click', importFun);

        this.themeToggleButton.onclick = () => {
            themeToggleFun();
        }

        this.notifyButton.onclick = () => {
            if (!navigator.serviceWorker.controller) {
                showSnackbar(`Please install app before.`);
                return;
            }
            requestNotification();

            navigator.serviceWorker.controller.postMessage({
                type: 'schedule-alarm'
            });
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
