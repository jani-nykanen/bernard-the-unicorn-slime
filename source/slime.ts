import { Bitmap } from "./bitmap.js";
import { GameObject } from "./gameobject.js";
import { isometricProjection } from "./math.js";
import { ProgramInterface } from "./program.js";
import { Flip, RenderTarget } from "./rendertarget.js";
import { Vector } from "./vector.js";



export class Slime implements GameObject {


    private renderPos : Vector;

    public readonly pos : Vector;


    constructor(x : number, y : number, z : number) {

        this.pos = new Vector(x, y, z);
        this.renderPos = this.pos.clone();
    }


    public update(prog : ProgramInterface) : void {
        
        // ...
    }


    public draw(canvas : RenderTarget, bmp : Bitmap) : void {
        
        const v : Vector = isometricProjection(this.renderPos);
        
        const dx : number = v.x*12 - 8;
        const dy : number = v.y*12 - 13;

        canvas.drawBitmap(bmp, Flip.None, dx, dy, 0, 16, 16, 16);
    }
}
