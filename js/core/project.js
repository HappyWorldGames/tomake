export class Project {
    constructor(name, order, color = '', createDate = new Date(), id = self.crypto.randomUUID()) {
        this.id = id;
        this.createdDate = createDate;
        this.name = name;
        this.order = order;
        this.color = color;
    }
    toDB() {
        return {
            id: this.id,
            createdDate: this.createdDate,
            name: this.name,
            order: this.order,
            color: this.color
        };
    }
    static fromDB(obj) {
        return new Project(obj.name, obj.order, obj.color, obj.createDate, obj.id);
    }
}
