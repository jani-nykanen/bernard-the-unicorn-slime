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


export const enum MovingObjectType {

    Unknown = 0,
    Slime = 1,
    DeactivedSlime = 2,
};


export class MovingObject {


    private shadowRef : Vector | null = null;

    private basePos : Vector;
    private targetPos : Vector;
    private renderPos : Vector;

    private sprite : Sprite;
    private faceDir : Direction = Direction.Down;
    private faceOffset : Vector = new Vector();

    private moving : boolean = false;
    private moveTimer : number = 0.0;
    private gravity : number = 0.0;
    private falling : boolean = false;

    private changeAnimationFinished : boolean = true;

    private _type : MovingObjectType;


    public get pos() : Vector {

        if (this.moving && this.moveTimer > 0.5) {

            return this.targetPos;
        }
        return this.basePos;
    }


    public get type() : number {

        return this._type;
    }


    constructor(x : number, y : number, z : number, type : MovingObjectType) {

        this.basePos = new Vector(x, y, z);
        this.renderPos = this.basePos.clone();
        this.targetPos = this.basePos.clone();

        this.sprite = new Sprite(16, 16);

        this._type = type;
    }


    private control(terrain : Terrain, prog : ProgramInterface) : void {

        if (this.moving || this.type != MovingObjectType.Slime) {

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
            this.faceDir = Direction.Right;
        }
        else if ((left.flag & InputFlag.DownOrPressed) != 0 && left.timestamp >= maxTimestamp) {

            dirx = -1;
            this.faceDir = Direction.Left;
        }
        else if ((down.flag & InputFlag.DownOrPressed) != 0 && down.timestamp >= maxTimestamp) {

            dirz = 1;
            this.faceDir = Direction.Down;
        }
        else if ((up.flag & InputFlag.DownOrPressed) != 0 && up.timestamp >= maxTimestamp) {

            dirz = -1;
            this.faceDir = Direction.Up;
        }

        if (dirx != 0 || dirz != 0) {

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

            if (this.targetPos.y < this.basePos.y) {

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
            this.faceDir == Direction.Left || this.faceDir == Direction.Down ? 
                Flip.Horizontal : Flip.None;
    }


    private animate(prog : ProgramInterface) : void {

        const FRAME_TIME : number = 15;

        if (this._type == MovingObjectType.DeactivedSlime) {

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
        if (this._type == MovingObjectType.DeactivedSlime) {

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
        const objectBelow : MovingObject | null = terrain.checkObjectBelow(dx, y, dz);
        if (objectBelow !== null) {

            dy = objectBelow.pos.y + 1;
        }

        this.moving = true;
        this.moveTimer = 0.0;

        this.targetPos.x = dx;
        this.targetPos.y = dy;
        this.targetPos.z = dz;
        
        this.renderPos.makeEqual(this.basePos);

        this.falling = false;

        terrain.markObject(x, y, z, null);
        // terrain.markObject(dx, dy, dz, this);

        return true;
    }


    public update(terrain : Terrain, prog : ProgramInterface) : void {
                
        if (!this.changeAnimationFinished) {

            this.animateStateChanging(prog);
            return;
        }

        this.control(terrain, prog);
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

        const showFace : boolean = this._type == MovingObjectType.Slime;
        const faceFront : boolean = this.faceDir == Direction.Right || this.faceDir == Direction.Down;
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


    public changeType(type : MovingObjectType, force : boolean = false) : void {

        this._type = type;
        if (force) {

            this.changeAnimationFinished = true;
            return;
        }

        switch (type) {

        case MovingObjectType.Slime:
        case MovingObjectType.DeactivedSlime:

            this.sprite.setFrame(type == MovingObjectType.Slime ? 3 : 0, 1);
            this.changeAnimationFinished = false;
            break;

        default:
            break;
        }
        
    }
}
