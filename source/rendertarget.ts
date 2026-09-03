/* 
 * License: GNU General Public License v3
 * Copyright 2026 Jani Nykänen
 */

import { Bitmap } from "./bitmap.js";
import { Vector } from "./vector.js";


export const enum Flip {

    None = 0,
    Horizontal = 1,
    Vertical = 2,
    Both = 3
};


export const enum Align {

    Left = 0,
    Right = 1,
    Center = 2,
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
        this.canvas.width = width;
        this.canvas.height = height;

        if (div !== null) {

            this.canvas.setAttribute("style", 
                "position: absolute;" +
                "z-index: -1;" +
                "image-rendering: optimizeSpeed;" + 
                "image-rendering: pixelated;" +
                "image-rendering: -moz-crisp-edges;");

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


    public move(x : number, y : number) : void {

        this.translation.x += x;
        this.translation.y += y;
    }


    public clear() : void {

        this.ctx.fillRect(0, 0, this.width, this.height);
    }


    public fillRect(x : number, y : number, w : number, h : number) : void {

        x = (x + this.translation.x) | 0;
        y = (y + this.translation.y) | 0;

        this.ctx.fillRect(x, y, w | 0, h | 0);
    }


    public fillCircle(x : number, y : number, r : number, height : number = r*2) : void {

        x = (x + this.translation.x) | 0;
        y = (y + this.translation.y) | 0;

        const start : number = y - r;
        for (let dy : number = start; dy < start + Math.min(height, r*2); ++ dy) {

            const t : number = (dy - y)/r;
            const dw : number = Math.round(Math.sqrt(Math.max(0, 1 - t*t))*r*2.0);
            const dx : number = (x - dw/2.0) | 0;
            this.ctx.fillRect(dx, dy, dw, 1);
        }
    }


    public fillCircleOutside(r : number, cx : number = this.width/2, cy : number = this.height/2) : void {

        const start : number = Math.max(0, cy - r) | 0;
        const end : number = Math.min(this.height, cy + r) | 0;

        if (start > 0) {

            this.fillRect(0, 0, this.width, start);
        }
        if (end < this.height) {

            this.fillRect(0, end, this.width, this.height - end);
        }

        for (let y : number = start; y < end; ++ y) {

            const dy : number = y - cy;
            if (Math.abs(dy) >= r) {

                this.ctx.fillRect(0, y, this.width, 1);
                continue;
            }

            const px1 : number = Math.round(cx - Math.sqrt(r*r - dy*dy));
            const px2 : number = Math.round(cx + Math.sqrt(r*r - dy*dy));

            if (px1 > 0) {

                this.ctx.fillRect(0, y, px1, 1);
            }
            if (px2 < this.width) {

                this.ctx.fillRect(px2, y, this.width - px1, 1);
            }
        }
    }


    public drawBitmap(bmp : Bitmap, flip : Flip = Flip.None,
        dx : number = 0.0, dy : number = 0.0, 
        sx : number = 0.0, sy : number = 0.0, 
        sw : number = bmp.width, sh : number = bmp.height,
        dw : number = sw, dh : number = sh) : void {

        sx |= 0;
        sy |= 0;
        sw |= 0;
        sh |= 0;
        dx = (dx + this.translation.x) | 0;
        dy = (dy + this.translation.y) | 0;
        dw |= 0;
        dh |= 0;

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

        ctx.drawImage(bmp, sx, sy, sw, sh, dx, dy, dw, dh);

        if (transform) {

            ctx.restore();
        }
    }


    public drawText(font : Bitmap, text : string, 
        dx : number, dy : number, align : Align = Align.Left,
        period : number = 0.0, amplitude : number = 0.0, shift : number = 0.0) : void {

        const LINE_SHIFT : number = 2;

        const cw : number = (font.width/16) | 0;
        const ch : number = cw;

        dx = (dx + this.translation.x) | 0;
        dy = (dy + this.translation.y) | 0;

        const len : number = (text.length)*cw;
        if (align == Align.Center) {

            dx -= (len/2.0) | 0;
        }
        else if (align == Align.Right) {
            
            dx -= len | 0;
        }
        
        let x : number = dx;
        let y : number = dy;
        const waveShift : number = period/text.length;

        for (let i : number = 0; i < text.length; ++ i) {

            const chr : number = text.charCodeAt(i);
            if (chr == '\n'.charCodeAt(0)) {

                x = dx;
                y += ch;
                continue;
            }

            const wave : number = Math.round(Math.sin(shift + i*waveShift)*amplitude);
            this.ctx.drawImage(font, 
                (chr % 16)*cw, 
                (((chr/16) | 0) - LINE_SHIFT)*ch, 
                cw, ch, x, y + wave, cw, ch);
            x += cw;
        }
    }


    public toBitmap() : Bitmap {

        return this.canvas;
    }
}