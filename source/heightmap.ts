

export class Heightmap {


    private data : number[];

    public readonly width : number;
    public readonly depth : number;
    public readonly maxHeight : number;


    constructor(data : number[], width : number, depth : number) {

        this.data = Array.from(data);
        this.width = width;
        this.depth = depth;
        this.maxHeight = Math.max(...data);
    }


    public heightAt(x : number, z : number) : number {

        if (x < 0 || z < 0 || x >= this.width || z >= this.depth) {

            return -1;
        }
        return this.data[z*this.width + x];
    }
}