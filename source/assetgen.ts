import { Program, ProgramInterface } from "./program.js";
import { Game } from "./game.js";
import { BitmapIndex } from "./assetindex.js"
import { MASTER_PALETTE } from "./palette.js";
import { initKeyConfig } from "./keyconfig.js";
import { AssetManager } from "./assetmanager.js";


const ALPHA_MASK : number[] = 
[
    2, 2, 2, 4, 4, 4, 0, 0,    
    2, 2, 2, 4, 4, 4, 0, 0,      
    4, 2, 4, 2, 4, 2, 2, 4,
    4, 2, 4, 2, 4, 2, 4, 4, 
    2, 4, 4, 2, 1, 1, 1, 1,
    2, 4, 4, 0, 1, 1, 1, 1, 
    2, 4, 2, 2, 2, 2, 0, 0,
    2, 4, 4, 4, 4, 4, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0,
];


export const generateAssets = (assets : AssetManager) : void => {

    assets.applyPalette(
        BitmapIndex.BaseRaw, BitmapIndex.Base, 
        MASTER_PALETTE, ALPHA_MASK);
}