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
import { convertToDateTimeLocalString } from "../utils/date_converter.js";
export class CustomContextMenuUI {
    constructor(tasksManager, projectsManager) {
        this.weekDaysName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        this.customContextMenuDiv = null;
        _CustomContextMenuUI_selectedObj.set(this, null);
        _CustomContextMenuUI_selectedWontDoMethod.set(this, null);
        _CustomContextMenuUI_selectedDuplicateMethod.set(this, null);
        _CustomContextMenuUI_selectedDeleteMethod.set(this, null);
        this.target = [];
        this.tasksManager = tasksManager;
        this.projectsManager = projectsManager;
    }
    showTask(event, task, wontDoMethod = null, duplicateMethod = null, deleteMethod = null) {
        this.createBody(event);
        const ul = document.createElement("ul");
        const tagsButton = document.createElement("li");
        tagsButton.id = "custom-context-menu-tags-button";
        tagsButton.innerText = "Tags";
        tagsButton.style.display = "none";
        const wontDoButton = document.createElement("li");
        wontDoButton.id = "custom-context-menu-wontdo-button";
        wontDoButton.innerText = "Won`t Do";
        wontDoButton.onclick = () => {
            if (!__classPrivateFieldGet(this, _CustomContextMenuUI_selectedObj, "f"))
                return;
            switch (__classPrivateFieldGet(this, _CustomContextMenuUI_selectedObj, "f").constructor) {
                case Task:
                    __classPrivateFieldGet(this, _CustomContextMenuUI_selectedObj, "f").status = TaskStatus.NoCompleted;
                    this.tasksManager.updateTask(__classPrivateFieldGet(this, _CustomContextMenuUI_selectedObj, "f")).then(() => {
                        if (__classPrivateFieldGet(this, _CustomContextMenuUI_selectedWontDoMethod, "f"))
                            __classPrivateFieldGet(this, _CustomContextMenuUI_selectedWontDoMethod, "f").call(this);
                    });
                    break;
                case Project:
                    break;
            }
        };
        const duplicateButton = document.createElement("li");
        duplicateButton.id = "custom-context-menu-duplicate-button";
        duplicateButton.innerText = "Duplicate";
        duplicateButton.style.display = "none";
        duplicateButton.onclick = () => {
        };
        const deleteButton = document.createElement("li");
        deleteButton.id = "custom-context-menu-delete-button";
        deleteButton.innerText = "🗑 Delete";
        deleteButton.onclick = () => {
            if (!__classPrivateFieldGet(this, _CustomContextMenuUI_selectedObj, "f"))
                return;
            switch (__classPrivateFieldGet(this, _CustomContextMenuUI_selectedObj, "f").constructor) {
                case Task:
                    this.tasksManager.deleteTask(__classPrivateFieldGet(this, _CustomContextMenuUI_selectedObj, "f").id).then(() => {
                        if (__classPrivateFieldGet(this, _CustomContextMenuUI_selectedDeleteMethod, "f"))
                            __classPrivateFieldGet(this, _CustomContextMenuUI_selectedDeleteMethod, "f").call(this);
                    });
                    break;
                case Project:
                    this.projectsManager.deleteProject(__classPrivateFieldGet(this, _CustomContextMenuUI_selectedObj, "f").id, this.tasksManager).then(() => {
                        if (__classPrivateFieldGet(this, _CustomContextMenuUI_selectedDeleteMethod, "f"))
                            __classPrivateFieldGet(this, _CustomContextMenuUI_selectedDeleteMethod, "f").call(this);
                    });
                    break;
            }
        };
        ul.appendChild(tagsButton);
        ul.appendChild(wontDoButton);
        ul.appendChild(duplicateButton);
        ul.appendChild(deleteButton);
        this.customContextMenuDiv.appendChild(ul);
        __classPrivateFieldSet(this, _CustomContextMenuUI_selectedObj, task, "f");
        __classPrivateFieldSet(this, _CustomContextMenuUI_selectedWontDoMethod, wontDoMethod, "f");
        __classPrivateFieldSet(this, _CustomContextMenuUI_selectedDuplicateMethod, duplicateMethod, "f");
        __classPrivateFieldSet(this, _CustomContextMenuUI_selectedDeleteMethod, deleteMethod, "f");
        this.customContextMenuDiv.style.display = 'block';
    }
    showProject(project) {
    }
    showDateTime(event, defaultDate = null) {
        this.createBody(event);
        const calendarParent = document.createElement('div');
        this.customContextMenuDiv.appendChild(calendarParent);
        function checkDateTimeValue() {
            if (dateInput.value === '' && timeInput.value !== '')
                dateInput.value = new Date().toISOString().slice(0, 10);
        }
        const dateTimeValue = defaultDate ? convertToDateTimeLocalString(defaultDate).split('T') : ['', ''];
        const dateInput = document.createElement('input');
        dateInput.type = 'date';
        dateInput.value = dateTimeValue[0];
        dateInput.onchange = checkDateTimeValue;
        this.customContextMenuDiv.appendChild(dateInput);
        const timeInput = document.createElement('input');
        timeInput.type = 'time';
        timeInput.value = dateTimeValue[1];
        timeInput.onchange = checkDateTimeValue;
        this.customContextMenuDiv.appendChild(timeInput);
        const clearTimeButton = document.createElement('button');
        clearTimeButton.textContent = 'Clear Time';
        clearTimeButton.onclick = () => {
            timeInput.value = '';
        };
        this.customContextMenuDiv.appendChild(clearTimeButton);
        return new Promise(resolve => {
            const applyButton = document.createElement('button');
            applyButton.textContent = 'Apply';
            applyButton.onclick = () => {
                resolve(`${dateInput.value}T${timeInput.value}`);
                this.dismiss();
            };
            this.customContextMenuDiv.appendChild(applyButton);
        });
    }
    dismiss() {
        if (this.customContextMenuDiv)
            this.customContextMenuDiv.remove();
        this.customContextMenuDiv = null;
        this.target = [];
    }
    globalClick(event) {
        var _a;
        if (event.target instanceof Node) {
            const clickNode = event.target;
            if ((_a = this.customContextMenuDiv) === null || _a === void 0 ? void 0 : _a.contains(clickNode))
                return;
            for (const node of this.target) {
                if (node.contains(clickNode))
                    return;
            }
        }
        this.dismiss();
    }
    isOpen() {
        return this.customContextMenuDiv ? this.customContextMenuDiv.style.display !== 'none' : false;
    }
    createBody(event) {
        this.dismiss();
        this.customContextMenuDiv = document.createElement("div");
        this.customContextMenuDiv.id = "custom-context-menu";
        document.body.appendChild(this.customContextMenuDiv);
        if (!(event.target instanceof Node))
            return;
        this.target.push(event.target);
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
}
_CustomContextMenuUI_selectedObj = new WeakMap(), _CustomContextMenuUI_selectedWontDoMethod = new WeakMap(), _CustomContextMenuUI_selectedDuplicateMethod = new WeakMap(), _CustomContextMenuUI_selectedDeleteMethod = new WeakMap();
