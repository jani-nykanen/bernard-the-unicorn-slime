import { Bitmap } from "./bitmap.js";
import { DepthObject } from "./depthobject.js";
import { isometricProjection } from "./math.js";
import { MASTER_PALETTE } from "./palette.js";
import { Flip, RenderTarget } from "./rendertarget.js";
import { Vector } from "./vector.js";
import { Terrain } from "./terrain.js";


export const enum TileFlags {

    None = 0,
    Floor = 1,
    WallLeft = 1 << 1,
    WallRight = 1 << 2,
}


export class Tile implements DepthObject {


    private flags : TileFlags;
    private neighborhood : number[];

    private readonly terrain : Terrain;

    public readonly pos : Vector = new Vector();

    public get exists() : boolean {

        return true;
    }


    constructor(x : number, y : number, z : number, flags : TileFlags, 
        neighborhood : number[], terrain : Terrain) {

        this.pos.setValues(x, y, z);
        this.flags = flags;
        this.neighborhood = Array.from(neighborhood);

        this.terrain = terrain;
    }


    private drawFloor(canvas : RenderTarget, bmp : Bitmap, dx : number, dy : number) : void {

        canvas.drawBitmap(bmp, Flip.None, dx - 12, dy - 6, 0, 0, 24, 12);
        if (this.terrain.objectAt(this.pos.x | 0, (this.pos.y | 0) + 1, this.pos.z | 0 ) === null) {

            const shadow : Vector | null = this.terrain.shadowAt(this.pos.x, this.pos.z);
            if (shadow !== null) {

                const shadowPos = isometricProjection(shadow);
                canvas.drawBitmap(bmp, Flip.None, shadowPos.x*12 - 8, shadowPos.y*12 - 3, 8, 32, 16, 8);
            }
        }
    }


    private drawWallLeft(canvas : RenderTarget, bmp : Bitmap, dx : number, dy : number) : void {

        canvas.drawBitmap(bmp, Flip.None, dx - 12, dy, 24, 0, 12, 16);
        canvas.drawBitmap(bmp, Flip.None, dx - 12, dy + 2, 24, 0, 12, 16);

        if (this.neighborhood[7] < 0) {

            canvas.setDrawColor(...MASTER_PALETTE[1]);
            canvas.fillRect(dx - 12, dy + 12, 12, canvas.height);
        }

        // Outline
        const dif1 : number = this.pos.y - this.neighborhood[3];
        const dif2 : number = this.pos.y - this.neighborhood[7];
        if (dif1 > 0 && dif2 > 0) {
            
            const h : number = this.neighborhood[3] < 0 && this.neighborhood[7] < 0 ? canvas.height : Math.min(dif1, dif2)*12;
            canvas.setDrawColor(...MASTER_PALETTE[0]);
            canvas.fillRect(dx - 12, dy, 1, h);
        }
    }


    private drawWallRight(canvas : RenderTarget, bmp : Bitmap, dx : number, dy : number) : void {

        canvas.drawBitmap(bmp, Flip.None, dx, dy, 36, 0, 12, 16);
        canvas.drawBitmap(bmp, Flip.None, dx, dy + 2, 36, 0, 12, 16);

        if (this.neighborhood[5] < 0) {

            canvas.setDrawColor(...MASTER_PALETTE[2]);
            canvas.fillRect(dx, dy + 12, 12, canvas.height);
        }

        // Outline
        if (this.pos.y > this.neighborhood[1] && this.pos.y > this.neighborhood[5]) {
                
            const h : number = this.neighborhood[1] < 0 && this.neighborhood[5] < 0 ? canvas.height : 12;
            canvas.setDrawColor(...MASTER_PALETTE[0]);
            canvas.fillRect(dx + 11, dy, 1, h);
        }
    }



    public draw(canvas : RenderTarget, bmp : Bitmap) : void {

        const v : Vector = isometricProjection(this.pos);

        const dx : number = v.x*12;
        const dy : number = v.y*12;

        if ((this.flags & TileFlags.Floor) != 0) {

            this.drawFloor(canvas, bmp, dx, dy);
        }
        if ((this.flags & TileFlags.WallLeft) != 0) {

            this.drawWallLeft(canvas, bmp, dx, dy);
        }
        if ((this.flags & TileFlags.WallRight) != 0) {

            this.drawWallRight(canvas, bmp, dx, dy);
        }
    }
}