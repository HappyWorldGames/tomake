export function convertToDateTimeLocalString(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}
export function getUTCDateFromLocal(dateTimeValue) {
    const localDate = new Date(dateTimeValue);
    const offsetMs = localDate.getTimezoneOffset() * 60000;
    const utcDate = new Date(localDate.getTime() - offsetMs);
    return utcDate;
}
