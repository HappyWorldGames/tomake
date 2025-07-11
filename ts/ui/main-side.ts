import { ProjectsManager } from "../core/projects_manager.js";
import { Task, TaskPriority, TaskStatus } from "../core/task.js";
import { TasksManager } from "../core/tasks_manager.js";

export class MainSideUI {

    taskAddInput: HTMLInputElement | null;
    taskAddButton: HTMLElement | null;

    taskArrayList: HTMLElement | null;

    #projectId: string = '';

    constructor() {
        this.taskAddInput = document.getElementById('task-add-input') as HTMLInputElement;
        this.taskAddButton = document.getElementById('add-task-btn');

        this.taskArrayList = document.getElementById('task-array-list');

        if (!this.taskAddInput) alert('error init taskArrayList');
        if (!this.taskAddButton) alert('error init taskAddButton');

        if (!this.taskArrayList) alert('error init taskArrayList');
    }

    setOnTaskAddButtonClickListener(tasksManager: TasksManager, projectsManager: ProjectsManager) {
        this.taskAddButton?.addEventListener('click', () => {
            if (this.taskAddInput == null) return;

            const titleTask = this.taskAddInput.value;
            const task = new Task(titleTask);
            task.startDate = new Date();

            tasksManager.addTask(task);
            this.taskAddInput.value = '';
            this.renderMainSide(tasksManager, projectsManager);
        });
    }

    renderMainSide(tasksManager: TasksManager, projectsManager: ProjectsManager, projectId: string = '', sysListName = 'today') {
        if (projectId !== '') this.#projectId = projectId;
        this.clearAll();

        // TODO listName load

        if (projectId !== '') return;
        switch(sysListName) {
            case 'today':
                this.addUntilToDay(tasksManager, projectsManager);
                this.addToDay(tasksManager, projectsManager);
                this.addCompletedAndNoCompleted(tasksManager, projectsManager);
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

    async addItem(task: Task, tasksManager: TasksManager, projectsManager: ProjectsManager) {
        if (this.taskArrayList == null || task.status === TaskStatus.Deleted) return;

        // body item
        const taskItem = document.createElement('li');
        taskItem.id = task.id;
        taskItem.classList.add('item');

        this.taskArrayList?.appendChild(taskItem);

        // checkbox item
        const taskCheckbox = document.createElement('input') as HTMLInputElement;
        taskCheckbox.type = 'checkbox';
        taskCheckbox.classList.add('task-checkbox');

        const priorityColor: string = function(): string {
            switch(task.priority) {
                case TaskPriority.High:
                    return 'red';
                case TaskPriority.Medium:
                    return 'yellow';
                case TaskPriority.Low:
                    return 'RoyalBlue';
                default:
                    return 'gray';
            }
        }();

        taskCheckbox.style.borderColor = priorityColor;
        taskCheckbox.style.accentColor = priorityColor;

        taskCheckbox.checked = !!task.completedDate;

        taskCheckbox.onchange = () => {
            task.completedDate = taskCheckbox.checked ? new Date() : null;
            task.status = taskCheckbox.checked ? TaskStatus.Completed : TaskStatus.Normal;

            tasksManager.updateTask(task).then(() => {
                this.renderMainSide(tasksManager, projectsManager);
            });
        }

        taskItem.appendChild(taskCheckbox);

        // input item
        const taskInput = document.createElement('input') as HTMLInputElement;
        taskInput.type = 'text';
        taskInput.classList.add('task-name');
        taskInput.value = task.title;

        let timerId: number;
        const debouncedSave = () => {
            clearTimeout(timerId);
            timerId = setTimeout(() => {
                if (task.title === taskInput.value) return;

                task.title = taskInput.value;
                tasksManager.updateTask(task);
            }, 2000);
        };

        taskInput.oninput = debouncedSave;
        taskInput.onblur = debouncedSave;
        window.onbeforeunload = () => {
            // TODO move from here
            debouncedSave();
        }

        taskItem.appendChild(taskInput);

        // listName button item
        const taskListNameButton = document.createElement('button') as HTMLButtonElement;
        taskListNameButton.type = 'button';
        taskListNameButton.classList.add('task-list-name-btn');

        const project = await projectsManager.getProjectFromId(task.listNameId);

        taskListNameButton.textContent = project ? project.name : '';
        taskListNameButton.addEventListener('click', () => {
            // TODO open listName
        });

        taskItem.appendChild(taskListNameButton);

        // date button item
        const taskDateButton = document.createElement('button') as HTMLButtonElement;
        taskDateButton.type = 'button';
        taskDateButton.classList.add('task-date-btn');
        taskDateButton.textContent = task.startDate != null ? this.dateToString(task.startDate) : '';

        const toDayDate = new Date();
        toDayDate.setHours(0, 0, 0, 0);

        if (task.startDate !== null && task.startDate < toDayDate) taskDateButton.style.color = 'red';
        taskDateButton.addEventListener('click', () => {
            // TODO edit date
        });

        taskItem.appendChild(taskDateButton);

        // delete button item
        const taskDeleteButton = document.createElement('button') as HTMLButtonElement;
        taskDeleteButton.type = 'button';
        taskDeleteButton.classList.add('task-delete');
        taskDeleteButton.textContent = "🗑️";
        taskDeleteButton.addEventListener('click', () => {
            tasksManager.deleteTask(task.id).then(() => this.renderMainSide(tasksManager, projectsManager));
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

    async addUntilToDay(tasksManager: TasksManager, projectsManager: ProjectsManager) {
        const endDate = new Date();
        endDate.setHours(0, 0, 0, 0);

        const tasks = (await tasksManager.getTasksFromIndex('startDate', null)).filter( task => {
            if (task.startDate !== null && task.startDate < endDate) return true;
            else return false;
        });
        if (tasks.length === 0) return;

        this.addTaskListName('Overdue');
        for (const task of tasks) {
            if (task.status !== TaskStatus.Completed && task.status !== TaskStatus.NoCompleted)
                this.addItem(task, tasksManager, projectsManager);
        }
    }

    async addToDay(tasksManager: TasksManager, projectsManager: ProjectsManager) {
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);

        const tasks = await tasksManager.getTasksFromIndex('startDate', IDBKeyRange.bound(startDate, endDate));
        if (tasks.length === 0) return;

        this.addTaskListName('ToDay');
        for (const task of tasks) {
            if (task.status !== TaskStatus.Completed && task.status !== TaskStatus.NoCompleted)
                this.addItem(task, tasksManager, projectsManager);
        }
    }

    async addCompletedAndNoCompleted(tasksManager: TasksManager, projectsManager: ProjectsManager) {
        // TODO tasks
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);

        const tasks = await tasksManager.getTasksFromIndex('startDate', IDBKeyRange.bound(startDate, endDate));
        if (tasks.length === 0) return;

        const hasCompleted = tasks.map(task => task.status).includes(TaskStatus.Completed);
        const hasNoCompleted = tasks.map(task => task.status).includes(TaskStatus.NoCompleted);
        let titleTaskList = '';

        if (hasCompleted) titleTaskList += 'Complete' + (hasNoCompleted ? ' and' : '');
        if (hasNoCompleted) titleTaskList += 'No complete';

        this.addTaskListName(titleTaskList);
        for (const task of tasks) {
            if (task.status === TaskStatus.Completed || task.status === TaskStatus.NoCompleted)
                this.addItem(task, tasksManager, projectsManager);
        }
    }

    dateToString(date: Date, fromDate: Date = new Date()): string {
        let result = '';

        if (date.getFullYear() !== fromDate.getFullYear()) result += `${date.getFullYear()} `;
        if (date.getDate() !== fromDate.getDate() || date.getMonth() !== fromDate.getMonth())
            result += `${date.toLocaleString('default', { month: 'short' })} ${date.getDate()}`;
        else result += date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return result;
    }
}
