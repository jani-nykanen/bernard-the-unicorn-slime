import { Keyboard } from "./keyboard.js";
import { Renderer } from "./renderer.js";
import { Scene, SceneChangeParameter } from "./scene.js";
import { AssetManager } from "./assetmanager.js";


export interface ProgramInterface {

    get keyboard() : Keyboard;
    get assets() : AssetManager;
    get step() : number;

    get screenWidth() : number;
    get screenHeight() : number;

    addScene(name : string, scene : Scene, makeActive? : boolean) : void;
    changeScene(name : string) : boolean;
}


export type OnInitCallback = (prog : ProgramInterface) => void;
export type OnLoadCallback = (prog : ProgramInterface) => void;


export class Program implements ProgramInterface {


    private timeSum : number = 0.0;
    private oldTime : number = 0.0;
    private initialized : boolean = false;

    private _step : number;

    private renderer : Renderer;
    private scenes : Map<string, Scene>;
    private activeScene : Scene | null = null;

    private onInitEvent : OnInitCallback;
    private onLoadEvent : OnLoadCallback;

    public readonly keyboard : Keyboard;
    public readonly assets : AssetManager;

    
    public get step() : number {

        return this._step;
    }
    public get screenWidth() : number {

        return this.renderer.canvas.width;
    }
    public get screenHeight() : number {

        return this.renderer.canvas.height;
    }


    constructor(canvasWidth : number, canvasHeight : number, framerate : number,
        onInit : OnInitCallback, onLoad : OnLoadCallback) {

        this.keyboard = new Keyboard();
        this.renderer = new Renderer(canvasWidth, canvasHeight);
        this.scenes = new Map<string, Scene> ();
        this.assets = new AssetManager();

        this.onInitEvent = onInit;
        this.onLoadEvent = onLoad;

        this._step = 60/framerate;

        window.addEventListener("mousemove", () : void => window.focus());
        window.addEventListener("mousedown", () : void => window.focus());
    }


    public loop(ts : number) : void {

        const MAX_REFRESH_COUNT : number = 5; 

        const frameTime : number = 1000.0/60.0*this._step;
        const loaded : boolean = this.assets.hasLoaded();
        const delta : number = ts - this.oldTime;

        this.timeSum = Math.min(this.timeSum + delta, MAX_REFRESH_COUNT*frameTime);
        this.oldTime = ts;

        const refreshScreen : boolean = this.timeSum >= frameTime;
        let firstFrame : boolean = true;
        for (; this.timeSum >= frameTime; this.timeSum -= frameTime) {

            this.keyboard.updateActions();

            if (this.initialized) {

                this.activeScene?.update(this);
            }

            if (loaded && !this.initialized) {
                
                this.onLoadEvent?.(this);
                this.activeScene?.init(null, this);
                this.initialized = true;
            }
                
            if (firstFrame) {

                this.keyboard.updateStates();
                firstFrame = false;
            }
        }

        if (refreshScreen && loaded) {

            this.activeScene?.redraw(this.renderer.canvas, this.assets);
        }

        window.requestAnimationFrame((ts : number) => this.loop(ts));
    }


    public run() : void {

        this.onInitEvent?.(this);
        this.loop(0.0);
    }


    public addScene(name : string, scene : Scene, makeActive : boolean = false) : void {

        this.scenes.set(name, scene);
        if (makeActive || this.activeScene === null) {

            this.activeScene = scene;
        }
    }


    public changeScene(name : string) : boolean {

        const s : Scene | undefined = this.scenes.get(name);
        if (s === undefined) {

            return false;
        }

        const param : SceneChangeParameter = this.activeScene?.onChange?.() ?? null;
        s.init(param, this);
        this.activeScene = s;
        return true;
    }
}
