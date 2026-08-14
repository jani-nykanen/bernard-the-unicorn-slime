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


    private drawHeightmap(canvas : RenderTarget, bmp : Bitmap) : void {

        const shiftx : number = (this.width/2) | 0;
        const shiftz : number = (this.depth/2) | 0;

        const v : Vector = new Vector();
        for (let z : number = 0; z < this.depth; ++ z) {

            for (let x : number = 0; x < this.width; ++ x) {

                const y : number = this.heightMap[z*this.width + x];
                isometricProjection(x - shiftx, y, z - shiftz, v);

                const dx : number = v.x*12 - 12;
                const dy : number = v.y*12 - 6;

                const sideHeight : number = x < this.width - 1 ? this.heightMap[z*this.width + x + 1] : -1;
                const frontHeight : number = z < this.depth - 1 ? this.heightMap[(z + 1)*this.width + x] : -1;
                // Front wall
                const difz : number = y - frontHeight;
                if (difz > 0) {

                    for (let d = 0; d < difz; ++ d) {

                        canvas.drawBitmap(bmp, Flip.None, dx, dy + 8 + d*12 - 1, 24, 0, 12, 16);
                    }
                }
                // Right wall
                const difx : number = y - sideHeight;
                if (difx > 0) {

                    for (let d = 0; d < difx; ++ d) {

                        canvas.drawBitmap(bmp, Flip.None, dx + 12, dy + 8 + d*12 - 1, 36, 0, 12, 16);
                    }
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

        canvas.moveTo(canvas.width/2, canvas.height/2 + this.height*8);
        this.drawHeightmap(canvas, bmpBase);
        canvas.moveTo();
    }
}