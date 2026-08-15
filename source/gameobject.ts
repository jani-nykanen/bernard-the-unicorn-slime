import { DepthObject } from "./depthobject.js";
import { Terrain } from "./terrain.js";
import { ProgramInterface } from "./program.js";


export interface GameObject extends DepthObject {

    update(terrain : Terrain, prog : ProgramInterface) : void;
}