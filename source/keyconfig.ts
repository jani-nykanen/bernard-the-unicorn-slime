import { Keyboard } from "./keyboard.js";


export const enum ActionIndex {

    Right = 0,
    Up = 1,
    Left = 2,
    Down = 3,

    Select = 4,
    Back = 5,
    Pause = 6,
    
    Undo = 7,
    Reset = 8,
};


export const initKeyConfig = (keyb : Keyboard) : void => {

    keyb.addAction(ActionIndex.Right, ["ArrowRight"]);
    keyb.addAction(ActionIndex.Up, ["ArrowUp"]);
    keyb.addAction(ActionIndex.Left, ["ArrowLeft"]);
    keyb.addAction(ActionIndex.Down, ["ArrowDown"]);

    keyb.addAction(ActionIndex.Select, ["Enter", "Space" ]);
    keyb.addAction(ActionIndex.Back, ["Backspace", "Escape"]);
    keyb.addAction(ActionIndex.Pause, ["Escape"]);

    keyb.addAction(ActionIndex.Undo, ["KeyZ", "Backspace"]);
    keyb.addAction(ActionIndex.Reset, ["KeyR"]);
}
