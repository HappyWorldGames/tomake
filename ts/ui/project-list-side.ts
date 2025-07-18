import { Project } from "../core/project.js";
import { ProjectsManager } from "../core/projects_manager";
import { TasksManager } from "../core/tasks_manager";
import { MainSideUI } from "./main-side";

export class ProjectListSideUI {

    projectListSys: HTMLDivElement;
    projectList: HTMLDivElement;

    projectListAddButton: HTMLButtonElement;

    #mainSideUI: MainSideUI;

    readonly sysProjectList: Project[] = [
        new Project('All', 0, '', SysProjectId.All),
        new Project('ToDay', 1, '', SysProjectId.ToDay),
        new Project('Tomorrow', 2, '', SysProjectId.Tomorrow),
        new Project('Next 7 Days', 3, '', SysProjectId.Next_7_Days),
        new Project('Inbox', 4, '', SysProjectId.Inbox)
    ]
    #selectedProject: Project = this.sysProjectList[1];

    constructor(mainSideUI: MainSideUI, tasksManager: TasksManager, projectsManager: ProjectsManager) {
        this.projectListSys = document.getElementById('project-list-sys') as HTMLDivElement;
        this.projectList = document.getElementById('project-list') as HTMLDivElement;

        this.projectListAddButton = document.getElementById('project-list-add-button') as HTMLButtonElement;

        this.#mainSideUI = mainSideUI;

        this.projectListAddButton.onclick = () => {
            const name = prompt('List name:', '');
            if (!name) return;

            projectsManager.addProject(new Project(name, -1)).then(() => {
                this.renderProjectListSide(tasksManager, projectsManager)
            })
        }
    }

    renderProjectListSide(tasksManager: TasksManager, projectsManager: ProjectsManager) {
        this.clearAll();
        // Render sys project list
        for (const sysProject of this.sysProjectList) {
            this.addProject(sysProject, tasksManager, projectsManager, true);
        }

        // TODO Render project list
        projectsManager.getAllProjects().then(projects => {
            for (const project of projects)
                this.addProject(project, tasksManager, projectsManager);
        })
    }

    clearAll() {
        // Clear sys project list
        while(this.projectListSys.firstChild)
            this.projectListSys.removeChild(this.projectListSys.firstChild);

        // Clear project list
        while(this.projectList.firstChild)
            this.projectList.removeChild(this.projectList.firstChild);
    }

    addProject(project: Project, tasksManager: TasksManager, projectsManager: ProjectsManager, isSys = false) {
        const projectItem = document.createElement('div') as HTMLDivElement;
        projectItem.classList.add('item');
        if (this.#selectedProject === project) projectItem.classList.add('selected');
        projectItem.textContent = project.name;
        projectItem.id = project.id;

        projectItem.onclick = () => {
            // Select project
            if (this.#selectedProject === project) return;

            document.getElementById(this.#selectedProject.id)?.classList.remove('selected');
            document.getElementById(project.id)?.classList.add('selected');

            this.#selectedProject = project;

            this.#mainSideUI.renderMainSide(tasksManager, projectsManager, project.id);
        }

        this.insertChildAtIndex(isSys? this.projectListSys : this.projectList, projectItem, project.order);

        // Edit Button
        const editButton = document.createElement('button') as HTMLButtonElement;
        editButton.type = 'button';
        editButton.textContent = 'Edit';

        editButton.onclick = () => {
            const newName = prompt('List name:', project.name);
            if (newName === project.name || newName === null) return;

            // TODO project save function
            project.name = newName;
            projectsManager.updateProject(project).then(() => {
                this.renderProjectListSide(tasksManager, projectsManager);
            })
        }

        projectItem.appendChild(editButton);

        // Delete Button
    }

    insertChildAtIndex(parent: HTMLElement, child: HTMLElement, index: number) {
        if (index >= parent.children.length || index === -1) {
            parent.appendChild(child);
        } else {
            parent.insertBefore(child, parent.children[index]);
        }
    }
}

export enum SysProjectId {
    All = '0',
    ToDay = '1',
    Tomorrow = '2',
    Next_7_Days = '3',
    Inbox = '4'
}