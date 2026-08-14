import { Vector } from "./vector.js";



export const isometricProjection = (
    x : number, y : number, z : number, 
    out : Vector) : void => {

    out.setValues(x - z, 0.5*(x + z) - y);
} 