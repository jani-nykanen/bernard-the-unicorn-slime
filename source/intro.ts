/* 
 * License: GNU General Public License v3
 * Copyright 2026 Jani Nykänen
 */

import { AssetManager } from "./assetmanager.js";
import { Bitmap } from "./bitmap.js";
import { MASTER_PALETTE } from "./palette.js";
import { ProgramInterface } from "./program.js";
import { Flip, RenderTarget } from "./rendertarget.js";
import { Scene, SceneChangeParameter } from "./scene.js";
import { BitmapIndex, SoundIndex } from "./assetindex.js";
import { clamp } from "./math.js";
import { drawFadingText } from "./utility.js";


const TEXT : string[] =
[
// Controls screen
`    CONTROLS:

ARROWS:    MOVE
Z/B.SPACE: UNDO
R:         RESET
ESC/ENTER: PAUSE`,
// Ending
`THANK YOU FOR
   PLAYING!`
]


export class Intro implements Scene {


    private phase : number = 0;
    private fadeTimer : number = 0;
    private fadingIn : boolean = false;

    private textWidth : number = 0;
    private textHeight : number = 0;
    private text : string = "";


    constructor() {}


    public init(param : SceneChangeParameter, prog : ProgramInterface): void {
        
        this.phase = param === 1 ? 1 : 0;
        this.fadingIn = false;
        this.fadeTimer = 1.0;
        
        this.text = TEXT[this.phase];
        const lines : string[] = this.text.split("\n");
        this.textWidth = Math.max(...lines.map((v : string) => v.length));
        this.textHeight = lines.length;

        prog.transition.deactivate();
    }


    public update(prog : ProgramInterface) : void {
        
        const FADE_SPEED : number = 1.0/30.0;

        this.fadeTimer -= FADE_SPEED*prog.step;
        if (this.fadeTimer <= 0) {

            this.fadeTimer = 0;
            if (this.phase == 0 && this.fadingIn) {

                prog.changeScene("game");
                prog.transition.activate(false, 1.0/30.0);
            }
        }
        else {

            return;
        }

        if (this.phase == 0 && prog.keyboard.anyPressed) {

            prog.audio.playSound(prog.assets.getSound(SoundIndex.Select), 0.80);
            this.fadeTimer = 1.0;
            this.fadingIn = true;
        }
    }


    public redraw(canvas : RenderTarget, assets : AssetManager) : void {

        const SHADOW_OFFSET : number = 3;
        const MOON_OFFSET : number = 32;

        let t : number = 1.0;
        if (this.fadeTimer > 0.0) {

            t = this.fadingIn ? this.fadeTimer : 1.0 - this.fadeTimer;
        }
        const colorIndex : number = this.phase == 1 ? 0 : clamp(Math.floor(t*4.0), 0, 3);

        canvas.setDrawColor(...MASTER_PALETTE[Math.max(0, colorIndex - 1)]);
        canvas.clear();

        const dx : number = canvas.width/2 - this.textWidth*4;
        const dy : number = canvas.height/2 - this.textHeight*4 + this.phase*MOON_OFFSET;

        if (this.phase == 0) {

            const dw : number = this.textWidth*8;
            const dh : number = this.textHeight*8;
            
            canvas.setDrawColor(...MASTER_PALETTE[Math.max(0, colorIndex - 2)]);
            canvas.fillRect(dx - 5 + SHADOW_OFFSET, dy - 5 + SHADOW_OFFSET, 
                dw + 10, dh + 10);

            canvas.setDrawColor(...MASTER_PALETTE[0]);
            canvas.fillRect(dx - 5, dy - 5, dw + 10, dh + 10);

            canvas.setDrawColor(...MASTER_PALETTE[colorIndex]);
            canvas.fillRect(dx - 4, dy - 4, dw + 8, dh + 8);

            canvas.setDrawColor(...MASTER_PALETTE[0]);
            canvas.fillRect(dx - 3, dy - 3, dw + 6, dh + 6);
        }
        else {

            const bmpMoon : Bitmap = assets.getBitmap(BitmapIndex.Moon)!;
            const bmpBase : Bitmap = assets.getBitmap(BitmapIndex.Base)!;

            const moonX : number = canvas.width/2 - 16;
            const moonY : number = canvas.height/2 - 16 - MOON_OFFSET/2;

            canvas.drawBitmap(bmpMoon, Flip.None, moonX, moonY);
            canvas.drawBitmap(bmpBase, Flip.None, moonX + 21, moonY + 23, 0, 40, 8, 8);
        }

        drawFadingText(this.text, canvas, assets, dx, dy, t);
    }


    public onChange() : SceneChangeParameter {
        
        return 0;
    }

}