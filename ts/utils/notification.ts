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
