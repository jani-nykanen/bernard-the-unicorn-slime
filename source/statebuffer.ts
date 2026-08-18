import { Direction } from "./direction.js";
import { GameObjectType } from "./gameobject.js";
import { Vector } from "./vector.js";



export class ObjectInfo {

    
    public type : GameObjectType = GameObjectType.Unknown;
    public faceDir : Direction = Direction.None;
    public active : boolean = false;

    public readonly pos : Vector = new Vector();


    public makeEqual(o : ObjectInfo) : void {

        this.type = o.type;
        this.faceDir = o.faceDir;
        this.pos.makeEqual(o.pos);
        this.active = o.active;
    }
}


export class PuzzleState {


    private objects : ObjectInfo[] = [];
    private activeIndex : number = 0;


    constructor(maxObjectCount : number) {

        this.objects = new Array<ObjectInfo> (maxObjectCount);
        for (let i : number = 0; i < maxObjectCount; ++ i) {

            this.objects[i] = new ObjectInfo();
        }
    }


    public makeEqual(state : PuzzleState) : void {

        for (let i : number = 0; i < this.objects.length; ++ i) {

            if (i >= state.objects.length) {

                this.objects[i].active = false;
                continue;
            }
            this.objects[i].makeEqual(state.objects[i]);
        }

        this.activeIndex = state.objects.length;
    }


    public flush() : void {

        for (const o of this.objects) {

            o.active = false;
        }
        this.activeIndex = 0;
    }


    public pushObject(o : ObjectInfo) : void {

        if (this.activeIndex >= this.objects.length) {

            return;
        }

        this.objects[this.activeIndex].makeEqual(o);
        ++ this.activeIndex;
    }


    public iterateObjects(cb : (o : ObjectInfo) => void) : void {

        for (let i : number = 0; i < this.activeIndex; ++ i) {

            const o : ObjectInfo = this.objects[i];
            if (!o.active) {

                continue;
            }
            cb(o);
        }
    }
}


export class StateBuffer {


    private states : PuzzleState[];

    private index : number = 0;
    private firstIndex : number = 0;


    constructor(stateCount : number, maxStateObjectCount : number) {

        this.states = new Array<PuzzleState> (stateCount);
        for (let i : number = 0; i < stateCount; ++ i) {

            this.states[i] = new PuzzleState(maxStateObjectCount);
        }
    }


    public pushState(state : PuzzleState) : void {
        
        this.states[this.index].makeEqual(state);
        this.index = (this.index + 1) % this.states.length;
        if (this.index == this.firstIndex) {

            this.firstIndex = (this.firstIndex + 1) % this.states.length;;
        }
    }


    public undo(out : PuzzleState) : boolean {

        if (this.index == this.firstIndex) {

            return false;
        }

        -- this.index;
        if (this.index < 0) {

            this.index = this.states.length - 1;
        }
        out.makeEqual(this.states[this.index]);
        
        return true;
    }
}