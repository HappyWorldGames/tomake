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
        taskListName.addEventListener('click', () => {
            const children = taskListName.parentElement?.children;
            if (children == null) return;

            let startHide = false;
            for (let i = 0; i < children.length; i++) {
                const childItem = children[i] as HTMLElement;
                if (childItem instanceof HTMLDivElement){
                    if (startHide) return;
                    else if (childItem.textContent === text) startHide = true;
                }else if (startHide) {
                    if (childItem.style.display !== 'none')
                        childItem.style.display = 'none';
                    else childItem.style = '';
                }
            }
        })

        this.taskArrayList.appendChild(taskListName);
    }

    addItem(task: Task, tasksManager: TasksManager) {
        if (this.taskArrayList == null) return;

        // body item
        const taskItem = document.createElement('li');
        taskItem.id = task.id;
        taskItem.classList.add('item');

        this.taskArrayList?.appendChild(taskItem);

        // input item
        const taskInput = document.createElement('input') as HTMLInputElement;
        taskInput.type = 'text';
        taskInput.classList.add('task-name');
        taskInput.value = task.title;

        taskItem.appendChild(taskInput);

        // date button item
        const taskDateButton = document.createElement('button') as HTMLButtonElement;
        taskDateButton.type = 'button';
        taskDateButton.classList.add('task-date-btn');
        taskDateButton.textContent = task.startDate != null ? this.dateToString(task.startDate) : '';

        const toDayDate = new Date();
        toDayDate.setHours(0, 0, 0, 0);

        if (task.startDate !== null && task.startDate < toDayDate) taskDateButton.style.color = 'red';
        taskDateButton.addEventListener('click', () => {
            // TODO
        });

        taskItem.appendChild(taskDateButton);

        // delete button item
        const taskDeleteButton = document.createElement('button') as HTMLButtonElement;
        taskDeleteButton.type = 'button';
        taskDeleteButton.classList.add('task-delete');
        taskDeleteButton.textContent = "🗑️";
        taskDeleteButton.addEventListener('click', () => {
            tasksManager.deleteTask(task.id);
        });

        taskItem.appendChild(taskDeleteButton);

        // more button item
        const taskMoreButton = document.createElement('button') as HTMLButtonElement;
        taskMoreButton.type = 'button';
        taskMoreButton.classList.add('task-more-btn');
        taskMoreButton.textContent = "...";
        taskMoreButton.addEventListener('click', () => {
            // TODO open more menu
        });

        taskItem.appendChild(taskMoreButton);
    }

    async addUntilToDay(tasksManager: TasksManager) {
        const endDate = new Date();
        endDate.setHours(0, 0, 0, 0);

        const tasks = (await tasksManager.getTasksFromIndex('startDate', null)).filter( task => {
            if (task.startDate !== null && task.startDate < endDate) return true;
            else return false;
        });
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

    dateToString(date: Date): string {
        const dateNow = new Date();
        let result = '';

        if (date.getFullYear() !== dateNow.getFullYear()) result += `${date.getFullYear()} `;
        if (date.getDate() !== dateNow.getDate() || date.getMonth() !== dateNow.getMonth())
            result += `${date.toLocaleString('default', { month: 'short' })} ${date.getDate()}`;
        else result += `${date.getHours()}:${date.getMinutes()}`;

        return result;
    }
}