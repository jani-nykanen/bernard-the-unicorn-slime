import { Vector } from "./vector.js";


export const isometricProjection = (v : Vector) : Vector => {

    return isometricProjectionFromComponents(v.x, v.y, v.z);
} 


export const isometricProjectionFromComponents = (x : number, y : number, z : number) : Vector => {

    return new Vector(x - z, 0.5*(x + z) - y);
} 
