import { SysProjectId } from "../ui/project-list-side.js";
import { getUUID } from "../utils/uuid.js";
export class Task {
    constructor(title = '', description = "", id = getUUID(), parentId = '', childIdList = [], listNameId = SysProjectId.Inbox, createdDate = new Date(), updatedDate = new Date(), completedDate = null, startDate = null, dueDate = null, reminder = [], repeat = [], priority = TaskPriority.Nope, status = TaskStatus.Normal, order = -1, tags = []) {
        this.id = id;
        this.parentId = parentId;
        this.childIdList = childIdList;
        this.listNameId = listNameId;
        this.title = title;
        this.description = description;
        this.createdDate = createdDate;
        this.updatedDate = updatedDate;
        this.completedDate = completedDate;
        this.startDate = startDate;
        this.dueDate = dueDate;
        this.reminder = reminder;
        this.repeat = repeat;
        this.priority = priority;
        this.status = status;
        this.order = order;
        this.tags = tags;
    }
    toDB() {
        return {
            taskId: this.id,
            parentId: this.parentId,
            childIdList: JSON.stringify(this.childIdList),
            listNameId: this.listNameId,
            title: this.title,
            description: this.description,
            createdDate: this.createdDate,
            updatedDate: this.updatedDate,
            completedDate: this.completedDate,
            startDate: this.startDate,
            dueDate: this.dueDate,
            reminder: this.reminder,
            repeat: this.repeat,
            priority: this.priority,
            status: this.status,
            order: this.order,
            tags: JSON.stringify(this.tags)
        };
    }
    static fromDB(obj) {
        return new Task(obj.title, obj.description, obj.taskId, obj.parentId, JSON.parse(obj.childIdList), obj.listNameId, new Date(obj.createdDate), new Date(obj.updatedDate), obj.completedDate && new Date(obj.completedDate), obj.startDate && new Date(obj.startDate), obj.dueDate && new Date(obj.dueDate), obj.reminder.map((date) => new Date(date)), obj.repeat.map((date) => new Date(date)), Number(obj.priority || 0), obj.status, obj.order ? obj.order : -1, obj.tags ? JSON.parse(obj.tags) : []);
    }
}
export var TaskPriority;
(function (TaskPriority) {
    TaskPriority[TaskPriority["Nope"] = 0] = "Nope";
    TaskPriority[TaskPriority["Low"] = 1] = "Low";
    TaskPriority[TaskPriority["Medium"] = 2] = "Medium";
    TaskPriority[TaskPriority["High"] = 3] = "High";
})(TaskPriority || (TaskPriority = {}));
export var TaskStatus;
(function (TaskStatus) {
    TaskStatus[TaskStatus["Normal"] = 0] = "Normal";
    TaskStatus[TaskStatus["Completed"] = 1] = "Completed";
    TaskStatus[TaskStatus["NoCompleted"] = 2] = "NoCompleted";
    TaskStatus[TaskStatus["Archived"] = 11] = "Archived";
    TaskStatus[TaskStatus["Deleted"] = 13] = "Deleted";
})(TaskStatus || (TaskStatus = {}));
