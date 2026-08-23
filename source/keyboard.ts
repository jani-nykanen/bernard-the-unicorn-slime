


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


class Action {
    

    public keys : string[];
    public state : InputState = defaultState();


    constructor(keys : string[]) {

        this.keys = Array.from(keys);
    }
}


export class Keyboard {


    private states : Map<string, InputState>;
    private prevent : Set<string>;
    private actions : Map<number, Action>;

    private _anyPressed : boolean = false;
    private audioContextCreated : boolean = false;


    public get anyPressed() : boolean {

        return this._anyPressed;
    }


    static _defaultState : InputState = defaultState();


    constructor(createAudioContextEvent : (ctx : AudioContext) => void) {

        this.states = new Map<string, InputState> ();
        this.prevent = new Set<string> ();
        this.actions = new Map<number, Action> ();

        // TODO: Verify that e.timestamp works as intended (if not, change
        // to Date.now())
        window.addEventListener("keydown", (e : KeyboardEvent) : void  => {

            if (!this.audioContextCreated) {

                createAudioContextEvent(new AudioContext());
                this.audioContextCreated = true;
            }

            this.keyEvent(e.code, true, e.timeStamp);
            if (this.prevent.has(e.code)) {

                e.preventDefault();
            }
            
        });
        window.addEventListener("keyup", (e : KeyboardEvent) : void  => {

           this.keyEvent(e.code, false, e.timeStamp);
            if (this.prevent.has(e.code)) {

                e.preventDefault();
            }
        }); 
    }


    private keyEvent(key : string, pressed : boolean, timestamp : number) : void {

        let state : InputState | undefined = this.states.get(key);
        if (state === undefined) {

            state = defaultState();
            this.states.set(key, state);
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


    public addAction(id : number, keys : string[], prevent : boolean = true) : void {

        this.actions.set(id, new Action(keys));
        if (prevent) {

            for (const k of keys) {

                this.prevent.add(k);
            }
        }
    }


    public updateStates() : void {

        for (const k of this.states.keys()) {

            const state : InputState = this.states.get(k)!;
            if (state.flag === InputFlag.Pressed) {

                state.flag = InputFlag.Down;
            }
            else if (state.flag == InputFlag.Released) {

                state.flag = InputFlag.Up;
            }
        }
        this._anyPressed = false;
    }


    public updateActions() : void {

        for (const [,a] of this.actions) {

            a.state.timestamp = 0.0;
            a.state.flag = InputFlag.Up;
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
        }
    }


    public getActionState(id : number) : InputState {

        const a : Action | undefined = this.actions.get(id);
        if (a === undefined) {

            return Keyboard._defaultState;
        }
        return a.state;
    }
}
