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
var _ProjectListSideUI_selectedProject;
import { Project, ProjectStatus } from "../core/project.js";
import { insertChildAtIndex } from "../utils/html_functions.js";
export class ProjectListSideUI {
    get getProjectListSide() {
        return this.projectListSide;
    }
    constructor(mainSideUI, tasksManager, projectsManager, projectSpaceClick) {
        this.sysProjectList = [
            new Project('All', 0, '', SysProjectId.All),
            new Project('ToDay', 1, '', SysProjectId.ToDay),
            new Project('Tomorrow', 2, '', SysProjectId.Tomorrow),
            new Project('Next 7 Days', 3, '', SysProjectId.Next_7_Days),
            new Project('Inbox', 4, '', SysProjectId.Inbox)
        ];
        _ProjectListSideUI_selectedProject.set(this, this.sysProjectList[1]);
        this.projectListSide = document.getElementById('project-list-side');
        this.projectListSideSpace = document.getElementById('project-list-side-space');
        this.projectListSys = document.getElementById('project-list-sys');
        this.projectList = document.getElementById('project-list');
        this.projectListAddButton = document.getElementById('project-list-add-button');
        this.mainSideUI = mainSideUI;
        this.tasksManager = tasksManager;
        this.projectsManager = projectsManager;
        this.projectListSide.style.visibility = window.innerWidth <= 640 ? 'hidden' : 'visible';
        this.projectListSideSpace.onclick = () => {
            this.projectListSide.style.visibility = 'hidden';
            this.updateStyle();
            projectSpaceClick();
        };
        this.projectListAddButton.onclick = () => {
            const name = prompt('List name:', '');
            if (!name)
                return;
            projectsManager.addProject(new Project(name, -1)).then(() => {
                this.renderProjectListSide();
            });
        };
    }
    renderProjectListSide() {
        this.clearAll();
        for (const sysProject of this.sysProjectList) {
            this.addProject(sysProject, this.tasksManager, this.projectsManager, true);
        }
        this.projectsManager.getAllProjects().then(projects => {
            for (const project of projects)
                if (project.status !== ProjectStatus.Deleted)
                    this.addProject(project, this.tasksManager, this.projectsManager);
        });
    }
    clearAll() {
        while (this.projectListSys.firstChild)
            this.projectListSys.removeChild(this.projectListSys.firstChild);
        while (this.projectList.firstChild)
            this.projectList.removeChild(this.projectList.firstChild);
    }
    addProject(project, tasksManager, projectsManager, isSys = false) {
        const projectItem = document.createElement('div');
        projectItem.classList.add('item');
        if (__classPrivateFieldGet(this, _ProjectListSideUI_selectedProject, "f") === project)
            projectItem.classList.add('selected');
        projectItem.textContent = project.name;
        projectItem.id = project.id;
        projectItem.onclick = () => {
            var _a, _b;
            if (__classPrivateFieldGet(this, _ProjectListSideUI_selectedProject, "f") === project)
                return;
            (_a = document.getElementById(__classPrivateFieldGet(this, _ProjectListSideUI_selectedProject, "f").id)) === null || _a === void 0 ? void 0 : _a.classList.remove('selected');
            (_b = document.getElementById(project.id)) === null || _b === void 0 ? void 0 : _b.classList.add('selected');
            __classPrivateFieldSet(this, _ProjectListSideUI_selectedProject, project, "f");
            this.mainSideUI.renderMainSide(tasksManager, projectsManager, project.id);
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
            projectsManager.updateProject(project).then(() => {
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
                projectsManager.deleteProject(project.id, tasksManager);
            }
        };
        buttons.appendChild(deleteButton);
    }
    updateStyle() {
        if (this.projectListSide.style.visibility === 'visible') {
            if (window.innerWidth <= 640) {
                this.projectListSide.style.position = 'absolute';
                this.projectListSideSpace.style.display = 'block';
            }
            else {
                this.projectListSide.style.position = '';
                this.projectListSideSpace.style.display = 'none';
            }
            this.projectListSide.style.left = '50px';
            this.projectListSide.style.display = 'flex';
        }
        else {
            this.projectListSideSpace.style.display = 'none';
            this.projectListSide.style.position = '';
            this.projectListSide.style.left = '';
            this.projectListSide.style.display = 'none';
        }
    }
}
_ProjectListSideUI_selectedProject = new WeakMap();
export var SysProjectId;
(function (SysProjectId) {
    SysProjectId["All"] = "0";
    SysProjectId["ToDay"] = "1";
    SysProjectId["Tomorrow"] = "2";
    SysProjectId["Next_7_Days"] = "3";
    SysProjectId["Inbox"] = "4";
})(SysProjectId || (SysProjectId = {}));
