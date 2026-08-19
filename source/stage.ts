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
import { ObjectInfo, PuzzleState, StateBuffer } from "./statebuffer.js";


export class Stage {


    private terrain : Terrain;

    private walls : Wall[];
    private objects : GameObject[];
    private activeSlimeIndex : number = -1;
    private depthBuffer : DepthObjectBuffer;
    private stateBuffer : StateBuffer;
    private activeState : PuzzleState;
    private initialState : PuzzleState;
    private info : ObjectInfo = new ObjectInfo();

    private wasAnythingMoving : boolean = false;

    public readonly width : number;
    public readonly height : number;
    public readonly depth : number;


    constructor(heightData : number[], objectData : number[], width : number, depth : number) {

        const MAX_STATE_COUNT : number = 32;
        const STATE_BUFFER_MAX_OBJECT_COUNT : number = 32;

        this.terrain = new Terrain(heightData, width, depth);

        this.width = width;
        this.depth = depth;
        this.height = this.terrain.maxHeight;

        this.depthBuffer = new DepthObjectBuffer();
        this.stateBuffer = new StateBuffer(MAX_STATE_COUNT, STATE_BUFFER_MAX_OBJECT_COUNT);
        this.activeState = new PuzzleState(STATE_BUFFER_MAX_OBJECT_COUNT);

        this.walls = new Array<Wall> (width*depth);
        this.objects = new Array<GameObject> ();

        this.constructWalls();
        this.createObjects(objectData);
        this.refreshState();
        this.stateBuffer.pushState(this.activeState);

        this.initialState = new PuzzleState(STATE_BUFFER_MAX_OBJECT_COUNT);
        this.initialState.makeEqual(this.activeState);
    }


    private refreshState() : void {

        this.activeState.flush();
        for (const o of this.objects) {

            this.info.pos.makeEqual(o.pos);
            this.info.type = o.type;
            this.info.active = o.exists;
            this.info.faceDir = o.faceDir;

            this.activeState.pushObject(this.info);
        }
    }


    private recoverState() : void {

        for (const o of this.objects) {

            o.forceKill();
        }

        let i : number = 0;
        this.activeState.iterateObjects((o : ObjectInfo) : void => {

            this.objects[i].respawn(o.pos, o.type, o.faceDir);
            if (o.type == GameObjectType.Slime) {

                this.activeSlimeIndex = i;
            }
            ++ i;
        });

        this.terrain.flush(true);
        for (const o of this.objects) {

            const p : Vector = o.pos;
            this.terrain.markObject(p.x, p.y, p.z, o);
        }
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

                this.stateBuffer.pushState(this.activeState);
                this.refreshState();
                return;
            }
        }
        while (i != this.activeSlimeIndex);
    }


    private updateObjects(prog : ProgramInterface) : void {

        let anythingMoving : boolean = false;
        let somethingNewMoved : boolean = false;
        const canMove : boolean = !this.wasAnythingMoving;
        do {

            somethingNewMoved = false;
            for (const o of this.objects) {

                const wasMoving : boolean = o.isMoving();
                o.update(this.terrain, canMove, prog);
                if (!wasMoving && o.isMoving()) {

                    somethingNewMoved = true;
                }
                anythingMoving ||= o.isMoving();
            }
        }
        while (somethingNewMoved);

        // Resolve conflicts (a hacky workaround)
        let conflicts : boolean = false;
        do {

            conflicts = false;
            for (let i : number = 0; i < this.objects.length; ++ i) {

                for (let j : number = i + 1; j < this.objects.length; ++ j) {

                    if (this.objects[i].checkConflicts(this.objects[j])) {

                        conflicts = true;
                    }
                }
            }
        }
        while (conflicts);
        
        if (!anythingMoving && this.wasAnythingMoving) {

            this.stateBuffer.pushState(this.activeState);
            this.refreshState();
        }
        this.wasAnythingMoving = anythingMoving;
    }


    private checkKeyboardActions(prog : ProgramInterface) {

        if (this.wasAnythingMoving) {

            return;
        }

        if (prog.keyboard.getActionState(ActionIndex.ChangeActive).flag == InputFlag.Pressed) {

            this.changeActiveSlime();
        }
        else if (prog.keyboard.getActionState(ActionIndex.Undo).flag == InputFlag.Pressed) {

            if (this.stateBuffer.undo(this.activeState)) {
                
                this.recoverState();
            }
        }
        else if (prog.keyboard.getActionState(ActionIndex.Reset).flag == InputFlag.Pressed) {

            this.stateBuffer.pushState(this.activeState);
            this.activeState.makeEqual(this.initialState);
            this.recoverState();
        }
    }


    public update(prog : ProgramInterface) : void {

        this.terrain.flush();
        this.updateObjects(prog);
        if (!this.wasAnythingMoving) {
            
            this.checkKeyboardActions(prog);
        }
    }


    public draw(canvas : RenderTarget, assets : AssetManager) : void {

        const bmpBase : Bitmap = assets.getBitmap(BitmapIndex.Base)!;

        const left : number = canvas.width/2;
        const top : number = canvas.height/2 + this.height*4;

        canvas.moveTo(left, top);

        this.depthBuffer.sort();
        this.depthBuffer.draw(canvas, bmpBase);

        canvas.moveTo();
    }
}