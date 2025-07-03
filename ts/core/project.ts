export class Project {

    id: string;

    createdDate: Date;

    name: string;
    order: number;
    color: string;

    constructor(
        name: string,
        order: number,
        color: string = '',

        createDate: Date = new Date(),

        id: string = self.crypto.randomUUID()
    ) {
        this.id = id;

        this.createdDate = createDate;

        this.name = name;
        this.order = order;
        this.color = color;
    }

    toDB(): Object {
        return {
            id: this.id,
            
            createdDate: this.createdDate,

            name: this.name,
            order: this.order,
            color: this.color
        }
    }

    static fromDB(obj: any): Project {
        return new Project(
            obj.name,
            obj.order,
            obj.color,

            obj.createDate,
            
            obj.id
        )
    }
}