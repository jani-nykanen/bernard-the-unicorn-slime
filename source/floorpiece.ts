import { Bitmap } from "./bitmap.js";
import { DepthObject } from "./depthobject.js";
import { isometricProjection } from "./math.js";
import { Flip, RenderTarget } from "./rendertarget.js";
import { Terrain } from "./terrain.js";
import { Vector } from "./vector.js";


export class FloorPiece implements DepthObject {


    // A reference to terrain since "draw" cannot take
    // additional arguments.
    private readonly terrain : Terrain;

    public readonly pos : Vector = new Vector();


    constructor(x : number, y : number, z : number, terrain : Terrain) {

        this.pos.setValues(x, y, z);
        this.terrain = terrain;
    }


    public draw(canvas : RenderTarget, bmp : Bitmap) : void {

        const v : Vector = isometricProjection(this.pos);

        const dx : number = v.x*12 - 12;
        const dy : number = v.y*12 - 6;

        canvas.drawBitmap(bmp, Flip.None, dx, dy, 0, 0, 24, 12);
        if (this.terrain.objectAt(this.pos.x | 0, (this.pos.y | 0) + 1, this.pos.z | 0 ) === null) {

            const shadow : Vector | null = this.terrain.shadowAt(this.pos.x, this.pos.z);
            if (shadow !== null) {

                const shadowPos = isometricProjection(shadow);
                canvas.drawBitmap(bmp, Flip.None, shadowPos.x*12 - 8, shadowPos.y*12 - 3, 8, 32, 16, 8);
            }
        }
    }
}
