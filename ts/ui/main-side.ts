import { ProjectsManager } from "../core/projects_manager.js";
import { Task, TaskPriority, TaskStatus } from "../core/task.js";
import { TasksManager } from "../core/tasks_manager.js";
import { CustomContextMenuUI } from "./custom-context-menu.js";
import { SysProjectId } from "./project-list-side.js";
import { TaskViewSideUI } from "./task-view-side.js";

export class MainSideUI {

    menuButton: HTMLButtonElement;

    taskAddInput: HTMLInputElement;
    taskAddButton: HTMLElement;

    taskArrayList: HTMLElement;

    #taskViewSideUI: TaskViewSideUI;
    #customContextMenuUI: CustomContextMenuUI;

    #projectId: string = '';
    #selectedTaskItemId: string = '';

    constructor(taskViewSideUI: TaskViewSideUI, customContextMenuUI: CustomContextMenuUI, menuButtonClick: Function) {
        this.menuButton = document.getElementById('menu-btn') as HTMLButtonElement;

        this.taskAddInput = document.getElementById('task-add-input') as HTMLInputElement;
        this.taskAddButton = document.getElementById('add-task-btn') as HTMLButtonElement;

        this.taskArrayList = document.getElementById('task-array-list') as HTMLUListElement;

        this.#taskViewSideUI = taskViewSideUI;
        this.#customContextMenuUI = customContextMenuUI;

        this.menuButton.onclick = () => {
            menuButtonClick();
        }
    }

    setOnTaskAddButtonClickListener(tasksManager: TasksManager, projectsManager: ProjectsManager) {
        this.taskAddButton?.addEventListener('click', () => {
            if (this.taskAddInput == null) return;

            const titleTask = this.taskAddInput.value;
            const task = new Task(titleTask);
            task.startDate = new Date();

            tasksManager.addTask(task).then(() => {
                this.renderMainSide(tasksManager, projectsManager);
                this.taskAddInput.value = '';
            });
        });
    }

    renderMainSide(tasksManager: TasksManager, projectsManager: ProjectsManager, projectId: string = '') {
        if (projectId !== '') this.#projectId = projectId;
        this.#taskViewSideUI.renderTaskViewSide(null, tasksManager, projectsManager);
        this.#selectedTaskItemId = '';
        this.clearAll();

        // check system or not
        if (projectId.length < 4 && projectId !== SysProjectId.Inbox) {
            switch(this.#projectId) {
                case SysProjectId.ToDay:
                    this.addSysToDay(tasksManager, projectsManager);
                    break;
            }
        } else {
            this.addFiltredList(tasksManager, projectsManager, 'listNameId', IDBKeyRange.only(projectId));
        }
    }

    clearAll() {
        // clear tasks
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

    // TODO make fun small
    async addItem(task: Task, tasksManager: TasksManager, projectsManager: ProjectsManager) {
        if (this.taskArrayList == null || task.status === TaskStatus.Deleted) return;

        // body item
        const taskItem = document.createElement('li');
        taskItem.id = task.id;
        taskItem.classList.add('item');
        if (this.#selectedTaskItemId === task.id) taskItem.classList.add('selected');

        taskItem.onclick = (event) => {
            if (this.#selectedTaskItemId === task.id || event.target === taskMoreButton) return;

            document.getElementById(this.#selectedTaskItemId)?.classList.remove('selected');
            this.#selectedTaskItemId = task.id;
            taskItem.classList.add('selected');
            taskTitleInput.focus();

            this.#taskViewSideUI.renderTaskViewSide(task, tasksManager, projectsManager);
            this.#taskViewSideUI.updateStyle(() => this.renderMainSide(tasksManager, projectsManager));
        }

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
        const taskTitleInput = document.createElement('input') as HTMLInputElement;
        taskTitleInput.type = 'text';
        taskTitleInput.classList.add('task-name');
        taskTitleInput.value = task.title;
        taskTitleInput.placeholder = 'No Title';

        taskTitleInput.readOnly = true;
        // TODO make save with taskViewSide
        // const saveTask = () => {
        //     if (task.title === taskTitleInput.value) return;

        //     task.title = taskTitleInput.value;
        //     tasksManager.updateTask(task);
        // };

        // let timerId: number;
        // taskTitleInput.oninput = () => {
        //     clearTimeout(timerId);
        //     timerId = setTimeout(() => {
        //         saveTask();
        //     }, 2500);
        // };
        // taskTitleInput.onblur = saveTask;
        // window.onbeforeunload = () => {
        //     // TODO move from here
        //     saveTask();
        // };

        taskItem.appendChild(taskTitleInput);

        // listName button item
        const taskListNameButton = document.createElement('button') as HTMLButtonElement;
        taskListNameButton.type = 'button';
        taskListNameButton.classList.add('task-list-name-btn');

        if (task.listNameId === SysProjectId.Inbox) taskListNameButton.textContent = 'Inbox';
        else projectsManager.getProjectFromId(task.listNameId).then(project => {
            taskListNameButton.textContent = project ? project.name : '';
        });

        taskListNameButton.addEventListener('click', () => {
            // Open listName
            this.renderMainSide(tasksManager, projectsManager, task.listNameId);
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

        // more button item
        const taskMoreButton = document.createElement('button') as HTMLButtonElement;
        taskMoreButton.type = 'button';
        taskMoreButton.classList.add('task-more-btn');
        taskMoreButton.textContent = "···";
        taskMoreButton.addEventListener('click', (event) => {
            this.#customContextMenuUI.showTask(event, task,
                () => {
                    this.renderMainSide(tasksManager, projectsManager);
                    this.#taskViewSideUI.renderTaskViewSide(null, tasksManager, projectsManager);
                }, null,
                () => {
                taskItem.remove();
                this.#taskViewSideUI.renderTaskViewSide(null, tasksManager, projectsManager);
            });
        });

        taskItem.appendChild(taskMoreButton);
    }

    async addSysToDay(tasksManager: TasksManager, projectsManager: ProjectsManager) {
        this.addUntilToDay(tasksManager, projectsManager);

        // ToDay
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);

        this.addFiltredList(tasksManager, projectsManager, 'startDate', IDBKeyRange.bound(startDate, endDate), 'ToDay');
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

    async addFiltredList(tasksManager: TasksManager, projectsManager: ProjectsManager, index: string, dateRange: IDBKeyRange, taskListName: string = '', withCompleteTasks = true) {
        const tasks = await tasksManager.getTasksFromIndex(index, dateRange);
        if (tasks.length === 0) return;

        const filtredTasks: Task[] = [];
        const completeTasks: Task[] = [];
        for (const task of tasks) {
            if (task.status !== TaskStatus.Completed && task.status !== TaskStatus.NoCompleted)
                filtredTasks.push(task);
            else if (task.status === TaskStatus.Completed || task.status === TaskStatus.NoCompleted)
                completeTasks.push(task);
        }

        if (filtredTasks.length !== 0) {
            if (taskListName !== '') this.addTaskListName(taskListName);
            for (const task of filtredTasks)
                this.addItem(task, tasksManager, projectsManager);
        }

        if (!withCompleteTasks || completeTasks.length === 0) return;
        const hasCompleted = completeTasks.map(task => task.status).includes(TaskStatus.Completed);
        const hasNoCompleted = completeTasks.map(task => task.status).includes(TaskStatus.NoCompleted);

        let titleTaskList = '';
        if (hasCompleted) titleTaskList += 'Complete' + (hasNoCompleted ? ' and' : '');
        if (hasNoCompleted) titleTaskList += 'No complete';

        if (titleTaskList === '') return;

        this.addTaskListName(titleTaskList);
        for (const task of completeTasks)
            this.addItem(task, tasksManager, projectsManager);
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
