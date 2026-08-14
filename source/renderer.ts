import { RenderTarget } from "./rendertarget.js";


export class Renderer {


    private canvasDiv : HTMLDivElement;

    public readonly canvas : RenderTarget;


    constructor(canvasWidth : number, canvasHeight : number) {

        this.canvasDiv = document.createElement("div");
        // div.id = "d"; // TODO: Does this have any purpose?
        this.canvasDiv.setAttribute("style", "position: absolute; top: 0; left: 0; z-index: -1;");

        this.canvas = new RenderTarget(canvasWidth, canvasHeight, this.canvasDiv);

        window.addEventListener("resize", () => {

            this.resize(window.innerWidth, window.innerHeight);
        });
        this.resize(window.innerWidth, window.innerHeight);
    }


    private resize(width : number, height : number) : void {

        const canvasRatio : number = this.canvas.width/this.canvas.height;
        const targetRatio : number = width/height;

        let newWidth : number = width;
        let newHeight : number = height;

        if (targetRatio >= canvasRatio) {

            newWidth = Math.round(newHeight*canvasRatio);
        }
        else {

            newHeight = Math.round(newWidth/canvasRatio);
        }

        const cornerx : number = (width/2 - newWidth/2) | 0;
        const cornery : number  = (height/2 - newHeight/2) | 0;

        this.canvas.style.width  = `${newWidth}px`;
        this.canvas.style.height = `${newHeight}px`;
    
        this.canvas.style.left = `${cornerx}px`;
        this.canvas.style.top  = `${cornery}px`;
    }
}
