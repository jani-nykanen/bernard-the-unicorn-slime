import { Program, ProgramInterface } from "./program.js";
import { Game } from "./game.js";
import { BitmapIndex } from "./assetindex.js"
import { MASTER_PALETTE } from "./palette.js";
import { initKeyConfig } from "./keyconfig.js";
import { createSounds, generateBitmaps } from "./assetgen.js";
import { Align, RenderTarget } from "./rendertarget.js";
import { AssetManager } from "./assetmanager.js";
import { TitleScreen } from "./titlescreen.js";
import { Intro } from "./intro.js";


window.onload = () : void => (new Program(160, 144, 60, 0.60,
    // On initialize
    (prog : ProgramInterface) : void => {

        initKeyConfig(prog.keyboard);

        prog.addScene("game", new Game());
        prog.addScene("intro", new Intro());
        prog.addScene("title", new TitleScreen(), true);

        prog.assets.loadBitmap(BitmapIndex.BaseRaw, "base.png");
        prog.assets.loadBitmap(BitmapIndex.FontRaw, "font.png");
    },
    // On loaded
    (prog : ProgramInterface) : void => {

        generateBitmaps(prog.assets);

    },
    // Draw "wait for input" screen
    (canvas : RenderTarget, assets : AssetManager) : void => {

        canvas.setDrawColor(...MASTER_PALETTE[0]);
        canvas.clear();

        canvas.drawText(assets.getBitmap(BitmapIndex.FontWhite)!, "PRESS ANY KEY", 
            canvas.width/2, canvas.height/2 - 4, Align.Center);
    },
    // On audio prepared
    (prog : ProgramInterface) : void => {

        createSounds(prog.audio, prog.assets);

    })).run();
