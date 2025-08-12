import { Project } from "../core/project.js";
import { ProjectsManager } from "../core/projects_manager.js";
import { Task, TaskStatus } from "../core/task.js";
import { TasksManager } from "../core/tasks_manager.js";

export class CustomContextMenuUI {

    customContextMenuDiv: HTMLDivElement;

    wontDoButton: HTMLLIElement;
    duplicateButton: HTMLLIElement;
    deleteButton: HTMLLIElement;

    #selectedObj: Task | Project | null = null;
    #selectedWontDoMethod: Function | null = null;
    #selectedDuplicateMethod: Function | null = null;
    #selectedDeleteMethod: Function | null = null;

    private target: Node | null = null;

    constructor(tasksManager: TasksManager, projectsManager: ProjectsManager) {
        this.customContextMenuDiv = document.getElementById('custom-context-menu') as HTMLDivElement;

        this.wontDoButton = document.getElementById('custom-context-menu-wontdo-button') as HTMLLIElement;
        this.duplicateButton = document.getElementById('custom-context-menu-duplicate-button') as HTMLLIElement;
        this.deleteButton = document.getElementById('custom-context-menu-delete-button') as HTMLLIElement;

        this.wontDoButton.onclick = () => {
            if (!this.#selectedObj) return;
            switch (this.#selectedObj.constructor) {
                case Task:
                    this.#selectedObj.status = TaskStatus.NoCompleted;
                    tasksManager.updateTask(this.#selectedObj as Task).then(() => {
                        if (this.#selectedWontDoMethod)
                            this.#selectedWontDoMethod();
                    });
                    break;
                case Project:
                    // TODO
                    break;
            }
        }
        this.duplicateButton.onclick = () => {
            // TODO
        }
        this.deleteButton.onclick = () => {
            if (!this.#selectedObj) return;
            switch (this.#selectedObj.constructor) {
                case Task:
                    tasksManager.deleteTask(this.#selectedObj.id).then(() => {
                        if (this.#selectedDeleteMethod)
                            this.#selectedDeleteMethod();
                    });
                    break;
                case Project:
                    projectsManager.deleteProject(this.#selectedObj.id, tasksManager).then(() => {
                        if (this.#selectedDeleteMethod)
                            this.#selectedDeleteMethod();
                    });
                    break;
            }
        }
    }

    showTask(event: MouseEvent, task: Task, wontDoMethod: Function | null = null, duplicateMethod: Function | null = null, deleteMethod: Function | null = null) {
        this.target = event.target instanceof Node ? event.target : null;
        this.#selectedObj = task;
        this.#selectedWontDoMethod = wontDoMethod;
        this.#selectedDuplicateMethod = duplicateMethod;
        this.#selectedDeleteMethod = deleteMethod;

        this.customContextMenuDiv.style.display = 'block';
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

    showProject(project: Project) {
        // TODO
    }

    showDateTime(event: MouseEvent) {
        // TODO
        this.target = event.target instanceof Node ? event.target : null;

        // create context menu
    }

    dismiss() {
        this.customContextMenuDiv.style.display = 'none';
        this.target = null;
    }

    globalClick(event: MouseEvent) {
        if (event.target instanceof Node && this.target && this.target.contains(event.target)) return;
        this.dismiss();
    }

    isOpen(): boolean {
        return this.customContextMenuDiv.style.display !== 'none';
    }
}