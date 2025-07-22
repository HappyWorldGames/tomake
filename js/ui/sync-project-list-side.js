export class SyncProjectListSideUI {
    constructor() {
        this.syncSide = document.getElementById('sync-side');
        this.authButton = document.getElementById('authButton');
        this.themeToggleButton = document.getElementById('themeToggleButton');
        this.syncButton = document.getElementById('syncButton');
        this.exportButton = document.getElementById('exportButton');
        this.importButton = document.getElementById('importButton');
        if (this.authButton == null)
            alert('error init authButton');
        if (!this.syncButton)
            alert('error init syncButton');
        if (!this.exportButton)
            alert('error init exportButton');
        if (!this.importButton)
            alert('error init importButton');
        if (window.innerWidth > 500)
            this.syncSide.classList.add('visible');
    }
    setOnClickListener(exportFun, importFun) {
        var _a, _b, _c;
        (_a = this.authButton) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
            alert('Auth');
        });
        (_b = this.exportButton) === null || _b === void 0 ? void 0 : _b.addEventListener('click', exportFun);
        (_c = this.importButton) === null || _c === void 0 ? void 0 : _c.addEventListener('click', importFun);
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
