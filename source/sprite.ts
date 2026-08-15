import { Bitmap } from "./bitmap.js";
import { Flip, RenderTarget } from "./rendertarget.js";


export class Sprite {


    private _column : number = 0;
    private _row : number = 0;
    private timer : number = 0.0;

    public readonly width : number;
    public readonly height : number;

    public flip : Flip = Flip.None;


    public get column() : number {

        return this._column;
    }
    public get row() : number {

        return this._row;
    }

    public get frameTimer() : number {

        return this.timer;
    }


    constructor(width : number, height : number, 
        initialColumn : number = 0, initialRow : number = 0) {

        this.width = width;
        this.height = height;

        this._column = initialColumn;
        this._row = initialRow;
    }


    private nextFrame(dir : number, startFrame : number, endFrame : number, loop : boolean) : void {

        this._column += dir;

        const min : number = Math.min(startFrame, endFrame);
        const max : number = Math.max(startFrame, endFrame);

        if (this._column < min) {

            if (!loop) {

                this._column = min;
                return;
            }
            this._column = max;
        }
        else if (this._column > max) {

            if (!loop) {

                this._column = max;
                return;
            }
            this._column = min;
        }
    } 

    
    public animate(_row : number,
        startFrame : number, endFrame : number, 
        frameTime : number, step : number, loop : boolean = true) : void {

        // To avoid semi-infinite loops
        const MAX_FRAME_SKIP : number = 5;

        if (startFrame == endFrame) {

            this.setFrame(startFrame, _row);
            return;
        }
        
        frameTime = Math.max(frameTime, 1);

        const dir : number = Math.sign(endFrame - startFrame);
        if (_row != this._row) {
            
            this._column = startFrame;
            this.timer = 0;

            this._row = _row;
        }

        this.timer += step;
 
        let frameSkipCount : number = 0;
        while (this.timer >= frameTime) {

            this.timer -= frameTime;
            this.nextFrame(dir, startFrame, endFrame, loop);

            ++ frameSkipCount;
            if (frameSkipCount >= MAX_FRAME_SKIP) {

                this.timer = 0;
                break;
            }
        }
        
    }


    public draw(canvas : RenderTarget, bmp : Bitmap, dx : number, dy : number) : void {

        canvas.drawBitmap(bmp, this.flip, dx, dy, 
            this._column*this.width, this._row*this.height, this.width, this.height);
    }


    public setFrame(_column : number, _row : number, preserveTimer : boolean = false) : void {

        this._column = _column;
        this._row = _row;

        if (!preserveTimer) {
            
            this.timer = 0.0;
        }
    }
}
