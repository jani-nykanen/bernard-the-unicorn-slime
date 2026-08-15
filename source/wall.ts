import { Bitmap } from "./bitmap.js";
import { DepthObject } from "./depthobject.js";
import { isometricProjection } from "./math.js";
import { MASTER_PALETTE } from "./palette.js";
import { Flip, RenderTarget } from "./rendertarget.js";
import { Vector } from "./vector.js";



export class Wall implements DepthObject {


    private neighborhood : number[];

    public readonly pos : Vector = new Vector();


    constructor(x : number, y : number, z : number, neighborhood : number[]) {

        this.neighborhood = Array.from(neighborhood);
        this.pos.setValues(x, y, z);
    }


    public draw(canvas : RenderTarget, bmp : Bitmap) : void {

        const v : Vector = isometricProjection(this.pos);

        const dx : number = v.x*12 - 12;
        const dy : number = v.y*12 - 6;

        // Left wall
        const bottomLeft : number = this.neighborhood[7];
        let dif : number = this.pos.y - bottomLeft;
        if (dif > 0) {

            const top : number = dy + 7;
            const bottom : number = bottomLeft < 0 ? canvas.height : dy + 16 + (dif - 1)*12;

            canvas.drawBitmap(bmp, Flip.None, dx, top, 24, 0, 12, 8);
            if (bottomLeft >= 0) {

                canvas.drawBitmap(bmp, Flip.None, dx, bottom, 24, 8, 12, 8);
            }

            const h : number = Math.max(1, bottom - top - 8);
            canvas.setDrawColor(...MASTER_PALETTE[1]);
            canvas.fillRect(dx, top + 8, 12, h);

            // Outline
            canvas.setDrawColor(...MASTER_PALETTE[0]);
            if (this.neighborhood[3] < 0 && this.neighborhood[7] < 0) {

                canvas.fillRect(dx, dy + 6, 1, canvas.height);
            }
            else {

                const outlineHeight : number = Math.max(0, Math.min(this.pos.y - this.neighborhood[3], dif));
                if (outlineHeight > 0) {

                    canvas.fillRect(dx, dy + 6, 1, outlineHeight*12);
                }
            }
        }

        // Right wall
        const bottomRight : number = this.neighborhood[5];
        dif = this.pos.y - bottomRight;
        if (dif > 0) {

            const top : number = dy + 7;
            const bottom : number = bottomRight < 0 ? canvas.height : dy + 16 + (dif - 1)*12;

            canvas.drawBitmap(bmp, Flip.None, dx + 12, top, 36, 0, 12, 8);
            if (bottomRight >= 0) {
                    
                canvas.drawBitmap(bmp, Flip.None, dx + 12, bottom, 36, 8, 12, 8);
            }

            const h : number = Math.max(1, bottom - top - 8);
            canvas.setDrawColor(...MASTER_PALETTE[2]);
            canvas.fillRect(dx + 12, top + 8, 12, h);

            // Outline
            canvas.setDrawColor(...MASTER_PALETTE[0]);
            if (this.neighborhood[1] < 0 && this.neighborhood[5] < 0) {

                canvas.fillRect(dx + 23, dy + 6, 1, canvas.height);
            }
            else {

                const outlineHeight : number = Math.max(0, Math.min(this.pos.y - this.neighborhood[1], dif));
                if (outlineHeight > 0) {

                    canvas.fillRect(dx + 23, dy + 6, 1, outlineHeight*12);
                }
            }
        }

        // Floor
        canvas.drawBitmap(bmp, Flip.None, dx, dy, 0, 0, 24, 12);
    }
}
