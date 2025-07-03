export class SyncProjectListSideUI {
    authButton: HTMLElement | null;
    themeToggleButton: HTMLElement | null;
    syncButton: HTMLElement | null;
    exportButton: HTMLElement | null;
    importButton: HTMLElement | null;

    constructor() {
        this.authButton = document.getElementById('authButton');
        this.themeToggleButton = document.getElementById('themeToggleButton');
        this.syncButton = document.getElementById('syncButton');
        this.exportButton = document.getElementById('exportButton');
        this.importButton = document.getElementById('importButton');

        if (this.authButton == null) alert('error init authButton');
        if (!this.themeToggleButton) alert('error init themeToggleButton');
        if (!this.syncButton) alert('error init syncButton');
        if (!this.exportButton) alert('error init exportButton');
        if (!this.importButton) alert('error init importButton');
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
}