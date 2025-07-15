import { Task, TaskPriority, TaskStatus } from "../core/task.js";
import { TasksManager } from "../core/tasks_manager.js";
import { convertToDateTimeLocalString, getUTCDateFromLocal } from "../utils/date_converter.js";

export class TaskViewSideUI {

    taskViewSide: HTMLDivElement;
    taskHeader: HTMLDivElement;
    taskCheckboxComplete: HTMLInputElement;
    taskDateTimeInput: HTMLInputElement;
    taskPrioritySelect: HTMLSelectElement;

    taskTitleInput: HTMLInputElement;
    taskDescriptionInput: HTMLTextAreaElement;
    taskSubtaskList: HTMLUListElement;
    taskSubtaskAddButton: HTMLButtonElement;

    #selectedTask: Task | null = null;

    constructor(tasksManager: TasksManager) {
        this.taskViewSide = document.getElementById('task-view-side') as HTMLDivElement;
        this.taskHeader = document.getElementById('task-header') as HTMLDivElement;
        this.taskCheckboxComplete = document.getElementById('task-checkbox-complete') as HTMLInputElement;
        this.taskDateTimeInput = document.getElementById('task-date-button') as HTMLInputElement;
        this.taskPrioritySelect = document.getElementById('task-priority-select') as HTMLSelectElement;

        this.taskTitleInput = document.getElementById('task-title-input') as HTMLInputElement;
        this.taskDescriptionInput = document.getElementById('task-description-input') as HTMLTextAreaElement;
        this.taskSubtaskList = document.getElementById('subtask-list') as HTMLUListElement;
        this.taskSubtaskAddButton = document.getElementById('add-subtask-btn') as HTMLButtonElement;

        this.taskDateTimeInput.onchange = () => {
            this.saveTask(tasksManager);
        }
        this.taskPrioritySelect.onchange = () => {
            this.saveTask(tasksManager);
        };
        this.taskDescriptionInput.oninput = () => {
            this.taskDescriptionInput.style.height = 'auto';
            this.taskDescriptionInput.style.height = `${this.taskDescriptionInput.scrollHeight}`;
        };
        this.taskSubtaskAddButton.onclick = () => {
            // TODO add subtask and render
        }
    }

    // TODO make fun small
    renderTaskViewSide(task: Task, tasksManager: TasksManager) {
        this.taskViewSide.style.visibility = task ? 'visible' : 'hidden';
        if (!task) return;
        if (task !== this.#selectedTask) this.#selectedTask = task;
        this.clearAll();

        // Checkbox complete
        this.taskCheckboxComplete.checked = !!task.completedDate;

        // Input date
        this.taskDateTimeInput.value = task.startDate ? convertToDateTimeLocalString(task.startDate) : '';

        // Priority select
        this.taskPrioritySelect.selectedIndex = task.priority;

        // Title
        this.taskTitleInput.value = task.title;

        let saveTimerId: number;
        this.taskTitleInput.oninput = () => {
            clearTimeout(saveTimerId);
            saveTimerId = setTimeout(() => {
                this.saveTask(tasksManager);
            }, 2500);
        };
        this.taskTitleInput.onblur = () => this.saveTask(tasksManager);

        // Description
        this.taskDescriptionInput.value = task.description;

        this.taskDescriptionInput.oninput = () => {
            clearTimeout(saveTimerId);
            saveTimerId = setTimeout(() => {
                this.saveTask(tasksManager);
            }, 2500);
        };
        this.taskDescriptionInput.onblur = () => this.saveTask(tasksManager);

        // Subtask list
        for (const taskChildId of task.childIdList) {
            tasksManager.getTaskFromId(taskChildId).then( subTask => {
                if (subTask.status === TaskStatus.Deleted) return;

                const subTaskItem = document.createElement('li') as HTMLLIElement;

                this.taskSubtaskList.appendChild(subTaskItem);

                // Checkbox
                const subTaskCheckbox = document.createElement('input') as HTMLInputElement;
                subTaskCheckbox.type = 'checkbox';
                subTaskCheckbox.classList.add('check-field');
                subTaskCheckbox.checked = !!subTask.completedDate;

                subTaskItem.appendChild(subTaskCheckbox);

                // Title
                const subTaskTitle = document.createElement('input') as HTMLInputElement;
                subTaskTitle.type = 'text';
                subTaskTitle.classList.add('text-field');
                subTaskTitle.value = subTask.title;

                subTaskItem.appendChild(subTaskTitle);

                // Delete Button
                const subTaskDeleteButton = document.createElement('button') as HTMLButtonElement;
                subTaskDeleteButton.classList.add('delete-btn');
                subTaskDeleteButton.title = 'delete';
                subTaskDeleteButton.textContent = '🗑';

                subTaskDeleteButton.onclick = () => {
                    // TODO delete subtask
                }

                subTaskItem.appendChild(subTaskDeleteButton);
            });
        }
    }

    clearAll() {
        // clear subtasks
        while(this.taskSubtaskList.firstChild)
            this.taskSubtaskList.removeChild(this.taskSubtaskList.firstChild);
    }

    saveTask(tasksManager: TasksManager) {
        if (!this.#selectedTask) return;
        let isEdited = false;

        // check datetime
        const dateTime = getUTCDateFromLocal(this.taskDateTimeInput.value);
        if (this.#selectedTask.startDate !== dateTime) {
            this.#selectedTask.startDate = dateTime;
            isEdited = true;
        }

        // check priority
        if (this.#selectedTask.priority !== +this.taskPrioritySelect.value) {
            this.#selectedTask.priority = Number(this.taskPrioritySelect.value) as TaskPriority;
            isEdited = true;
        }

        // check title
        if (this.#selectedTask.title !== this.taskTitleInput.value) {
            this.#selectedTask.title = this.taskTitleInput.value;
            isEdited = true;
        }

        // check description
        if (this.#selectedTask.description !== this.taskDescriptionInput.value) {
            this.#selectedTask.description = this.taskDescriptionInput.value;
            isEdited = true;
        }

        if (isEdited) tasksManager.updateTask(this.#selectedTask);
    }
}
