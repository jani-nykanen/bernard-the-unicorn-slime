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
import { GameObjectType } from "./objecttype.js";


export class GameObject {


    private shadowRef : Vector | null = null;

    protected basePos : Vector;
    protected targetPos : Vector;
    protected renderPos : Vector;

    protected sprite : Sprite;
    protected faceDir : Direction = Direction.Down;

    protected moving : boolean = false;
    protected moveTimer : number = 0.0;
    protected gravity : number = 0.0;
    protected falling : boolean = false;
    protected jumping : boolean = false;

    protected active : boolean = true;


    public readonly type : GameObjectType;


    public get pos() : Vector {

        if (this.moving && this.moveTimer > 0.5) {

            return this.targetPos;
        }
        return this.basePos;
    }


    constructor(x : number, y : number, z : number, type : GameObjectType) {

        this.basePos = new Vector(x, y, z);
        this.renderPos = this.basePos.clone();
        this.targetPos = this.basePos.clone();

        this.sprite = new Sprite(16, 16);

        this.type = type;
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


    private drawShadow(canvas : RenderTarget, bmp : Bitmap) : void {

        if (this.shadowRef === null) {

            return;
        }

        const v : Vector = isometricProjectionFromComponents(this.shadowRef.x, this.shadowRef.y + 1, this.shadowRef.z);
        const dx : number = v.x*12 - 8;
        const dy : number = v.y*12 - 3;

        canvas.drawBitmap(bmp, Flip.None, dx, dy, 8, 32, 16, 8);
    }


    protected updateLogic?(terrain : Terrain, prog : ProgramInterface) : void;
    protected customDraw?(canvas : RenderTarget, bmp : Bitmap, dx : number, dy : number) : void;


    protected move(terrain : Terrain, dirx : number, dirz : number) : boolean {

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
                
        this.updateLogic?.(terrain, prog);
        this.updateMovement(terrain, prog);
        this.markShadows(terrain);
        this.checkOverlayingShadow(terrain);
    }


    public draw(canvas : RenderTarget, bmp : Bitmap) : void {
        
        const v : Vector = isometricProjection(this.renderPos);
        const dx : number = v.x*12 - 8;
        const dy : number = v.y*12 - 1;

        if (this.customDraw !== undefined) {

            this.customDraw(canvas, bmp, dx, dy);
        }
        else {
            
            this.sprite.draw(canvas, bmp, dx, dy);
        }
        this.drawShadow(canvas, bmp);
    }


    public isActive() : boolean {

        return this.active;
    }


    public isMoving() : boolean {

        return this.moving;
    }


    public toggleActivation?(state : boolean) : void;
}
