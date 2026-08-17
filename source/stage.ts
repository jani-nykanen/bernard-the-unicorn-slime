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
import { GameObject, GameObjectType } from "./gameobject.js";
import { Terrain } from "./terrain.js";
import { ActionIndex } from "./keyconfig.js";
import { InputFlag } from "./keyboard.js";


export class Stage {


    private terrain : Terrain;

    private walls : Wall[];
    private objects : GameObject[];
    private activeSlimeIndex : number = -1;
    private depthBuffer : DepthObjectBuffer;

    public readonly width : number;
    public readonly height : number;
    public readonly depth : number;


    constructor(heightData : number[], objectData : number[], width : number, depth : number) {

        this.terrain = new Terrain(heightData, width, depth);

        this.width = width;
        this.depth = depth;
        this.height = this.terrain.maxHeight;

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
                out[(j + 1)*3 + (i + 1)] = this.terrain.heightAt(x + i, z + j);
            }
        }
        return out;
    }


    private constructWalls() : void {

        for (let z : number = 0; z < this.depth; ++ z) {

            for (let x : number = 0; x < this.width; ++ x) {

                const y : number = this.terrain.heightAt(x, z);
                const w : Wall = new Wall(x, y, z, this.computeNeighbors(x, z), this.terrain);
                this.walls[z*this.width + x] = w;
                this.depthBuffer.pushObject(w);
            }
        }
    }
    

    private createObjects(objectData : number[]) : void {

        const MOVING_OBJECT_FIRST : number = 1;
        const MOVING_OBJECT_LAST : number = 8;

        for (let z : number = 0; z < this.depth; ++ z) {

            for (let x : number = 0; x < this.width; ++ x) {

                const y : number = this.terrain.heightAt(x, z) + 1;
                const objectID : number = objectData[z*this.width + x];
                if (objectID < 1) {

                    continue;
                }

                // Moving objects
                if (objectID >= MOVING_OBJECT_FIRST && objectID <= MOVING_OBJECT_LAST) {
                
                    const o : GameObject = new GameObject(x, y, z, objectID);

                    this.objects.push(o);
                    this.depthBuffer.pushObject(o);
                    this.terrain.markObject(x, y, z, o);

                    if (objectID == 1) {

                        this.activeSlimeIndex = this.objects.length - 1;
                    }
                }
            }
        }
    }


    private changeActiveSlime() : void {

        let i : number = this.activeSlimeIndex;
        do {

            i = (i + 1) % this.objects.length;

            const o : GameObject = this.objects[i];
            if (o.type == GameObjectType.DeactivedSlime) {

                this.objects[this.activeSlimeIndex].changeType(GameObjectType.DeactivedSlime);
                o.changeType(GameObjectType.Slime);
                this.activeSlimeIndex = i;
                return;
            }
        }
        while (i != this.activeSlimeIndex);
    }


    public update(prog : ProgramInterface) : void {

        this.terrain.flush();

        let anythingMoving : boolean = false;
        for (const o of this.objects) {

            o.update(this.terrain, prog);
            anythingMoving ||= o.isMoving();
        }

        if (!anythingMoving && 
            prog.keyboard.getActionState(ActionIndex.ChangeActive).flag == InputFlag.Pressed) {

            this.changeActiveSlime();
        }
    }


    public draw(canvas : RenderTarget, assets : AssetManager) : void {

        const bmpBase : Bitmap = assets.getBitmap(BitmapIndex.Base)!;

        const left : number = canvas.width/2;
        const top : number = canvas.height/2 + this.height*4;

        canvas.moveTo(left, top);

        this.depthBuffer.sort();
        this.depthBuffer.draw(canvas, bmpBase);

        //this.drawTerrain(canvas, bmpBase, canvas.height - centery);
        canvas.moveTo();
    }
}