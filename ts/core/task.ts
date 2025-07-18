import { SysProjectId } from "../ui/project-list-side.js";
import { getUUID } from "../utils/uuid.js";

export class Task {

    id: string;
    parentId: string;
    childIdList: string[];
    listNameId: string;

    title: string;
    description: string;

    createdDate: Date;
    updatedDate: Date;
    completedDate: Date | null;

    startDate: Date | null;
    dueDate: Date | null;

    reminder: Date[];
    repeat: Date[];

    priority: TaskPriority;
    status: TaskStatus;

    constructor(
        title: string = '',
        description: string = "",

        id: string = getUUID(),
        parentId: string = '',
        childIdList: string[] = [],
        listNameId: string = SysProjectId.Inbox,

        createdDate: Date = new Date(),
        updatedDate: Date = new Date(),
        completedDate: Date | null = null,

        startDate: Date | null = null,
        dueDate: Date | null = null,

        reminder: Date[] = [],
        repeat: Date[] = [],

        priority: TaskPriority = TaskPriority.Nope,
        status: TaskStatus = TaskStatus.Normal
    ) {
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
    }

    toDB(): Object {
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
        status: this.status
        }
    }

    static fromDB(obj: any): Task {
        return new Task(
            obj.title,
            obj.description,

            obj.taskId,
            obj.parentId,
            JSON.parse(obj.childIdList),
            obj.listNameId,

            new Date(obj.createdDate),
            new Date(obj.updatedDate),
            obj.completedDate && new Date(obj.completedDate),

            obj.startDate && new Date(obj.startDate),
            obj.dueDate && new Date(obj.dueDate),

            obj.reminder.map((date: string) => new Date(date)),
            obj.repeat.map((date: string) => new Date(date)),

            Number(obj.priority || 0) as TaskPriority,
            obj.status
        )
    }

}

export enum TaskPriority {
    Nope = 0,
    Low = 1,
    Medium = 2,
    High = 3
}

export enum TaskStatus {
    Normal = 0,
    Completed = 1,
    NoCompleted = 2,
    Archived = 11,
    Deleted = 13
}