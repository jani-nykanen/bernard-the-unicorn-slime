import { BitmapIndex, SoundIndex } from "./assetindex.js";
import { AssetManager } from "./assetmanager.js";
import { Bitmap } from "./bitmap.js";
import { MASTER_PALETTE } from "./palette.js";
import { ProgramInterface } from "./program.js";
import { Align, Flip, RenderTarget } from "./rendertarget.js";
import { Scene, SceneChangeParameter } from "./scene.js";
import { Stage } from "./stage.js";
import { Menu } from "./menu.js";
import { createPauseMenu } from "./pausemenu.js";
import { ActionIndex } from "./keyconfig.js";
import { InputFlag } from "./keyboard.js";
import { LEVEL_DATA } from "./leveldata.js";
import { clamp } from "./math.js";
import { saveData } from "./savedata.js";


const STAR_POSITIONS : number[][][] = 
[
    [[1,1], [2,6], [7, 7], [12,3], [14, 8]],
    [[5, 4], [4, 10], [16, 9]],
    [[8, 2], [18, 7]]
]


const MAX_LEVEL_INDEX : number = 12;


export class Game implements Scene {
    

    private stage : Stage | null = null;

    private pauseMenu : Menu | null = null;

    private cameraPos : number = 0;
    private cutsceneStarted : boolean = false;
    private cutscenePhase : number = 0;
    private cutsceneTimer : number = 0;

    private levelIndex : number = 0;


    constructor() {
        
        // ...
    }


    private initializeLevel(prog : ProgramInterface) : void {
        
        this.cutsceneStarted = false;
        this.cutsceneTimer = 0.0;
        this.cutscenePhase = 0;
        this.cameraPos = 0.0;

        this.stage = new Stage(LEVEL_DATA[this.levelIndex]);
        // Yes, pause menu needs to be recreated each time to make
        // undo and restart work properly.
        // TODO: Maybe do not recreate the whole stage object each
        // time...?
        this.pauseMenu = createPauseMenu(this.stage, () => {

            prog.transition.activate(true, 1.0/30.0, (prog : ProgramInterface) : void => {

                prog.changeScene("title");
            })
        });
    }


    private nextLevel(prog : ProgramInterface) : void {

        if (this.levelIndex == MAX_LEVEL_INDEX) {

            throw new Error("TODO: Implement ending.");
        }

        ++ this.levelIndex;
        saveData(this.levelIndex);

        this.initializeLevel(prog);
    }


    private updateCutscene(prog : ProgramInterface) : void {

        const CAMERA_MOVE_SPEED : number = 2.0;
        const TEXT_FLICKER_TIME : number = 60;
        const FINAL_WAIT_TIME : number = 30;

        const camTarget : number = -prog.screenHeight;

        switch (this.cutscenePhase) {

        case 0:

            this.cutsceneTimer = this.cameraPos/camTarget;
            this.cameraPos -= CAMERA_MOVE_SPEED*prog.step;
            if (this.cameraPos < camTarget) {

                this.cameraPos = camTarget;
                this.cutscenePhase = 1;
                this.cutsceneTimer = 0.0;
            }
            break;

        case 1:

            this.cutsceneTimer += prog.step;
            if (this.cutsceneTimer >= TEXT_FLICKER_TIME) {

                this.cutscenePhase = 2;
                this.cutsceneTimer = 0.0;
            }
            break;

        case 2:

            this.cutsceneTimer += prog.step;
            if (this.cutsceneTimer >= FINAL_WAIT_TIME) {

                prog.transition.activate(true, 1.0/30.0, (prog : ProgramInterface) : void => {

                    this.nextLevel(prog);
                });
            }
            break;

        default:
            break;
        }
    }


    private drawBackground(canvas : RenderTarget, assets : AssetManager) : void {

        const CLOUD_WIDTH : number = 64;
        const CLOUD_Y : number = 88;

        const bmpBase : Bitmap = assets.getBitmap(BitmapIndex.Base)!;
        const bmpMoon : Bitmap = assets.getBitmap(BitmapIndex.Moon)!;

        canvas.setDrawColor(...MASTER_PALETTE[0]);
        canvas.clear();

        // Moon
        canvas.drawBitmap(bmpMoon, Flip.None, canvas.width - 48, 8);

        // Stars
        for (let i : number = 0; i < 4; ++ i) {

            const table : number[][] = STAR_POSITIONS[i] ?? [];

            const sx : number = 48 + (i % 2)*8;
            const sy : number = 48 + ((i/2) | 0)*8;

            for (const p of table) {

                const dx : number = p[0]*8;
                const dy : number = p[1]*8;

                canvas.drawBitmap(bmpBase, Flip.None, dx, dy, sx, sy, 8, 8);
            }
        }

        // Rainbow
        if (this.cutsceneStarted) {

            const bmpRainbow : Bitmap = assets.getBitmap(BitmapIndex.Rainbow)!;

            const t : number = this.cutscenePhase == 0 ? this.cutsceneTimer : 1.0;
            const dw : number = Math.round(bmpRainbow.width*t);
            const dh : number = bmpRainbow.height;
            const left : number = canvas.width/2 - bmpRainbow.width/2;
            const top : number = CLOUD_Y - 40;

            canvas.drawBitmap(bmpRainbow, Flip.None, left, top, 0, 0, dw, dh);

            if (this.cutscenePhase == 0) {

                const dx : number = left + dw;
                const dy : number = top + dh - Math.sqrt(Math.max(0.0, 1 - (t - 0.5)*(t - 0.5)*4))*dh;

                for (let i : number = 0; i < 4; ++ i) {

                    canvas.drawBitmap(bmpBase, Flip.None, dx - 4, dy + i*10, 56, 56, 8, 8);
                }
            }
        }
        

        // Clouds
        const cloudCount : number = Math.ceil(canvas.width/CLOUD_WIDTH);
        for (let i : number = 0; i < cloudCount + 1; ++ i) {

            const dx : number = i*CLOUD_WIDTH;
            canvas.drawBitmap(bmpBase, Flip.None, dx, CLOUD_Y, 0, 64, CLOUD_WIDTH, 16);
        }
        canvas.setDrawColor(...MASTER_PALETTE[3]);
        canvas.fillRect(0, CLOUD_Y + 16, canvas.width, canvas.height - (CLOUD_Y + 16));
    }


    private drawHeaderText(canvas : RenderTarget, assets : AssetManager) : void {

        const CUTSCENE_TEXT : string = "RAINBOW CREATED!";

        const bmpFontWhite : Bitmap = assets.getBitmap(BitmapIndex.FontWhite)!;
        if (!this.cutsceneStarted) {

            canvas.drawText(bmpFontWhite, `LEVEL ${this.levelIndex + 1}`, canvas.width/2, 1, Align.Center);
            return;
        }

        const textLength : number = CUTSCENE_TEXT.length;
        const dx : number = canvas.width/2 - textLength*4;

        if (this.cutscenePhase == 0) {

            const text : string = CUTSCENE_TEXT.substring(0, Math.round(this.cutsceneTimer*textLength));
            canvas.drawText(bmpFontWhite, text, dx, 1);
            return;
        }

        if (this.cutscenePhase == 1 && Math.floor(this.cutsceneTimer/10) % 2 == 0) {

            return;
        }
        canvas.drawText(bmpFontWhite, CUTSCENE_TEXT, dx, 1);
    }


    public init(param : SceneChangeParameter, prog : ProgramInterface) : void {
        
        if (typeof(param) === "number") {

            this.levelIndex = clamp(param, 0, MAX_LEVEL_INDEX);
        }
        this.initializeLevel(prog);
    }


    public update(prog : ProgramInterface) : void {
        
        if (prog.transition.active) {

            return;
        }

        if (this.cutsceneStarted) {

            this.stage?.update(prog);
            this.updateCutscene(prog);
            return;
        }

        if (this.pauseMenu!.isActive()) {

            this.pauseMenu!.update(prog);
            return;
        }
        if (prog.keyboard.getActionState(ActionIndex.Pause).flag == InputFlag.Pressed) {

            prog.audio.playSound(prog.assets.getSound(SoundIndex.Pause), 0.80);
            this.pauseMenu!.changeMenuText(3, prog.audio.getStateString());
            this.pauseMenu!.activate(0);
            return;
        }

        this.stage?.update(prog);
        if (this.stage?.cleared === true) {

            this.cutsceneStarted = true;
            this.cutscenePhase = 0;

            prog.audio.playSound(prog.assets.getSound(SoundIndex.Victory), 0.80);
        }
    }


    public redraw(canvas : RenderTarget, assets : AssetManager) : void {

        this.drawBackground(canvas, assets);
        canvas.moveTo(0, -this.cameraPos);
        this.stage?.draw(canvas, assets);

        canvas.moveTo();
        if (this.pauseMenu!.isActive()) {

            this.pauseMenu!.draw(canvas, assets);
        }
        this.drawHeaderText(canvas, assets);
    }


    public onChange() : SceneChangeParameter {
        
        return 1;
    }
}
