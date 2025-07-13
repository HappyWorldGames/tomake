var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
var _MainSideUI_taskViewSideUI, _MainSideUI_projectId, _MainSideUI_selectedTaskItemId;
import { Task, TaskPriority, TaskStatus } from "../core/task.js";
export class MainSideUI {
    constructor(taskViewSideUI) {
        _MainSideUI_taskViewSideUI.set(this, void 0);
        _MainSideUI_projectId.set(this, '');
        _MainSideUI_selectedTaskItemId.set(this, '');
        this.taskAddInput = document.getElementById('task-add-input');
        this.taskAddButton = document.getElementById('add-task-btn');
        this.taskArrayList = document.getElementById('task-array-list');
        __classPrivateFieldSet(this, _MainSideUI_taskViewSideUI, taskViewSideUI, "f");
    }
    setOnTaskAddButtonClickListener(tasksManager, projectsManager) {
        var _a;
        (_a = this.taskAddButton) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
            if (this.taskAddInput == null)
                return;
            const titleTask = this.taskAddInput.value;
            const task = new Task(titleTask);
            task.startDate = new Date();
            tasksManager.addTask(task).then(() => {
                this.renderMainSide(tasksManager, projectsManager);
                this.taskAddInput.value = '';
            });
        });
    }
    renderMainSide(tasksManager, projectsManager, projectId = '', sysListName = 'today') {
        if (projectId !== '')
            __classPrivateFieldSet(this, _MainSideUI_projectId, projectId, "f");
        this.clearAll();
        if (projectId !== '')
            return;
        switch (sysListName) {
            case 'today':
                this.addUntilToDay(tasksManager, projectsManager);
                this.addToDay(tasksManager, projectsManager);
                const startDate = new Date();
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date();
                endDate.setHours(23, 59, 59, 999);
                const dateRange = IDBKeyRange.bound(startDate, endDate);
                this.addCompletedAndNoCompleted(tasksManager, projectsManager, dateRange);
                break;
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
    addItem(task, tasksManager, projectsManager) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (this.taskArrayList == null || task.status === TaskStatus.Deleted)
                return;
            const taskItem = document.createElement('li');
            taskItem.id = task.id;
            taskItem.classList.add('item');
            if (__classPrivateFieldGet(this, _MainSideUI_selectedTaskItemId, "f") === task.id)
                taskItem.classList.add('selected');
            taskItem.onclick = () => {
                var _a;
                if (__classPrivateFieldGet(this, _MainSideUI_selectedTaskItemId, "f") === task.id)
                    return;
                (_a = document.getElementById(__classPrivateFieldGet(this, _MainSideUI_selectedTaskItemId, "f"))) === null || _a === void 0 ? void 0 : _a.classList.remove('selected');
                __classPrivateFieldSet(this, _MainSideUI_selectedTaskItemId, task.id, "f");
                taskItem.classList.add('selected');
                taskTitleInput.focus();
                __classPrivateFieldGet(this, _MainSideUI_taskViewSideUI, "f").renderTaskViewSide(task, tasksManager);
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
            const project = yield projectsManager.getProjectFromId(task.listNameId);
            taskListNameButton.textContent = project ? project.name : '';
            taskListNameButton.addEventListener('click', () => {
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
            const taskDeleteButton = document.createElement('button');
            taskDeleteButton.type = 'button';
            taskDeleteButton.classList.add('task-delete');
            taskDeleteButton.textContent = "🗑️";
            taskDeleteButton.addEventListener('click', () => {
                tasksManager.deleteTask(task.id).then(() => this.renderMainSide(tasksManager, projectsManager));
            });
            taskItem.appendChild(taskDeleteButton);
            const taskMoreButton = document.createElement('button');
            taskMoreButton.type = 'button';
            taskMoreButton.classList.add('task-more-btn');
            taskMoreButton.textContent = "...";
            taskMoreButton.addEventListener('click', () => {
            });
            taskItem.appendChild(taskMoreButton);
        });
    }
    addUntilToDay(tasksManager, projectsManager) {
        return __awaiter(this, void 0, void 0, function* () {
            const endDate = new Date();
            endDate.setHours(0, 0, 0, 0);
            const tasks = (yield tasksManager.getTasksFromIndex('startDate', null)).filter(task => {
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
        });
    }
    addToDay(tasksManager, projectsManager) {
        return __awaiter(this, void 0, void 0, function* () {
            const startDate = new Date();
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date();
            endDate.setHours(23, 59, 59, 999);
            const tasks = yield tasksManager.getTasksFromIndex('startDate', IDBKeyRange.bound(startDate, endDate));
            if (tasks.length === 0)
                return;
            this.addTaskListName('ToDay');
            for (const task of tasks) {
                if (task.status !== TaskStatus.Completed && task.status !== TaskStatus.NoCompleted)
                    this.addItem(task, tasksManager, projectsManager);
            }
        });
    }
    addCompletedAndNoCompleted(tasksManager, projectsManager, dateRange) {
        return __awaiter(this, void 0, void 0, function* () {
            const tasks = yield tasksManager.getTasksFromIndex('completedDate', dateRange);
            if (tasks.length === 0)
                return;
            const hasCompleted = tasks.map(task => task.status).includes(TaskStatus.Completed);
            const hasNoCompleted = tasks.map(task => task.status).includes(TaskStatus.NoCompleted);
            let titleTaskList = '';
            if (hasCompleted)
                titleTaskList += 'Complete' + (hasNoCompleted ? ' and' : '');
            if (hasNoCompleted)
                titleTaskList += 'No complete';
            this.addTaskListName(titleTaskList);
            for (const task of tasks) {
                if (task.status === TaskStatus.Completed || task.status === TaskStatus.NoCompleted)
                    this.addItem(task, tasksManager, projectsManager);
            }
        });
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
}
_MainSideUI_taskViewSideUI = new WeakMap(), _MainSideUI_projectId = new WeakMap(), _MainSideUI_selectedTaskItemId = new WeakMap();
