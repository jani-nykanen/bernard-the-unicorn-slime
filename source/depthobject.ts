import { Bitmap } from "./bitmap.js";
import { RenderTarget } from "./rendertarget.js";
import { Vector } from "./vector.js";


export interface DepthObject {

    get pos() : Vector;

    draw(canvas : RenderTarget, bmp : Bitmap) : void;
}
