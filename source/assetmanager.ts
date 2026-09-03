/* 
 * License: GNU General Public License v3
 * Copyright 2026 Jani Nykänen
 */

import { Bitmap } from "./bitmap.js";
import { Sound } from "./sound.js";


export class AssetManager {


    private bitmaps : Map<number, Bitmap>;
    private sounds : Map<number, Sound | null>;

    private loadedCount : number = 0;
    private totalCount : number = 0;


    constructor() {

        this.bitmaps = new Map<number, Bitmap> ();
        this.sounds = new Map<number, Sound | null> ();
    }

    
    public getBitmap(id : number) : Bitmap | null {

        return this.bitmaps.get(id) ?? null;
    }


    public loadBitmap(id : number, path : string) : void {

        ++ this.totalCount;

        const image : HTMLImageElement = new Image();
        image.onload = () : void => {

            ++ this.loadedCount;
            this.bitmaps.set(id, image);
        }
        image.src = path;
    }


    public addBitmap(id : number, bmp : Bitmap) : void {

        this.bitmaps.set(id, bmp);
    }


    public getSound(id : number) : Sound | null {

        return this.sounds.get(id) ?? null;
    }


    public addSound(id : number, s : Sound | null) : void {

        this.sounds.set(id, s);
    }


    public hasLoaded() : boolean {

        return this.loadedCount >= this.totalCount;
    }
}
