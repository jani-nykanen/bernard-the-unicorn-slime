import { Bitmap } from "./bitmap.js";
import { DepthObject } from "./depthobject.js";
import { RenderTarget } from "./rendertarget.js";


export class DepthObjectBuffer {


    private objects : DepthObject[] = [];


    constructor() {

        // ...
    }


    public sort() : void {

        this.objects.sort( (a : DepthObject, b : DepthObject) : number => {

            if ((a.pos.z | 0) == (b.pos.z | 0)) {

                if ((a.pos.y | 0) == (b.pos.y | 0)) {

                    return a.pos.x - b.pos.x;
                }
                return a.pos.y - b.pos.y;
            }
            return a.pos.z - b.pos.z;
        })
    }


    public pushObject(d : DepthObject) : void {

        this.objects.push(d);
    }


    public flush() : void {

        this.objects.length = 0;
    }


    public iterate(cb : (d : DepthObject) => void) : void {

        for (const d of this.objects) {

            cb(d);
        }
    }


    public draw(canvas : RenderTarget, bmp : Bitmap) : void {

        for (const d of this.objects) {

            d.draw(canvas, bmp);
        }
    }
}
