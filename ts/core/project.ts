import { getUUID } from "../utils/uuid.js";

export class Project {

    id: string;

    createdDate: Date;
    updatedDate: Date;

    name: string;
    order: number;
    color: string;

    status: ProjectStatus;

    constructor(
        name: string,
        order: number = -1,
        color: string = '',

        id: string = getUUID(),

        createDate: Date = new Date(),
        updatedDate: Date = new Date(),

        status: ProjectStatus = ProjectStatus.Normal
    ) {
        this.id = id;

        this.createdDate = createDate;
        this.updatedDate = updatedDate;

        this.name = name;
        this.order = order;
        this.color = color;

        this.status = status;
    }

    toDB(): Object {
        return {
            id: this.id,

            createdDate: this.createdDate.toISOString(),
            updatedDate: this.updatedDate.toISOString(),

            name: this.name,
            order: this.order,
            color: this.color,

            status: this.status
        }
    }

    static fromDB(obj: any): Project {
        return new Project(
            obj.name,
            obj.order,
            obj.color,

            obj.id,

            new Date(obj.createdDate),
            new Date(obj.updatedDate),

            obj.status
        )
    }
}

// TODO make support with "|"
export enum ProjectStatus {
    Normal = 0,
    Archived = 11,
    Deleted = 13
}