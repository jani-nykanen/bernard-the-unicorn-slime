import { Program, ProgramInterface } from "./program.js";
import { Game } from "./game.js";
import { BitmapIndex } from "./assetindex.js"


const palette : number[][] = 
[
    [24, 24, 24],
    [74, 81, 56],
    [140, 146, 107],
    [192, 202, 164]
];


const alphaMask : number[] = 
[
    3, 2, 2, 0, 0, 0, 0, 0,    
    0, 0, 0, 0, 0, 0, 0, 0,   
    4, 4, 4, 4, 0, 0, 0, 0,        
];


window.onload = () : void => (new Program(160, 144, 60, 
    // onInit
    (prog : ProgramInterface) : void => {

        prog.addScene("game", new Game(), true);

        prog.assets.loadBitmap(BitmapIndex.BaseRaw, "base.png");
    },
    // onLoad
    (prog : ProgramInterface) : void => {

        prog.assets.applyPalette(BitmapIndex.BaseRaw, BitmapIndex.Base, palette, alphaMask);

    })).run();
