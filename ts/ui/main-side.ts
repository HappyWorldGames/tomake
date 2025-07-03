import { DatabaseManager } from "../core/database_manager.js";
import { Task } from "../core/task.js";

export class MainSideUI {

    taskAddInput: HTMLInputElement | null;
    taskAddButton: HTMLElement | null;

    taskArrayList: HTMLElement | null;

    #listName: string = 'today';

    constructor() {
        this.taskAddInput = document.getElementById('task-add-input') as HTMLInputElement;
        this.taskAddButton = document.getElementById('add-task-btn');

        this.taskArrayList = document.getElementById('task-array-list');

        if (!this.taskAddInput) alert('error init taskArrayList');
        if (!this.taskAddButton) alert('error init taskAddButton');

        if (!this.taskArrayList) alert('error init taskArrayList');
    }

    setOnTaskAddButtonClickListener(dbManager: DatabaseManager) {
        this.taskAddButton?.addEventListener('click', () => {
            if (this.taskAddInput == null) return;

            const titleTask = this.taskAddInput.value;
            const task = new Task(titleTask);
            task.startDate = new Date();

            dbManager.tasksManager.addTask(task);
            this.taskAddInput.value = '';
            this.renderMainSide(dbManager);
        });
    }

    renderMainSide(dbManager: DatabaseManager, listName: string = '') {
        if (listName != '') this.#listName = listName;
        this.clearAll();
        
        this.addToDay(dbManager);
    }

    clearAll() {
        if (this.taskArrayList == null) return;

        while(this.taskArrayList.firstChild)
            this.taskArrayList.removeChild(this.taskArrayList.firstChild);
    }

    addTaskListName(text: string) {
        if (this.taskArrayList == null) return;

        const taskListName = document.createElement('div');

        taskListName.classList.add('task-list-name');
        taskListName.textContent = text;

        this.taskArrayList.appendChild(taskListName);
    }

    addItem(task: Task) {
        if (this.taskArrayList == null) return;

        const taskItem = document.createElement('li');

        taskItem.id = task.id;
        taskItem.classList.add('item');

        const taskInput = document.createElement('input');

        taskInput.type = 'text';
        taskInput.classList.add('task-name');
        taskInput.value = task.title;

        taskItem.appendChild(taskInput);
        this.taskArrayList?.appendChild(taskItem);
    }

    async addToDay(dbManager: DatabaseManager) {
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);

        const tasks = await dbManager.tasksManager.getTasksFromIndex('startDate', IDBKeyRange.bound(startDate, endDate));
        if (tasks.length == 0) return;

        this.addTaskListName('ToDay');
        for (const task of tasks) {
            this.addItem(task);
        }
    }
}