import { Bitmap } from "./bitmap.js";
import { Vector } from "./vector.js";


export const enum Flip {

    None = 0,
    Horizontal = 1,
    Vertical = 2,
    Both = 3
};


export class RenderTarget {


    private canvas : HTMLCanvasElement;
    private ctx : CanvasRenderingContext2D;

    private translation : Vector = new Vector();


    public get width() : number {

        return this.canvas.width;
    }
    public get height() : number {

        return this.canvas.height;
    }
    public get style() : CSSStyleDeclaration {

        return this.canvas.style;
    }


    constructor(width : number, height : number, div : HTMLDivElement | null = null) {

        this.canvas = document.createElement("canvas")!;
        this.canvas.setAttribute("style", 
            "position: absolute;" +
            "z-index: -1;" +
            "image-rendering: optimizeSpeed;" + 
            "image-rendering: pixelated;" +
            "image-rendering: -moz-crisp-edges;");

        this.canvas.width = width;
        this.canvas.height = height;

        if (div !== null) {

            div.appendChild(this.canvas);
            document.body.appendChild(div);
        }

        this.ctx = this.canvas.getContext("2d")!;
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.globalAlpha = 1.0;;
    }


    public setDrawColor(r : number = 255, g : number = 255, b : number = 255, a : number = 1.0) : void {

        this.ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
    }


    public moveTo(x : number = 0.0, y : number = 0.0) : void {

        this.translation.setValues(x, y);
    }


    public clear() : void {

        this.ctx.fillRect(0, 0, this.width, this.height);
    }


    public fillRect(x : number, y : number, w : number, h : number) : void {

        x = (x + this.translation.x) | 0;
        y = (y + this.translation.y) | 0;

        this.ctx.fillRect(x, y, w | 0, h | 0);
    }


    public drawBitmap(bmp : Bitmap, flip : Flip = Flip.None,
        dx : number = 0.0, dy : number = 0.0, 
        sx : number = 0.0, sy : number = 0.0, sw : number = bmp.width, sh : number = bmp.height) : void {

        sx |= 0;
        sy |= 0;
        sw |= 0;
        sh |= 0;
        dx = (dx + this.translation.x) | 0;
        dy = (dy + this.translation.y) | 0;

        const ctx : CanvasRenderingContext2D = this.ctx;
        const transform : boolean = flip != Flip.None;

         if (transform) {

            ctx.save();
        }

        if ((flip & Flip.Horizontal) != 0) {

            ctx.translate(sw, 0);
            ctx.scale(-1, 1);
            dx *= -1;
        }
        if ((flip & Flip.Vertical) != 0) {

            ctx.translate(0, sh);
            ctx.scale(1, -1);
            dy *= -1;
        }

        ctx.drawImage(bmp, sx, sy, sw, sh, dx, dy, sw, sh);

        if (transform) {

            ctx.restore();
        }
    }
}