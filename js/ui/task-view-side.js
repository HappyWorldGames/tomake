var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var _TaskViewSideUI_selectedTask;
import { TaskStatus } from "../core/task.js";
import { convertToDateTimeLocalString, getUTCDateFromLocal } from "../utils/date_converter.js";
export class TaskViewSideUI {
    constructor(tasksManager) {
        _TaskViewSideUI_selectedTask.set(this, null);
        this.taskViewSide = document.getElementById('task-view-side');
        this.taskHeader = document.getElementById('task-header');
        this.taskCheckboxComplete = document.getElementById('task-checkbox-complete');
        this.taskDateTimeInput = document.getElementById('task-date-button');
        this.taskPrioritySelect = document.getElementById('task-priority-select');
        this.taskTitleInput = document.getElementById('task-title-input');
        this.taskDescriptionInput = document.getElementById('task-description-input');
        this.taskSubtaskList = document.getElementById('subtask-list');
        this.taskSubtaskAddButton = document.getElementById('add-subtask-btn');
        this.taskDateTimeInput.onchange = () => {
            this.saveTask(tasksManager);
        };
        this.taskPrioritySelect.onchange = () => {
            this.saveTask(tasksManager);
        };
        this.taskDescriptionInput.oninput = () => {
            this.taskDescriptionInput.style.height = 'auto';
            this.taskDescriptionInput.style.height = `${this.taskDescriptionInput.scrollHeight}`;
        };
        this.taskSubtaskAddButton.onclick = () => {
        };
    }
    renderTaskViewSide(task, tasksManager) {
        this.taskViewSide.style.visibility = task ? 'visible' : 'hidden';
        if (!task)
            return;
        if (task !== __classPrivateFieldGet(this, _TaskViewSideUI_selectedTask, "f"))
            __classPrivateFieldSet(this, _TaskViewSideUI_selectedTask, task, "f");
        this.clearAll();
        this.taskCheckboxComplete.checked = !!task.completedDate;
        if (task.startDate)
            this.taskDateTimeInput.value = convertToDateTimeLocalString(task.startDate);
        this.taskPrioritySelect.selectedIndex = task.priority;
        this.taskTitleInput.value = task.title;
        let saveTimerId;
        this.taskTitleInput.oninput = () => {
            clearTimeout(saveTimerId);
            saveTimerId = setTimeout(() => {
                this.saveTask(tasksManager);
            }, 2500);
        };
        this.taskTitleInput.onblur = () => this.saveTask(tasksManager);
        this.taskDescriptionInput.value = task.description;
        this.taskDescriptionInput.oninput = () => {
            clearTimeout(saveTimerId);
            saveTimerId = setTimeout(() => {
                this.saveTask(tasksManager);
            }, 2500);
        };
        this.taskDescriptionInput.onblur = () => this.saveTask(tasksManager);
        for (const taskChildId of task.childIdList) {
            tasksManager.getTaskFromId(taskChildId).then(subTask => {
                if (subTask.status === TaskStatus.Deleted)
                    return;
                const subTaskItem = document.createElement('li');
                this.taskSubtaskList.appendChild(subTaskItem);
                const subTaskCheckbox = document.createElement('input');
                subTaskCheckbox.type = 'checkbox';
                subTaskCheckbox.classList.add('check-field');
                subTaskCheckbox.checked = !!subTask.completedDate;
                subTaskItem.appendChild(subTaskCheckbox);
                const subTaskTitle = document.createElement('input');
                subTaskTitle.type = 'text';
                subTaskTitle.classList.add('text-field');
                subTaskTitle.value = subTask.title;
                subTaskItem.appendChild(subTaskTitle);
                const subTaskDeleteButton = document.createElement('button');
                subTaskDeleteButton.classList.add('delete-btn');
                subTaskDeleteButton.title = 'delete';
                subTaskDeleteButton.textContent = '🗑';
                subTaskDeleteButton.onclick = () => {
                };
                subTaskItem.appendChild(subTaskDeleteButton);
            });
        }
    }
    clearAll() {
        while (this.taskSubtaskList.firstChild)
            this.taskSubtaskList.removeChild(this.taskSubtaskList.firstChild);
    }
    saveTask(tasksManager) {
        if (!__classPrivateFieldGet(this, _TaskViewSideUI_selectedTask, "f"))
            return;
        let isEdited = false;
        const dateTime = getUTCDateFromLocal(this.taskDateTimeInput.value);
        if (__classPrivateFieldGet(this, _TaskViewSideUI_selectedTask, "f").startDate !== dateTime) {
            console.log(`old: ${__classPrivateFieldGet(this, _TaskViewSideUI_selectedTask, "f").startDate}`);
            __classPrivateFieldGet(this, _TaskViewSideUI_selectedTask, "f").startDate = dateTime;
            console.log(`new: ${new Date()}, set: ${new Date(this.taskDateTimeInput.value)}`);
        }
        if (__classPrivateFieldGet(this, _TaskViewSideUI_selectedTask, "f").priority !== +this.taskPrioritySelect.value) {
            __classPrivateFieldGet(this, _TaskViewSideUI_selectedTask, "f").priority = Number(this.taskPrioritySelect.value);
            isEdited = true;
        }
        if (__classPrivateFieldGet(this, _TaskViewSideUI_selectedTask, "f").title !== this.taskTitleInput.value) {
            __classPrivateFieldGet(this, _TaskViewSideUI_selectedTask, "f").title = this.taskTitleInput.value;
            isEdited = true;
        }
        if (__classPrivateFieldGet(this, _TaskViewSideUI_selectedTask, "f").description !== this.taskDescriptionInput.value) {
            __classPrivateFieldGet(this, _TaskViewSideUI_selectedTask, "f").description = this.taskDescriptionInput.value;
            isEdited = true;
        }
        if (isEdited)
            tasksManager.updateTask(__classPrivateFieldGet(this, _TaskViewSideUI_selectedTask, "f"));
    }
}
_TaskViewSideUI_selectedTask = new WeakMap();
