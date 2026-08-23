import { Sound, OscType, Ramp } from "./sound.js";


export class AudioPlayer {


    private globalVolume : number;
    private enabled : boolean = true;

    private ctx : AudioContext | null = null;


    constructor(globalVolume : number = 0.60) {

        this.globalVolume = globalVolume;
    }


     public createSound(sequence : number[], baseVolume : number = 1.0,
        type : OscType = OscType.Square, ramp : Ramp = Ramp.Exponential,
        attackTime : number = 0.40) : Sound | null {

        if (this.ctx === null) {

            return null;
        }
        return new Sound(this.ctx, sequence, baseVolume, type, ramp, attackTime);
    }


    public playSound(sound : Sound, volume : number = 0.60) : void {

        if (!this.enabled || this.ctx === null) {

            return;
        }
        try {

            sound.play(volume*this.globalVolume);
        }
        catch (e) {}
    }


    public toggleAudio(state : boolean = !this.enabled) : void {

        this.enabled = state;
    }


    public getStateString() : string {

        return "SOUND: " + (this.enabled ? "ON " : "OFF");
    }


    public setContext(ctx : AudioContext) : void {

        this.ctx ??= ctx;
    }


    public contextCreated() : boolean {

        return this.ctx !== null;
    }
}
