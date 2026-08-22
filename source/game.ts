import { BitmapIndex } from "./assetindex.js";
import { AssetManager } from "./assetmanager.js";
import { Bitmap } from "./bitmap.js";
import { MASTER_PALETTE } from "./palette.js";
import { ProgramInterface } from "./program.js";
import { Align, Flip, RenderTarget } from "./rendertarget.js";
import { Scene, SceneChangeParameter } from "./scene.js";
import { Stage } from "./stage.js";


const TEST_HEIGHT_MAP : number[] = [

    3, 4, 3, 2,
    2, 3, 3, 1,
    1, 1, 0, 1,
    1, 0, 0, 0,
];

const TEST_OBJECT_MAP : number[] = [

    0, 1, 0, 0,
    0, 0, 2, 3,
    0, 2, 0, 2,
    0, 0, 3, 0,
];


const STAR_POSITIONS : number[][][] = 
[
    [[1,1], [2,6], [7, 7], [12,3], [15, 8]],
    [[5, 4], [4, 10]],
    [[8, 2], [18, 7]]
]


export class Game implements Scene {
    

    private stage : Stage | null = null;


    constructor() {

        // ...
    }


    private drawBackground(canvas : RenderTarget, assets : AssetManager) : void {

        const CLOUD_WIDTH : number = 64;
        const CLOUD_Y : number = 88;

        const bmpBase : Bitmap = assets.getBitmap(BitmapIndex.Base)!;
        const bmpMoon : Bitmap = assets.getBitmap(BitmapIndex.Moon)!;

        canvas.setDrawColor(...MASTER_PALETTE[0]);
        canvas.clear();

        // Moon
        canvas.drawBitmap(bmpMoon, Flip.None, canvas.width - 48, 8);

        // Stars
        for (let i : number = 0; i < 4; ++ i) {

            const table : number[][] = STAR_POSITIONS[i] ?? [];

            const sx : number = 48 + (i % 2)*8;
            const sy : number = 48 + ((i/2) | 0)*8;

            for (const p of table) {

                const dx : number = p[0]*8;
                const dy : number = p[1]*8;

                canvas.drawBitmap(bmpBase, Flip.None, dx, dy, sx, sy, 8, 8);
            }
        }

        // Clouds
        const cloudCount : number = Math.ceil(canvas.width/CLOUD_WIDTH);
        for (let i : number = 0; i < cloudCount + 1; ++ i) {

            const dx : number = i*CLOUD_WIDTH;
            canvas.drawBitmap(bmpBase, Flip.None, dx, CLOUD_Y, 0, 64, CLOUD_WIDTH, 16);
        }
        canvas.setDrawColor(...MASTER_PALETTE[3]);
        canvas.fillRect(0, CLOUD_Y + 16, canvas.width, canvas.height - (CLOUD_Y + 16));
    }


    public init(param : SceneChangeParameter, prog : ProgramInterface) : void {
        
        this.stage = new Stage(TEST_HEIGHT_MAP, TEST_OBJECT_MAP, 4, 4);
    }


    public update(prog : ProgramInterface) : void {
        
        this.stage?.update(prog);
    }


    public redraw(canvas : RenderTarget, assets : AssetManager) : void {

        this.drawBackground(canvas, assets);
        this.stage?.draw(canvas, assets);

        // TODO: Think a better place for this
        const bmpFontWhite : Bitmap = assets.getBitmap(BitmapIndex.FontWhite)!;
        canvas.drawText(bmpFontWhite, "LEVEL 1", canvas.width/2, 1, Align.Center);
    }
}
