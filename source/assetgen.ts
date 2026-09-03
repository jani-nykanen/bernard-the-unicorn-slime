import { BitmapIndex, SoundIndex } from "./assetindex.js"
import { MASTER_PALETTE } from "./palette.js";
import { AssetManager } from "./assetmanager.js";
import { Bitmap } from "./bitmap.js";
import { Flip, RenderTarget } from "./rendertarget.js";
import { AudioPlayer } from "./audioplayer.js";
import { OscType, Ramp } from "./sound.js";


const ALPHA_MASK : number[] = 
[
    2, 2, 2, 4, 4, 4, 3, 3,    
    2, 2, 2, 4, 4, 4, 4, 2,      
    4, 2, 4, 2, 4, 2, 2, 4,
    4, 2, 4, 2, 4, 2, 4, 4, 
    2, 4, 4, 4, 1, 1, 1, 1,
    2, 4, 4, 4, 1, 1, 1, 1, 
    2, 4, 2, 2, 2, 2, 1, 1,
    2, 4, 4, 4, 4, 4, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1,
    3, 3, 2, 4, 1, 1, 1, 1,
    4, 0, 4, 4, 1, 1, 1, 1,
];


const enum Note {

    C2 = 65.41,
    D2 = 73.42,
    E2 = 82.41,
    F2 = 87.31,
    G2 = 98.0,
    A2 = 110.0,
    B2 = 123.7,
    C3 = 130.81,
    D3 = 146.83,
    E3 = 164.81,
    F3 = 174.61,
    G3 = 196.0,
    A3 = 220.0,
    B3 = 246.94,
    C4 = 261.63,
    D4 = 293.66,
    E4 = 329.63,
    F4 = 349.23,
    G4 = 392.0,
    A4 = 440.0,
    B4 = 493.88,
}


const convertMonochrome = (source : Bitmap, palette : number[], 
    alphaThreshold : number) : Bitmap => {

    const output : HTMLCanvasElement = document.createElement("canvas");
    output.width = source.width;
    output.height = source.height;
    const ctx : CanvasRenderingContext2D = output.getContext("2d")!;

    ctx.drawImage(source, 0, 0);

    const imageData : ImageData = ctx.getImageData(0, 0, source.width, source.height);
    const pixels : ImageDataArray = imageData.data;

    for (let i : number = 0; i < pixels.length/4; ++ i) {

        for (let j : number = 0; j < 3; ++ j) {

            pixels[i*4 + j] = palette[j];
        }

           pixels[i*4 + 3] = pixels[i*4 + 3] < alphaThreshold ? 0 : 255;
    }

    ctx.putImageData(imageData, 0, 0);
    return output;
}


const applyPaletteToTile = (pixels : ImageDataArray, 
    dx : number, dy : number, dw : number, dh : number, offset : number,
    alphaMask : number, palette : number[][]) : void => {

    for (let y : number = dy; y < dy + dh; ++ y) {

        for (let x : number = dx; x < dx + dw; ++ x) {

            const i : number = y*offset + x;
            const colorIndex : number = Math.round(pixels[i*4]/85);
            const paletteEntry : number[] = palette[colorIndex];

            for (let j : number = 0; j < 3; ++ j) {

                pixels[i*4 + j] = paletteEntry[j] ?? 255;
            }
            pixels[i*4 + 3] = Number(colorIndex != alphaMask)*255;
        }
    }
}


const applyPalette = (source : Bitmap, palette : number[][], alphaLookUp : number[]) : Bitmap => {

    const output : HTMLCanvasElement = document.createElement("canvas");
    output.width = source.width;
    output.height = source.height;
    const ctx : CanvasRenderingContext2D = output.getContext("2d")!;

    ctx.drawImage(source, 0, 0);

    const imageData : ImageData = ctx.getImageData(0, 0, source.width, source.height);
    const pixels : ImageDataArray = imageData.data;
    
    const w : number = (output.width/8) | 0;
    const h : number = (output.height/8) | 0;

    let j : number = 0;
    for (let y : number = 0; y < h; ++ y) {

        for (let x : number = 0; x < w; ++ x) {

            const alphaMask : number = (alphaLookUp[j] ?? 0) - 1;
            applyPaletteToTile(pixels, x*8, y*8, 8, 8, 
            source.width, alphaMask, palette);
            ++ j;
        }
    }
    ctx.putImageData(imageData, 0, 0);
    
    return output;
}


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


const generateLogoRaw = () : Bitmap => {

    const WIDTH : number = 144;
    const HEIGHT : number = 64;

    const canvas : HTMLCanvasElement = document.createElement("canvas")!;
    canvas.width = WIDTH;
    canvas.height = HEIGHT; 

    const ctx : CanvasRenderingContext2D = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = false;

    const dx : number = canvas.width/2;
    ctx.textAlign = "center";
    ctx.font = "bold 16px Arial";
    ctx.fillText("BERNARD THE", dx, 16);
    ctx.font = "bold 28px Arial";
    ctx.fillText("UNICORN", dx, 40);
    ctx.fillText("SLIME", dx, 64);

    return canvas;
}


const generateLogoFinal = (black : Bitmap, white : Bitmap) : Bitmap => {

    const canvas : RenderTarget = new RenderTarget(160, 96, null);
    
    const dx : number = canvas.width/2 - black.width/2;
    const dy : number = 0;

    for (let i : number = -1; i <= 1; ++ i) {
    
        for (let j : number = -1; j <= 2; ++ j) {
    
            canvas.drawBitmap(black, Flip.None, dx + i, dy + j);
        }
    }
    canvas.drawBitmap(white, Flip.None, dx, dy);

    return canvas.toBitmap();
}


export const generateBitmaps = (assets : AssetManager) : void => {

    const LOGO_ALPHA_THRESHOLD : number = 127;

    // Base tileset
    const raw : Bitmap = assets.getBitmap(BitmapIndex.BaseRaw)!;
    assets.addBitmap(BitmapIndex.Base, applyPalette(raw, MASTER_PALETTE, ALPHA_MASK));

    // Fonts
    const fontAlphaMask : number[] = (new Array<number> (16*4)).fill(1);
    const fontRaw : Bitmap = assets.getBitmap(BitmapIndex.FontRaw)!;
    for (let i : number = 0; i < 4; ++ i) {

        const palette : number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0], MASTER_PALETTE[i]];
        const font : Bitmap = applyPalette(fontRaw, palette, fontAlphaMask);
        assets.addBitmap(BitmapIndex.FontBlack + i, font);
    }
    
    // Misc
    assets.addBitmap(BitmapIndex.Moon, generateMoon());
    assets.addBitmap(BitmapIndex.Rainbow, generateRainbow());

    // Logo
    const logoRaw : Bitmap = generateLogoRaw();
    const logoBlack : Bitmap = convertMonochrome(logoRaw, 
        MASTER_PALETTE[0], LOGO_ALPHA_THRESHOLD);
    const logoWhite : Bitmap = convertMonochrome(logoRaw, 
        MASTER_PALETTE[3], LOGO_ALPHA_THRESHOLD);
    assets.addBitmap(BitmapIndex.Logo, generateLogoFinal(logoBlack, logoWhite));
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


    assets.addSound(SoundIndex.Victory,
        audio.createSound( 
            [
            Note.C3, 20, 0.50,
            Note.D3, 10, 0.70,
            Note.E3, 7.5, 1.0,
            Note.F3, 7.5, 1.0,
            Note.E3, 7.5, 1.0,
            Note.F3, 7.5, 1.0,
            Note.A3, 15, 1.0,
            Note.A3, 45, 0.80,
            ], 
            0.35,
            OscType.Square, 
            Ramp.Instant)!);


    assets.addSound(SoundIndex.Undo,
        audio.createSound( 
        [144, 4, 0.90,
         96, 6, 0.30], 
        0.50,
        OscType.Square, 
        Ramp.Instant)!);

    assets.addSound(SoundIndex.Restart,
        audio.createSound( 
        [160, 6, 0.90,
         88, 10, 0.30], 
        0.55,
        OscType.Square, 
        Ramp.Instant)!);

    assets.addSound(SoundIndex.Pause,
        audio.createSound( 
        [128, 12, 0.90], 
        0.50,
        OscType.Square, 
        Ramp.Instant)!);

    assets.addSound(SoundIndex.Select,
        audio.createSound( 
        [120, 6, 1.0,
        96, 2, 0.30], 
        0.55,
        OscType.Sawtooth, 
        Ramp.Instant)!);

    assets.addSound(SoundIndex.Accept,
        audio.createSound( 
        [144, 8, 1.0,
        96, 4, 0.30], 
        0.45,
        OscType.Square, 
        Ramp.Instant)!);

    assets.addSound(SoundIndex.Rise, 
        audio.createSound(
        [80,  4, 0.50,
        128, 3, 0.80,
        192, 2, 0.70,
        288, 12, 0.60], 
        0.80,
        OscType.Sawtooth, 
        Ramp.Exponential)!);  
    
    assets.addSound(SoundIndex.CylinderFall, 
        audio.createSound(
        [224,  6, 0.50,
        192, 4, 0.80,
        128, 2, 0.70,
        80, 6, 0.60], 
        0.60,
        OscType.Sawtooth, 
        Ramp.Exponential)!);

    assets.addSound(SoundIndex.TitleTheme, 
        audio.createSound(
        [Note.G2, 30, 0.55,
         Note.F2, 20, 0.70,
         Note.A2, 10, 0.85,
         Note.B2, 30, 1.0,
        ],
        0.30,
        OscType.Sawtooth, 
        Ramp.Instant)!);
}