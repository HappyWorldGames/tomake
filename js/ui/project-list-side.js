import { Project, ProjectStatus } from "../core/project.js";
import { insertChildAtIndex } from "../utils/html_functions.js";
export var SysProjectId;
(function (SysProjectId) {
    SysProjectId["All"] = "0";
    SysProjectId["ToDay"] = "1";
    SysProjectId["Tomorrow"] = "2";
    SysProjectId["Next_7_Days"] = "3";
    SysProjectId["Inbox"] = "4";
})(SysProjectId || (SysProjectId = {}));
export class ProjectListSideUI {
    get getProjectListSide() {
        return this.projectListSide;
    }
    constructor(tasksManager, projectsManager, projectListCloseSpaceClick, renderMainSide) {
        this.selectedProject = ProjectListSideUI.SysProjectList[1];
        this.projectListSide = document.getElementById('project-list-side');
        this.projectListCloseSideSpace = document.getElementById('project-list-close-side-space');
        this.projectListSys = document.getElementById('project-list-sys');
        this.projectList = document.getElementById('project-list');
        this.projectListAddButton = document.getElementById('project-list-add-button');
        this.tasksManager = tasksManager;
        this.projectsManager = projectsManager;
        this.renderMainSide = renderMainSide;
        this.projectListSide.style.visibility = window.innerWidth <= 640 ? 'hidden' : 'visible';
        this.projectListCloseSideSpace.onclick = () => {
            this.projectListSide.style.visibility = 'hidden';
            this.updateStyle();
            projectListCloseSpaceClick();
        };
        this.projectListAddButton.onclick = () => {
            const name = prompt('List name:', '');
            if (!name)
                return;
            projectsManager.addProject(new Project(name)).then(() => {
                this.renderProjectListSide();
            });
        };
    }
    renderProjectListSide() {
        this.clearAll();
        for (const sysProject of ProjectListSideUI.SysProjectList) {
            this.addProject(sysProject, true);
        }
        this.projectsManager.getAllProjects().then(projects => {
            for (const project of projects)
                if (project.status !== ProjectStatus.Deleted && project.order != -2)
                    this.addProject(project);
        });
    }
    clearAll() {
        while (this.projectListSys.firstChild)
            this.projectListSys.removeChild(this.projectListSys.firstChild);
        while (this.projectList.firstChild)
            this.projectList.removeChild(this.projectList.firstChild);
    }
    addProject(project, isSys = false) {
        const projectItem = document.createElement('div');
        projectItem.classList.add('item');
        if (this.selectedProject === project)
            projectItem.classList.add('selected');
        projectItem.textContent = project.name;
        projectItem.id = project.id;
        projectItem.onclick = () => {
            if (this.selectedProject === project)
                return;
            this.selectProject(project);
        };
        insertChildAtIndex(isSys ? this.projectListSys : this.projectList, projectItem, project.order);
        if (isSys)
            return;
        const buttons = document.createElement('div');
        projectItem.appendChild(buttons);
        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.classList.add('button');
        editButton.title = 'Edit';
        editButton.textContent = '✎';
        editButton.onclick = () => {
            const newName = prompt('List name:', project.name);
            if (newName === project.name || newName === null)
                return;
            project.name = newName;
            this.projectsManager.updateProject(project).then(() => {
                this.renderProjectListSide();
            });
        };
        buttons.appendChild(editButton);
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.classList.add('button');
        deleteButton.title = 'Delete';
        deleteButton.textContent = '🗑';
        deleteButton.onclick = () => {
            if (confirm(`Delete ${project.name}?`)) {
                this.projectsManager.deleteProject(project.id, this.tasksManager);
                projectItem.remove();
            }
        };
        buttons.appendChild(deleteButton);
    }
    updateStyle() {
        if (this.projectListSide.style.visibility === 'visible') {
            if (window.innerWidth <= 640) {
                this.projectListSide.style.position = 'absolute';
                this.projectListCloseSideSpace.style.display = 'block';
            }
            else {
                this.projectListSide.style.position = '';
                this.projectListCloseSideSpace.style.display = 'none';
            }
            this.projectListSide.style.left = '50px';
            this.projectListSide.style.display = 'flex';
        }
        else {
            this.projectListCloseSideSpace.style.display = 'none';
            this.projectListSide.style.position = '';
            this.projectListSide.style.left = '';
            this.projectListSide.style.display = 'none';
        }
    }
    selectProject(project) {
        var _a, _b;
        (_a = document.getElementById(this.selectedProject.id)) === null || _a === void 0 ? void 0 : _a.classList.remove('selected');
        (_b = document.getElementById(project.id)) === null || _b === void 0 ? void 0 : _b.classList.add('selected');
        this.selectedProject = project;
        this.renderMainSide(project.id);
    }
}
ProjectListSideUI.SysProjectList = [
    new Project('All', 0, '', SysProjectId.All),
    new Project('ToDay', 1, '', SysProjectId.ToDay),
    new Project('Tomorrow', 2, '', SysProjectId.Tomorrow),
    new Project('Next 7 Days', 3, '', SysProjectId.Next_7_Days),
    new Project('Inbox', 4, '', SysProjectId.Inbox)
];
