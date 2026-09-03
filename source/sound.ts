/* 
 * License: GNU General Public License v3
 * Copyright 2026 Jani Nykänen
 */

import { clamp } from "./math.js";


const TYPE_LOOKUP : OscillatorType[] = ["square", "triangle", "sawtooth", "sine"];


export const enum Ramp {

    Instant = 0,
    Linear = 1,
    Exponential = 2
};


export const enum OscType {

    Square = 0,
    Triangle = 1,
    Sawtooth = 2,
    Sine = 3,
};


export class Sound {


    private readonly ctx : AudioContext;

    private baseSequence : number[];
    private baseVolume : number;
    private type : OscType;
    private ramp : Ramp;
    private attack : number = 0.0;

    private _playing : boolean = false;

    private oscillator : OscillatorNode | undefined = undefined;


    public get playing() : boolean {

        return this._playing;
    }


    constructor(ctx : AudioContext, sequence : number[], 
        baseVolume : number, type : OscType,
        ramp : Ramp, attack : number = 1.0) {

        this.ctx = ctx;

        this.baseSequence = Array.from(sequence);

        this.baseVolume = baseVolume;
        this.type = type;
        this.ramp = ramp;
        this.attack = attack;
    }


    public stop() : void {

        this.oscillator?.stop();
        this.oscillator?.disconnect();
        this._playing = false;
    }


    public play(volume : number) : void {

        const time : number = this.ctx.currentTime;
        const osc : OscillatorNode = this.ctx.createOscillator();
        const gain : GainNode = this.ctx.createGain();

        osc.type = TYPE_LOOKUP[this.type] ?? "square";

        volume *= this.baseVolume;

        let latestVolume : number = this.baseSequence[2]*volume;

        osc.frequency.setValueAtTime(this.baseSequence[0], time);
        gain.gain.setValueAtTime(this.attack*latestVolume, time);

        let timer : number = 0.0;
        for (let i : number = 0; i < this.baseSequence.length; i += 3) {

            const freq : number = this.baseSequence[i];
            const len : number = this.baseSequence[i + 1];

            latestVolume = clamp(this.baseSequence[i + 2]*volume, 0.0001, 1.0);

            switch (this.ramp) {

            case Ramp.Instant:
                osc.frequency.setValueAtTime(freq, time + timer);
                gain.gain.setValueAtTime(latestVolume, time + timer);
                break;

            case Ramp.Linear:
                osc.frequency.linearRampToValueAtTime(freq, time + timer);
                gain.gain.linearRampToValueAtTime(latestVolume, time + timer);
                break;

            case Ramp.Exponential:
                osc.frequency.exponentialRampToValueAtTime(freq, time + timer);
                gain.gain.exponentialRampToValueAtTime(latestVolume, time + timer);
                break;

            default:
                break;
            }
            timer += 1.0/60.0*len;
        }
        gain.gain.exponentialRampToValueAtTime(latestVolume*0.50, time + timer);
        
        osc.connect(gain).connect(this.ctx.destination);
        osc.start(time);

        osc.stop(time + timer);
        osc.onended = () : void => {
            this._playing = false;
            osc.disconnect();
        }
        
        this.oscillator?.disconnect();
        this.oscillator = osc;

        this._playing = true;
    }
}
