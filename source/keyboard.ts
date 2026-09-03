/* 
 * License: GNU General Public License v3
 * Copyright 2026 Jani Nykänen
 */


export const enum InputFlag {

    Up = 0,
    Down = 1,
    Released = 2,
    Pressed = 3,

    DownOrPressed = 1
}


export type InputState = {

    timestamp : number,
    flag : InputFlag,
}


const defaultState = () : InputState => {return {timestamp: 0.0, flag: InputFlag.Up};}


const updateStateArray = (states : Map<string, InputState>) : void => {

    for (const k of states.keys()) {

        const state : InputState = states.get(k)!;
        if (state.flag === InputFlag.Pressed) {

            state.flag = InputFlag.Down;
        }
        else if (state.flag == InputFlag.Released) {

            state.flag = InputFlag.Up;
        }
    }
}


class Action {
    

    public keys : string[];
    public specialKeys : string[];

    public state : InputState = defaultState();


    constructor(keys : string[], specialKeys : string[] = []) {

        this.keys = Array.from(keys);
        this.specialKeys = Array.from(specialKeys);
    }
}


export class Keyboard {


    private states : Map<string, InputState>;
    private specialStates : Map<string, InputState>; 

    private prevent : Set<string>;
    private preventSpecial : Set<string>;

    private actions : Map<number, Action>;

    private _anyPressed : boolean = false;
    private audioContextCreated : boolean = false;


    public get anyPressed() : boolean {

        return this._anyPressed;
    }


    static _defaultState : InputState = defaultState();


    constructor() {

        this.states = new Map<string, InputState> ();
        this.specialStates = new Map<string, InputState> ();

        this.prevent = new Set<string> ();
        this.preventSpecial = new Set<string> ();

        this.actions = new Map<number, Action> ();
    }


    private keyEvent(states : Map<string, InputState>, key : string, pressed : boolean, timestamp : number) : void {

        let state : InputState | undefined = states.get(key);
        if (state === undefined) {

            state = defaultState();
            states.set(key, state);
        }

        if (pressed) {

            if (state!.flag === InputFlag.Down) {

                return;
            }
            state!.flag = InputFlag.Pressed;
            state!.timestamp = timestamp;

            this._anyPressed = true;
            return;
        }

        if (state!.flag === InputFlag.Up) {

            return;
        }
        state!.flag = InputFlag.Released;
        state!.timestamp = 0.0; 
    }


    public addAction(id : number, keys : string[], specialKeys : string[] = [], prevent : boolean = true) : void {

        this.actions.set(id, new Action(keys, specialKeys));
        if (prevent) {

            for (const k of keys) {

                this.prevent.add(k);
            }

            for (const k of specialKeys) {

                this.prevent.add(k);
            }
        }
    }


    public updateStates() : void {

        updateStateArray(this.states);
        updateStateArray(this.specialStates);
        
        this._anyPressed = false;
    }


    public updateActions() : void {

        for (const [,a] of this.actions) {

            a.state.timestamp = 0.0;
            a.state.flag = InputFlag.Up;

            // Normal keys
            for (const k of a.keys) {

                const state : InputState | undefined = this.states.get(k);
                if (state === undefined || 
                    state.flag === InputFlag.Up || 
                    state.timestamp < a.state.timestamp) {

                    continue;
                }
                a.state.flag = state.flag;
                a.state.timestamp = state.timestamp;
            }
            if (a.state.flag != InputFlag.Up) {

                continue;
            }
            a.state.timestamp = 0;

            // "Special" keys
            for (const k of a.specialKeys) {

                const state : InputState | undefined = this.specialStates.get(k);
                if (state === undefined || 
                    state.flag === InputFlag.Up || 
                    state.timestamp < a.state.timestamp) {

                    continue;
                }
                a.state.flag = state.flag;
                a.state.timestamp = state.timestamp;
            }
        }
    }


    public getActionState(id : number) : InputState {

        const a : Action | undefined = this.actions.get(id);
        if (a === undefined) {

            return Keyboard._defaultState;
        }
        return a.state;
    }


    public setListeners(createAudioContextEvent : (ctx : AudioContext | null) => void) : void {

        window.addEventListener("keydown", (e : KeyboardEvent) : void  => {

            if (!this.audioContextCreated && e.code != "Escape") {

                let ctx : AudioContext | null = null
                try {

                    ctx = new AudioContext();
                }
                catch(e) {

                    ctx = null;
                };

                createAudioContextEvent(ctx);
                this.audioContextCreated = true;
                return;
            }

            this.keyEvent(this.states, e.code, true, e.timeStamp);
            this.keyEvent(this.specialStates, e.key, true, e.timeStamp);
            if (this.prevent.has(e.code) || this.preventSpecial.has(e.key)) {

                e.preventDefault();
            }
            
        });
        window.addEventListener("keyup", (e : KeyboardEvent) : void  => {

           this.keyEvent(this.states, e.code, false, e.timeStamp);
           this.keyEvent(this.specialStates, e.key, false, e.timeStamp);
            if (this.prevent.has(e.code) || this.preventSpecial.has(e.key)) {

                e.preventDefault();
            }
        }); 
    }
}
