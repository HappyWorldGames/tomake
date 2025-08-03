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
var _TaskViewSideUI_instances, _TaskViewSideUI_selectedTask, _TaskViewSideUI_closeTaskButtonMethod, _TaskViewSideUI_updateHeightDescription;
import { ProjectStatus } from "../core/project.js";
import { Task, TaskPriority, TaskStatus } from "../core/task.js";
import { convertToDateTimeLocalString, getUTCDateFromLocal } from "../utils/date_converter.js";
import { insertChildAtIndex } from "../utils/html_functions.js";
import { SysProjectId } from "./project-list-side.js";
export class TaskViewSideUI {
    constructor(tasksManager, projectsManager, customContextMenuUI) {
        _TaskViewSideUI_instances.add(this);
        _TaskViewSideUI_selectedTask.set(this, null);
        _TaskViewSideUI_closeTaskButtonMethod.set(this, () => { });
        this.taskViewSide = document.getElementById('task-view-side');
        this.taskHeader = document.getElementById('task-header');
        this.taskCloseButton = document.getElementById('task-close-btn');
        this.taskCheckboxComplete = document.getElementById('task-checkbox-complete');
        this.taskDateTimeInput = document.getElementById('task-date-button');
        this.taskPrioritySelect = document.getElementById('task-priority-select');
        this.taskTitleInput = document.getElementById('task-title-input');
        this.taskDescriptionInput = document.getElementById('task-description-input');
        this.taskSubtaskList = document.getElementById('subtask-list');
        this.taskSubtaskAddButton = document.getElementById('add-subtask-btn');
        this.taskProjectSelect = document.getElementById('task-project-select');
        this.taskProjectMoreButton = document.getElementById('task-project-more-btn');
        this.taskCheckboxComplete.onchange = () => {
            if (!__classPrivateFieldGet(this, _TaskViewSideUI_selectedTask, "f"))
                return;
            this.saveTask(tasksManager);
        };
        this.taskDateTimeInput.onchange = () => {
            this.saveTask(tasksManager);
        };
        this.taskPrioritySelect.onchange = () => {
            this.saveTask(tasksManager);
        };
        let saveTimerId;
        this.taskTitleInput.oninput = () => {
            clearTimeout(saveTimerId);
            saveTimerId = setTimeout(() => {
                this.saveTask(tasksManager);
            }, 2500);
        };
        this.taskTitleInput.onblur = () => this.saveTask(tasksManager);
        this.taskDescriptionInput.oninput = () => {
            __classPrivateFieldGet(this, _TaskViewSideUI_instances, "m", _TaskViewSideUI_updateHeightDescription).call(this);
            clearTimeout(saveTimerId);
            saveTimerId = setTimeout(() => {
                this.saveTask(tasksManager);
            }, 2500);
        };
        this.taskDescriptionInput.onblur = () => this.saveTask(tasksManager);
        this.taskSubtaskAddButton.onclick = () => {
            if (!__classPrivateFieldGet(this, _TaskViewSideUI_selectedTask, "f"))
                return;
            const subTaskTitle = prompt('SubTask Title:', '');
            if (!subTaskTitle)
                return;
            tasksManager.addSubTask(__classPrivateFieldGet(this, _TaskViewSideUI_selectedTask, "f").id, new Task(subTaskTitle)).then(subTaskId => {
                if (!__classPrivateFieldGet(this, _TaskViewSideUI_selectedTask, "f"))
                    return;
                __classPrivateFieldGet(this, _TaskViewSideUI_selectedTask, "f").childIdList.push(subTaskId);
                this.renderTaskViewSide(__classPrivateFieldGet(this, _TaskViewSideUI_selectedTask, "f"), tasksManager, projectsManager);
            });
        };
        this.taskProjectSelect.onchange = () => {
            this.saveTask(tasksManager);
        };
        this.taskProjectMoreButton.onclick = (event) => {
            if (!__classPrivateFieldGet(this, _TaskViewSideUI_selectedTask, "f"))
                return;
            customContextMenuUI.showTask(event, __classPrivateFieldGet(this, _TaskViewSideUI_selectedTask, "f"), null, null, () => this.renderTaskViewSide(null, tasksManager, projectsManager));
        };
    }
    renderTaskViewSide(task, tasksManager, projectsManager) {
        this.taskViewSide.style.visibility = task ? 'visible' : 'hidden';
        if (!task) {
            __classPrivateFieldSet(this, _TaskViewSideUI_selectedTask, null, "f");
            return;
        }
        if (task !== __classPrivateFieldGet(this, _TaskViewSideUI_selectedTask, "f"))
            __classPrivateFieldSet(this, _TaskViewSideUI_selectedTask, task, "f");
        this.clearAll();
        this.taskCloseButton.onclick = () => {
            this.renderTaskViewSide(null, tasksManager, projectsManager);
            __classPrivateFieldGet(this, _TaskViewSideUI_closeTaskButtonMethod, "f").call(this);
            this.updateStyle();
        };
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
        this.taskCheckboxComplete.style.borderColor = priorityColor;
        this.taskCheckboxComplete.style.accentColor = priorityColor;
        this.taskCheckboxComplete.checked = !!task.completedDate;
        this.taskDateTimeInput.value = task.startDate ? convertToDateTimeLocalString(task.startDate) : '';
        this.taskPrioritySelect.selectedIndex = task.priority;
        this.taskTitleInput.value = task.title;
        this.taskDescriptionInput.value = task.description;
        __classPrivateFieldGet(this, _TaskViewSideUI_instances, "m", _TaskViewSideUI_updateHeightDescription).call(this);
        const completeSubTasks = [];
        const addMainSubTask = async () => {
            return new Promise(resolve => {
                let count = 0;
                for (const taskChildId of task.childIdList) {
                    tasksManager.getTaskFromId(taskChildId).then(subTask => {
                        switch (subTask.status) {
                            case TaskStatus.Deleted:
                                break;
                            case TaskStatus.Completed:
                            case TaskStatus.NoCompleted:
                                completeSubTasks.push(subTask);
                                break;
                            default:
                                this.addSubTask(subTask, tasksManager, projectsManager);
                                break;
                        }
                        count++;
                        if (count >= task.childIdList.length)
                            resolve('');
                    });
                }
            });
        };
        addMainSubTask().then(() => {
            if (completeSubTasks.length === 0)
                return;
            for (const subTask of completeSubTasks) {
                this.addSubTask(subTask, tasksManager, projectsManager);
            }
        });
        projectsManager.getAllProjects().then(projects => {
            const inboxItem = document.createElement('option');
            inboxItem.value = SysProjectId.Inbox;
            inboxItem.text = 'Inbox';
            this.taskProjectSelect.appendChild(inboxItem);
            for (const project of projects) {
                if (project.status === ProjectStatus.Deleted)
                    continue;
                const selectItem = document.createElement('option');
                selectItem.value = project.id;
                selectItem.text = project.name;
                insertChildAtIndex(this.taskProjectSelect, selectItem, project.order);
            }
            this.taskProjectSelect.value = task.listNameId;
        });
    }
    addSubTask(subTask, tasksManager, projectsManager) {
        const subTaskItem = document.createElement('li');
        subTaskItem.id = subTask.id;
        this.taskSubtaskList.appendChild(subTaskItem);
        const subTaskCheckbox = document.createElement('input');
        subTaskCheckbox.type = 'checkbox';
        subTaskCheckbox.classList.add('check-field');
        subTaskCheckbox.checked = !!subTask.completedDate;
        subTaskCheckbox.onchange = () => {
            this.saveSubTask(subTask, subTaskCheckbox, subTaskTitle, tasksManager);
            if (__classPrivateFieldGet(this, _TaskViewSideUI_selectedTask, "f"))
                this.renderTaskViewSide(__classPrivateFieldGet(this, _TaskViewSideUI_selectedTask, "f"), tasksManager, projectsManager);
        };
        subTaskItem.appendChild(subTaskCheckbox);
        const subTaskTitle = document.createElement('input');
        subTaskTitle.type = 'text';
        subTaskTitle.classList.add('text-field');
        subTaskTitle.value = subTask.title;
        let saveTimerId;
        subTaskTitle.oninput = () => {
            clearTimeout(saveTimerId);
            saveTimerId = setTimeout(() => {
                subTask = this.saveSubTask(subTask, subTaskCheckbox, subTaskTitle, tasksManager);
            }, 2500);
        };
        subTaskTitle.onblur = () => subTask = this.saveSubTask(subTask, subTaskCheckbox, subTaskTitle, tasksManager);
        subTaskItem.appendChild(subTaskTitle);
        const subTaskDeleteButton = document.createElement('button');
        subTaskDeleteButton.classList.add('delete-btn');
        subTaskDeleteButton.title = 'delete';
        subTaskDeleteButton.textContent = '🗑';
        subTaskDeleteButton.onclick = () => {
            tasksManager.deleteTask(subTask.id).then(() => subTaskItem.remove());
        };
        subTaskItem.appendChild(subTaskDeleteButton);
        const subTaskOpenButton = document.createElement('button');
        subTaskOpenButton.classList.add('delete-btn');
        subTaskOpenButton.title = 'Open';
        subTaskOpenButton.textContent = '>';
        subTaskOpenButton.onclick = () => {
            this.renderTaskViewSide(subTask, tasksManager, projectsManager);
        };
        subTaskItem.appendChild(subTaskOpenButton);
    }
    clearAll() {
        while (this.taskSubtaskList.firstChild)
            this.taskSubtaskList.removeChild(this.taskSubtaskList.firstChild);
        while (this.taskProjectSelect.firstChild)
            this.taskProjectSelect.removeChild(this.taskProjectSelect.firstChild);
    }
    saveTask(tasksManager) {
        if (!__classPrivateFieldGet(this, _TaskViewSideUI_selectedTask, "f"))
            return;
        let isEdited = false;
        if (!!__classPrivateFieldGet(this, _TaskViewSideUI_selectedTask, "f").completedDate !== this.taskCheckboxComplete.checked) {
            __classPrivateFieldGet(this, _TaskViewSideUI_selectedTask, "f").completedDate = this.taskCheckboxComplete.checked ? new Date() : null;
            __classPrivateFieldGet(this, _TaskViewSideUI_selectedTask, "f").status = this.taskCheckboxComplete.checked ? TaskStatus.Completed : TaskStatus.Normal;
            isEdited = true;
        }
        const dateTime = getUTCDateFromLocal(this.taskDateTimeInput.value);
        if (__classPrivateFieldGet(this, _TaskViewSideUI_selectedTask, "f").startDate !== dateTime) {
            __classPrivateFieldGet(this, _TaskViewSideUI_selectedTask, "f").startDate = dateTime;
            isEdited = true;
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
        if (__classPrivateFieldGet(this, _TaskViewSideUI_selectedTask, "f").listNameId !== this.taskProjectSelect.value) {
            __classPrivateFieldGet(this, _TaskViewSideUI_selectedTask, "f").listNameId = this.taskProjectSelect.value;
            isEdited = true;
        }
        if (isEdited)
            tasksManager.updateTask(__classPrivateFieldGet(this, _TaskViewSideUI_selectedTask, "f"));
    }
    saveSubTask(subTask, checkBoxView, titleView, tasksManager) {
        let isEdited = false;
        if (!!subTask.completedDate !== checkBoxView.checked) {
            subTask.completedDate = checkBoxView.checked ? new Date() : null;
            subTask.status = checkBoxView.checked ? TaskStatus.Completed : TaskStatus.Normal;
            isEdited = true;
        }
        if (subTask.title !== titleView.value) {
            subTask.title = titleView.value;
            isEdited = true;
        }
        if (isEdited)
            tasksManager.updateTask(subTask);
        return subTask;
    }
    updateStyle(closeTaskButtonMethod = null) {
        if (this.taskViewSide.style.visibility === 'visible' && window.innerWidth <= 960) {
            this.taskViewSide.style.zIndex = '4';
            if (window.innerWidth <= 640) {
                this.taskViewSide.style.position = 'absolute';
                this.taskViewSide.style.display = 'flex';
                this.taskViewSide.style.width = '100vw';
                this.taskCloseButton.style.display = 'block';
            }
            else {
                this.taskViewSide.style.position = 'absolute';
                this.taskViewSide.style.right = '0';
                this.taskViewSide.style.display = 'flex';
                this.taskViewSide.style.width = '400px';
                this.taskCloseButton.style.display = 'block';
            }
        }
        else {
            this.taskViewSide.style.zIndex = '';
            this.taskViewSide.style.position = '';
            this.taskViewSide.style.right = '';
            this.taskViewSide.style.display = '';
            this.taskViewSide.style.width = '';
            this.taskCloseButton.style.display = '';
        }
        if (closeTaskButtonMethod)
            __classPrivateFieldSet(this, _TaskViewSideUI_closeTaskButtonMethod, closeTaskButtonMethod, "f");
        __classPrivateFieldGet(this, _TaskViewSideUI_instances, "m", _TaskViewSideUI_updateHeightDescription).call(this);
    }
}
_TaskViewSideUI_selectedTask = new WeakMap(), _TaskViewSideUI_closeTaskButtonMethod = new WeakMap(), _TaskViewSideUI_instances = new WeakSet(), _TaskViewSideUI_updateHeightDescription = function _TaskViewSideUI_updateHeightDescription() {
    this.taskDescriptionInput.style.height = 'auto';
    this.taskDescriptionInput.style.minHeight = 'auto';
    this.taskDescriptionInput.style.height = `${this.taskDescriptionInput.scrollHeight}px`;
    this.taskDescriptionInput.style.minHeight = `${this.taskDescriptionInput.scrollHeight}px`;
};
