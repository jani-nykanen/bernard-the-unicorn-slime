

export class Vector {


    public x : number = 0.0;
    public y : number = 0.0;
    public z : number = 0.0;


    constructor(x : number = 0, y : number = 0, z : number = 0) {

        this.x = x;
        this.y = y;
        this.z = z;
    }


    public setValues(x : number, y : number, z : number = 0.0) : void {

        this.x = x;
        this.y = y;
        this.z = z;
    }


    public makeEqual(v : Vector) : void {

        this.setValues(v.x, v.y, v.z);
    }


    public clone() : Vector {

        return new Vector(this.x, this.y, this.z);
    }
}
