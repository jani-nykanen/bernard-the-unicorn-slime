import { DepthObject } from "./depthobject.js";
import { ProgramInterface } from "./program.js";


export interface GameObject extends DepthObject {

    update(prog : ProgramInterface) : void;
}