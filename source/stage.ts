import { BitmapIndex, SoundIndex } from "./assetindex.js";
import { AssetManager } from "./assetmanager.js";
import { Bitmap } from "./bitmap.js";
import { DepthObjectBuffer } from "./depthobjectbuffer.js";
import { ProgramInterface } from "./program.js";
import { RenderTarget } from "./rendertarget.js";
import { Vector } from "./vector.js";
import { GameObject, GameObjectType } from "./gameobject.js";
import { Terrain } from "./terrain.js";
import { ActionIndex } from "./keyconfig.js";
import { InputFlag } from "./keyboard.js";
import { ObjectInfo, PuzzleState, StateBuffer } from "./statebuffer.js";
import { Particle } from "./particle.js";


export class Stage {


    private terrain : Terrain;

    private objects : GameObject[];
    private depthBuffer : DepthObjectBuffer;
    private stateBuffer : StateBuffer;
    private activeState : PuzzleState;
    private initialState : PuzzleState;
    private info : ObjectInfo = new ObjectInfo();
    private particles : Particle[] = [];

    private anythingMoving : boolean = false;
    private _cleared : boolean = false;

    public readonly width : number;
    public readonly height : number;
    public readonly depth : number;


    public get cleared() : boolean {

        return this._cleared;
    }


    constructor(levelData : string) {

        const MAX_STATE_COUNT : number = 32;
        const STATE_BUFFER_MAX_OBJECT_COUNT : number = 32;

        this.width = parseInt(levelData[0], 32);
        this.depth = parseInt(levelData[1], 32);
        
        const len : number = this.width*this.depth;
        const heightData : number[] = levelData.substring(2, 2 + len).split("").map((c : string) => parseInt(c, 32));
        const objectData : number[] = levelData.substring(2 + len).split("").map((c : string) => parseInt(c, 32));

        this.depthBuffer = new DepthObjectBuffer();
        this.terrain = new Terrain(heightData, this.width, this.depth, this.depthBuffer);
        this.height = this.terrain.maxHeight;

        this.stateBuffer = new StateBuffer(MAX_STATE_COUNT, STATE_BUFFER_MAX_OBJECT_COUNT);
        this.activeState = new PuzzleState(STATE_BUFFER_MAX_OBJECT_COUNT);
        this.objects = new Array<GameObject> ();

        // this.constructWalls();
        this.createObjects(objectData);
        this.refreshState();
        this.stateBuffer.pushState(this.activeState);

        this.initialState = new PuzzleState(STATE_BUFFER_MAX_OBJECT_COUNT);
        this.initialState.makeEqual(this.activeState);
    }


    private refreshState() : void {

        this.activeState.flush();
        for (const o of this.objects) {

            // NOTE: Nonexistent objects are also pushed to the buffer,
            // because... well, I tried to change this but things went
            // wrong.
            // TODO: Perhaps worth fixing, then?

            this.info.pos.makeEqual(o.logicalPos);
            this.info.type = o.type;
            this.info.active = o.exists;
            this.info.faceDir = o.faceDir;

            this.activeState.pushObject(this.info);
        }
    }


    private recoverState() : void {

        for (const o of this.objects) {

            o.kill(true);
        }

        let i : number = 0;
        this.activeState.iterateObjects((o : ObjectInfo) : void => {

            this.objects[i].respawn(o.pos, o.type, o.faceDir);
            ++ i;
        });

        this.terrain.flush(true);
        for (const o of this.objects) {

            const p : Vector = o.logicalPos;
            this.terrain.markObject(p.x, p.y, p.z, o);
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
                
                    const o : GameObject = new GameObject(x, y, z, objectID, this.particles);
                    this.objects.push(o);
                    this.depthBuffer.pushObject(o);
                    this.terrain.markObject(x, y, z, o);
                }
            }
        }
    }


    private resolveConflicts() : void {

        let conflicts : boolean = false;
        do {

            conflicts = false;
            for (let i : number = 0; i < this.objects.length; ++ i) {

                const o : GameObject = this.objects[i];
                if (!o.exists || !o.isMoving()) {

                    continue;
                }

                for (let j : number = i + 1; j < this.objects.length; ++ j) {
                    
                    if (this.objects[i].resolveConflicts(this.objects[j])) {

                        conflicts = true;
                    }
                }
            }
        }
        while (conflicts);
    }


    private postprocessObjects(prog : ProgramInterface) : void {

        for (let i : number = 0; i < this.objects.length; ++ i) {

            const o : GameObject = this.objects[i];
            if (!o.exists) {

                continue;
            }

            for (let j : number = i + 1; j < this.objects.length; ++ j) {
                
                const o2 : GameObject = this.objects[j];
                o.objectCollision(o2, this.terrain, prog);
                o2.objectCollision(o, this.terrain, prog);
            }
        }
    } 


    private initiateObjectMovement(prog : ProgramInterface) : void {

        let somethingNewMoved : boolean = false;
        let somethingMoved : boolean = true;
        do {

            somethingNewMoved = false;
            for (let i : number = 0; i < this.objects.length; ++ i) {

                const o : GameObject = this.objects[i];
                if (!o.exists) {

                    continue;
                }

                // Check movement
                if (o.control(this.terrain, prog)) {

                    somethingMoved = true;
                    somethingNewMoved = true;
                }
            }
        }
        while (somethingNewMoved);

        if (somethingMoved) {

            this.resolveConflicts();
        }
    }


    private updateObjects(prog : ProgramInterface) : void {

        this._cleared = true;
        if (!this.anythingMoving) {

            this.initiateObjectMovement(prog);
        }
        
        const wasAnythingMoving : boolean = this.anythingMoving;
        this.anythingMoving = false;
        this._cleared = true;
        for (const o of this.objects) {

            if (!o.exists) {

                continue;
            }

            o.update(wasAnythingMoving, this.terrain, prog);
            this.anythingMoving ||= o.isMoving();

            if (this._cleared && o.type == GameObjectType.Gem) {

                this._cleared = false;
            }
        }

        if (!this.anythingMoving && wasAnythingMoving) {

            this.postprocessObjects(prog);
            this.stateBuffer.pushState(this.activeState);
            this.refreshState();
        }
    }


    private checkKeyboardActions(prog : ProgramInterface) {

        if (this.anythingMoving) {

            return;
        }

        if (prog.keyboard.getActionState(ActionIndex.Undo).flag == InputFlag.Pressed) {

            prog.audio.playSound(prog.assets.getSound(SoundIndex.Undo), 0.80);
            this.undo();
        }
        else if (prog.keyboard.getActionState(ActionIndex.Reset).flag == InputFlag.Pressed) {

            prog.audio.playSound(prog.assets.getSound(SoundIndex.Restart), 0.80);
            this.reset();
        }
    }


    public update(prog : ProgramInterface) : void {

        if (!this._cleared) {

            this.terrain.flush();
            this.updateObjects(prog);
            if (!this.anythingMoving) {
                
                this.checkKeyboardActions(prog);
            }
        }

        for (const p of this.particles) {

            p.update(prog);
        }
    }


    public draw(canvas : RenderTarget, assets : AssetManager) : void {

        const bmpBase : Bitmap = assets.getBitmap(BitmapIndex.Base)!;

        const left : number = canvas.width/2;
        const top : number = canvas.height/2 + this.height*4;

        canvas.move(left, top);

        this.depthBuffer.sort();
        this.depthBuffer.draw(canvas, bmpBase);

        for (const p of this.particles) {

            p.draw(canvas, bmpBase);
        }

        canvas.move(-left, -top);
    }


    public undo() : void {

        if (this.stateBuffer.undo(this.activeState)) {
                
            this.recoverState();
        }
    }


    public reset() : void {

        this.stateBuffer.pushState(this.activeState);
        this.activeState.makeEqual(this.initialState);
        this.recoverState();
    }
}