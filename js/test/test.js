import { DatabaseManagerTest } from "./database_manager.test.js";
globalThis.testAll = () => {
    const testClass = [
        new DatabaseManagerTest()
    ];
    console.log('start test');
    for (const selfTest of testClass) {
        selfTest.test();
    }
    console.log('end test');
};
document.addEventListener('DOMContentLoaded', () => {
    var _a;
    (_a = document.getElementById('test')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', function () {
        testAll();
    });
});
