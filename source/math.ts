import { Vector } from "./vector.js";


export const isometricProjection = (v : Vector) : Vector => {

    return isometricProjectionFromComponents(v.x, v.y, v.z);
} 


export const isometricProjectionFromComponents = (x : number, y : number, z : number) : Vector => {

    return new Vector(x - z, 0.5*(x + z) - y);
} 


export const clamp = (x : number, min : number, max : number) => {

    return Math.max(min, Math.min(x, max));
}


export const signedMod = (m : number, n : number) : number => {

    m |= 0;
    n |= 0;

    return ((m % n) + n) % n;
}
