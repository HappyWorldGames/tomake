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
var _CustomContextMenuUI_selectedObj, _CustomContextMenuUI_selectedWontDoMethod, _CustomContextMenuUI_selectedDuplicateMethod, _CustomContextMenuUI_selectedDeleteMethod;
import { Project } from "../core/project.js";
import { Task, TaskStatus } from "../core/task.js";
export class CustomContextMenuUI {
    constructor(tasksManager, projectsManager) {
        _CustomContextMenuUI_selectedObj.set(this, null);
        _CustomContextMenuUI_selectedWontDoMethod.set(this, null);
        _CustomContextMenuUI_selectedDuplicateMethod.set(this, null);
        _CustomContextMenuUI_selectedDeleteMethod.set(this, null);
        this.target = null;
        this.customContextMenuDiv = document.getElementById('custom-context-menu');
        this.wontDoButton = document.getElementById('custom-context-menu-wontdo-button');
        this.duplicateButton = document.getElementById('custom-context-menu-duplicate-button');
        this.deleteButton = document.getElementById('custom-context-menu-delete-button');
        this.wontDoButton.onclick = () => {
            if (!__classPrivateFieldGet(this, _CustomContextMenuUI_selectedObj, "f"))
                return;
            switch (__classPrivateFieldGet(this, _CustomContextMenuUI_selectedObj, "f").constructor) {
                case Task:
                    __classPrivateFieldGet(this, _CustomContextMenuUI_selectedObj, "f").status = TaskStatus.NoCompleted;
                    tasksManager.updateTask(__classPrivateFieldGet(this, _CustomContextMenuUI_selectedObj, "f")).then(() => {
                        if (__classPrivateFieldGet(this, _CustomContextMenuUI_selectedWontDoMethod, "f"))
                            __classPrivateFieldGet(this, _CustomContextMenuUI_selectedWontDoMethod, "f").call(this);
                    });
                    break;
                case Project:
                    break;
            }
        };
        this.duplicateButton.onclick = () => {
        };
        this.deleteButton.onclick = () => {
            if (!__classPrivateFieldGet(this, _CustomContextMenuUI_selectedObj, "f"))
                return;
            switch (__classPrivateFieldGet(this, _CustomContextMenuUI_selectedObj, "f").constructor) {
                case Task:
                    tasksManager.deleteTask(__classPrivateFieldGet(this, _CustomContextMenuUI_selectedObj, "f").id).then(() => {
                        if (__classPrivateFieldGet(this, _CustomContextMenuUI_selectedDeleteMethod, "f"))
                            __classPrivateFieldGet(this, _CustomContextMenuUI_selectedDeleteMethod, "f").call(this);
                    });
                    break;
                case Project:
                    projectsManager.deleteProject(__classPrivateFieldGet(this, _CustomContextMenuUI_selectedObj, "f").id, tasksManager).then(() => {
                        if (__classPrivateFieldGet(this, _CustomContextMenuUI_selectedDeleteMethod, "f"))
                            __classPrivateFieldGet(this, _CustomContextMenuUI_selectedDeleteMethod, "f").call(this);
                    });
                    break;
            }
        };
    }
    showTask(event, task, wontDoMethod = null, duplicateMethod = null, deleteMethod = null) {
        this.target = event.target instanceof Node ? event.target : null;
        __classPrivateFieldSet(this, _CustomContextMenuUI_selectedObj, task, "f");
        __classPrivateFieldSet(this, _CustomContextMenuUI_selectedWontDoMethod, wontDoMethod, "f");
        __classPrivateFieldSet(this, _CustomContextMenuUI_selectedDuplicateMethod, duplicateMethod, "f");
        __classPrivateFieldSet(this, _CustomContextMenuUI_selectedDeleteMethod, deleteMethod, "f");
        this.customContextMenuDiv.style.display = 'block';
        let posX = event.clientX;
        let posY = event.clientY;
        const width = this.customContextMenuDiv.clientWidth;
        const height = this.customContextMenuDiv.clientHeight;
        if (posX + width > window.innerWidth)
            posX -= width;
        if (posY + height > window.innerHeight)
            posY -= height;
        if (posY < 0)
            posY = 0;
        this.customContextMenuDiv.style.left = posX + 'px';
        this.customContextMenuDiv.style.top = posY + 'px';
    }
    showProject(project) {
    }
    dismiss() {
        this.customContextMenuDiv.style.display = 'none';
        this.target = null;
    }
    globalClick(event) {
        if (event.target instanceof Node && this.target && this.target.contains(event.target))
            return;
        this.dismiss();
    }
    isOpen() {
        return this.customContextMenuDiv.style.display !== 'none';
    }
}
_CustomContextMenuUI_selectedObj = new WeakMap(), _CustomContextMenuUI_selectedWontDoMethod = new WeakMap(), _CustomContextMenuUI_selectedDuplicateMethod = new WeakMap(), _CustomContextMenuUI_selectedDeleteMethod = new WeakMap();
