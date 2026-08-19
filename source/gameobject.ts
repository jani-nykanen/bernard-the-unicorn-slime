import { Bitmap } from "./bitmap.js";
import { isometricProjection, isometricProjectionFromComponents } from "./math.js";
import { ProgramInterface } from "./program.js";
import { Flip, RenderTarget } from "./rendertarget.js";
import { Vector } from "./vector.js";
import { Sprite } from "./sprite.js";
import { Terrain } from "./terrain.js";
import { InputFlag, InputState } from "./keyboard.js";
import { ActionIndex } from "./keyconfig.js";
import { Direction } from "./direction.js";


export const enum GameObjectType {

    Unknown = 0,
    Slime = 1,
    DeactivedSlime = 2,
};


export class GameObject {


    private shadowRef : Vector | null = null;

    private basePos : Vector;
    private targetPos : Vector;
    private renderPos : Vector;

    private sprite : Sprite;
    private _faceDir : Direction = Direction.Down;
    private faceOffset : Vector = new Vector();

    private moving : boolean = false;
    private moveTimer : number = 0.0;
    private gravity : number = 0.0;
    private falling : boolean = false;
    private jumping : boolean = false;

    private changeAnimationFinished : boolean = true;

    private _type : GameObjectType;
    private _exists : boolean = true;


    public get pos() : Vector {

        if (this.moving && this.moveTimer > 0.5) {

            return this.targetPos;
        }
        return this.basePos;
    }


    public get faceDir() : Direction {

        return this._faceDir;
    }


    public get type() : number {

        return this._type;
    }


    public get exists() : boolean {

        return this._exists;
    }
    


    constructor(x : number, y : number, z : number, type : GameObjectType) {

        this.basePos = new Vector(x, y, z);
        this.renderPos = this.basePos.clone();
        this.targetPos = this.basePos.clone();

        this.sprite = new Sprite(16, 16);

        this._type = type;
    }


    private move(terrain : Terrain, dirx : number, dirz : number) : boolean {

        const x : number = (this.basePos.x) | 0;
        const y : number = (this.basePos.y) | 0;
        const z : number = (this.basePos.z) | 0;

        const dx : number = x + dirx;
        const dz : number = z + dirz;

        let height : number = terrain.heightAt(dx, dz) + 1;
        if (height <= 0 || height > (this.basePos.y | 0) ||
            terrain.objectAt(dx, y, dz) !== null) {

            return false;
        }

        let dy : number = height;
        const objectBelow : GameObject | null = terrain.checkObjectBelow(dx, y, dz);
        if (objectBelow !== null) {

            dy = objectBelow.pos.y + 1;
        }

        this.moving = true;
        this.moveTimer = 0.0;
        this.jumping = this.type == GameObjectType.Slime && 
            (objectBelow !== null || dy < y);

        this.targetPos.x = dx;
        this.targetPos.y = dy;
        this.targetPos.z = dz;
        
        this.renderPos.makeEqual(this.basePos);

        this.falling = false;

        terrain.markObject(x, y, z, null);
        // terrain.markObject(dx, dy, dz, this);

        return true;
    }


    private checkFalling(terrain : Terrain, prog : ProgramInterface) : boolean {

        const x : number = (this.basePos.x) | 0;
        const y : number = (this.basePos.y) | 0;
        const z : number = (this.basePos.z) | 0;

        const floorPos : number = terrain.firstSolidTileHeightBelow(x, y, z) + 1;
        if (floorPos < y) {

            this.falling = true;
            this.moving = true;
            this.gravity = 0.0;

            this.targetPos.y = floorPos;
            terrain.markObject(x, y, z, null);
            return true;
        }
        return false;
    }


    private control(terrain : Terrain, prog : ProgramInterface) : void {

        if (this.moving) {

            return;
        }

        if (this.checkFalling(terrain, prog)) {

            return;
        }

        const right : InputState = prog.keyboard.getActionState(ActionIndex.Right);
        const up : InputState = prog.keyboard.getActionState(ActionIndex.Up);
        const left : InputState = prog.keyboard.getActionState(ActionIndex.Left);
        const down : InputState = prog.keyboard.getActionState(ActionIndex.Down);

        const maxTimestamp : number = Math.max(right.timestamp, up.timestamp, left.timestamp, down.timestamp);

        let dirx : number = 0;
        let dirz : number = 0;

        if ((right.flag & InputFlag.DownOrPressed) != 0 && right.timestamp >= maxTimestamp) {

            dirx = 1;
            this._faceDir = Direction.Right;
        }
        else if ((left.flag & InputFlag.DownOrPressed) != 0 && left.timestamp >= maxTimestamp) {

            dirx = -1;
            this._faceDir = Direction.Left;
        }
        else if ((down.flag & InputFlag.DownOrPressed) != 0 && down.timestamp >= maxTimestamp) {

            dirz = 1;
            this._faceDir = Direction.Down;
        }
        else if ((up.flag & InputFlag.DownOrPressed) != 0 && up.timestamp >= maxTimestamp) {

            dirz = -1;
            this._faceDir = Direction.Up;
        }

        if (dirx != 0 || dirz != 0) {

            if (this.type == GameObjectType.DeactivedSlime) {

                if (!terrain.activeSlimeNearby(
                    this.basePos.x - dirx, this.basePos.y, this.basePos.z - dirz, 
                    terrain.heightAt(this.basePos.x, this.basePos.z))) {

                    return;
                }
            }

            this.move(terrain, dirx, dirz);
        }
    }


    private terminateMovement(terrain : Terrain) : void {

        this.renderPos.y = this.targetPos.y;
        this.moving = false;
        this.falling = false;

        this.basePos.makeEqual(this.targetPos);

        terrain.markObject(this.basePos.x | 0, this.basePos.y | 0, this.basePos.z | 0, this);
    }


    private updateMovement(terrain : Terrain, prog : ProgramInterface) : void {

        const MOVE_SPEED : number = 1.0/12.0;
        const INITIAL_GRAVITY : number = 0.1;
        const MAX_GRAVITY : number = 0.4;
        const GRAVITY_DELTA : number = 0.0075;
        const JUMP_HEIGHT : number = 0.5;

        if (!this.moving) {

            this.renderPos.makeEqual(this.pos);
            return;
        }

        if (!this.falling) {

            this.moveTimer += MOVE_SPEED*prog.step;
            if (this.moveTimer >= 1.0) {

                this.falling = true;
                this.renderPos.x = this.targetPos.x;
                this.renderPos.z = this.targetPos.z;
                this.gravity = INITIAL_GRAVITY;

                if ((this.targetPos.y | 0) == (this.basePos.y | 0)) {

                    this.terminateMovement(terrain);
                }
                return;
            }

            const t : number = this.moveTimer;

            this.renderPos.x = (1.0 - t)*this.basePos.x + t*this.targetPos.x;
            this.renderPos.z = (1.0 - t)*this.basePos.z + t*this.targetPos.z;

            if (this.jumping) {

                this.renderPos.y = this.basePos.y + Math.sin(t*Math.PI)*JUMP_HEIGHT;
            }
            
            return;
        }
        
        this.gravity = Math.min(MAX_GRAVITY, this.gravity + GRAVITY_DELTA*prog.step);
        this.renderPos.y -= this.gravity*prog.step;
        if (this.renderPos.y <= this.targetPos.y) {

            this.terminateMovement(terrain);
        }
    }


    private markShadows(terrain : Terrain) : void {

        if (!this.moving) {

            return;
        }
            
        if (this.moveTimer < 0.5) {
            
            terrain.markShadow(this.basePos.x, this.basePos.z, this.renderPos);
            return;
        }
        terrain.markShadow(this.targetPos.x, this.targetPos.z, this.renderPos);
    }


    private checkOverlayingShadow(terrain : Terrain) : void {

        const x : number = this.basePos.x | 0;
        const y : number = this.basePos.y | 0;
        const z : number = this.basePos.z | 0;
        if (this.moving || terrain.heightAt(x, z) + 1 != y ||
            terrain.objectAt(x, y + 1, z) !== null) {

            return;
        }
        this.shadowRef = terrain.shadowAt(x, z);
    }


    private computeFaceProperties() : void {

        this.faceOffset.x = this.sprite.flip == Flip.Horizontal ? 1 : 7;
        this.faceOffset.y = this.sprite.column == 2 ? -3 : this.sprite.column - 1;
    }


    private determineFlip() : void {

        this.sprite.flip = 
            this._faceDir == Direction.Left || this._faceDir == Direction.Down ? 
                Flip.Horizontal : Flip.None;
    }


    private animate(prog : ProgramInterface) : void {

        const FRAME_TIME : number = 15;

        if (this._type == GameObjectType.DeactivedSlime) {

            this.sprite.setFrame(3, 1);
            this.sprite.flip = Flip.None;
            return;
        }

        this.determineFlip();
        if (this.targetPos.y < this.basePos.y) {

            this.sprite.setFrame(this.falling ? 0 : 2, 1);
            return;
        }
        this.sprite.animate(1, 0, 1, FRAME_TIME, prog.step);
    }


    private animateStateChanging(prog : ProgramInterface) : void {

        const FRAME_TIME : number = 6.0;

        this.determineFlip();
        if (this._type == GameObjectType.DeactivedSlime) {

            this.sprite.animate(1, 0, 3, FRAME_TIME, prog.step, false);
            if (this.sprite.column == 3) {

                this.changeAnimationFinished = true;
                this.computeFaceProperties();
            }
            return;
        }

        this.sprite.animate(1, 3, 0, FRAME_TIME, prog.step, false);
        if (this.sprite.column == 0) {

            this.changeAnimationFinished = true;
            this.computeFaceProperties();
        }
    }


    private drawShadow(canvas : RenderTarget, bmp : Bitmap) : void {

        if (this.shadowRef === null) {

            return;
        }

        const v : Vector = isometricProjectionFromComponents(this.shadowRef.x, this.shadowRef.y + 1, this.shadowRef.z);
        const dx : number = v.x*12 - 8;
        const dy : number = v.y*12 - 3;

        canvas.drawBitmap(bmp, Flip.None, dx, dy, 8, 32, 16, 8);
    }


    private drawFace(canvas : RenderTarget, bmp : Bitmap, dx : number, dy : number) : void {

        if (!this.changeAnimationFinished) {

            return;
        }

        canvas.drawBitmap(bmp, this.sprite.flip,
             dx + this.faceOffset.x, 
             dy + this.faceOffset.y, 0, 32, 8, 16);
    }


    public update(terrain : Terrain, canMove : boolean, prog : ProgramInterface) : void {
                
        if (!this.changeAnimationFinished) {

            this.animateStateChanging(prog);
            return;
        }

        if (canMove) {
        
            this.control(terrain, prog);
        }
        this.animate(prog);
        this.computeFaceProperties();

        this.updateMovement(terrain, prog);
        this.markShadows(terrain);
        this.checkOverlayingShadow(terrain);
    }


    public draw(canvas : RenderTarget, bmp : Bitmap) : void {
        
        const v : Vector = isometricProjection(this.renderPos);
        const dx : number = v.x*12 - 8;
        const dy : number = v.y*12 - 1;

        const showFace : boolean = this._type == GameObjectType.Slime;
        const faceFront : boolean = this._faceDir == Direction.Right || this._faceDir == Direction.Down;
        if (showFace && !faceFront) {

            this.drawFace(canvas, bmp, dx, dy);
        }
        this.sprite.draw(canvas, bmp, dx, dy);
        if (showFace && faceFront) {

            // Face
            this.drawFace(canvas, bmp, dx, dy);
        }
        this.drawShadow(canvas, bmp);
    }


    public isMoving() : boolean {

        return this.moving;
    }


    public changeType(type : GameObjectType, force : boolean = false) : void {

        this._type = type;
        if (force) {

            this.changeAnimationFinished = true;
            return;
        }

        switch (type) {

        case GameObjectType.Slime:
        case GameObjectType.DeactivedSlime:

            this.sprite.setFrame(type == GameObjectType.Slime ? 3 : 0, 1);
            this.changeAnimationFinished = false;
            break;

        default:
            break;
        }
    }


    public checkConflicts(o : GameObject) : boolean {

        if (!this.moving || !o.moving || !this.exists || !o.exists) {

            return false;
        }

        if (this.targetPos.equals(o.targetPos)) {

            ++ this.targetPos.y;
            return true;
        }
        return false;
    }


    public respawn(pos : Vector, type : GameObjectType, faceDir : Direction) : void {

        this.basePos.makeEqual(pos);
        this.targetPos.makeEqual(this.basePos);
        this.renderPos.makeEqual(this.basePos);

        this._faceDir = faceDir;
        // TODO: Reset sprite

        this._type = type;

        this.moving = false;
        this.falling = false;
        this.moveTimer = 0.0;
        this.changeAnimationFinished = true;
        this._exists = true;
    }


    public forceKill() : void {

        this._exists = false;
    }
}
