import { Program, ProgramInterface } from "./program.js";
import { Game } from "./game.js";
import { BitmapIndex } from "./assetindex.js"
import { MASTER_PALETTE } from "./palette.js";
import { initKeyConfig } from "./keyconfig.js";
import { generateAssets } from "./assetgen.js";


window.onload = () : void => (new Program(160, 144, 60, 
    // onInit
    (prog : ProgramInterface) : void => {

        initKeyConfig(prog.keyboard);

        prog.addScene("game", new Game(), true);

        prog.assets.loadBitmap(BitmapIndex.BaseRaw, "base.png");
    },
    // onLoad
    (prog : ProgramInterface) : void => {

        generateAssets(prog.assets);

    })).run();
