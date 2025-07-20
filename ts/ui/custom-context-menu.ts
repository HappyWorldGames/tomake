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
        this.#selectedObj = task;
        this.#selectedWontDoMethod = wontDoMethod;
        this.#selectedDuplicateMethod = duplicateMethod;
        this.#selectedDeleteMethod = deleteMethod;

        setTimeout(() => { // FIXME Kludge
            this.customContextMenuDiv.style.display = 'block';
            // Position the context menu relative to the button
            // FIXME going abroad
            this.customContextMenuDiv.style.left = event.clientX + 'px';
            this.customContextMenuDiv.style.top = event.clientY + 'px';
        }, 5);
    }

    showProject(project: Project) {
        // TODO
    }

    dismiss() {
        this.customContextMenuDiv.style.display = 'none';
    }

    isOpen(): boolean {
        return this.customContextMenuDiv.style.display !== 'none';
    }
}