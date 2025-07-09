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
var _MainSideUI_listName;
import { Task, TaskStatus } from "../core/task.js";
export class MainSideUI {
    constructor() {
        _MainSideUI_listName.set(this, '');
        this.taskAddInput = document.getElementById('task-add-input');
        this.taskAddButton = document.getElementById('add-task-btn');
        this.taskArrayList = document.getElementById('task-array-list');
        if (!this.taskAddInput)
            alert('error init taskArrayList');
        if (!this.taskAddButton)
            alert('error init taskAddButton');
        if (!this.taskArrayList)
            alert('error init taskArrayList');
    }
    setOnTaskAddButtonClickListener(tasksManager, projectsManager) {
        var _a;
        (_a = this.taskAddButton) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
            if (this.taskAddInput == null)
                return;
            const titleTask = this.taskAddInput.value;
            const task = new Task(titleTask);
            task.startDate = new Date();
            tasksManager.addTask(task);
            this.taskAddInput.value = '';
            this.renderMainSide(tasksManager, projectsManager);
        });
    }
    renderMainSide(tasksManager, projectsManager, listName = '', sysListName = 'today') {
        if (listName !== '')
            __classPrivateFieldSet(this, _MainSideUI_listName, listName, "f");
        this.clearAll();
        if (listName !== '')
            return;
        switch (sysListName) {
            case 'today':
                this.addUntilToDay(tasksManager, projectsManager);
                this.addToDay(tasksManager, projectsManager);
                break;
        }
    }
    clearAll() {
        if (this.taskArrayList == null)
            return;
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
            (_a = this.taskArrayList) === null || _a === void 0 ? void 0 : _a.appendChild(taskItem);
            const taskInput = document.createElement('input');
            taskInput.type = 'text';
            taskInput.classList.add('task-name');
            taskInput.value = task.title;
            taskItem.appendChild(taskInput);
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
                this.addItem(task, tasksManager, projectsManager);
            }
        });
    }
    dateToString(date) {
        const dateNow = new Date();
        let result = '';
        if (date.getFullYear() !== dateNow.getFullYear())
            result += `${date.getFullYear()} `;
        if (date.getDate() !== dateNow.getDate() || date.getMonth() !== dateNow.getMonth())
            result += `${date.toLocaleString('default', { month: 'short' })} ${date.getDate()}`;
        else
            result += `${date.getHours()}:${date.getMinutes()}`;
        return result;
    }
}
_MainSideUI_listName = new WeakMap();
