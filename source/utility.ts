/* 
 * License: GNU General Public License v3
 * Copyright 2026 Jani Nykänen
 */

import { AssetManager } from "./assetmanager.js";
import { Bitmap } from "./bitmap.js";
import { RenderTarget } from "./rendertarget.js";
import { BitmapIndex } from "./assetindex.js";
import { clamp } from "./math.js";


export const drawFadingText = (text : string, canvas : RenderTarget, assets : AssetManager, 
    dx : number, dy : number, t : number) : void => {

    const fontIndex : number = clamp(Math.floor(t*4.0), 0, 3);
    const font : Bitmap = assets.getBitmap(BitmapIndex.FontBlack + fontIndex)!;

    canvas.drawText(font, text, dx, dy);
}
