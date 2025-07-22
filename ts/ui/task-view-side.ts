import { ProjectStatus } from "../core/project.js";
import { ProjectsManager } from "../core/projects_manager.js";
import { Task, TaskPriority, TaskStatus } from "../core/task.js";
import { TasksManager } from "../core/tasks_manager.js";
import { convertToDateTimeLocalString, getUTCDateFromLocal } from "../utils/date_converter.js";
import { insertChildAtIndex } from "../utils/html_functions.js";
import { CustomContextMenuUI } from "./custom-context-menu.js";
import { SysProjectId } from "./project-list-side.js";

export class TaskViewSideUI {

    taskViewSide: HTMLDivElement;
    taskHeader: HTMLDivElement;

    taskCloseButton: HTMLButtonElement;
    taskCheckboxComplete: HTMLInputElement;
    taskDateTimeInput: HTMLInputElement;
    taskPrioritySelect: HTMLSelectElement;

    taskTitleInput: HTMLInputElement;
    taskDescriptionInput: HTMLTextAreaElement;
    taskSubtaskList: HTMLUListElement;
    taskSubtaskAddButton: HTMLButtonElement;

    taskProjectSelect: HTMLSelectElement;
    taskProjectMoreButton: HTMLButtonElement;

    #selectedTask: Task | null = null;
    #closeTaskButtonMethod: Function = ()=>{}

    constructor(tasksManager: TasksManager, projectsManager: ProjectsManager, customContextMenuUI: CustomContextMenuUI) {
        this.taskViewSide = document.getElementById('task-view-side') as HTMLDivElement;
        this.taskHeader = document.getElementById('task-header') as HTMLDivElement;

        this.taskCloseButton = document.getElementById('task-close-btn') as HTMLButtonElement;
        this.taskCheckboxComplete = document.getElementById('task-checkbox-complete') as HTMLInputElement;
        this.taskDateTimeInput = document.getElementById('task-date-button') as HTMLInputElement;
        this.taskPrioritySelect = document.getElementById('task-priority-select') as HTMLSelectElement;

        this.taskTitleInput = document.getElementById('task-title-input') as HTMLInputElement;
        this.taskDescriptionInput = document.getElementById('task-description-input') as HTMLTextAreaElement;
        this.taskSubtaskList = document.getElementById('subtask-list') as HTMLUListElement;
        this.taskSubtaskAddButton = document.getElementById('add-subtask-btn') as HTMLButtonElement;

        this.taskProjectSelect = document.getElementById('task-project-select') as HTMLSelectElement;
        this.taskProjectMoreButton = document.getElementById('task-project-more-btn') as HTMLButtonElement;

        // listeners to save
        this.taskCheckboxComplete.onchange = () => {
            if (!this.#selectedTask) return;
            this.saveTask(tasksManager);
        }
        this.taskDateTimeInput.onchange = () => {
            this.saveTask(tasksManager);
        }
        this.taskPrioritySelect.onchange = () => {
            this.saveTask(tasksManager);
        };

        let saveTimerId: number;
        this.taskTitleInput.oninput = () => {
            clearTimeout(saveTimerId);
            saveTimerId = setTimeout(() => {
                this.saveTask(tasksManager);
            }, 2500);
        };
        this.taskTitleInput.onblur = () => this.saveTask(tasksManager);

        // TODO auto height descruption
        this.taskDescriptionInput.oninput = () => {
            this.#updateHeightDescription();

            clearTimeout(saveTimerId);
            saveTimerId = setTimeout(() => {
                this.saveTask(tasksManager);
            }, 2500);
        };
        this.taskDescriptionInput.onblur = () => this.saveTask(tasksManager);

        this.taskSubtaskAddButton.onclick = () => {
            if (!this.#selectedTask) return;
            tasksManager.addSubTask(this.#selectedTask.id, new Task()).then( subTaskId => {
                if (!this.#selectedTask) return;

                this.#selectedTask.childIdList.push(subTaskId);
                this.renderTaskViewSide(this.#selectedTask, tasksManager, projectsManager);
            })
        }

        this.taskProjectSelect.onchange = () => {
            this.saveTask(tasksManager);
        }
        this.taskProjectMoreButton.onclick = (event) => {
            if (!this.#selectedTask) return;
            customContextMenuUI.showTask(event, this.#selectedTask, null, null, () => this.renderTaskViewSide(null, tasksManager, projectsManager));
        }
    }

    // TODO make fun small
    renderTaskViewSide(task: Task | null, tasksManager: TasksManager, projectsManager: ProjectsManager) {
        this.taskViewSide.style.visibility = task ? 'visible' : 'hidden';
        if (!task) {
            this.#selectedTask = null;
            return;
        }
        if (task !== this.#selectedTask) this.#selectedTask = task;
        this.clearAll();

        // Close Button
        this.taskCloseButton.onclick = () => {
            this.renderTaskViewSide(null, tasksManager, projectsManager);
            this.#closeTaskButtonMethod();
            this.updateStyle();
        }

        // Checkbox complete
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

        this.taskCheckboxComplete.style.borderColor = priorityColor;
        this.taskCheckboxComplete.style.accentColor = priorityColor;

        this.taskCheckboxComplete.checked = !!task.completedDate;

        // Input date
        this.taskDateTimeInput.value = task.startDate ? convertToDateTimeLocalString(task.startDate) : '';

        // Priority select
        this.taskPrioritySelect.selectedIndex = task.priority;

        // Title
        this.taskTitleInput.value = task.title;

        // Description
        this.taskDescriptionInput.value = task.description;
        this.#updateHeightDescription();

        // Subtask list
        const completeSubTasks: Task[] = [];
        const addMainSubTask = async() => { return new Promise(resolve => {
            let count = 0;
            for (const taskChildId of task.childIdList) {
                tasksManager.getTaskFromId(taskChildId).then( subTask => {
                    switch(subTask.status) {
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
                    if (count >= task.childIdList.length) resolve('');
                });
            }
        });};

        addMainSubTask().then(() => {
            if (completeSubTasks.length === 0) return;
            for (const subTask of completeSubTasks) {
                this.addSubTask(subTask, tasksManager, projectsManager);
            }
        });

        // Select ProjectList
        projectsManager.getAllProjects().then(projects => {
            // add system project
            const inboxItem = document.createElement('option');
            inboxItem.value = SysProjectId.Inbox;
            inboxItem.text = 'Inbox';
            this.taskProjectSelect.appendChild(inboxItem);

            for (const project of projects) {
                if (project.status === ProjectStatus.Deleted) continue;

                const selectItem = document.createElement('option') as HTMLOptionElement;
                selectItem.value = project.id;
                selectItem.text = project.name;

                insertChildAtIndex(this.taskProjectSelect, selectItem, project.order);
            }

            this.taskProjectSelect.value = task.listNameId;
        });
    }

    addSubTask(subTask: Task, tasksManager: TasksManager, projectsManager: ProjectsManager) {
        const subTaskItem = document.createElement('li') as HTMLLIElement;
        subTaskItem.id = subTask.id;

        this.taskSubtaskList.appendChild(subTaskItem);

        // Checkbox
        const subTaskCheckbox = document.createElement('input') as HTMLInputElement;
        subTaskCheckbox.type = 'checkbox';
        subTaskCheckbox.classList.add('check-field');
        subTaskCheckbox.checked = !!subTask.completedDate;
        subTaskCheckbox.onchange = () => {
            this.saveSubTask(subTask, subTaskCheckbox, subTaskTitle, tasksManager);
            if (this.#selectedTask) this.renderTaskViewSide(this.#selectedTask, tasksManager, projectsManager);
        }

        subTaskItem.appendChild(subTaskCheckbox);

        // Title
        const subTaskTitle = document.createElement('input') as HTMLInputElement;
        subTaskTitle.type = 'text';
        subTaskTitle.classList.add('text-field');
        subTaskTitle.value = subTask.title;

        let saveTimerId: number;
        subTaskTitle.oninput = () => {
            clearTimeout(saveTimerId);
            saveTimerId = setTimeout(() => {
                subTask = this.saveSubTask(subTask, subTaskCheckbox, subTaskTitle, tasksManager);
            }, 2500);
        };
        subTaskTitle.onblur = () => subTask = this.saveSubTask(subTask, subTaskCheckbox, subTaskTitle, tasksManager);

        subTaskItem.appendChild(subTaskTitle);

        // Delete Button
        const subTaskDeleteButton = document.createElement('button') as HTMLButtonElement;
        subTaskDeleteButton.classList.add('delete-btn');
        subTaskDeleteButton.title = 'delete';
        subTaskDeleteButton.textContent = '🗑';

        subTaskDeleteButton.onclick = () => {
            tasksManager.deleteTask(subTask.id).then(() => subTaskItem.remove() );
        }

        subTaskItem.appendChild(subTaskDeleteButton);
    }

    clearAll() {
        // clear subtasks
        while (this.taskSubtaskList.firstChild)
            this.taskSubtaskList.removeChild(this.taskSubtaskList.firstChild);

        // clear projects
        while (this.taskProjectSelect.firstChild)
            this.taskProjectSelect.removeChild(this.taskProjectSelect.firstChild);
    }

    saveTask(tasksManager: TasksManager) {
        if (!this.#selectedTask) return;
        let isEdited = false;

        // check complete
        if (!!this.#selectedTask.completedDate !== this.taskCheckboxComplete.checked) {
            this.#selectedTask.completedDate = this.taskCheckboxComplete.checked ? new Date() : null;
            this.#selectedTask.status = this.taskCheckboxComplete.checked ? TaskStatus.Completed : TaskStatus.Normal;
            isEdited = true;
        }

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

        // check project
        if (this.#selectedTask.listNameId !== this.taskProjectSelect.value) {
            this.#selectedTask.listNameId = this.taskProjectSelect.value;
            isEdited = true;
        }

        if (isEdited) tasksManager.updateTask(this.#selectedTask);
    }

    saveSubTask(subTask: Task, checkBoxView: HTMLInputElement, titleView: HTMLInputElement, tasksManager: TasksManager): Task {
        let isEdited = false;

        // check checkBox
        if (!!subTask.completedDate !== checkBoxView.checked) {
            subTask.completedDate = checkBoxView.checked ? new Date() : null;
            subTask.status = checkBoxView.checked ? TaskStatus.Completed : TaskStatus.Normal;
            isEdited = true;
        }

        // check title
        if (subTask.title !== titleView.value) {
            subTask.title = titleView.value;
            isEdited = true;
        }

        if (isEdited) tasksManager.updateTask(subTask);
        return subTask;
    }

    updateStyle(closeTaskButtonMethod: Function | null = null) {
        if (this.taskViewSide.style.visibility === 'visible') {
            this.taskViewSide.style.zIndex = '4';

            if (window.innerWidth <= 640) {
                this.taskViewSide.style.position = 'absolute';
                this.taskViewSide.style.display = 'flex';
                this.taskViewSide.style.width = '100vw';
                this.taskCloseButton.style.display = 'block';
            }else if (window.innerWidth <= 960) {
                this.taskViewSide.style.position = 'absolute';
                this.taskViewSide.style.right = '0';
                this.taskViewSide.style.display = 'flex';
                this.taskViewSide.style.width = '50vw';
                this.taskCloseButton.style.display = 'block';
            }
        } else {
            this.taskViewSide.style.zIndex = '';
            this.taskViewSide.style.position = '';
            this.taskViewSide.style.right = '';
            this.taskViewSide.style.display = '';
            this.taskViewSide.style.width = '';
            this.taskCloseButton.style.display = '';
        }

        if (closeTaskButtonMethod) this.#closeTaskButtonMethod = closeTaskButtonMethod;
        this.#updateHeightDescription();
    }

    #updateHeightDescription() {
        this.taskDescriptionInput.style.height = 'auto';
        this.taskDescriptionInput.style.minHeight = 'auto';
        this.taskDescriptionInput.style.height = `${this.taskDescriptionInput.scrollHeight}px`;
        this.taskDescriptionInput.style.minHeight = `${this.taskDescriptionInput.scrollHeight}px`;
    }
}
