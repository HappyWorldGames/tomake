import { ProjectStatus } from "../core/project.js";
import { ProjectsManager } from "../core/projects_manager.js";
import { Task, TaskPriority, TaskStatus } from "../core/task.js";
import { TasksManager } from "../core/tasks_manager.js";
import { getUTCDateFromLocal } from "../utils/date_converter.js";
import { insertChildAtIndex } from "../utils/html_functions.js";
import { CustomContextMenuUI } from "./custom-context-menu.js";
import { SysProjectId } from "./project-list-side.js";
import { TaskViewSideUI } from "./task-view-side.js";

export class MainSideUI {

    menuButton: HTMLButtonElement;

    taskForm: HTMLDivElement;
    taskAddInput: HTMLInputElement;
    taskFormDown: HTMLDivElement;
    taskNewDateButton: HTMLInputElement;
    taskNewPrioritySelect: HTMLSelectElement;
    taskNewProjectSelect: HTMLSelectElement;
    taskAddButton: HTMLButtonElement;

    taskArrayList: HTMLElement;

    #taskViewSideUI: TaskViewSideUI;
    #customContextMenuUI: CustomContextMenuUI;

    #projectId: string = '';
    #selectedTaskItemId: string = '';

    constructor(taskViewSideUI: TaskViewSideUI, customContextMenuUI: CustomContextMenuUI) {
        this.menuButton = document.getElementById('menu-btn') as HTMLButtonElement;

        this.taskForm = document.getElementById('task-form') as HTMLDivElement;
        this.taskAddInput = document.getElementById('task-add-input') as HTMLInputElement;
        this.taskFormDown = document.getElementById('task-form-down') as HTMLDivElement;
        this.taskNewDateButton = document.getElementById('task-new-date-button') as HTMLInputElement;
        this.taskNewPrioritySelect = document.getElementById('task-new-priority-select') as HTMLSelectElement;
        this.taskNewProjectSelect = document.getElementById('task-new-project-select') as HTMLSelectElement;
        this.taskAddButton = document.getElementById('add-task-btn') as HTMLButtonElement;

        this.taskArrayList = document.getElementById('task-array-list') as HTMLUListElement;

        this.#taskViewSideUI = taskViewSideUI;
        this.#customContextMenuUI = customContextMenuUI;
    }

    setOnTaskAddButtonClickListener(tasksManager: TasksManager, projectsManager: ProjectsManager, menuButtonClick: Function) {
        this.menuButton.onclick = () => {
            menuButtonClick();
        }

        this.taskForm.onclick = () => {
            projectsManager.getAllProjects().then(projects => {
                while(this.taskNewProjectSelect.firstChild)
                    this.taskNewProjectSelect.firstChild.remove();

                // add system project
                const inboxItem = document.createElement('option');
                inboxItem.value = SysProjectId.Inbox;
                inboxItem.text = 'Inbox';
                this.taskNewProjectSelect.appendChild(inboxItem);

                for (const project of projects) {
                    if (project.status === ProjectStatus.Deleted) continue;

                    const selectItem = document.createElement('option') as HTMLOptionElement;
                    selectItem.value = project.id;
                    selectItem.text = project.name;

                    insertChildAtIndex(this.taskNewProjectSelect, selectItem, project.order);
                }

                this.taskNewProjectSelect.value = SysProjectId.Inbox;
            });

            this.taskFormDown.style.display = 'flex';
            this.taskForm.style.outline = 'solid';
            this.taskForm.style.outlineColor = 'green';
        }

        const addTaskUI = () => {
            const titleTask = this.taskAddInput.value;
            if (!titleTask) return;

            const task = new Task(titleTask);
            task.startDate = getUTCDateFromLocal(this.taskNewDateButton.value);
            task.priority = Number(this.taskNewPrioritySelect.value) as TaskPriority;
            task.listNameId = this.taskNewProjectSelect.value;

            tasksManager.addTask(task).then(() => {
                this.renderMainSide(tasksManager, projectsManager);
                this.taskAddInput.value = '';
            });
        }

        this.taskAddButton?.addEventListener('click', () => {
            addTaskUI();
        });
        this.taskAddInput.onkeydown = (event) => {
            if (event.key === 'Enter') {
                addTaskUI();
            }
        }
    }

    async renderMainSide(tasksManager: TasksManager, projectsManager: ProjectsManager, projectId: string = '') {
        if (projectId !== '') this.#projectId = projectId;
        this.#taskViewSideUI.renderTaskViewSide(null, tasksManager, projectsManager);
        this.#selectedTaskItemId = '';
        this.clearAll();

        // check system or not
        if (projectId.length < 4 && projectId !== SysProjectId.Inbox) {
            switch(this.#projectId) {
                case SysProjectId.All:
                    const tasksWithStartDate = await tasksManager.getTasksFromIndex('startDate', null);
                    let dateNow: Date | null = null;
                    tasksWithStartDate.forEach(task => {
                        if (task.status == TaskStatus.Normal && task.startDate != null) {
                            if (dateNow == null || task.startDate != dateNow) {
                                dateNow = task.startDate;
                                this.addTaskListName(dateNow.toDateString());
                            }
                            this.addItem(task, tasksManager, projectsManager);
                        }
                    });
                    break;
                case SysProjectId.ToDay:
                    this.addSysToDay(tasksManager, projectsManager);
                    break;
                case SysProjectId.Tomorrow:
                    const date = new Date();
                    date.setHours(23, 59, 59, 999);
                    this.addFiltredList(tasksManager, projectsManager, 'startDate', IDBKeyRange.lowerBound(date.toISOString()), 'Tomorrow');
                    break;
                case SysProjectId.Next_7_Days:
                    const date7 = new Date();
                    date7.setHours(0, 0, 0, 0);
                    const date7t = new Date();
                    date7t.setHours(23, 59, 59, 999);
                    for (let day = 0; day < 7; day++) {
                        this.addFiltredList(tasksManager, projectsManager, 'startDate', IDBKeyRange.bound(date7.toISOString(), date7t.toISOString()), date7.toDateString());
                        date7.setDate(date7.getDate() + 1);
                        date7t.setDate(date7t.getDate() + 1);
                    }
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

        const dateRange = IDBKeyRange.bound(startDate.toISOString(), endDate.toISOString());

        this.addFiltredList(tasksManager, projectsManager, 'startDate', dateRange, 'ToDay', true, true);
    }

    async addUntilToDay(tasksManager: TasksManager, projectsManager: ProjectsManager) {
        const endDate = new Date();
        endDate.setHours(0, 0, 0, 0);

        this.addFiltredList(tasksManager, projectsManager, 'startDate', IDBKeyRange.upperBound(endDate.toISOString()), 'Overdue', false);
    }

    async addFiltredList(
        tasksManager: TasksManager,
        projectsManager: ProjectsManager,
        index: string,
        dateRange: IDBKeyRange,
        taskListName: string = '',
        withCompleteTasks = true,
        withToDayCompleteTasks = false
    ) {
        const tasks = await tasksManager.getTasksFromIndex(index, dateRange);
        if (tasks.length === 0) return;

        const filtredTasks: Task[] = [];
        const completeTasks: Task[] = [];
        for (const task of tasks) {
            if (task.status === TaskStatus.Normal)
                filtredTasks.push(task);
            else if (task.status === TaskStatus.Completed || task.status === TaskStatus.NoCompleted)
                completeTasks.push(task);
        }

        if (filtredTasks.length !== 0) {
            if (taskListName !== '') this.addTaskListName(taskListName);
            for (const task of filtredTasks)
                this.addItem(task, tasksManager, projectsManager);
        }

        if (withToDayCompleteTasks) {
            const toDayCompleteTasks = await tasksManager.getTasksFromIndex('completedDate', dateRange);
            toDayCompleteTasks.forEach(task => {
                switch(task.status) {
                    case TaskStatus.Completed:
                    case TaskStatus.NoCompleted:
                        if (!completeTasks.includes(task))
                            completeTasks.push(task);
                }
            });
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

    globalClick(event: MouseEvent) {
        if (event.target instanceof Node && this.taskForm.contains(event.target)) return;
            this.taskFormDown.style.display = '';
            this.taskForm.style.outline = '';
            this.taskForm.style.outlineColor = '';
    }
}
