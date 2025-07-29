export function requestNotification(title = '', text = '') {
    Notification.requestPermission().then((result) => {
        if (result === "granted" && title != '') {
            new Notification(title, { body: text, icon: `/tomake/favicon.ico` });
        }
    });
}
export function notify(title, text = '') {
    requestNotification(title, text);
}
