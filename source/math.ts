import { Vector } from "./vector.js";


export const isometricProjection = (v : Vector) : Vector => {

    return new Vector(v.x - v.z, 0.5*(v.x + v.z) - v.y);
} 
