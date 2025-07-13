import { DatabaseManager } from "../core/database_manager.js";
import { Task, TaskStatus } from "../core/task.js";
export class DatabaseManagerTest {
    constructor() {
        this.dbManager = null;
    }
    async test() {
        await this.initDBTest();
        this.addDBTest();
        this.getDBTest();
        this.removeDBTest();
    }
    async initDBTest() {
        indexedDB.deleteDatabase(DatabaseManager.dbName);
        this.dbManager = new DatabaseManager();
        await this.dbManager.initDB().then(db => {
            var _a;
            (_a = this.dbManager) === null || _a === void 0 ? void 0 : _a.tasksManager.getAllTasks().then(result => {
                console.assert(result.length === 0, 'WTF, how?');
            });
        }, error => {
            console.log(error);
        });
    }
    addDBTest() {
        if (this.dbManager == null) {
            console.log('No init DB in addDBTest');
            return;
        }
        const testTask = new Task('test');
        testTask.repeat = [...testTask.repeat, new Date(1), new Date()];
        this.dbManager.tasksManager.addTask(testTask);
        const testTask2 = new Task('test2');
        testTask2.status = TaskStatus.Completed;
        this.dbManager.tasksManager.addTask(testTask2);
        const testTask3 = new Task('test3');
        this.dbManager.tasksManager.addTask(testTask3);
        this.dbManager.tasksManager.getAllTasks().then(result => {
            console.assert(result.length > 0, 'db lengh wrong');
            console.assert(!!result.find(task => task.repeat.length == 2), 'wrong repeat length');
            console.assert(!!result.find(task => task.status == TaskStatus.Completed), 'wront status');
            console.assert(!!result.find(task => task.title == 'test3'), 'cant find test task3');
        });
    }
    getDBTest() {
        if (this.dbManager == null) {
            console.log('No init DB in getDBTest');
            return;
        }
    }
    async removeDBTest() {
        if (this.dbManager == null) {
            console.log('No init DB in addDBTest');
            return;
        }
        this.dbManager.tasksManager.getAllTasks().then(result => {
            if (this.dbManager === null) {
                console.log('How on earth did this happen?!');
                return;
            }
            const deletedId = this.dbManager.tasksManager.deleteTask(result[0].id).then(taskId => {
                console.log(`Deleted ID: ${taskId}`);
            });
        });
    }
}
