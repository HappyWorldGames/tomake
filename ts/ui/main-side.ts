import { Task } from "../core/task.js";
import { TasksManager } from "../core/tasks_manager.js";

export class MainSideUI {

    taskAddInput: HTMLInputElement | null;
    taskAddButton: HTMLElement | null;

    taskArrayList: HTMLElement | null;

    #listName: string = '';

    constructor() {
        this.taskAddInput = document.getElementById('task-add-input') as HTMLInputElement;
        this.taskAddButton = document.getElementById('add-task-btn');

        this.taskArrayList = document.getElementById('task-array-list');

        if (!this.taskAddInput) alert('error init taskArrayList');
        if (!this.taskAddButton) alert('error init taskAddButton');

        if (!this.taskArrayList) alert('error init taskArrayList');
    }

    setOnTaskAddButtonClickListener(tasksManager: TasksManager) {
        this.taskAddButton?.addEventListener('click', () => {
            if (this.taskAddInput == null) return;

            const titleTask = this.taskAddInput.value;
            const task = new Task(titleTask);
            task.startDate = new Date();

            tasksManager.addTask(task);
            this.taskAddInput.value = '';
            this.renderMainSide(tasksManager);
        });
    }

    renderMainSide(tasksManager: TasksManager, listName: string = '', sysListName = 'today') {
        if (listName !== '') this.#listName = listName;
        this.clearAll();

        // TODO listName load

        if (listName !== '') return;
        switch(sysListName) {
            case 'today':
                this.addUntilToDay(tasksManager);
                this.addToDay(tasksManager);
                break;
        }
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

    addItem(task: Task, tasksManager: TasksManager) {
        if (this.taskArrayList == null) return;

        const taskItem = document.createElement('li');
        taskItem.id = task.id;
        taskItem.classList.add('item');

        this.taskArrayList?.appendChild(taskItem);

        const taskInput = document.createElement('input') as HTMLInputElement;
        taskInput.type = 'text';
        taskInput.classList.add('task-name');
        taskInput.value = task.title;

        taskItem.appendChild(taskInput);

        const taskDelete = document.createElement('button') as HTMLButtonElement;
        taskDelete.type = 'button';
        taskDelete.classList.add('task-delete');
        taskDelete.textContent = "🗑️";
        taskDelete.addEventListener('click', () => {
            tasksManager.deleteTask(task.id);
        })

        taskItem.appendChild(taskDelete);
    }

    async addUntilToDay(tasksManager: TasksManager) {
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);

        const tasks = await tasksManager.getTasksFromIndex('startDate', IDBKeyRange.lowerBound(endDate));
        if (tasks.length === 0) return;

        this.addTaskListName('Overdue');
        for (const task of tasks) {
            this.addItem(task, tasksManager);
        }
    }

    async addToDay(tasksManager: TasksManager) {
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);

        const tasks = await tasksManager.getTasksFromIndex('startDate', IDBKeyRange.bound(startDate, endDate));
        if (tasks.length === 0) return;

        this.addTaskListName('ToDay');
        for (const task of tasks) {
            this.addItem(task, tasksManager);
        }
    }
}