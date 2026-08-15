import { BitmapIndex } from "./assetindex.js";
import { AssetManager } from "./assetmanager.js";
import { Bitmap } from "./bitmap.js";
import { DepthObjectBuffer } from "./depthobjectbuffer.js";
import { isometricProjection } from "./math.js";
import { MASTER_PALETTE } from "./palette.js";
import { ProgramInterface } from "./program.js";
import { Flip, RenderTarget } from "./rendertarget.js";
import { Vector } from "./vector.js";
import { Wall } from "./wall.js";
import { GameObject } from "./gameobject.js";
import { Slime } from "./slime.js";


export class Stage {


    private heightMap : number[];

    private walls : Wall[];
    private objects : GameObject[];
    private depthBuffer : DepthObjectBuffer;

    public readonly width : number;
    public readonly height : number;
    public readonly depth : number;


    constructor(heightData : number[], objectData : number[], width : number, depth : number) {

        this.heightMap = Array.from(heightData);

        this.width = width;
        this.depth = depth;
        this.height = Math.max(...this.heightMap);

        this.depthBuffer = new DepthObjectBuffer();
        this.walls = new Array<Wall> (width*depth);
        this.objects = new Array<GameObject> ();
        this.constructWalls();
        this.createObjects(objectData);
    }


    private computeNeighbors(x : number, z : number) : number[] {

        const out : number[] = (new Array<number> (9)).fill(-1);
        for (let i : number = -1; i <= 1; ++ i) {

            for (let j : number = -1; j <= 1; ++ j) {

                if (Math.abs(i) == Math.abs(j) || 
                    x + i >= this.width || x + i < 0 ||
                    z + j >= this.depth || z + j < 0) {

                    continue;
                }
                out[(j + 1)*3 + (i + 1)] = this.heightMap[(z + j)*this.width + (x + i)]; 
            }
        }
        return out;
    }


    private constructWalls() : void {

        for (let z : number = 0; z < this.depth; ++ z) {

            for (let x : number = 0; x < this.width; ++ x) {

                const y : number = this.heightMap[z*this.width + x];
                const w : Wall = new Wall(x, y, z, this.computeNeighbors(x, z));
                this.walls[z*this.width + x] = w;
                this.depthBuffer.pushObject(w);
            }
        }
    }
    

    private createObjects(objectData : number[]) : void {

        for (let z : number = 0; z < this.depth; ++ z) {

            for (let x : number = 0; x < this.width; ++ x) {

                const index : number = z*this.width + x;
                const y : number = this.heightMap[index];
                const objectID : number = objectData[index];
                switch (objectID) {

                // Slime
                case 1: {
                    const o : Slime = new Slime(x, y, z);
                    this.objects.push(o);
                    this.depthBuffer.pushObject(o);
                    break;
                }

                default:
                    break;
                }
            }
        }
    }


    public update(prog : ProgramInterface) : void {

        // ...
    }


    public draw(canvas : RenderTarget, assets : AssetManager) : void {

        const bmpBase : Bitmap = assets.getBitmap(BitmapIndex.Base)!;

        const left : number = canvas.width/2;
        const top : number = canvas.height/2 + this.height*4;

        canvas.moveTo(left, top);

        this.depthBuffer.sort();
        this.depthBuffer.draw(canvas, bmpBase);

        //this.drawHeightmap(canvas, bmpBase, canvas.height - centery);
        canvas.moveTo();
    }
}