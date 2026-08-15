import { Program, ProgramInterface } from "./program.js";
import { Game } from "./game.js";
import { BitmapIndex } from "./assetindex.js"
import { MASTER_PALETTE } from "./palette.js";
import { initKeyConfig } from "./keyconfig.js";


const ALPHA_MASK : number[] = 
[
    2, 2, 2, 4, 4, 4, 0, 0,    
    2, 2, 2, 4, 4, 4, 0, 0,      
    4, 2, 4, 2, 0, 0, 0, 0,
    4, 2, 4, 2, 0, 0, 0, 0, 
    2, 0, 0, 0, 0, 0, 0, 0,
    2, 0, 0, 0, 0, 0, 0, 0, 
];


window.onload = () : void => (new Program(160, 144, 60, 
    // onInit
    (prog : ProgramInterface) : void => {

        initKeyConfig(prog.keyboard);

        prog.addScene("game", new Game(), true);

        prog.assets.loadBitmap(BitmapIndex.BaseRaw, "base.png");
    },
    // onLoad
    (prog : ProgramInterface) : void => {

        prog.assets.applyPalette(
            BitmapIndex.BaseRaw, BitmapIndex.Base, 
            MASTER_PALETTE, ALPHA_MASK);

    })).run();
