import { ProjectStatus } from "../core/project.js";
import { Task, TaskPriority, TaskStatus } from "../core/task.js";
import { convertToDateTimeLocalString, getUTCDateFromLocal } from "../utils/date_converter.js";
import { insertChildAtIndex } from "../utils/html_functions.js";
export class TaskViewSideUI {
    constructor(tasksManager, projectsManager, customContextMenuUI) {
        this.selectedTask = null;
        this.closeTaskButtonFun = () => { };
        this.taskViewSide = document.getElementById('task-view-side');
        this.taskHeader = document.getElementById('task-header');
        this.taskCloseButton = document.getElementById('task-close-btn');
        this.taskCheckboxComplete = document.getElementById('task-checkbox-complete');
        this.taskDateTimeButton = document.getElementById('task-date-button');
        this.taskPrioritySelect = document.getElementById('task-priority-select');
        this.taskTitleInput = document.getElementById('task-title-input');
        this.taskDescriptionInput = document.getElementById('task-description-input');
        this.taskSubtaskList = document.getElementById('subtask-list');
        this.taskSubtaskAddButton = document.getElementById('add-subtask-btn');
        this.taskProjectSelect = document.getElementById('task-project-select');
        this.taskProjectMoreButton = document.getElementById('task-project-more-btn');
        this.tasksManager = tasksManager;
        this.projectsManager = projectsManager;
        this.taskCheckboxComplete.onchange = () => {
            if (!this.selectedTask)
                return;
            this.updateCompleteCheckBox();
            this.saveTask();
        };
        this.taskDateTimeButton.onclick = (event) => {
            var _a;
            customContextMenuUI.showDateTime(event, (_a = this.selectedTask) === null || _a === void 0 ? void 0 : _a.startDate).then(dateString => {
                const dateText = getUTCDateFromLocal(dateString);
                this.taskDateTimeButton.textContent = `𝄜 ${dateText ? dateText.toLocaleString() : ''}`;
                this.taskDateTimeButton.value = dateString;
                this.saveTask();
            });
        };
        this.taskPrioritySelect.onchange = () => {
            this.saveTask();
        };
        let saveTimerId;
        this.taskTitleInput.oninput = () => {
            clearTimeout(saveTimerId);
            saveTimerId = setTimeout(() => {
                this.saveTask();
            }, 2500);
        };
        this.taskTitleInput.onblur = () => this.saveTask();
        this.taskDescriptionInput.oninput = () => {
            this.updateHeightDescription();
            clearTimeout(saveTimerId);
            saveTimerId = setTimeout(() => {
                this.saveTask();
            }, 2500);
        };
        this.taskDescriptionInput.onblur = () => this.saveTask();
        this.taskSubtaskAddButton.onclick = () => {
            if (!this.selectedTask)
                return;
            const subTaskTitle = prompt('SubTask Title:', '');
            if (!subTaskTitle)
                return;
            this.tasksManager.addSubTask(this.selectedTask.id, new Task(subTaskTitle)).then(subTaskId => {
                if (!this.selectedTask)
                    return;
                this.selectedTask.childIdList.push(subTaskId);
                this.renderTaskViewSide(this.selectedTask);
            });
        };
        this.taskProjectSelect.onchange = () => {
            this.saveTask();
        };
        this.taskProjectMoreButton.onclick = (event) => {
            if (!this.selectedTask)
                return;
            customContextMenuUI.showTask(event, this.selectedTask, null, null, () => this.renderTaskViewSide(null));
        };
    }
    renderTaskViewSide(task, closeTaskButtonFun = null) {
        if (closeTaskButtonFun)
            this.closeTaskButtonFun = closeTaskButtonFun;
        this.taskViewSide.style.visibility = task ? 'visible' : 'hidden';
        if (!task) {
            this.selectedTask = null;
            return;
        }
        if (task !== this.selectedTask)
            this.selectedTask = task;
        this.clearAll();
        this.taskCloseButton.onclick = () => {
            this.renderTaskViewSide(null);
            this.closeTaskButtonFun();
            this.updateStyle();
        };
        this.updateCompleteCheckBox();
        this.taskCheckboxComplete.checked = !!task.completedDate;
        this.taskDateTimeButton.textContent = `𝄜 ${task.startDate ? task.startDate.toLocaleString() : ''}`;
        this.taskDateTimeButton.value = task.startDate ? convertToDateTimeLocalString(task.startDate) : '';
        this.taskPrioritySelect.selectedIndex = task.priority;
        this.taskTitleInput.value = task.title;
        this.taskDescriptionInput.value = task.description;
        this.updateHeightDescription();
        const completeSubTasks = [];
        const addMainSubTask = async () => {
            return new Promise(resolve => {
                let count = 0;
                for (const taskChildId of task.childIdList) {
                    this.tasksManager.getTaskFromId(taskChildId).then(subTask => {
                        switch (subTask.status) {
                            case TaskStatus.Deleted:
                                break;
                            case TaskStatus.Completed:
                            case TaskStatus.NoCompleted:
                                completeSubTasks.push(subTask);
                                break;
                            default:
                                this.addSubTask(subTask);
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
                this.addSubTask(subTask);
            }
        });
        this.projectsManager.getAllProjects().then(projects => {
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
        this.updateStyle();
    }
    addSubTask(subTask) {
        const subTaskItem = document.createElement('li');
        subTaskItem.id = subTask.id;
        this.taskSubtaskList.appendChild(subTaskItem);
        const subTaskCheckbox = document.createElement('input');
        subTaskCheckbox.type = 'checkbox';
        subTaskCheckbox.classList.add('check-field');
        subTaskCheckbox.checked = !!subTask.completedDate;
        subTaskCheckbox.onchange = () => {
            this.saveSubTask(subTask, subTaskCheckbox, subTaskTitle);
            if (this.selectedTask)
                this.renderTaskViewSide(this.selectedTask);
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
                subTask = this.saveSubTask(subTask, subTaskCheckbox, subTaskTitle);
            }, 2500);
        };
        subTaskTitle.onblur = () => subTask = this.saveSubTask(subTask, subTaskCheckbox, subTaskTitle);
        subTaskItem.appendChild(subTaskTitle);
        const subTaskDeleteButton = document.createElement('button');
        subTaskDeleteButton.classList.add('delete-btn');
        subTaskDeleteButton.title = 'delete';
        subTaskDeleteButton.textContent = '🗑';
        subTaskDeleteButton.onclick = () => {
            this.tasksManager.deleteTask(subTask.id).then(() => subTaskItem.remove());
        };
        subTaskItem.appendChild(subTaskDeleteButton);
        const subTaskOpenButton = document.createElement('button');
        subTaskOpenButton.classList.add('delete-btn');
        subTaskOpenButton.title = 'Open';
        subTaskOpenButton.textContent = '>';
        subTaskOpenButton.onclick = () => {
            this.renderTaskViewSide(subTask);
        };
        subTaskItem.appendChild(subTaskOpenButton);
    }
    clearAll() {
        while (this.taskSubtaskList.firstChild)
            this.taskSubtaskList.removeChild(this.taskSubtaskList.firstChild);
        while (this.taskProjectSelect.firstChild)
            this.taskProjectSelect.removeChild(this.taskProjectSelect.firstChild);
    }
    saveTask() {
        if (!this.selectedTask)
            return;
        let isEdited = false;
        if (!!this.selectedTask.completedDate !== this.taskCheckboxComplete.checked) {
            this.selectedTask.completedDate = this.taskCheckboxComplete.checked ? new Date() : null;
            this.selectedTask.status = this.taskCheckboxComplete.checked ? TaskStatus.Completed : TaskStatus.Normal;
            isEdited = true;
        }
        const dateTime = getUTCDateFromLocal(this.taskDateTimeButton.value);
        if (this.selectedTask.startDate !== dateTime) {
            this.selectedTask.startDate = dateTime;
            isEdited = true;
        }
        if (this.selectedTask.priority !== +this.taskPrioritySelect.value) {
            this.selectedTask.priority = Number(this.taskPrioritySelect.value);
            isEdited = true;
        }
        if (this.selectedTask.title !== this.taskTitleInput.value) {
            this.selectedTask.title = this.taskTitleInput.value;
            isEdited = true;
        }
        if (this.selectedTask.description !== this.taskDescriptionInput.value) {
            this.selectedTask.description = this.taskDescriptionInput.value;
            isEdited = true;
        }
        if (this.selectedTask.listNameId !== this.taskProjectSelect.value) {
            this.selectedTask.listNameId = this.taskProjectSelect.value;
            isEdited = true;
        }
        if (isEdited)
            this.tasksManager.updateTask(this.selectedTask);
    }
    saveSubTask(subTask, checkBoxView, titleView) {
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
            this.tasksManager.updateTask(subTask);
        return subTask;
    }
    updateStyle() {
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
        this.updateHeightDescription();
    }
    updateCompleteCheckBox() {
        if (!this.selectedTask)
            return;
        const tempSelectedTask = this.selectedTask;
        const priorityColor = function () {
            switch (tempSelectedTask.priority) {
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
    }
    updateHeightDescription() {
        this.taskDescriptionInput.style.height = 'auto';
        this.taskDescriptionInput.style.minHeight = 'auto';
        this.taskDescriptionInput.style.height = `${this.taskDescriptionInput.scrollHeight}px`;
        this.taskDescriptionInput.style.minHeight = `${this.taskDescriptionInput.scrollHeight}px`;
    }
}
