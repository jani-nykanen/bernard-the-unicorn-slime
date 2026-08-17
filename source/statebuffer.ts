import { Direction } from "./direction.js";
import { MovingObjectType } from "./movingobject.js";
import { Vector } from "./vector.js";



class ObjectInfo {

    
    public type : MovingObjectType = MovingObjectType.Unknown;
    public faceDir : Direction = Direction.None;
    public pos : Vector = new Vector();

    public active : boolean = false;
}


class PuzzleState {


    public objects : ObjectInfo[] = [];


    constructor() {

        // ...
    }
}


export class StateBuffer {



}