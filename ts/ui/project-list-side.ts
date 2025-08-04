import { Project, ProjectStatus } from "../core/project.js";
import { ProjectsManager } from "../core/projects_manager";
import { TasksManager } from "../core/tasks_manager";
import { insertChildAtIndex } from "../utils/html_functions.js";
import { MainSideUI } from "./main-side";

export class ProjectListSideUI {

    // UI Elements
    private projectListSide: HTMLDivElement;
    public get getProjectListSide() : HTMLDivElement {
        return this.projectListSide;
    }

    private projectListSideSpace: HTMLDivElement;

    private projectListSys: HTMLDivElement;
    private projectList: HTMLDivElement;

    private projectListAddButton: HTMLButtonElement;

    private mainSideUI: MainSideUI;

    // Other
    readonly sysProjectList: Project[] = [
        new Project('All', 0, '', SysProjectId.All),
        new Project('ToDay', 1, '', SysProjectId.ToDay),
        new Project('Tomorrow', 2, '', SysProjectId.Tomorrow),
        new Project('Next 7 Days', 3, '', SysProjectId.Next_7_Days),
        new Project('Inbox', 4, '', SysProjectId.Inbox)
    ]
    #selectedProject: Project = this.sysProjectList[1];

    tasksManager: TasksManager;
    projectsManager: ProjectsManager;

    constructor(mainSideUI: MainSideUI, tasksManager: TasksManager, projectsManager: ProjectsManager, projectSpaceClick: Function) {
        // Init UI Elements
        this.projectListSide = document.getElementById('project-list-side') as HTMLDivElement;
        this.projectListSideSpace = document.getElementById('project-list-side-space') as HTMLDivElement;

        this.projectListSys = document.getElementById('project-list-sys') as HTMLDivElement;
        this.projectList = document.getElementById('project-list') as HTMLDivElement;

        this.projectListAddButton = document.getElementById('project-list-add-button') as HTMLButtonElement;

        // Other
        this.mainSideUI = mainSideUI;

        this.tasksManager = tasksManager;
        this.projectsManager = projectsManager;

        this.projectListSide.style.visibility = window.innerWidth <= 640 ? 'hidden' : 'visible';
        this.projectListSideSpace.onclick = () => {
            this.projectListSide.style.visibility = 'hidden';
            this.updateStyle();
            projectSpaceClick();
        }

        this.projectListAddButton.onclick = () => {
            const name = prompt('List name:', '');
            if (!name) return;

            projectsManager.addProject(new Project(name, -1)).then(() => {
                this.renderProjectListSide();
            })
        }
    }

    renderProjectListSide() {
        this.clearAll();
        // Render sys project list
        for (const sysProject of this.sysProjectList) {
            this.addProject(sysProject, this.tasksManager, this.projectsManager, true);
        }

        // Render project list
        this.projectsManager.getAllProjects().then(projects => {
            for (const project of projects)
                if (project.status !== ProjectStatus.Deleted)
                    this.addProject(project, this.tasksManager, this.projectsManager);
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

            this.mainSideUI.renderMainSide(tasksManager, projectsManager, project.id);
        }

        insertChildAtIndex(isSys? this.projectListSys : this.projectList, projectItem, project.order);

        if (isSys) return;

        const buttons = document.createElement('div') as HTMLDivElement;
        projectItem.appendChild(buttons);

        // Edit Button
        const editButton = document.createElement('button') as HTMLButtonElement;
        editButton.type = 'button';
        editButton.classList.add('button');
        editButton.title = 'Edit';
        editButton.textContent = '✎';

        editButton.onclick = () => {
            const newName = prompt('List name:', project.name);
            if (newName === project.name || newName === null) return;

            // TODO make project save function
            project.name = newName;
            projectsManager.updateProject(project).then(() => {
                this.renderProjectListSide();
            });
        }

        buttons.appendChild(editButton);

        // Delete Button
        const deleteButton = document.createElement('button') as HTMLButtonElement;
        deleteButton.type = 'button';
        deleteButton.classList.add('button');
        deleteButton.title = 'Delete';
        deleteButton.textContent = '🗑';

        deleteButton.onclick = () => {
            if (confirm(`Delete ${project.name}?`)) {
                projectsManager.deleteProject(project.id, tasksManager);
            }
        }

        buttons.appendChild(deleteButton);
    }

    updateStyle() {
        if (this.projectListSide.style.visibility === 'visible') {
            if (window.innerWidth <= 640){
                this.projectListSide.style.position = 'absolute';
                this.projectListSideSpace.style.display = 'block';
            }else {
                this.projectListSide.style.position = '';
                this.projectListSideSpace.style.display = 'none';
            }
            this.projectListSide.style.left = '50px';
            this.projectListSide.style.display = 'flex';
        } else {
            this.projectListSideSpace.style.display = 'none';
            this.projectListSide.style.position = '';
            this.projectListSide.style.left = '';
            this.projectListSide.style.display = 'none';
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