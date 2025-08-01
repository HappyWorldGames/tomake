import { getUUID } from "../utils/uuid.js";
export class Project {
    constructor(name, order, color = '', id = getUUID(), createDate = new Date(), updatedDate = new Date(), status = ProjectStatus.Normal) {
        this.id = id;
        this.createdDate = createDate;
        this.updatedDate = updatedDate;
        this.name = name;
        this.order = order;
        this.color = color;
        this.status = status;
    }
    toDB() {
        return {
            id: this.id,
            createdDate: this.createdDate.toISOString(),
            updatedDate: this.updatedDate.toISOString(),
            name: this.name,
            order: this.order,
            color: this.color,
            status: this.status
        };
    }
    static fromDB(obj) {
        return new Project(obj.name, obj.order, obj.color, obj.id, new Date(obj.createDate), new Date(obj.updatedDate), obj.status);
    }
}
export var ProjectStatus;
(function (ProjectStatus) {
    ProjectStatus[ProjectStatus["Normal"] = 0] = "Normal";
    ProjectStatus[ProjectStatus["Archived"] = 11] = "Archived";
    ProjectStatus[ProjectStatus["Deleted"] = 13] = "Deleted";
})(ProjectStatus || (ProjectStatus = {}));
