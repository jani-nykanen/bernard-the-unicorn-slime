import { AssetManager } from "./assetmanager.js";
import { Bitmap } from "./bitmap.js";
import { MASTER_PALETTE } from "./palette.js";
import { ProgramInterface } from "./program.js";
import { Align, Flip, RenderTarget } from "./rendertarget.js";
import { Scene, SceneChangeParameter } from "./scene.js";
import { BitmapIndex, SoundIndex } from "./assetindex.js";
import { Menu, MenuButton } from "./menu.js";


export class TitleScreen implements Scene {


    private waveTimer : number = 0.0;
    private menu : Menu;

    private startNewGame : boolean = false;


    constructor() {

        this.menu = new Menu(
        [
        // New game
        new MenuButton("NEW GAME", (button : MenuButton, prog : ProgramInterface) : boolean => {

            this.startNewGame = true;
            prog.transition.activate(true, 1.0/30.0, (prog : ProgramInterface) : void => {

                prog.changeScene("game");
            });
            return false;
        }),
        // Load game
        new MenuButton("LOAD GAME", (button : MenuButton, prog : ProgramInterface) : boolean => {

            this.startNewGame = false;
            prog.transition.activate(true, 1.0/30.0, (prog : ProgramInterface) : void => {

                prog.changeScene("game");
            });
            return false;
        }),

        ], true, false);
    }

    
    private drawBackground(canvas : RenderTarget) : void {

        canvas.setDrawColor(...MASTER_PALETTE[2]);
        canvas.clear();

        canvas.setDrawColor(...MASTER_PALETTE[1]);
        canvas.fillRect(0, canvas.height - 24, canvas.width, 24);
        for (let i : number = 0; i < 12; ++ i) {

            if (i % 2 == 0) {

                canvas.fillRect(0, canvas.height - 23 - i, canvas.width, 1);
            }
            if (i % 3 == 0) {

                canvas.fillRect(0, canvas.height - 35 - i, canvas.width, 1);
            }
        }

        canvas.setDrawColor(...MASTER_PALETTE[2]);
        for (let i : number = 0; i <= 12; i += 3) {

            canvas.fillRect(0, canvas.height - 12 - i, canvas.width, 1);
        }
    }


    private drawLogo(canvas : RenderTarget, assets : AssetManager) : void {

        // TODO: Maybe draw this to a bitmap in advance?

        const SUBTITLE : string = "SAVES THE RAINBOWS"
        const SUBTITLE_OFFSET_Y : number = 72;
        const SUBTITLE_WAVE_AMPLITUDE : number = 2;
        const SUBTITLE_PERIOD : number = Math.PI*3;

        const bmpLogoBlack : Bitmap = assets.getBitmap(BitmapIndex.LogoBlack)!;
        const bmpLogoWhite : Bitmap = assets.getBitmap(BitmapIndex.LogoWhite)!;
        const bmpFontBlack : Bitmap = assets.getBitmap(BitmapIndex.FontBlack)!;
        const bmpFontWhite : Bitmap = assets.getBitmap(BitmapIndex.FontWhite)!;

        const dx : number = canvas.width/2 - bmpLogoBlack.width/2;
        const dy : number = 8;
        const subtitleX : number = canvas.width/2;
        const subtitleY : number = dy + SUBTITLE_OFFSET_Y;

        for (let i : number = -1; i <= 1; ++ i) {

            for (let j : number = -1; j <= 2; ++ j) {

                canvas.drawBitmap(bmpLogoBlack, Flip.None, dx + i, dy + j);
                canvas.drawText(bmpFontBlack, SUBTITLE, 
                    subtitleX + i, subtitleY + j, Align.Center,
                    SUBTITLE_PERIOD, SUBTITLE_WAVE_AMPLITUDE, this.waveTimer);
            }
        }
        canvas.drawBitmap(bmpLogoWhite, Flip.None, dx, dy);
        canvas.drawText(bmpFontWhite, SUBTITLE, 
            subtitleX, subtitleY, Align.Center,
            SUBTITLE_PERIOD, SUBTITLE_WAVE_AMPLITUDE, this.waveTimer);
    }



    public init(param : SceneChangeParameter, prog : ProgramInterface): void {
        
        this.menu.setCursor(param === null ? 0 : 1);
    }


    public update(prog : ProgramInterface) : void {
        
        const WAVE_SPEED : number = Math.PI*2/120.0;

        this.waveTimer = (this.waveTimer + WAVE_SPEED*prog.step) % (Math.PI*2);

        this.menu.update(prog);
    }


    public redraw(canvas : RenderTarget, assets : AssetManager) : void {
        
        this.drawBackground(canvas);
        this.drawLogo(canvas, assets);

        const bmpFontWhite : Bitmap = assets.getBitmap(BitmapIndex.FontWhite)!;
        canvas.drawText(bmpFontWhite, "*2026 JANI NYK@NEN", canvas.width/2, canvas.height - 9, Align.Center);
    
        this.menu.draw(canvas, assets, 0, 40);
    }


    public onChange?() : SceneChangeParameter {
        
        return null;
    }

}