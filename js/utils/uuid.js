export function getUUID() {
    var _a;
    return ((_a = self === null || self === void 0 ? void 0 : self.crypto) === null || _a === void 0 ? void 0 : _a.randomUUID) ? self.crypto.randomUUID() : uuidv4();
}
export function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
        .replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
