var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _MainSideUI_taskViewSideUI, _MainSideUI_customContextMenuUI, _MainSideUI_projectId, _MainSideUI_selectedTaskItemId;
import { ProjectStatus } from "../core/project.js";
import { Task, TaskPriority, TaskStatus } from "../core/task.js";
import { getUTCDateFromLocal } from "../utils/date_converter.js";
import { insertChildAtIndex } from "../utils/html_functions.js";
import { SysProjectId } from "./project-list-side.js";
export class MainSideUI {
    constructor(taskViewSideUI, customContextMenuUI) {
        _MainSideUI_taskViewSideUI.set(this, void 0);
        _MainSideUI_customContextMenuUI.set(this, void 0);
        _MainSideUI_projectId.set(this, '');
        _MainSideUI_selectedTaskItemId.set(this, '');
        this.menuButton = document.getElementById('menu-btn');
        this.taskForm = document.getElementById('task-form');
        this.taskAddInput = document.getElementById('task-add-input');
        this.taskFormDown = document.getElementById('task-form-down');
        this.taskNewDateButton = document.getElementById('task-new-date-button');
        this.taskNewPrioritySelect = document.getElementById('task-new-priority-select');
        this.taskNewProjectSelect = document.getElementById('task-new-project-select');
        this.taskAddButton = document.getElementById('add-task-btn');
        this.taskArrayList = document.getElementById('task-array-list');
        __classPrivateFieldSet(this, _MainSideUI_taskViewSideUI, taskViewSideUI, "f");
        __classPrivateFieldSet(this, _MainSideUI_customContextMenuUI, customContextMenuUI, "f");
    }
    setOnTaskAddButtonClickListener(tasksManager, projectsManager, menuButtonClick) {
        var _a;
        projectsManager.getAllProjects().then(projects => {
            console.log('wtf');
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
            this.taskNewProjectSelect.value = SysProjectId.Inbox;
        });
        this.menuButton.onclick = () => {
            menuButtonClick();
        };
        this.taskForm.onclick = () => {
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
            tasksManager.addTask(task).then(() => {
                this.renderMainSide(tasksManager, projectsManager);
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
    renderMainSide(tasksManager, projectsManager, projectId = '') {
        if (projectId !== '')
            __classPrivateFieldSet(this, _MainSideUI_projectId, projectId, "f");
        __classPrivateFieldGet(this, _MainSideUI_taskViewSideUI, "f").renderTaskViewSide(null, tasksManager, projectsManager);
        __classPrivateFieldSet(this, _MainSideUI_selectedTaskItemId, '', "f");
        this.clearAll();
        if (projectId.length < 4 && projectId !== SysProjectId.Inbox) {
            switch (__classPrivateFieldGet(this, _MainSideUI_projectId, "f")) {
                case SysProjectId.ToDay:
                    this.addSysToDay(tasksManager, projectsManager);
                    break;
            }
        }
        else {
            this.addFiltredList(tasksManager, projectsManager, 'listNameId', IDBKeyRange.only(projectId));
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
    async addItem(task, tasksManager, projectsManager) {
        var _a;
        if (this.taskArrayList == null || task.status === TaskStatus.Deleted)
            return;
        const taskItem = document.createElement('li');
        taskItem.id = task.id;
        taskItem.classList.add('item');
        if (__classPrivateFieldGet(this, _MainSideUI_selectedTaskItemId, "f") === task.id)
            taskItem.classList.add('selected');
        taskItem.onclick = (event) => {
            var _a;
            if (__classPrivateFieldGet(this, _MainSideUI_selectedTaskItemId, "f") === task.id || event.target === taskMoreButton)
                return;
            (_a = document.getElementById(__classPrivateFieldGet(this, _MainSideUI_selectedTaskItemId, "f"))) === null || _a === void 0 ? void 0 : _a.classList.remove('selected');
            __classPrivateFieldSet(this, _MainSideUI_selectedTaskItemId, task.id, "f");
            taskItem.classList.add('selected');
            taskTitleInput.focus();
            __classPrivateFieldGet(this, _MainSideUI_taskViewSideUI, "f").renderTaskViewSide(task, tasksManager, projectsManager);
            __classPrivateFieldGet(this, _MainSideUI_taskViewSideUI, "f").updateStyle(() => this.renderMainSide(tasksManager, projectsManager));
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
            tasksManager.updateTask(task).then(() => {
                this.renderMainSide(tasksManager, projectsManager);
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
            projectsManager.getProjectFromId(task.listNameId).then(project => {
                taskListNameButton.textContent = project ? project.name : '';
            });
        taskListNameButton.addEventListener('click', () => {
            this.renderMainSide(tasksManager, projectsManager, task.listNameId);
        });
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
            __classPrivateFieldGet(this, _MainSideUI_customContextMenuUI, "f").showTask(event, task, () => {
                this.renderMainSide(tasksManager, projectsManager);
                __classPrivateFieldGet(this, _MainSideUI_taskViewSideUI, "f").renderTaskViewSide(null, tasksManager, projectsManager);
            }, null, () => {
                taskItem.remove();
                __classPrivateFieldGet(this, _MainSideUI_taskViewSideUI, "f").renderTaskViewSide(null, tasksManager, projectsManager);
            });
        });
        taskItem.appendChild(taskMoreButton);
    }
    async addSysToDay(tasksManager, projectsManager) {
        this.addUntilToDay(tasksManager, projectsManager);
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date();
        endDate.setHours(23, 59, 59, 999);
        this.addFiltredList(tasksManager, projectsManager, 'startDate', IDBKeyRange.bound(startDate, endDate), 'ToDay');
    }
    async addUntilToDay(tasksManager, projectsManager) {
        const endDate = new Date();
        endDate.setHours(0, 0, 0, 0);
        const tasks = (await tasksManager.getTasksFromIndex('startDate', null)).filter(task => {
            if (task.startDate !== null && task.startDate < endDate)
                return true;
            else
                return false;
        });
        if (tasks.length === 0)
            return;
        this.addTaskListName('Overdue');
        for (const task of tasks) {
            if (task.status !== TaskStatus.Completed && task.status !== TaskStatus.NoCompleted)
                this.addItem(task, tasksManager, projectsManager);
        }
    }
    async addFiltredList(tasksManager, projectsManager, index, dateRange, taskListName = '', withCompleteTasks = true) {
        const tasks = await tasksManager.getTasksFromIndex(index, dateRange);
        if (tasks.length === 0)
            return;
        const filtredTasks = [];
        const completeTasks = [];
        for (const task of tasks) {
            if (task.status !== TaskStatus.Completed && task.status !== TaskStatus.NoCompleted)
                filtredTasks.push(task);
            else if (task.status === TaskStatus.Completed || task.status === TaskStatus.NoCompleted)
                completeTasks.push(task);
        }
        if (filtredTasks.length !== 0) {
            if (taskListName !== '')
                this.addTaskListName(taskListName);
            for (const task of filtredTasks)
                this.addItem(task, tasksManager, projectsManager);
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
            this.addItem(task, tasksManager, projectsManager);
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
_MainSideUI_taskViewSideUI = new WeakMap(), _MainSideUI_customContextMenuUI = new WeakMap(), _MainSideUI_projectId = new WeakMap(), _MainSideUI_selectedTaskItemId = new WeakMap();
