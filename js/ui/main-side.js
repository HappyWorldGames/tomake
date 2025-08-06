import { ProjectStatus } from "../core/project.js";
import { Task, TaskPriority, TaskStatus } from "../core/task.js";
import { convertToDateTimeLocalString, getUTCDateFromLocal } from "../utils/date_converter.js";
import { insertChildAtIndex } from "../utils/html_functions.js";
import { ProjectListSideUI, SysProjectId } from "./project-list-side.js";
export class MainSideUI {
    constructor(customContextMenuUI, tasksManager, projectsManager, renderTaskViewSide, selectProject) {
        this.projectId = '';
        this.selectedTaskItemId = '';
        this.menuButton = document.getElementById('menu-btn');
        this.taskForm = document.getElementById('task-form');
        this.taskAddInput = document.getElementById('task-add-input');
        this.taskFormDown = document.getElementById('task-form-down');
        this.taskNewDateButton = document.getElementById('task-new-date-button');
        this.taskNewPrioritySelect = document.getElementById('task-new-priority-select');
        this.taskNewProjectSelect = document.getElementById('task-new-project-select');
        this.taskAddButton = document.getElementById('add-task-btn');
        this.taskArrayList = document.getElementById('task-array-list');
        this.customContextMenuUI = customContextMenuUI;
        this.tasksManager = tasksManager;
        this.projectsManager = projectsManager;
        this.renderTaskViewSide = renderTaskViewSide;
        this.selectProject = selectProject;
    }
    setOnTaskAddButtonClickListener(menuButtonClick) {
        var _a;
        this.menuButton.onclick = () => {
            menuButtonClick();
        };
        this.taskForm.onclick = () => {
            this.projectsManager.getAllProjects().then(projects => {
                while (this.taskNewProjectSelect.firstChild)
                    this.taskNewProjectSelect.firstChild.remove();
                const inboxItem = document.createElement('option');
                inboxItem.value = SysProjectId.Inbox;
                inboxItem.text = 'Inbox';
                this.taskNewProjectSelect.appendChild(inboxItem);
                for (const project of projects) {
                    if (project.status === ProjectStatus.Deleted)
                        continue;
                    const selectItem = document.createElement('option');
                    selectItem.value = project.id;
                    selectItem.text = project.name;
                    insertChildAtIndex(this.taskNewProjectSelect, selectItem, project.order);
                }
                this.taskNewProjectSelect.value = this.projectId.length < 4 ? SysProjectId.Inbox : this.projectId;
                this.taskNewDateButton.value = this.projectId === SysProjectId.ToDay ? convertToDateTimeLocalString(new Date()) : '';
            });
            this.taskFormDown.style.display = 'flex';
            this.taskForm.style.outline = 'solid';
            this.taskForm.style.outlineColor = 'green';
        };
        const addTaskUI = () => {
            const titleTask = this.taskAddInput.value;
            if (!titleTask)
                return;
            const task = new Task(titleTask);
            task.startDate = getUTCDateFromLocal(this.taskNewDateButton.value);
            task.priority = Number(this.taskNewPrioritySelect.value);
            task.listNameId = this.taskNewProjectSelect.value;
            this.tasksManager.addTask(task).then(() => {
                this.renderMainSide();
                this.taskAddInput.value = '';
            });
        };
        (_a = this.taskAddButton) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
            addTaskUI();
        });
        this.taskAddInput.onkeydown = (event) => {
            if (event.key === 'Enter') {
                addTaskUI();
            }
        };
    }
    async renderMainSide(projectId = '') {
        if (projectId !== '')
            this.projectId = projectId;
        this.renderTaskViewSide(null);
        this.selectedTaskItemId = '';
        this.clearAll();
        if (projectId.length < 4 && projectId !== SysProjectId.Inbox) {
            switch (this.projectId) {
                case SysProjectId.All:
                    const tasksWithStartDate = await this.tasksManager.getTasksFromIndex('startDate', null);
                    let dateNow = null;
                    tasksWithStartDate.forEach(task => {
                        if (task.status == TaskStatus.Normal && task.startDate != null) {
                            if (dateNow == null || task.startDate != dateNow) {
                                dateNow = task.startDate;
                                this.addTaskListName(dateNow.toDateString());
                            }
                            this.addItem(task);
                        }
                    });
                    break;
                case SysProjectId.ToDay:
                    this.addSysToDay();
                    break;
                case SysProjectId.Tomorrow:
                    const date = new Date();
                    date.setHours(23, 59, 59, 999);
                    this.addFiltredList('startDate', IDBKeyRange.lowerBound(date.toISOString()), 'Tomorrow');
                    break;
                case SysProjectId.Next_7_Days:
                    const date7 = new Date();
                    date7.setHours(0, 0, 0, 0);
                    const date7t = new Date();
                    date7t.setHours(23, 59, 59, 999);
                    for (let day = 0; day < 7; day++) {
                        this.addFiltredList('startDate', IDBKeyRange.bound(date7.toISOString(), date7t.toISOString()), date7.toDateString());
                        date7.setDate(date7.getDate() + 1);
                        date7t.setDate(date7t.getDate() + 1);
                    }
                    break;
            }
        }
        else {
            this.addFiltredList('listNameId', IDBKeyRange.only(projectId));
        }
    }
    clearAll() {
        while (this.taskArrayList.firstChild)
            this.taskArrayList.removeChild(this.taskArrayList.firstChild);
    }
    addTaskListName(text) {
        if (this.taskArrayList == null)
            return;
        const taskListName = document.createElement('div');
        taskListName.classList.add('task-list-name');
        taskListName.textContent = text;
        taskListName.addEventListener('click', () => {
            var _a;
            const children = (_a = taskListName.parentElement) === null || _a === void 0 ? void 0 : _a.children;
            if (children == null)
                return;
            let startHide = false;
            for (let i = 0; i < children.length; i++) {
                const childItem = children[i];
                if (childItem instanceof HTMLDivElement) {
                    if (startHide)
                        return;
                    else if (childItem.textContent === text)
                        startHide = true;
                }
                else if (startHide) {
                    if (childItem.style.display !== 'none')
                        childItem.style.display = 'none';
                    else
                        childItem.style = '';
                }
            }
        });
        this.taskArrayList.appendChild(taskListName);
    }
    async addItem(task) {
        var _a;
        if (this.taskArrayList == null || task.status === TaskStatus.Deleted)
            return;
        const taskItem = document.createElement('li');
        taskItem.id = task.id;
        taskItem.classList.add('item');
        if (this.selectedTaskItemId === task.id)
            taskItem.classList.add('selected');
        taskItem.onclick = (event) => {
            var _a;
            if (this.selectedTaskItemId === task.id)
                return;
            switch (event.target) {
                case taskMoreButton:
                case taskListNameButton:
                    return;
            }
            (_a = document.getElementById(this.selectedTaskItemId)) === null || _a === void 0 ? void 0 : _a.classList.remove('selected');
            this.selectedTaskItemId = task.id;
            taskItem.classList.add('selected');
            taskTitleInput.focus();
            this.renderTaskViewSide(task, () => this.renderMainSide());
        };
        (_a = this.taskArrayList) === null || _a === void 0 ? void 0 : _a.appendChild(taskItem);
        const taskCheckbox = document.createElement('input');
        taskCheckbox.type = 'checkbox';
        taskCheckbox.classList.add('task-checkbox');
        const priorityColor = function () {
            switch (task.priority) {
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
            this.tasksManager.updateTask(task).then(() => {
                this.renderMainSide();
            });
        };
        taskItem.appendChild(taskCheckbox);
        const taskTitleInput = document.createElement('input');
        taskTitleInput.type = 'text';
        taskTitleInput.classList.add('task-name');
        taskTitleInput.value = task.title;
        taskTitleInput.placeholder = 'No Title';
        taskTitleInput.readOnly = true;
        taskItem.appendChild(taskTitleInput);
        const taskListNameButton = document.createElement('button');
        taskListNameButton.type = 'button';
        taskListNameButton.classList.add('task-list-name-btn');
        if (task.listNameId === SysProjectId.Inbox)
            taskListNameButton.textContent = 'Inbox';
        else
            this.projectsManager.getProjectFromId(task.listNameId).then(project => {
                taskListNameButton.textContent = project ? project.name : '';
            });
        taskListNameButton.onclick = async () => {
            const project = task.listNameId === SysProjectId.Inbox ? ProjectListSideUI.SysProjectList[4] : await this.projectsManager.getProjectFromId(task.listNameId);
            if (project)
                this.selectProject(project);
        };
        taskItem.appendChild(taskListNameButton);
        const taskDateButton = document.createElement('button');
        taskDateButton.type = 'button';
        taskDateButton.classList.add('task-date-btn');
        taskDateButton.textContent = task.startDate != null ? this.dateToString(task.startDate) : '';
        const toDayDate = new Date();
        toDayDate.setHours(0, 0, 0, 0);
        if (task.startDate !== null && task.startDate < toDayDate)
            taskDateButton.style.color = 'red';
        taskDateButton.addEventListener('click', () => {
        });
        taskItem.appendChild(taskDateButton);
        const taskMoreButton = document.createElement('button');
        taskMoreButton.type = 'button';
        taskMoreButton.classList.add('task-more-btn');
        taskMoreButton.textContent = "···";
        taskMoreButton.addEventListener('click', (event) => {
            this.customContextMenuUI.showTask(event, task, () => {
                this.renderMainSide();
                this.renderTaskViewSide(null);
            }, null, () => {
                taskItem.remove();
                this.renderTaskViewSide(null);
            });
        });
        taskItem.appendChild(taskMoreButton);
    }
    async addSysToDay() {
        this.addUntilToDay();
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        const dateRange = IDBKeyRange.bound(startDate.toISOString(), endDate.toISOString());
        this.addFiltredList('startDate', dateRange, 'ToDay', true, true);
    }
    async addUntilToDay() {
        const endDate = new Date();
        endDate.setHours(0, 0, 0, 0);
        this.addFiltredList('startDate', IDBKeyRange.upperBound(endDate.toISOString()), 'Overdue', false);
    }
    async addFiltredList(index, dateRange, taskListName = '', withCompleteTasks = true, withToDayCompleteTasks = false) {
        const tasks = await this.tasksManager.getTasksFromIndex(index, dateRange);
        if (tasks.length === 0)
            return;
        const filtredTasks = [];
        const completeTasks = [];
        for (const task of tasks) {
            if (task.status === TaskStatus.Normal)
                filtredTasks.push(task);
            else if (task.status === TaskStatus.Completed || task.status === TaskStatus.NoCompleted)
                completeTasks.push(task);
        }
        if (filtredTasks.length !== 0) {
            if (taskListName !== '')
                this.addTaskListName(taskListName);
            for (const task of filtredTasks)
                this.addItem(task);
        }
        if (withToDayCompleteTasks) {
            const toDayCompleteTasks = await this.tasksManager.getTasksFromIndex('completedDate', dateRange);
            toDayCompleteTasks.forEach(task => {
                switch (task.status) {
                    case TaskStatus.Completed:
                    case TaskStatus.NoCompleted:
                        if (!completeTasks.includes(task))
                            completeTasks.push(task);
                }
            });
        }
        if (!withCompleteTasks || completeTasks.length === 0)
            return;
        const hasCompleted = completeTasks.map(task => task.status).includes(TaskStatus.Completed);
        const hasNoCompleted = completeTasks.map(task => task.status).includes(TaskStatus.NoCompleted);
        let titleTaskList = '';
        if (hasCompleted)
            titleTaskList += 'Complete' + (hasNoCompleted ? ' and' : '');
        if (hasNoCompleted)
            titleTaskList += 'No complete';
        if (titleTaskList === '')
            return;
        this.addTaskListName(titleTaskList);
        for (const task of completeTasks)
            this.addItem(task);
    }
    dateToString(date, fromDate = new Date()) {
        let result = '';
        if (date.getFullYear() !== fromDate.getFullYear())
            result += `${date.getFullYear()} `;
        if (date.getDate() !== fromDate.getDate() || date.getMonth() !== fromDate.getMonth())
            result += `${date.toLocaleString('default', { month: 'short' })} ${date.getDate()}`;
        else
            result += date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return result;
    }
    globalClick(event) {
        if (event.target instanceof Node && this.taskForm.contains(event.target))
            return;
        this.taskFormDown.style.display = '';
        this.taskForm.style.outline = '';
        this.taskForm.style.outlineColor = '';
    }
}
