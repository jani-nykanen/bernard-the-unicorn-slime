import { BitmapIndex } from "./assetindex.js";
import { AssetManager } from "./assetmanager.js";
import { Bitmap } from "./bitmap.js";
import { isometricProjection } from "./math.js";
import { MASTER_PALETTE } from "./palette.js";
import { ProgramInterface } from "./program.js";
import { Flip, RenderTarget } from "./rendertarget.js";
import { Vector } from "./vector.js";


export class Stage {


    private heightMap : number[];

    public readonly width : number;
    public readonly height : number;
    public readonly depth : number;


    constructor(data : number[], width : number, depth : number) {

        this.heightMap = data.map((v : number) : number => (v & 0b1111));

        this.width = width;
        this.depth = depth;
        this.height = Math.max(...this.heightMap);
    }


    private drawHeightmap(canvas : RenderTarget, bmp : Bitmap, screenBottom : number) : void {

        const shiftx : number = (this.width/2) | 0;
        const shiftz : number = (this.depth/2) | 0;

        const v : Vector = new Vector();
        for (let z : number = 0; z < this.depth; ++ z) {

            for (let x : number = 0; x < this.width; ++ x) {

                const y : number = this.heightMap[z*this.width + x];
                isometricProjection(x - shiftx, y, z - shiftz, v);

                const dx : number = v.x*12 - 12;
                const dy : number = v.y*12 - 6;

                const bottomRight : number = x < this.width - 1 ? this.heightMap[z*this.width + x + 1] : -1;
                const bottomLeft : number = z < this.depth - 1 ? this.heightMap[(z + 1)*this.width + x] : -1;
                const topLeft : number = x > 0 ? this.heightMap[z*this.width + x - 1] : -1;
                const topRight : number = z > 0 ? this.heightMap[(z - 1)*this.width + x] : -1;

                // Bottom left wall
                const difz : number = y - bottomLeft;
                if (difz > 0) {

                    const top : number = dy + 7;
                    const bottom : number = bottomLeft < 0 ? screenBottom :  dy + 16 + (difz - 1)*12;

                    canvas.drawBitmap(bmp, Flip.None, dx, top, 24, 0, 12, 8);
                    if (bottomLeft >= 0) {

                        canvas.drawBitmap(bmp, Flip.None, dx, bottom, 24, 8, 12, 8);
                    }

                    const h : number = Math.max(1, bottom - top - 8);
                    canvas.setDrawColor(...MASTER_PALETTE[1]);
                    canvas.fillRect(dx, top + 8, 12, h);
                }
                // Top left shade
                if (y - topLeft > 0) {

                    const h : number = topLeft < 0 ? screenBottom - dy : (y - topLeft)*12;
                    canvas.setDrawColor(...MASTER_PALETTE[0]);
                    canvas.fillRect(dx, dy + 6, 1, h);
                }
                // Right wall
                const difx : number = y - bottomRight;
                if (difx > 0) {

                    const top : number = dy + 7;
                    const bottom : number = bottomRight < 0 ? screenBottom : dy + 16 + (difx - 1)*12;

                    canvas.drawBitmap(bmp, Flip.None, dx + 12, top, 36, 0, 12, 8);
                    if (bottomRight >= 0) {
                    
                        canvas.drawBitmap(bmp, Flip.None, dx + 12, bottom, 36, 8, 12, 8);
                    }

                    const h : number = Math.max(1, bottom - top - 8);
                    canvas.setDrawColor(...MASTER_PALETTE[2]);
                    canvas.fillRect(dx + 12, top + 8, 12, h);
                }
                // Top right shade
                if (y - topRight > 0) {

                    const h : number = topRight < 0 ? screenBottom - dy : (y - topRight)*12;
                    canvas.setDrawColor(...MASTER_PALETTE[0]);
                    canvas.fillRect(dx + 23, dy + 6, 1, h);
                }
                // Floor
                canvas.drawBitmap(bmp, Flip.None, dx, dy, 0, 0, 24, 12);
            }
        }
    }


    public update(prog : ProgramInterface) : void {

        // ...
    }


    public draw(canvas : RenderTarget, assets : AssetManager) : void {

        const bmpBase : Bitmap = assets.getBitmap(BitmapIndex.Base)!;

        const centery : number = canvas.height/2 + this.height*8;

        canvas.moveTo(canvas.width/2, centery);
        this.drawHeightmap(canvas, bmpBase, canvas.height - centery);
        canvas.moveTo();
    }
}