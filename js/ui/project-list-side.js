var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _ProjectListSideUI_mainSideUI, _ProjectListSideUI_selectedProject;
import { Project } from "../core/project.js";
export class ProjectListSideUI {
    constructor(mainSideUI, tasksManager, projectsManager) {
        _ProjectListSideUI_mainSideUI.set(this, void 0);
        this.sysProjectList = [
            new Project('All', 0, '', SysProjectId.All),
            new Project('ToDay', 1, '', SysProjectId.ToDay),
            new Project('Tomorrow', 2, '', SysProjectId.Tomorrow),
            new Project('Next 7 Days', 3, '', SysProjectId.Next_7_Days),
            new Project('Inbox', 4, '', SysProjectId.Inbox)
        ];
        _ProjectListSideUI_selectedProject.set(this, this.sysProjectList[1]);
        this.projectListSys = document.getElementById('project-list-sys');
        this.projectList = document.getElementById('project-list');
        this.projectListAddButton = document.getElementById('project-list-add-button');
        __classPrivateFieldSet(this, _ProjectListSideUI_mainSideUI, mainSideUI, "f");
        this.projectListAddButton.onclick = () => {
            const name = prompt('List name:', '');
            if (!name)
                return;
            projectsManager.addProject(new Project(name, -1)).then(() => {
                this.renderProjectListSide(tasksManager, projectsManager);
            });
        };
    }
    renderProjectListSide(tasksManager, projectsManager) {
        this.clearAll();
        for (const sysProject of this.sysProjectList) {
            this.addProject(sysProject, tasksManager, projectsManager, true);
        }
        projectsManager.getAllProjects().then(projects => {
            for (const project of projects)
                this.addProject(project, tasksManager, projectsManager);
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
            __classPrivateFieldGet(this, _ProjectListSideUI_mainSideUI, "f").renderMainSide(tasksManager, projectsManager, project.id);
        };
        this.insertChildAtIndex(isSys ? this.projectListSys : this.projectList, projectItem, project.order);
        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.textContent = 'Edit';
        editButton.onclick = () => {
            const newName = prompt('List name:', project.name);
            if (newName === project.name || newName === null)
                return;
            project.name = newName;
            projectsManager.updateProject(project).then(() => {
                this.renderProjectListSide(tasksManager, projectsManager);
            });
        };
        projectItem.appendChild(editButton);
    }
    insertChildAtIndex(parent, child, index) {
        if (index >= parent.children.length || index === -1) {
            parent.appendChild(child);
        }
        else {
            parent.insertBefore(child, parent.children[index]);
        }
    }
}
_ProjectListSideUI_mainSideUI = new WeakMap(), _ProjectListSideUI_selectedProject = new WeakMap();
export var SysProjectId;
(function (SysProjectId) {
    SysProjectId["All"] = "0";
    SysProjectId["ToDay"] = "1";
    SysProjectId["Tomorrow"] = "2";
    SysProjectId["Next_7_Days"] = "3";
    SysProjectId["Inbox"] = "4";
})(SysProjectId || (SysProjectId = {}));
