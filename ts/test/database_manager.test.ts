import { DatabaseManager } from "../core/database_manager.js";
import { Task, TaskStatus } from "../core/task.js";

export class DatabaseManagerTest {
    print: (text: string) => void
    printError: (text: string) => void

    dbManager: DatabaseManager | null = null;

    constructor(
        print: (text: string) => void, 
        printError: (text: string) => void
    ){
        this.print = print;
        this.printError = printError;
    }

    async testAll() {
        await this.initDBTest();
        this.addDBTest();
        this.getDBTest();
        this.removeDBTest();
    }

    async initDBTest() {
        indexedDB.deleteDatabase(DatabaseManager.dbName);
        this.print('Old DB deleted');

        this.dbManager = new DatabaseManager(this.printError);
        const db = await this.dbManager.initDB();

        this.print(`DB name: ${db.name}`);
        if (this.dbManager !== null) this.dbManager.tasksManager.getAllTasks().then(result => {
            this.print(`${result.length}`);
        });
    }

    addDBTest() {
        if (this.dbManager == null) {
            this.printError('No init DB in addDBTest');
            return;
        }

        const testTask = new Task('test');
        testTask.repeat = [...testTask.repeat, new Date(1), new Date()];

        this.dbManager.tasksManager.addTask(testTask);

        const testTask2 = new Task('test2');
        testTask2.status = TaskStatus.Completed;
        const testTask3 = new Task('test3');
        
        this.dbManager.tasksManager.addTask(testTask2);
        this.dbManager.tasksManager.addTask(testTask3);
    }

    getDBTest() {
        if (this.dbManager == null) {
            this.printError('No init DB in addDBTest');
            return;
        }

        this.dbManager.tasksManager.getAllTasks().then(tasks => {
            this.print('Test getAllTasks');
            this.print(`tasks length: ${tasks.length}`);
            if (tasks.length > 0) this.print(`first element title: ${tasks[0].title}`);
            this.print('End getAllTasks');
        }).catch(e => {
            this.printError(e);
        });

        this.dbManager.tasksManager.getTasksFromIndex('status', IDBKeyRange.upperBound(1, true)).then(tasks => {
            this.print('Test getTaskFromIndex');
            this.print(`tasks length: ${tasks.length}`);
            if (tasks.length > 0) this.print(`first element title: ${tasks[0].title}`);
            this.print('End getTaskFromIndex');
        }).catch(err => {
            this.printError(err);
        })
    }

    async removeDBTest() {
        if (this.dbManager == null) {
            this.printError('No init DB in addDBTest');
            return;
        }

        this.dbManager.tasksManager.getAllTasks().then(result => {
            if (this.dbManager === null) {
                this.printError('How on earth did this happen?!');
                return;                
            }
            
            const deletedId = this.dbManager.tasksManager.deleteTask(result[0].id).then(taskId => {
                this.print(`Deleted ID: ${taskId}`);
            });
        });
    }

}