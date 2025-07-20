export class ThemeManager {

    toggleButton: HTMLButtonElement;

    constructor(toggleButton: HTMLButtonElement) {
        this.toggleButton = toggleButton;
        this._init();
    }

    _init() {
        // FIXME move onclick to main class(SyncProjectSide)
        this.toggleButton.addEventListener('click', () => this.toggleTheme());
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            localStorage.setItem('theme', 'dark');
        }
        if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
        }
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            const newColorScheme = e.matches ? "dark" : "light";
            localStorage.setItem('theme', newColorScheme);
        });
    }

    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        localStorage.setItem('theme',
            document.body.classList.contains('dark-theme') ? 'dark' : 'light'
        );
    }
}