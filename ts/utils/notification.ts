import { getUUID } from "./uuid.js";

export function requestNotification(title: string = '', text: string = '') {
    Notification.requestPermission().then((result) => {
        if (result === "granted" && title != '') {
            new Notification(title, {body: text, icon: `/tomake/favicon.ico`});
        }
    });
}

export function notify(title: string, text: string = '') {
    requestNotification(title, text);
}

const snackbars: Map<string, HTMLDivElement> = new Map();

export function showSnackbar(message: string, duration = 3000) {
    const snackbar = document.createElement('div') as HTMLDivElement;
    snackbar.classList.add('snackbar');
    snackbar.classList.add("show");

    const messageElement = document.createElement('span') as HTMLSpanElement;
    messageElement.className = 'message';
    messageElement.textContent = message;

    snackbar.appendChild(messageElement);
    document.body.appendChild(snackbar);
    snackbar.style.bottom = `${30 + snackbar.offsetHeight * snackbars.size + 5 * snackbars.size}px`;

    const uuid = getUUID();
    snackbar.id = uuid;
    snackbars.set(uuid, snackbar);

    recalculateSnackbarsPositions();

    requestAnimationFrame(() => {
        snackbar.classList.add('show');
    });

    setTimeout(() => {
        if (snackbars.has(uuid)) {
            snackbar.classList.remove('show');

            setTimeout(() => {
                snackbar.remove();
                snackbars.delete(uuid);
                recalculateSnackbarsPositions();
            }, 300);
        }
    }, duration);
}

function recalculateSnackbarsPositions() {
    if (snackbars.size === 0) return;

    const baseOffset = 30;
    const gap = 5;
    let currentOffset = baseOffset;

    const reversed = Array.from(snackbars.values()).reverse();

    reversed.forEach(snackbar => {
        snackbar.style.transition = 'bottom 0.3s ease-in-out, opacity 0.3s ease-in-out';
        snackbar.style.bottom = `${currentOffset}px`;

        currentOffset += snackbar.offsetHeight + gap;
    });
}