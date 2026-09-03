/* 
 * License: GNU General Public License v3
 * Copyright 2026 Jani Nykänen
 */

import { Bitmap } from "./bitmap.js";
import { isometricProjection, isometricProjectionFromComponents } from "./math.js";
import { ProgramInterface } from "./program.js";
import { Flip, RenderTarget } from "./rendertarget.js";
import { Vector } from "./vector.js";
import { Sprite } from "./sprite.js";
import { Terrain } from "./terrain.js";
import { InputFlag, InputState } from "./keyboard.js";
import { ActionIndex } from "./keyconfig.js";
import { Direction } from "./direction.js";
import { MASTER_PALETTE } from "./palette.js";
import { nextParticle, Particle, ParticleType } from "./particle.js";
import { SoundIndex } from "./assetindex.js";


export const enum GameObjectType {

    Unknown = 0,
    Slime = 1,
    Boulder = 2,
    Gem = 3,
    Cylinder = 4,
    CylinderDeactivating = 5,
    RisingPlatformDeactivated = 6,
    RisingPlatform = 7,
    RisenPlatform = 8,
    Egg = 9,
}


export class GameObject {


    private shadowRef : Vector | null = null;

    private basePos : Vector;
    private targetPos : Vector;
    private renderPos : Vector;
    private depthTestPos : Vector

    private sprite : Sprite;
    private _faceDir : Direction = Direction.Down;
    private faceOffset : Vector = new Vector();

    private moving : boolean = false;
    private moveTimer : number = 0.0;
    private gravity : number = 0.0;
    private falling : boolean = false;
    private jumping : boolean = false;

    private _type : GameObjectType;
    private _exists : boolean = true;

    private readonly particles : Particle[];


    public get logicalPos() : Vector {

        return this.basePos;
    }
    public get pos() : Vector {

        return this.depthTestPos;
    }
    public get faceDir() : Direction {

        return this._faceDir;
    }
    public get type() : number {

        return this._type;
    }
    public get exists() : boolean {

        return this._exists;
    }
    

    constructor(x : number, y : number, z : number, 
        type : GameObjectType, particles : Particle[]) {

        this.basePos = new Vector(x, y, z);
        this.renderPos = this.basePos.clone();
        this.targetPos = this.basePos.clone();
        this.depthTestPos = this.basePos.clone();

        this.sprite = new Sprite(16, 16);

        this._type = type;
        this.initialize();

        this.particles = particles;
    }


    private initialize() : void {
     
        switch (this.type) {

        case GameObjectType.Slime:

            this.sprite.setFrame(0, 1);
            this.computeOrientation();
            break;
            
        case GameObjectType.Gem:

            this.sprite.setFrame(0, 3);
            this.moveTimer = ((this.basePos.x | 0) % 2 == (this.basePos.z | 0) % 2) ? Math.PI : 0.0;
            break;

        default:
            break;
        }
    }


    private move(terrain : Terrain, dirx : number, dirz : number, prog : ProgramInterface) : boolean {

        const x : number = (this.basePos.x) | 0;
        const y : number = (this.basePos.y) | 0;
        const z : number = (this.basePos.z) | 0;

        const dx : number = x + dirx;
        const dz : number = z + dirz;

        if (this.isPushable()) {

            if (!terrain.isSlimeNearby(x - dirx, y, z - dirz, terrain.firstSolidTileHeightBelow(x, y, z, this._type)) ||
                terrain.objectAt(x, y + 1, z) !== null) {

                return false;
            }
        }

        let height : number = terrain.heightAt(dx, dz) + 1;
        if (height <= 0 || height > (this.basePos.y | 0) ) {

            return false;
        }

        let objectInFront : GameObject | null = terrain.objectAt(dx, y, dz);
        if (objectInFront?.isSolid(this._type) === true) {
            
            return false;
        }

        let dy : number = height;
        const objectBelow : GameObject | null = terrain.checkObjectBelow(dx, y, dz);
        if (objectBelow?.isSolid(this._type) === true) {

            dy = objectBelow.logicalPos.y + 1;
        }

        this.moving = true;
        this.moveTimer = 0.0;
        this.jumping = this.type == GameObjectType.Slime && 
            ((objectBelow !== null || dy < y) ||
            terrain.checkObjectBelow(x, y, z) !== null);

        this.targetPos.x = dx;
        this.targetPos.y = dy;
        this.targetPos.z = dz;
        
        this.renderPos.makeEqual(this.basePos);

        this.falling = false;

        terrain.markObject(x, y, z, null);
        // terrain.markObject(dx, dy, dz, this);

        if (this.isPushable()) {

            prog.audio.playSound(prog.assets.getSound(SoundIndex.Push), 0.80);
        }
        else if (this.jumping) {

            prog.audio.playSound(prog.assets.getSound(SoundIndex.Jump), 0.80);
        }

        return true;
    }


    private checkFalling(terrain : Terrain) : boolean {

        const x : number = (this.basePos.x) | 0;
        const y : number = (this.basePos.y) | 0;
        const z : number = (this.basePos.z) | 0;

        const floorPos : number = terrain.firstSolidTileHeightBelow(x, y, z) + 1;
        if (floorPos < y) {

            this.falling = true;
            this.moving = true;
            this.gravity = 0.0;

            this.targetPos.y = floorPos;
            terrain.markObject(x, y, z, null);
            return true;
        }
        return false;
    }


    private terminateMovement(terrain : Terrain) : void {

        this.renderPos.y = this.targetPos.y;
        this.moving = false;
        this.falling = false;

        this.basePos.makeEqual(this.targetPos);

        terrain.markObject(this.basePos.x | 0, this.basePos.y | 0, this.basePos.z | 0, this);

        this.shadowRef = null;
    }


    private breakEgg(terrain : Terrain, prog : ProgramInterface) : void {

        this.spawnParticles(ParticleType.EggPiece);
        terrain.markObject(this.basePos.x, this.basePos.y, this.basePos.z, null);
        this._exists = false;
    }


    private updateMovement(terrain : Terrain, prog : ProgramInterface) : void {

        const BASE_MOVE_SPEED : number = 1.0/12.0;
        const JUMP_MOVE_SPEED : number = 1.0/16.0;
        const INITIAL_GRAVITY : number = 0.1;
        const MAX_GRAVITY : number = 0.4;
        const GRAVITY_DELTA : number = 0.0075;
        const JUMP_HEIGHT : number = 0.675;

        if (this._type != GameObjectType.Slime &&
            !this.isPushable()) {

            return;
        }

        if (!this.moving) {

            this.depthTestPos.makeEqual(this.basePos);
            this.renderPos.makeEqual(this.basePos);
            return;
        }

        if (!this.falling) {

            const moveSpeed : number = this.jumping ? JUMP_MOVE_SPEED : BASE_MOVE_SPEED;
            this.moveTimer += moveSpeed*prog.step;
            if (this.moveTimer >= 1.0) {
                
                this.renderPos.x = this.targetPos.x;
                this.renderPos.z = this.targetPos.z;
                this.gravity = INITIAL_GRAVITY;

                if (this.targetPos.y >= this.basePos.y) {

                    this.terminateMovement(terrain);
                    return;
                }
                this.falling = true;
                return;
            }

            const t : number = this.moveTimer;

            this.renderPos.x = (1.0 - t)*this.basePos.x + t*this.targetPos.x;
            this.renderPos.z = (1.0 - t)*this.basePos.z + t*this.targetPos.z;
            if (this.targetPos.y > this.basePos.y) {

                this.renderPos.y = (1.0 - t)*this.basePos.y + t*this.targetPos.y;
            }

            if (this.jumping) {

                this.renderPos.y = this.basePos.y + Math.sin(t*Math.PI)*JUMP_HEIGHT;
            }
            
            return;
        }

        this.gravity = Math.min(MAX_GRAVITY, this.gravity + GRAVITY_DELTA*prog.step);
        this.renderPos.y -= this.gravity*prog.step;
        if (this.renderPos.y <= this.targetPos.y) {

            this.terminateMovement(terrain);
            if (this.isPushable()) {

                if (this._type == GameObjectType.Egg) {

                    this.breakEgg(terrain, prog);
                }
                prog.audio.playSound(prog.assets.getSound(SoundIndex.Fall), 0.80);
            }
        }
    }


    private markShadows(terrain : Terrain) : void {

        if (!this.moving) {

            return;
        }

        if (!this.jumping && (this.targetPos.y | 0) == (this.basePos.y | 0)) {

            return;
        }
            
        if (this.moveTimer < 0.5) {
            
            terrain.markShadow(this.basePos.x, this.basePos.z, this.renderPos);
            return;
        }
        terrain.markShadow(this.targetPos.x, this.targetPos.z, this.renderPos);
    }


    private checkOverlayingShadow(terrain : Terrain) : void {

        const x : number = this.basePos.x | 0;
        const y : number = this.basePos.y | 0;
        const z : number = this.basePos.z | 0;
        if (this.moving || terrain.heightAt(x, z) + 1 != y ||
            terrain.objectAt(x, y + 1, z) !== null) {

            return;
        }
        this.shadowRef = terrain.shadowAt(x, z);
    }


    private computeOrientation() : void {

        this.sprite.flip = 
            this._faceDir == Direction.Left || this._faceDir == Direction.Down ? 
                Flip.Horizontal : Flip.None;

        this.faceOffset.x = this.sprite.flip == Flip.Horizontal ? 1 : 7;
        this.faceOffset.y = this.sprite.column == 2 ? -3 : this.sprite.column - 1;
    }


    private animateSlime(prog : ProgramInterface) : void {

        const FRAME_TIME : number = 15;

        this.computeOrientation();

        if (this.targetPos.y < this.basePos.y) {

            this.sprite.setFrame(this.falling ? 0 : 2, 1);
            return;
        }
        this.sprite.animate(1, 0, 1, FRAME_TIME, prog.step);
    }


    private animateGem(prog : ProgramInterface) : void {

        const FRAME_TIME : number = 10;
        const WAVE_SPEED : number = Math.PI*2.0/75.0;

        this.sprite.animate(3, 0, 3, FRAME_TIME, prog.step);
        this.moveTimer = (this.moveTimer + WAVE_SPEED*prog.step) % (Math.PI*2.0);
    }


    private animateFallingCylinder(somethingMoving : boolean, terrain : Terrain, prog : ProgramInterface) : void {

        const FALL_SPEED : number = 1.0/10.0;

        if (!somethingMoving) {

            return;
        }

        if (this.moveTimer <= 0.0) {

            prog.audio.playSound(prog.assets.getSound(SoundIndex.CylinderFall), 0.80);
        }

        this.moveTimer += FALL_SPEED*prog.step;
        if (this.moveTimer >= 1.0) {

            this._exists = false;
            terrain.markObject(this.basePos.x, this.basePos.y, this.basePos.z, null);
        }
    }


    private animateRisingPlatform(prog : ProgramInterface) : void {

        const RISE_SPEED : number = 1.0/11.0;

        this.moveTimer -= RISE_SPEED*prog.step;
        if (this.moveTimer <= 0.0) {

            this._type = GameObjectType.RisenPlatform;
            this.moveTimer = 0.0;
        }
    }


    private spawnParticles(type : ParticleType) : void {

        const COUNT : number = 4;
        const LAUNCH_SPEED : number = 2.0;
        const JUMP_Y : number = -1.0;

        const angleStep : number = Math.PI*2.0/4.0;

        const v : Vector = isometricProjection(this.renderPos);
        const dx : number = v.x*12;
        const dy : number = v.y*12 + 7;

        for (let i : number = 0; i < COUNT; ++ i) {

            const angle : number = angleStep/2.0 + angleStep*i;

            const speedx : number = Math.cos(angle)*LAUNCH_SPEED;
            const speedy : number = Math.sin(angle)*LAUNCH_SPEED + JUMP_Y;

            nextParticle(this.particles).spawn(type,
                dx, dy, speedx, speedy);
        }
    }


    private computeDepthTestPos() : void {

        this.depthTestPos.setValues(
                Math.round(this.renderPos.x), 
                Math.round(this.renderPos.y), 
                Math.round(this.targetPos.z));
    }


    private moveUp() : void {

        ++ this.targetPos.y;

        this.moveTimer = 1.0/8.0;
        this.moving = true;
        this.jumping = false;
    }


    private moveDown() : void {

        -- this.targetPos.y;

        this.moveTimer = 0.0;
        this.moving = true;
        this.jumping = false;
        this.falling = true;
        this.gravity = 0.1;
    }


    private drawShadow(canvas : RenderTarget, bmp : Bitmap) : void {

        if (this.shadowRef === null) {

            return;
        }

        const v : Vector = isometricProjectionFromComponents(this.shadowRef.x, this.shadowRef.y + 1, this.shadowRef.z);
        const dx : number = v.x*12 - 8;
        const dy : number = v.y*12 - 3;

        canvas.drawBitmap(bmp, Flip.None, dx, dy, 8, 32, 16, 8);
    }


    private drawSlimeFace(canvas : RenderTarget, bmp : Bitmap, dx : number, dy : number) : void {

        canvas.drawBitmap(bmp, this.sprite.flip,
             dx + this.faceOffset.x, 
             dy + this.faceOffset.y, 0, 32, 8, 16);
    }


    private drawSlime(canvas : RenderTarget, bmp : Bitmap, dx : number, dy : number) : void {

        const showFace : boolean = this._type == GameObjectType.Slime; // i.e., active slime
        const faceFront : boolean = this._faceDir == Direction.Right || this._faceDir == Direction.Down;
        if (showFace && !faceFront) {

            this.drawSlimeFace(canvas, bmp, dx, dy);
        }
        this.sprite.draw(canvas, bmp, dx, dy);
        if (showFace && faceFront) {

            // Face
            this.drawSlimeFace(canvas, bmp, dx, dy);
        }
    }


    private drawGem(canvas : RenderTarget, bmp : Bitmap, dx : number, dy : number) : void {

        const AMPLITUDE : number = 1.0;
        const BASE_YOFF : number = 2.0;

        let sx : number = this.sprite.column;
        if (sx == 2) {

            sx = 0;
        }
        else if (sx == 3) {

            sx = 2;
        }
        const flip : Flip = this.sprite.column == 2 ? Flip.Horizontal : Flip.None;

        // Shadow
        canvas.drawBitmap(bmp, flip, dx, dy + 10, 8, 40, 16, 8);

        const offset : number = BASE_YOFF + Math.round(Math.sin(this.moveTimer)*AMPLITUDE);
        dy -= offset;

        // Color correction
        const colorCorrectionIndex : number = sx == 1 ? 1 : 3;
        canvas.setDrawColor(...MASTER_PALETTE[colorCorrectionIndex]);
        canvas.fillRect(dx + 2, dy + 7, 12, 2);

        // Gem body
        canvas.drawBitmap(bmp, flip, dx, dy, sx*16, 48, 16, 16);
    }


    private drawCylinder(canvas : RenderTarget, bmp : Bitmap, dx : number, dy : number) : void {

        let top : number = dy - 1;
        if (this._type == GameObjectType.CylinderDeactivating) {

            top += this.moveTimer*9;
        } 
        const bottom : number = dy + 11;

        // "Neck"
        const neckHeight : number = ((bottom - 3) - top) | 0;
        if (neckHeight > 0) {

            canvas.drawBitmap(bmp, Flip.None, dx, top + 4, 48, 8, 16, 4, 16, neckHeight);
        }

        // Bottom
        canvas.drawBitmap(bmp, Flip.None, dx, dy + 11, 48, 10, 16, 6);
        // Top
        canvas.drawBitmap(bmp, Flip.None, dx, top, 48, 0, 16, 8);
        // Face
        canvas.drawBitmap(bmp, Flip.None, dx + 4, top, 24, 32, 8, 8);
    }


    private drawRisingPlatform(canvas : RenderTarget, bmp : Bitmap, dx : number, dy : number) : void {

        // Shadow
        canvas.drawBitmap(bmp, Flip.None, dx, dy + 11, 8, 40, 16, 8);

        // Narrow part
        canvas.drawBitmap(bmp, Flip.None, dx + 3, dy + 10, 48, 8, 5, 8);
        canvas.drawBitmap(bmp, Flip.None, dx + 8, dy + 10, 59, 8, 5, 8);

        canvas.setDrawColor(...MASTER_PALETTE[2]);
        canvas.fillRect(dx + 7, dy + 10, 2, 5);

        let top : number = dy;
        if (this._type == GameObjectType.RisingPlatform) {
        
            top += this.moveTimer*7.0;
        }

        // Wide part
        canvas.drawBitmap(bmp, Flip.None, dx, top + 4, 48, 8, 16, 8);
        // Top
        canvas.drawBitmap(bmp, Flip.None, dx, top - 1, 48, 0, 16, 8);
        // Arrow
        canvas.drawBitmap(bmp, Flip.None, dx + 4, top, 24, 40, 8, 8);
    }


    public control(terrain : Terrain, prog : ProgramInterface) : boolean {

        if (this.moving) {

            return false;
        }

        if (this.checkFalling(terrain)) {

            return true;
        }

        if (this.type != GameObjectType.Slime && 
            !this.isPushable()) {

            return false;
        }

        const right : InputState = prog.keyboard.getActionState(ActionIndex.Right);
        const up : InputState = prog.keyboard.getActionState(ActionIndex.Up);
        const left : InputState = prog.keyboard.getActionState(ActionIndex.Left);
        const down : InputState = prog.keyboard.getActionState(ActionIndex.Down);

        const maxTimestamp : number = Math.max(right.timestamp, up.timestamp, left.timestamp, down.timestamp);

        let dirx : number = 0;
        let dirz : number = 0;

        if ((right.flag & InputFlag.DownOrPressed) != 0 && right.timestamp >= maxTimestamp) {

            dirx = 1;
            this._faceDir = Direction.Right;
        }
        else if ((left.flag & InputFlag.DownOrPressed) != 0 && left.timestamp >= maxTimestamp) {

            dirx = -1;
            this._faceDir = Direction.Left;
        }
        else if ((down.flag & InputFlag.DownOrPressed) != 0 && down.timestamp >= maxTimestamp) {

            dirz = 1;
            this._faceDir = Direction.Down;
        }
        else if ((up.flag & InputFlag.DownOrPressed) != 0 && up.timestamp >= maxTimestamp) {

            dirz = -1;
            this._faceDir = Direction.Up;
        }

        if (dirx != 0 || dirz != 0) {

            return this.move(terrain, dirx, dirz, prog);
        }
        return false;
    }


    public update(somethingMoving : boolean,  terrain : Terrain, prog : ProgramInterface) : void {
                
        switch (this.type) {

        case GameObjectType.Slime:

            this.animateSlime(prog);
            break;

        case GameObjectType.Gem:

            this.animateGem(prog);
            break;

        case GameObjectType.CylinderDeactivating:

            this.animateFallingCylinder(somethingMoving, terrain, prog);
            break;

        case GameObjectType.RisingPlatform:

            this.animateRisingPlatform(prog);
            break;
    
        default:
            break;
        }
        
        this.updateMovement(terrain, prog);
        this.computeDepthTestPos();
        this.markShadows(terrain);
        this.checkOverlayingShadow(terrain);
    }


    public draw(canvas : RenderTarget, bmp : Bitmap) : void {
        
        const v : Vector = isometricProjection(this.renderPos);
        const dx : number = v.x*12 - 8;
        const dy : number = v.y*12 - 1;

        switch (this.type) {

        case GameObjectType.Slime:

            this.drawSlime(canvas, bmp, dx, dy);
            break;

        case GameObjectType.Boulder:
            
            canvas.drawBitmap(bmp, Flip.None, dx, dy, 48, 16, 16, 16);
            break;

        case GameObjectType.Gem:

            this.drawGem(canvas, bmp, dx, dy);
            break;

        case GameObjectType.CylinderDeactivating:
        case GameObjectType.Cylinder:

            this.drawCylinder(canvas, bmp, dx, dy);
            break;

        case GameObjectType.RisingPlatformDeactivated:

            canvas.drawBitmap(bmp, Flip.None, dx, dy + 9, 0, 80, 16, 8);
            canvas.drawBitmap(bmp, Flip.None, dx + 4, dy + 10, 24, 40, 8, 8);
            break;

        case GameObjectType.RisingPlatform:
        case GameObjectType.RisenPlatform:

            this.drawRisingPlatform(canvas, bmp, dx, dy);
            break;

        case GameObjectType.Egg:

            canvas.drawBitmap(bmp, Flip.None, dx, dy, 16, 80, 16, 16);
            break;

        default:
            break;
        }

        this.drawShadow(canvas, bmp);
    }


    public isMoving() : boolean {

        return this.moving;
    }


    public changeType(type : GameObjectType, force : boolean = false) : void {

        this._type = type;

        switch (type) {

        case GameObjectType.Slime:

            this.sprite.setFrame(0, 1);
            break;

        case GameObjectType.Gem:

            this.sprite.setFrame(0, 0);
            break;

        default:
            break;
        }
    }


    public resolveConflicts(o : GameObject) : boolean {

        if (!this.moving || !o.moving || !this.exists || !o.exists) {

            return false;
        }

        if (this.targetPos.equals(o.targetPos)) {

            if (this.basePos.y > o.basePos.y) {

                ++ this.targetPos.y;
            }
            else {

                ++ o.targetPos.y;
            }
            return true;
        }
        return false;
    }


    public objectCollision(o : GameObject, terrain : Terrain, prog : ProgramInterface) : void {

        if (!this.exists || !o.exists) {

            return;
        }

        switch (o.type) {

        case GameObjectType.Gem:

            if (this.type == GameObjectType.Slime && this.targetPos.equals(o.targetPos)) {

                this.spawnParticles(ParticleType.Star);
                o.kill(false);

                prog.audio.playSound(prog.assets.getSound(SoundIndex.Gem), 0.80);
            }
            break;

        case GameObjectType.Cylinder:

            if (this._type == GameObjectType.Slime &&
                this.basePos.x == o.basePos.x && 
                this.basePos.z == o.basePos.z && 
                this.basePos.y == o.basePos.y + 1) {

                o._type = GameObjectType.CylinderDeactivating;
                this.moveTimer = 0.0;
            }
            break;

        case GameObjectType.RisingPlatformDeactivated:

            if (this.targetPos.equals(o.targetPos)) {
            
                prog.audio.playSound(prog.assets.getSound(SoundIndex.Rise), 0.80);

                o._type = GameObjectType.RisingPlatform;
                o.moveTimer = 1.0;
                this.moveUp();

                terrain.markObject(o.basePos.x, o.basePos.y, o.basePos.z, o);
                // terrain.markObject(this.basePos.x, this.basePos.y, this.basePos.z, this);
            }
            break;
            
        case GameObjectType.Egg:

            if (this._type == GameObjectType.Boulder &&
                this.basePos.x == o.basePos.x && 
                this.basePos.z == o.basePos.z && 
                this.basePos.y == o.basePos.y + 1) {

                o.breakEgg(terrain, prog);
                terrain.markObject(this.basePos.x, this.basePos.y, this.basePos.z, null);
                terrain.markObject(o.basePos.x, o.basePos.y, o.basePos.z, null);
                this.moveDown();
            }
            break;

        default:
            break;
        }
    }


    public respawn(pos : Vector, type : GameObjectType, faceDir : Direction) : void {

        this.basePos.makeEqual(pos);
        this.targetPos.makeEqual(this.basePos);
        this.renderPos.makeEqual(this.basePos);

        this._faceDir = faceDir;
        this._type = type;

        this.moving = false;
        this.falling = false;
        this.moveTimer = 0.0;
        this._exists = true;

        this.initialize();
    }


    public kill(force : boolean = false) : void {

        this._exists = false;
    }


    public isSolid(ownType : GameObjectType) : boolean {

        // This'll do for now...
        return (this._type != GameObjectType.Gem || 
                ownType == GameObjectType.Boulder || 
                ownType == GameObjectType.Egg) && 
            this._type != GameObjectType.RisingPlatformDeactivated;
    }


    public isPushable() : boolean {

        return this._type == GameObjectType.Boulder || this._type == GameObjectType.Egg;
    }
    
}
