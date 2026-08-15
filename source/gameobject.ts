import { DepthObject } from "./depthobject.js";
import { Heightmap } from "./heightmap.js";
import { ProgramInterface } from "./program.js";


export interface GameObject extends DepthObject {

    update(heightMap : Heightmap, prog : ProgramInterface) : void;
}