import { AssetManager } from "./assetmanager.js";
import { ProgramInterface } from "./program.js";
import { RenderTarget } from "./rendertarget.js";


export type SceneChangeParameter = number | string | null;


export interface Scene {

    init(param : SceneChangeParameter, prog : ProgramInterface) : void;
    update(prog : ProgramInterface) : void;
    redraw(canvas : RenderTarget, assets : AssetManager) : void;
    onChange?() : SceneChangeParameter;
}
