import { Bitmap } from "./bitmap.js";
import { GameObject } from "./gameobject.js";
import { isometricProjection } from "./math.js";
import { ProgramInterface } from "./program.js";
import { Flip, RenderTarget } from "./rendertarget.js";
import { Vector } from "./vector.js";
import { Sprite } from "./sprite.js";
import { Heightmap } from "./heightmap.js";
import { InputFlag, InputState } from "./keyboard.js";
import { ActionIndex } from "./keyconfig.js";
import { Direction } from "./direction.js";


export class Slime implements GameObject {


    private basePos : Vector;
    private targetPos : Vector;
    private renderPos : Vector;

    private sprite : Sprite;
    private faceDir : Direction = Direction.Down;

    private moving : boolean = false;
    private moveTimer : number = 0.0;
    private gravity : number = 0.0;
    private falling : boolean = false;

    private active : boolean;


    public get pos() : Vector {

        if (this.moving) {

            if (this.moveTimer > 0.5) {

                return this.targetPos;
            }
            return this.basePos;
        }
        return this.renderPos;
    }


    constructor(x : number, y : number, z : number, active : boolean) {

        this.basePos = new Vector(x, y, z);
        this.renderPos = this.basePos.clone();
        this.targetPos = this.basePos.clone();

        this.sprite = new Sprite(16, 16, 0, 1);

        this.active = active;
    }


    private initiateMovement(heightMap : Heightmap, prog : ProgramInterface) : void {

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

            const dx : number = (this.basePos.x | 0) + dirx;
            const dz : number = (this.basePos.z | 0) + dirz;
            const dy : number = heightMap.heightAt(dx, dz) + 1;

            if (dy <= 0 || dy > (this.basePos.y | 0)) {

                return;
            }

            this.moving = true;
            this.moveTimer = 0.0;

            this.targetPos.x = dx;
            this.targetPos.z = dz;
            this.targetPos.y = dy;

            this.renderPos.makeEqual(this.basePos);

            this.falling = false;
        }
    }


    private control(heightMap : Heightmap, prog : ProgramInterface) : void {

        if (this.moving) {

            return;
        }
        this.initiateMovement(heightMap, prog);
    }


    private updateMovement(prog : ProgramInterface) : void {

        const MOVE_SPEED : number = 1.0/12.0;
        const MAX_GRAVITY : number = 0.4;
        const GRAVITY_DELTA : number = 0.0075;

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
                return;
            }

            const t : number = this.moveTimer;

            this.renderPos.x = (1.0 - t)*this.basePos.x + t*this.targetPos.x;
            this.renderPos.z = (1.0 - t)*this.basePos.z + t*this.targetPos.z;
            
            return;
        }
        
        this.gravity = Math.min(MAX_GRAVITY, this.gravity + GRAVITY_DELTA*prog.step);
        this.renderPos.y -= this.gravity*prog.step;
        if (this.renderPos.y <= this.targetPos.y) {

            this.renderPos.y = this.targetPos.y;
            this.moving = false;
            this.falling = false;

            this.basePos.makeEqual(this.targetPos);
        }
    }


    private animate(prog : ProgramInterface) : void {

        const FRAME_TIME : number = 15;

        this.sprite.animate(1, 0, 1, FRAME_TIME, prog.step);

        this.sprite.flip = this.faceDir == Direction.Left || this.faceDir == Direction.Down ? Flip.Horizontal : Flip.None;
    }


    private drawFace(canvas : RenderTarget, bmp : Bitmap, dx : number, dy : number) : void {

        const xoff : number = this.sprite.flip == Flip.Horizontal ? 1 : 7;

        canvas.drawBitmap(bmp, this.sprite.flip, dx + xoff, dy - 1 + this.sprite.column, 0, 32, 8, 16);
    }


    public update(heightMap : Heightmap, prog : ProgramInterface) : void {
        
        if (!this.active) {

            this.sprite.setFrame(0, 1);
            return;
        }

        this.control(heightMap, prog);
        this.updateMovement(prog);
        this.animate(prog);
    }


    public draw(canvas : RenderTarget, bmp : Bitmap) : void {
        
        const v : Vector = isometricProjection(this.renderPos);
        
        const dx : number = v.x*12 - 8;
        const dy : number = v.y*12;

        const faceFront : boolean = this.faceDir == Direction.Right || this.faceDir == Direction.Down;

        if (this.active && !faceFront) {

            this.drawFace(canvas, bmp, dx, dy);
        }
        this.sprite.draw(canvas, bmp, dx, dy);
        if (this.active && faceFront) {

            // Face
            this.drawFace(canvas, bmp, dx, dy);
        }
    }
}
