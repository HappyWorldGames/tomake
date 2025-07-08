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
import { Task } from "../core/task.js";
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
    setOnTaskAddButtonClickListener(tasksManager) {
        var _a;
        (_a = this.taskAddButton) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
            if (this.taskAddInput == null)
                return;
            const titleTask = this.taskAddInput.value;
            const task = new Task(titleTask);
            task.startDate = new Date();
            tasksManager.addTask(task);
            this.taskAddInput.value = '';
            this.renderMainSide(tasksManager);
        });
    }
    renderMainSide(tasksManager, listName = '', sysListName = 'today') {
        if (listName !== '')
            __classPrivateFieldSet(this, _MainSideUI_listName, listName, "f");
        this.clearAll();
        if (listName !== '')
            return;
        switch (sysListName) {
            case 'today':
                this.addUntilToDay(tasksManager);
                this.addToDay(tasksManager);
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
        this.taskArrayList.appendChild(taskListName);
    }
    addItem(task, tasksManager) {
        var _a;
        if (this.taskArrayList == null)
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
        const taskDelete = document.createElement('button');
        taskDelete.type = 'button';
        taskDelete.classList.add('task-delete');
        taskDelete.textContent = "🗑️";
        taskDelete.addEventListener('click', () => {
            tasksManager.deleteTask(task.id);
        });
        taskItem.appendChild(taskDelete);
    }
    addUntilToDay(tasksManager) {
        return __awaiter(this, void 0, void 0, function* () {
            const endDate = new Date();
            endDate.setHours(23, 59, 59, 999);
            const tasks = yield tasksManager.getTasksFromIndex('startDate', IDBKeyRange.lowerBound(endDate));
            if (tasks.length === 0)
                return;
            this.addTaskListName('Overdue');
            for (const task of tasks) {
                this.addItem(task, tasksManager);
            }
        });
    }
    addToDay(tasksManager) {
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
                this.addItem(task, tasksManager);
            }
        });
    }
}
_MainSideUI_listName = new WeakMap();
