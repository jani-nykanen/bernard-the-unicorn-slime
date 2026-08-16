import { Bitmap } from "./bitmap.js";
import { isometricProjection } from "./math.js";
import { ProgramInterface } from "./program.js";
import { Flip, RenderTarget } from "./rendertarget.js";
import { Vector } from "./vector.js";
import { Sprite } from "./sprite.js";
import { Terrain } from "./terrain.js";
import { InputFlag, InputState } from "./keyboard.js";
import { ActionIndex } from "./keyconfig.js";
import { Direction } from "./direction.js";


export class GameObject {


    protected basePos : Vector;
    protected targetPos : Vector;
    protected renderPos : Vector;

    protected sprite : Sprite;
    protected faceDir : Direction = Direction.Down;

    protected moving : boolean = false;
    protected moveTimer : number = 0.0;
    protected gravity : number = 0.0;
    protected falling : boolean = false;


    public get pos() : Vector {

        if (this.moving && this.moveTimer > 0.5) {

            return this.targetPos;
        }
        return this.basePos;
    }


    constructor(x : number, y : number, z : number) {

        this.basePos = new Vector(x, y, z);
        this.renderPos = this.basePos.clone();
        this.targetPos = this.basePos.clone();

        this.sprite = new Sprite(16, 16);
    }


    private updateMovement(prog : ProgramInterface) : void {

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

            this.renderPos.y = this.targetPos.y;
            this.moving = false;
            this.falling = false;

            this.basePos.makeEqual(this.targetPos);
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


    protected updateLogic?(terrain : Terrain, prog : ProgramInterface) : void;
    protected customDraw?(canvas : RenderTarget, bmp : Bitmap, dx : number, dy : number) : void;


    protected move(terrain : Terrain, dirx : number, dirz : number) : boolean {

        const dx : number = (this.basePos.x | 0) + dirx;
        const dz : number = (this.basePos.z | 0) + dirz;

        const y : number = (this.basePos.y) | 0;
        let height : number = terrain.heightAt(dx, dz) + 1;
        if (height <= 0 || height > (this.basePos.y | 0) ||
            terrain.objectAt(dx, y, dz) !== null) {

            return false;
        }

        let dy : number = height;
        const objectBelow : GameObject | null = terrain.checkObjectBelow(dx, y, dz);
        if (objectBelow !== null) {

            console.log(objectBelow);
            dy = objectBelow.pos.y + 1;
        }

        this.moving = true;
        this.moveTimer = 0.0;

        this.targetPos.x = dx;
        this.targetPos.y = dy;
        this.targetPos.z = dz;
        
        this.renderPos.makeEqual(this.basePos);

        this.falling = false;

        return true;
    }


    public update(terrain : Terrain, prog : ProgramInterface) : void {
        
        if (!this.moving) {

            terrain.markObject(this);
        }
        
        this.updateLogic?.(terrain, prog);
        this.updateMovement(prog);
        this.markShadows(terrain);
    }


    public draw(canvas : RenderTarget, bmp : Bitmap) : void {
        
        const v : Vector = isometricProjection(this.renderPos);
        const dx : number = v.x*12 - 8;
        const dy : number = v.y*12 - 1;

        if (this.customDraw !== undefined) {

            this.customDraw(canvas, bmp, dx, dy);
            return;
        }
        this.sprite.draw(canvas, bmp, dx, dy);
    }

}
