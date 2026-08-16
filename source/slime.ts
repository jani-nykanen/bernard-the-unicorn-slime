import { Bitmap } from "./bitmap.js";
import { isometricProjection } from "./math.js";
import { ProgramInterface } from "./program.js";
import { Flip, RenderTarget } from "./rendertarget.js";
import { Vector } from "./vector.js";
import { GameObject } from "./gameobject.js";
import { Terrain } from "./terrain.js";
import { InputFlag, InputState } from "./keyboard.js";
import { ActionIndex } from "./keyconfig.js";
import { Direction } from "./direction.js";
import { GameObjectType } from "./objecttype.js";



export class Slime extends GameObject {


    private changeAnimationFinished : boolean = true;

    private faceOffset : Vector = new Vector();


    constructor(x : number, y : number, z : number, active : boolean) {

        super(x, y, z, GameObjectType.Slime);

        this.active = active;
        this.sprite.setFrame(Number(!active)*3, 1);
    }


    private controlSlime(terrain : Terrain, prog : ProgramInterface) : void {

        if (this.moving) {

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
        if (!this.active) {

            this.sprite.animate(1, 0, 3, FRAME_TIME, prog.step, false);
            if (this.sprite.column == 3) {

                this.changeAnimationFinished = true;
            }
            return;
        }

        this.sprite.animate(1, 3, 0, FRAME_TIME, prog.step, false);
        if (this.sprite.column == 0) {

            this.changeAnimationFinished = true;
        }
    }


    private drawFace(canvas : RenderTarget, bmp : Bitmap, dx : number, dy : number) : void {

        if (!this.changeAnimationFinished) {

            return;
        }

        canvas.drawBitmap(bmp, this.sprite.flip,
             dx + this.faceOffset.x, 
             dy + this.faceOffset.y, 0, 32, 8, 16);
    }


    protected updateLogic(terrain : Terrain, prog : ProgramInterface) : void {

        if (!this.changeAnimationFinished) {

            this.animateStateChanging(prog);
            return;
        }

        if (!this.active) {

            this.sprite.setFrame(3, 1);
            this.sprite.flip = Flip.None;
            return;
        }

        this.controlSlime(terrain, prog);
        this.animate(prog);
        this.computeFaceProperties();
    }


    protected customDraw(canvas : RenderTarget, bmp : Bitmap, dx : number, dy : number) : void {
        
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


    public toggleActivation(state : boolean) : void {
        
        this.active = state;
        this.changeAnimationFinished = false;

        this.sprite.setFrame(state ? 3 : 0, 1);
        // TODO: Start some animation etc.
    }
}