import { Bitmap } from "./bitmap.js";
import { ProgramInterface } from "./program.js";
import { Flip, RenderTarget } from "./rendertarget.js";
import { Vector } from "./vector.js";
import { Sprite } from "./sprite.js";


export const enum ParticleType {

    Star = 0,
}


export class Particle {


    private pos : Vector;
    private speed : Vector;
    private type : ParticleType = ParticleType.Star;

    private sprite : Sprite;

    private _exists : boolean = false;


    public get exists() : boolean {

        return this._exists;
    }


    constructor() {

        this.pos = new Vector();
        this.speed = new Vector();

        this.sprite = new Sprite(16, 16);
    }


    public update(prog : ProgramInterface) : void {

        const MAX_GRAVITY : number = 4.0;
        const GRAVITY_STEP : number = 0.1; 
        const STAR_FRAME_TIME : number = 6;

        if (!this._exists) {

            return;
        }
        
        switch (this.type) {

        case ParticleType.Star:

            this.speed.y = Math.min(MAX_GRAVITY, this.speed.y +  GRAVITY_STEP*prog.step);
            this.sprite.animate(2, 2, 3, STAR_FRAME_TIME, prog.step);
            break;

        default:
            break;
        }

        this.pos.x += this.speed.x*prog.step;
        this.pos.y += this.speed.y*prog.step;

        const w : number = this.sprite.width;
        const h : number = this.sprite.height;
        // Note: since the canvas translation is not known, we need to enough "offset"
        // to the check if inside the visible area (TODO: Maybe implement a camera object?)
        if (this.pos.x + w/2 < -prog.screenWidth || this.pos.x - w/2 >= prog.screenWidth ||
            this.pos.y + h/2 < -prog.screenHeight || this.pos.y - h/2 >= prog.screenHeight) {

            this._exists = false;
        }
    }


    public draw(canvas : RenderTarget, bmp : Bitmap) : void {

        if (!this._exists) {

            return;
        }

        this.sprite.draw(canvas, bmp, this.pos.x - 8, this.pos.y - 8);
    }


    public spawn(type : ParticleType, 
        x : number, y : number, speedx : number, speedy : number) : void {

        this.type = type;

        this.pos.setValues(x, y);
        this.speed.setValues(speedx, speedy);

        this.sprite.setFrame(2, 2);

        this._exists = true;
    }


    public kill() : void {

        this._exists = false;
    }
}


export const nextParticle = (particles : Particle[]) : Particle => {

    for (const p of particles) {

        if (!p.exists) {

            return p;
        }
    }
    const o : Particle = new Particle();
    particles.push(o);
    return o;
}
