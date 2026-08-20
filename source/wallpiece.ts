import { Bitmap } from "./bitmap.js";
import { DepthObject } from "./depthobject.js";
import { isometricProjection } from "./math.js";
import { MASTER_PALETTE } from "./palette.js";
import { Flip, RenderTarget } from "./rendertarget.js";
import { Vector } from "./vector.js";


export const enum WallOrientation {

    Left = 0,
    Right = 1,
}


export class WallPiece implements DepthObject {


    private orientation : WallOrientation;
    private neighborhood : number[];

    public readonly pos : Vector = new Vector();


    constructor(x : number, y : number, z : number, orientation : WallOrientation, neighborhood : number[]) {

        this.pos.setValues(x, y, z);
        this.orientation = orientation;
        this.neighborhood = Array.from(neighborhood);
    }

    public draw(canvas : RenderTarget, bmp : Bitmap) : void {

        const v : Vector = isometricProjection(this.pos);

        const dx : number = v.x*12;
        const dy : number = v.y*12 + 1;

        switch (this.orientation) {

        case WallOrientation.Left:

            canvas.drawBitmap(bmp, Flip.None, dx - 12, dy, 24, 0, 12, 16);

            canvas.setDrawColor(...MASTER_PALETTE[1]);  
            canvas.fillRect(dx - 12, dy + 8, 12, 1) 

            // Outline
            if (this.pos.y > this.neighborhood[3] && this.pos.y > this.neighborhood[7]) {
            
                canvas.setDrawColor(...MASTER_PALETTE[0]);
                canvas.fillRect(dx - 12, dy, 1, 12);
            }
            break;

        case WallOrientation.Right:

            canvas.drawBitmap(bmp, Flip.None, dx, dy, 36, 0, 12, 16);

            // Outline
            if (this.pos.y > this.neighborhood[1] && this.pos.y > this.neighborhood[5]) {
            
                canvas.setDrawColor(...MASTER_PALETTE[0]);
                canvas.fillRect(dx + 11, dy, 1, 12);
            }
            break;

        default:
            break;
        }
    }
}