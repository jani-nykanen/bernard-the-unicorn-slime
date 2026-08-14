import { BitmapIndex } from "./assetindex.js";
import { AssetManager } from "./assetmanager.js";
import { Bitmap } from "./bitmap.js";
import { ProgramInterface } from "./program.js";
import { Flip, RenderTarget } from "./rendertarget.js";
import { Scene, SceneChangeParameter } from "./scene.js";


export class Game implements Scene {
    

    constructor() {

        // ...
    }


    public init(param : SceneChangeParameter, prog : ProgramInterface) : void {
        
    }


    public update(prog : ProgramInterface) : void {
        
    }


    public redraw(canvas : RenderTarget, assets : AssetManager) : void {
        
        canvas.setDrawColor(0, 85, 170);
        canvas.clear();

        const bmp : Bitmap = assets.getBitmap(BitmapIndex.Base)!;

        canvas.drawBitmap(bmp, Flip.None, 8, 8);
    }
}
