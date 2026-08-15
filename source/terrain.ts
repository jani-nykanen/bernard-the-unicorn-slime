import { Vector } from "./vector.js";


export class Terrain {


    private heightData : number[];
    private shadowActive : boolean[];
    private shadowPositions : Vector[];

    public readonly width : number;
    public readonly depth : number;
    public readonly maxHeight : number;


    constructor(data : number[], width : number, depth : number) {

        const dummy : Vector = new Vector();

        this.heightData = Array.from(data);
        this.shadowActive = (new Array<boolean> (width*depth)).fill(false);
        this.shadowPositions = (new Array<Vector> (width*depth)).fill(dummy).map(() => new Vector());
        this.width = width;
        this.depth = depth;
        this.maxHeight = Math.max(...data);
    }


    private outOfBounds(x : number, z : number) : boolean {

        return x < 0 || z < 0 || x >= this.width || z >= this.depth;
    }


    public markShadow(x : number, z : number, v : Vector) : void {

        if (this.outOfBounds(x, z)) {

            return;
        }

        const y : number = this.heightAt(x, z);
        const index : number = z*this.width + x;
        
        this.shadowActive[index] = true;
        this.shadowPositions[index].setValues(v.x, y, v.z);
    }


    public heightAt(x : number, z : number) : number {

        if (this.outOfBounds(x, z)) {

            return -1;
        }
        return this.heightData[z*this.width + x];
    }

    
    public shadowAt(x : number, z : number) : Vector | null {

        const index : number = z*this.width + x;
        if (this.outOfBounds(x, z) || !this.shadowActive[index]) {

            return null;
        }
        return this.shadowPositions[index];
    }

 
    public flushShadows() : void {

        for (const k in this.shadowActive) {

            this.shadowActive[k] = false;
        }
    }
}