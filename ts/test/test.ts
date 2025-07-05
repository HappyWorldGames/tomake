import { DatabaseManagerTest } from "./database_manager.test.js";

declare global {
    var testAll: () => void;
}

globalThis.testAll = () => {
    const testClass: SelfTest[] = [
        new DatabaseManagerTest()
    ]

    console.log('start test');
    for (const selfTest of testClass) {
        selfTest.test();
    }
    console.log('end test');
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('test')?.addEventListener('click', function() {
        testAll();
    });
});

export interface SelfTest {
    test(): void;
}