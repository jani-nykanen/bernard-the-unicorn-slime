import { GameObject, GameObjectType } from "./gameobject.js";
import { Vector } from "./vector.js";
import { Tile, TileFlags } from "./tile.js";
import { DepthObjectBuffer } from "./depthobjectbuffer.js";


export class Terrain {


    private heightData : number[];
    private shadowActive : boolean[];
    private shadowPositions : Vector[];
    private objectPositions : (GameObject | null) [];
    private tiles : Tile[] = [];

    private readonly depthbuffer : DepthObjectBuffer;

    public readonly width : number;
    public readonly depth : number;
    public readonly maxHeight : number;


    constructor(data : number[], width : number, depth : number, 
        depthBuffer : DepthObjectBuffer) {

        const dummy : Vector = new Vector();

        this.heightData = Array.from(data);
        this.width = width;
        this.depth = depth;
        this.maxHeight = Math.max(...data);

        this.depthbuffer = depthBuffer;

        this.shadowActive = (new Array<boolean> (width*depth)).fill(false);
        this.shadowPositions = (new Array<Vector> (width*depth)).fill(dummy).map(() => new Vector());
        this.objectPositions = (new Array<GameObject | null> (width*depth*(this.maxHeight + 2))).fill(null);

        this.computeTiles();
    }


    private computeNeighborhood(x : number, z : number) : number[] {

        const out : number[] = (new Array<number> (9)).fill(-1);
        for (let i : number = -1; i <= 1; ++ i) {

            for (let j : number = -1; j <= 1; ++ j) {

                if (Math.abs(i) == Math.abs(j) || 
                    x + i >= this.width || x + i < 0 ||
                    z + j >= this.depth || z + j < 0) {

                    continue;
                }
                out[(j + 1)*3 + (i + 1)] = this.heightAt(x + i, z + j);
            }
        }
        return out;
    }


    private computeTiles() : void {

        for (let z : number = 0; z < this.depth; ++ z) {

            for (let x : number = 0; x < this.width; ++ x) {

                const starty : number = this.heightAt(x, z);
                const neighborhood : number[] = this.computeNeighborhood(x, z);

                const front : number = this.heightAt(x, z + 1);
                const right : number = this.heightAt(x + 1, z);

                for (let y = starty; y >= 0; -- y) {

                    let flags : number = TileFlags.None;
                    if (y == starty) {

                        flags |= TileFlags.Floor;
                    }
                    if (y > front) {

                        flags |= TileFlags.WallLeft;
                    }
                    if (y > right) {

                        flags |= TileFlags.WallRight;
                    }

                    if (flags == TileFlags.None) {

                        break;
                    }

                    const t : Tile = new Tile(x, y, z, flags, neighborhood, this);
                    this.tiles.push(t);
                    this.depthbuffer.pushObject(t);
                }
            }
        }
    }


    private outOfBounds(x : number, y : number, z : number) : boolean {

        return x < 0 || y < 0 || z < 0 || x >= this.width || y >= this.maxHeight + 2 || z >= this.depth;
    }


    public markShadow(x : number, z : number, v : Vector) : void {

        if (this.outOfBounds(x, 0, z)) {

            return;
        }

        const y : number = this.heightAt(x, z);
        const index : number = z*this.width + x;
        
        this.shadowActive[index] = true;
        this.shadowPositions[index].setValues(v.x, y, v.z);
    }


    public markObject(x : number, y : number, z : number, o : GameObject | null) : void {

        if (this.outOfBounds(x, y, z)) {

            return;
        }
        this.objectPositions[y*(this.width*this.depth) + z*this.width + x] = o;
    }


    public heightAt(x : number, z : number) : number {

        if (this.outOfBounds(x, 0, z)) {

            return -1;
        }
        return this.heightData[z*this.width + x];
    }


    public objectAt(x : number, y : number, z : number) : GameObject | null {

        if (this.outOfBounds(x, y, z)) {

            return null;
        }
        return this.objectPositions[y*(this.width*this.depth) + z*this.width + x];
    }


    public checkObjectBelow(x : number, y : number, z : number) : GameObject | null {

        if (this.outOfBounds(x, y, z)) {

            return null;
        }

        const area : number = this.width*this.depth;
        const offset : number = z*this.width + x;
        const height : number = this.heightAt(x, z);
        for (let dy : number = y - 1; dy > height; -- dy) {

            const o : GameObject | null = this.objectPositions[dy*area + offset] ?? null;
            if (o !== null) {

                return o;
            }
        }
        return null;
    }


    public isSlimeNearby(x : number, y : number, z : number, minY : number) : boolean {

        if (this.outOfBounds(x, y, z)) {

            return false;
        }

        minY = Math.max(minY, this.heightAt(x, z));

        const area : number = this.width*this.depth;
        const offset : number = z*this.width + x;
        for (let dy : number = y; dy > minY; -- dy) {

            const o : GameObject | null = this.objectPositions[dy*area + offset] ?? null;
            if (o?.type === GameObjectType.Slime) {

                return true;
            }
        }
        return false;
    }


    public firstSolidTileHeightBelow(x : number, y : number, z : number) : number {

        const o : GameObject | null = this.checkObjectBelow(x, y, z);
        if (o === null) {

            return this.heightAt(x, z);
        }
        return o.logicalPos.y;
    }

    
    public shadowAt(x : number, z : number) : Vector | null {

        const index : number = z*this.width + x;
        if (this.outOfBounds(x, 0, z) || !this.shadowActive[index]) {

            return null;
        }
        return this.shadowPositions[index];
    }

 
    public flush(flushObjectPosition : boolean = false) : void {

        for (const k in this.shadowActive) {

            this.shadowActive[k] = false;
        }

        if (flushObjectPosition) {
            
            for (const k in this.objectPositions) {

                this.objectPositions[k] = null;
            }
        }
    }
}