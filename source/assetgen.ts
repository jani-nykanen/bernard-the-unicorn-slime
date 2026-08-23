import { Program, ProgramInterface } from "./program.js";
import { Game } from "./game.js";
import { BitmapIndex, SoundIndex } from "./assetindex.js"
import { MASTER_PALETTE } from "./palette.js";
import { initKeyConfig } from "./keyconfig.js";
import { AssetManager } from "./assetmanager.js";
import { Bitmap } from "./bitmap.js";
import { RenderTarget } from "./rendertarget.js";
import { AudioPlayer } from "./audioplayer.js";
import { OscType, Ramp } from "./sound.js";


const ALPHA_MASK : number[] = 
[
    2, 2, 2, 4, 4, 4, 0, 0,    
    2, 2, 2, 4, 4, 4, 0, 0,      
    4, 2, 4, 2, 4, 2, 2, 4,
    4, 2, 4, 2, 4, 2, 4, 4, 
    2, 4, 4, 2, 1, 1, 1, 1,
    2, 4, 4, 0, 1, 1, 1, 1, 
    2, 4, 2, 2, 2, 2, 1, 1,
    2, 4, 4, 4, 4, 4, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1,
];


const generateMoon = () : Bitmap => {

    const RADIUS : number = 20;
    const INNER_RADIUS : number = 16;

    const canvas : RenderTarget = new RenderTarget(RADIUS*2, RADIUS*2);

    canvas.setDrawColor(...MASTER_PALETTE[2]);
    canvas.fillCircle(RADIUS, RADIUS, RADIUS);

    canvas.setDrawColor(...MASTER_PALETTE[3]);
    canvas.fillCircle(RADIUS - 1, RADIUS - 1, RADIUS - 2);

    canvas.setDrawColor(...MASTER_PALETTE[0]);
    canvas.fillCircle(RADIUS - 9, RADIUS - 9, INNER_RADIUS);

    return canvas.toBitmap();
}


const generateRainbow = () : Bitmap => {

    const WIDTH : number = 112;
    const HEIGHT : number = 56;
    const RAY_WIDTHS : number[] = [6, 6, 6, 6, 2, 2, 2, 2,  6];

    const COLOR_INDEX : number[] = [1, 2, 3, 2, 3, 2, 3, 2, 0];

    const canvas : RenderTarget = new RenderTarget(WIDTH, HEIGHT);

    let r : number = HEIGHT;
    for (let i : number = 0; i < COLOR_INDEX.length; ++ i) {

        canvas.setDrawColor(...MASTER_PALETTE[COLOR_INDEX[i]]);
        canvas.fillCircle(WIDTH/2, HEIGHT, r, HEIGHT);
        r -= RAY_WIDTHS[i];
    }

    return canvas.toBitmap();
}


export const generateBitmaps = (assets : AssetManager) : void => {

    // Base tileset
    assets.applyPalette(
        BitmapIndex.BaseRaw, BitmapIndex.Base, 
        MASTER_PALETTE, ALPHA_MASK);

    // Fonts
    const fontAlphaMask : number[] = (new Array<number> (16*4)).fill(1);
    for (let i : number = 0; i < 4; ++ i) {

        assets.applyPalette(BitmapIndex.FontRaw, BitmapIndex.FontBlack + i, 
            [[0, 0, 0], [0, 0, 0], [0, 0, 0], MASTER_PALETTE[i]], fontAlphaMask);
    }
    
    // Moon
    assets.addBitmap(BitmapIndex.Moon, generateMoon());
    // Rainbow
    assets.addBitmap(BitmapIndex.Rainbow, generateRainbow());
}


export const createSounds = (audio : AudioPlayer, assets : AssetManager) : void => {

    assets.addSound(SoundIndex.Gem, 
        audio.createSound(
            [160, 4, 0.60,
            100, 2, 0.80,
            256, 10, 1.00],
            0.50,
            OscType.Square, 
            Ramp.Instant)!);

    assets.addSound(SoundIndex.Push, 
        audio.createSound(
            [128, 6, 1.0,
            88, 4, 0.20], 
            0.70,
            OscType.Square, 
            Ramp.Exponential)!);  

    assets.addSound(SoundIndex.Jump, 
        audio.createSound(
            [96,  4, 0.50,
            112, 3, 0.80,
            160, 6, 0.60,
            224, 4, 0.20], 
            0.80,
            OscType.Sawtooth, 
            Ramp.Exponential)!);  

    assets.addSound(SoundIndex.Fall, 
        audio.createSound(
            [96, 7, 1.0,
            64, 3, 0.20], 
            0.70,
            OscType.Square, 
            Ramp.Exponential)!);  
}