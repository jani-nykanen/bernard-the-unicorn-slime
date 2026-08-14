

export class Vector {


    public x : number = 0.0;
    public y : number = 0.0;


    constructor(x : number = 0, y : number = 0) {

        this.x = x;
        this.y = y;
    }


    public setValues(x : number, y : number) : void {

        this.x = x;
        this.y = y;
    }


    public clone() : Vector {

        return new Vector(this.x, this.y);
    }
}
