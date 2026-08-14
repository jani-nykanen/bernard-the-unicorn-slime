import { BitmapIndex } from "./assetindex.js";
import { AssetManager } from "./assetmanager.js";
import { Bitmap } from "./bitmap.js";
import { MASTER_PALETTE } from "./palette.js";
import { ProgramInterface } from "./program.js";
import { Flip, RenderTarget } from "./rendertarget.js";
import { Scene, SceneChangeParameter } from "./scene.js";
import { Stage } from "./stage.js";


const TEST_MAP : number[] = [

    4, 4, 3, 2,
    3, 3, 2, 1,
    1, 1, 0, 1,
    1, 1, 0, 0,
]


export class Game implements Scene {
    

    private stage : Stage | null = null;


    constructor() {

        // ...
    }


    public init(param : SceneChangeParameter, prog : ProgramInterface) : void {
        
        this.stage = new Stage(TEST_MAP, 4, 4);
    }


    public update(prog : ProgramInterface) : void {
        
        this.stage?.update(prog);
    }


    public redraw(canvas : RenderTarget, assets : AssetManager) : void {
        
        //canvas.setDrawColor(...MASTER_PALETTE[2]);
        canvas.setDrawColor(0, 85, 170);
        canvas.clear();

        this.stage?.draw(canvas, assets);
    }
}
