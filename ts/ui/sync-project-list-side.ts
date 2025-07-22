export class SyncProjectListSideUI {

    syncSide: HTMLDivElement;

    authButton: HTMLElement | null;
    themeToggleButton: HTMLButtonElement;
    syncButton: HTMLElement | null;
    exportButton: HTMLElement | null;
    importButton: HTMLElement | null;

    constructor() {
        this.syncSide = document.getElementById('sync-side') as HTMLDivElement;

        this.authButton = document.getElementById('authButton');
        this.themeToggleButton = document.getElementById('themeToggleButton') as HTMLButtonElement;
        this.syncButton = document.getElementById('syncButton');
        this.exportButton = document.getElementById('exportButton');
        this.importButton = document.getElementById('importButton');

        if (this.authButton == null) alert('error init authButton');
        if (!this.syncButton) alert('error init syncButton');
        if (!this.exportButton) alert('error init exportButton');
        if (!this.importButton) alert('error init importButton');

        if (window.innerWidth > 500) this.syncSide.classList.add('visible');
    }

    setOnClickListener(
        exportFun: () => void,
        importFun: () => void
    ) {
        this.authButton?.addEventListener('click', () => {
            alert('Auth');
        });

        this.exportButton?.addEventListener('click', exportFun);
        this.importButton?.addEventListener('click', importFun);
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