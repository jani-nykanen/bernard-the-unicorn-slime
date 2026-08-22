import { Bitmap } from "./bitmap.js";



export class AssetManager {


    private bitmaps : Map<number, Bitmap>;

    private loadedCount : number = 0;
    private totalCount : number = 0;


    private applyPaletteToTile(pixels : ImageDataArray, 
        dx : number, dy : number, dw : number, dh : number, offset : number,
        alphaMask : number, palette : number[][]) : void {

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


    public applyPalette(id : number, newId : number, palette : number[][], alphaLookUp : number[]) : void {

        const source : Bitmap | null = this.getBitmap(id);
        if (source === null) {

            return;
        }

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
                this.applyPaletteToTile(pixels, x*8, y*8, 8, 8, 
                    source.width, alphaMask, palette);
                ++ j;
            }
        }

        ctx.putImageData(imageData, 0, 0);
        this.bitmaps.set(newId, output);
    }


    constructor() {

        this.bitmaps = new Map<number, Bitmap> ();
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


    public hasLoaded() : boolean {

        return this.loadedCount >= this.totalCount;
    }
}
