/* 
 * License: GNU General Public License v3
 * Copyright 2026 Jani Nykänen
 */

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

        let scaleFactor : number = 1.0;

        if (targetRatio >= canvasRatio) {

            scaleFactor = height/this.canvas.height;
        }
        else {

            scaleFactor = width/this.canvas.width;
        }

        if (scaleFactor >= 1.0) {

            scaleFactor = Math.floor(scaleFactor);
        }

        const newWidth = this.canvas.width*scaleFactor;
        const newHeight = this.canvas.height*scaleFactor;

        const cornerx : number = (width/2 - newWidth/2) | 0;
        const cornery : number  = (height/2 - newHeight/2) | 0;

        this.canvas.style.width  = `${newWidth}px`;
        this.canvas.style.height = `${newHeight}px`;
    
        this.canvas.style.left = `${cornerx}px`;
        this.canvas.style.top  = `${cornery}px`;
    }
}
