import { ProgramInterface } from "./program.js";
import { RenderTarget } from "./rendertarget.js";
import { MASTER_PALETTE } from "./palette.js";


export type TransitionCallback = (prog : ProgramInterface) => void;


export class Transition {


    private timer : number = 0.0;
    private speed : number = 1.0;
    private event : TransitionCallback | null = null;
    private transitionIn : boolean = false;
    private _active : boolean = false;
    private colorIndex : number = 0;


    public get active() : boolean {

        return this._active;
    }


    constructor() {}


    public activate(transitionIn : boolean, speed : number, 
        event : TransitionCallback | null = null, colorIndex : number = 0.0) : void {

        this.transitionIn = transitionIn;
        this.speed = speed;
        this.colorIndex = colorIndex;
        this.event = event;
        this.timer = 0.0;

        this._active = true;
    }


    public update(prog : ProgramInterface) : void {

        if (!this._active) {

            return;
        }

        this.timer += this.speed*prog.step;
        if (this.timer >= 1.0) {

            if (this.transitionIn) {

                this.event?.(prog);
                this.timer -= 1.0;
                this.transitionIn = false;
                return;
            }
            this._active = false;
            this.timer = 0.0;
        }
    }


    public draw(canvas : RenderTarget) : void {

        if (!this._active) {

            return;
        }

        const t : number = this.transitionIn ? this.timer : 1.0 - this.timer;
        const maxRadius : number = Math.hypot(canvas.width/2.0, canvas.height/2.0);
        const radius : number = (1.0 - t)*(1.0 - t)*maxRadius;

        canvas.moveTo();
        canvas.setDrawColor(...MASTER_PALETTE[this.colorIndex]);
        canvas.fillCircleOutside(radius);
    }


    public deactivate() : void {

        this._active = false;
    }
}
