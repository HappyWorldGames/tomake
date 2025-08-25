import { Project } from "../core/project.js";
import { ProjectsManager } from "../core/projects_manager.js";
import { Task, TaskStatus } from "../core/task.js";
import { TasksManager } from "../core/tasks_manager.js";
import { convertToDateTimeLocalString } from "../utils/date_converter.js";

export class CustomContextMenuUI {

    private weekDaysName: string[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    customContextMenuDiv: HTMLDivElement | null = null;
    #selectedObj: Task | Project | null = null;
    #selectedWontDoMethod: Function | null = null;
    #selectedDuplicateMethod: Function | null = null;
    #selectedDeleteMethod: Function | null = null;

    private target: Node[] = [];
    private tasksManager: TasksManager;
    private projectsManager: ProjectsManager;

    constructor(tasksManager: TasksManager, projectsManager: ProjectsManager) {
        this.tasksManager = tasksManager;
        this.projectsManager = projectsManager;
    }

    showTask(event: MouseEvent, task: Task, wontDoMethod: Function | null = null, duplicateMethod: Function | null = null, deleteMethod: Function | null = null) {
        this.createBody(event);
        const ul = document.createElement("ul");
        const tagsButton = document.createElement("li");
        tagsButton.id = "custom-context-menu-tags-button";
        tagsButton.innerText = "Tags";
        tagsButton.style.display = "none"; // TODO: uncomment when implemented

        const wontDoButton = document.createElement("li");
        wontDoButton.id = "custom-context-menu-wontdo-button";
        wontDoButton.innerText = "Won`t Do";
        wontDoButton.onclick = () => {
            if (!this.#selectedObj) return;
            switch (this.#selectedObj.constructor) {
                case Task:
                    this.#selectedObj.status = TaskStatus.NoCompleted;
                    this.tasksManager.updateTask(this.#selectedObj as Task).then(() => {
                        if (this.#selectedWontDoMethod)
                            this.#selectedWontDoMethod();
                    });
                    break;
                case Project:
                    // TODO
                    break;
            }
        }

        const duplicateButton = document.createElement("li");
        duplicateButton.id = "custom-context-menu-duplicate-button";
        duplicateButton.innerText = "Duplicate";
        duplicateButton.style.display = "none"; // TODO: uncomment when implemented
        duplicateButton.onclick = () => {
            // TODO
        }

        const deleteButton = document.createElement("li");
        deleteButton.id = "custom-context-menu-delete-button";
        deleteButton.innerText = "🗑 Delete";
        deleteButton.onclick = () => {
            if (!this.#selectedObj) return;
            switch (this.#selectedObj.constructor) {
                case Task:
                    this.tasksManager.deleteTask(this.#selectedObj.id).then(() => {
                        if (this.#selectedDeleteMethod)
                            this.#selectedDeleteMethod();
                    });
                    break;
                case Project:
                    this.projectsManager.deleteProject(this.#selectedObj.id, this.tasksManager).then(() => {
                        if (this.#selectedDeleteMethod)
                            this.#selectedDeleteMethod();
                    });
                    break;
            }
        }

        ul.appendChild(tagsButton);
        ul.appendChild(wontDoButton);
        ul.appendChild(duplicateButton);
        ul.appendChild(deleteButton);

        this.customContextMenuDiv!.appendChild(ul);
        this.#selectedObj = task;
        this.#selectedWontDoMethod = wontDoMethod;
        this.#selectedDuplicateMethod = duplicateMethod;
        this.#selectedDeleteMethod = deleteMethod;

        this.customContextMenuDiv!.style.display = 'block';
    }

    showProject(project: Project) {
        // TODO
    }

    showDateTime(event: MouseEvent, defaultDate: Date | null = null, isAllDay: Boolean = false): Promise<[string, boolean]> {
        this.createBody(event);

        const calendarParent = document.createElement('div') as HTMLDivElement;
        this.customContextMenuDiv!.appendChild(calendarParent);

        function checkDateTimeValue() {
            if (dateInput.value === '' && timeInput.value !== '') dateInput.value = new Date().toISOString().slice(0, 10);
        }

        const dateTimeValue = defaultDate ? convertToDateTimeLocalString(defaultDate).split('T') : ['', ''];

        // date
        const dateInput = document.createElement('input') as HTMLInputElement;
        dateInput.type = 'date';
        dateInput.value = dateTimeValue[0];
        dateInput.onchange = checkDateTimeValue;
        this.customContextMenuDiv!.appendChild(dateInput);

        // time
        const timeInput = document.createElement('input') as HTMLInputElement;
        timeInput.type = 'time';
        timeInput.value = isAllDay ? '' : dateTimeValue[1];
        timeInput.onchange = checkDateTimeValue;
        this.customContextMenuDiv!.appendChild(timeInput);

        // add clear button for time
        const clearTimeButton = document.createElement('button');
        clearTimeButton.textContent = 'Clear Time';
        clearTimeButton.onclick = () => {
            timeInput.value = '';
        };
        this.customContextMenuDiv!.appendChild(clearTimeButton);

        return new Promise(resolve => {
            // add apply button
            const applyButton = document.createElement('button');
            applyButton.textContent = 'Apply';
            applyButton.onclick = () => {
                resolve([`${dateInput.value}T${timeInput.value ? timeInput.value : '00:00'}`, !timeInput.value]);
                this.dismiss();
            };
            this.customContextMenuDiv!.appendChild(applyButton);
        });
    }

    dismiss() {
        if (this.customContextMenuDiv) this.customContextMenuDiv.remove();
        this.customContextMenuDiv = null;
        this.target = [];
    }

    globalClick(event: MouseEvent) {
        if (event.target instanceof Node) {
            const clickNode = event.target as Node;
            if (this.customContextMenuDiv?.contains(clickNode)) return;
            for (const node of this.target) {
                if (node.contains(clickNode)) return;
            }
        }
        this.dismiss();
    }

    isOpen(): boolean {
        return this.customContextMenuDiv ? this.customContextMenuDiv.style.display !== 'none' : false;
    }

    private createBody(event: MouseEvent) {
        this.dismiss();

        this.customContextMenuDiv = document.createElement("div");
        this.customContextMenuDiv.id = "custom-context-menu";

        document.body.appendChild(this.customContextMenuDiv);

        if (!(event.target instanceof Node)) return;
        this.target.push(event.target);

        // Position the context menu relative to the button
        let posX = event.clientX;
        let posY = event.clientY;
        const width = this.customContextMenuDiv.clientWidth;
        const height = this.customContextMenuDiv.clientHeight;

        if (posX + width > window.innerWidth) posX -= width;
        if (posY + height > window.innerHeight) posY -= height;
        if (posY < 0) posY = 0;

        this.customContextMenuDiv.style.left = posX + 'px';
        this.customContextMenuDiv.style.top = posY + 'px';
    }
}
