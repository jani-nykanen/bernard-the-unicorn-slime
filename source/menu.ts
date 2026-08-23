import { clamp, signedMod } from "./math.js";
import { Bitmap } from "./bitmap.js";
import { ProgramInterface } from "./program.js";
import { Align, RenderTarget } from "./rendertarget.js";
import { ActionIndex } from "./keyconfig.js";
import { InputFlag } from "./keyboard.js";
import { AssetManager } from "./assetmanager.js";
import { BitmapIndex, SoundIndex } from "./assetindex.js";
import { MASTER_PALETTE } from "./palette.js";


export type MenuButtonCallback = (button : MenuButton, prog : ProgramInterface) => boolean;


export class MenuButton {


    private callback : MenuButtonCallback;

    private buttonText : string;


    public get text() : string {

        return this.buttonText;
    }

    
    constructor(text : string, callback : MenuButtonCallback) {

        this.buttonText = text;
        this.callback = callback;
    }


    public evaluate(prog : ProgramInterface) : boolean {

        return this.callback(this, prog);
    }


    public changeText(newText : string) : void {

        this.buttonText = newText;
    }
}


export class Menu {


    private buttons : MenuButton[];

    private cursorPos : number = 0;
    
    private height : number;
    private width : number;

    private active : boolean;
    private canCancel : boolean = false;


    constructor(buttons : MenuButton[], makeActive : boolean = false, canCancel : boolean = false) {

        this.buttons = buttons; 
        this.active = makeActive;

        this.width = Math.max(...this.buttons.map(b => b.text.length + 2));
        this.height = this.buttons.length;
        this.canCancel = canCancel;
    }


    public changeMenuText(buttonIndex : number, newText : string) : void {

        this.buttons[buttonIndex].changeText(newText);
        if (newText.length >= this.width - 2) {

            this.width = newText.length + 2;
        }
    }


    public activate(cursorPos : number = this.cursorPos) : void {

        this.cursorPos = clamp(cursorPos, 0, this.buttons.length - 1);
        this.active = true;
    }


    public update(prog : ProgramInterface) : void {

        if (!this.active) {

            return;
        }

        if (this.canCancel &&
            prog.keyboard.getActionState(ActionIndex.Back).flag == InputFlag.Pressed) {
            
            prog.audio.playSound(prog.assets.getSound(SoundIndex.Pause)!, 0.80);
            this.active = false;
            return;
        }
        

        const oldPos : number = this.cursorPos;
        if (prog.keyboard.getActionState(ActionIndex.Up).flag  == InputFlag.Pressed) {

            -- this.cursorPos;
        }
        else if (prog.keyboard.getActionState(ActionIndex.Down).flag  == InputFlag.Pressed) {

            ++ this.cursorPos;
        }
        if (oldPos != this.cursorPos) {

            prog.audio.playSound(prog.assets.getSound(SoundIndex.Select)!, 0.80);
            this.cursorPos = signedMod(this.cursorPos, this.buttons.length);
        }

        if (prog.keyboard.getActionState(ActionIndex.Select).flag == InputFlag.Pressed) {

            if (this.buttons[this.cursorPos].evaluate(prog)) {

                this.active = false;
            }
            prog.audio.playSound(prog.assets.getSound(SoundIndex.Accept)!, 0.80);
        }
    }


    public draw(canvas : RenderTarget, assets : AssetManager, 
        xoff : number = 0, yoff : number = 0) : void {

        const FONT_YOFF : number = 12;
        const PADDING_X : number = 3;
        const PADDING_Y : number = 3;

        if (!this.active) {

            return;
        }

        const dw : number = this.width*8 + PADDING_X*2;
        const dh : number = this.height*FONT_YOFF + PADDING_Y*2;

        const dx : number = canvas.width/2 - dw/2;
        const dy : number = canvas.height/2 - dh/2;

        const bmpFontWhite : Bitmap = assets.getBitmap(BitmapIndex.FontWhite)!;
        const bmpFontBlack : Bitmap = assets.getBitmap(BitmapIndex.FontBlack)!;

        // Box
        canvas.setDrawColor(...MASTER_PALETTE[3]);
        canvas.fillRect(dx - 2, dy - 2, dw + 4, dh + 4);
        canvas.setDrawColor(...MASTER_PALETTE[1]);
        canvas.fillRect(dx - 1, dy - 1, dw + 2, dh + 2);
        canvas.setDrawColor(...MASTER_PALETTE[0]);
        canvas.fillRect(dx, dy, dw, dh);

        // Text
        canvas.setDrawColor(...MASTER_PALETTE[3]);
        for (let i = 0; i < this.buttons.length; ++ i) {

            const isCurrent : boolean = i == this.cursorPos;
            const b : MenuButton = this.buttons[i];
            const font : Bitmap = isCurrent ? bmpFontBlack : bmpFontWhite;

            const x : number = dx + xoff + PADDING_X;
            const y : number = dy + yoff + PADDING_Y + i*FONT_YOFF + 2;

            if (isCurrent) {

                canvas.fillRect(x - 1, y - 2, dw + 2 - PADDING_X*2, 11);
            }
            canvas.drawText(font, b.text, x, y, Align.Left);
        }
    }


    public isActive() : boolean {

        return this.active;
    }


    public setCursor(pos : number) : void {

        this.cursorPos = clamp(pos, 0, this.buttons.length - 1);
    }
}