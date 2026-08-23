import { Menu, MenuButton } from "./menu.js";
import { ProgramInterface } from "./program.js";
import { Stage } from "./stage.js";


export const createPauseMenu = (stage : Stage, onQuit : () => void) : Menu => {

    return new Menu(
        [

        new MenuButton("RESUME", (button : MenuButton, prog : ProgramInterface) : boolean => {

            return true;
        }),
        new MenuButton("UNDO", (button : MenuButton, prog : ProgramInterface) : boolean => {

            stage.undo();
            return true;
        }),
        new MenuButton("RESET", (button : MenuButton, prog : ProgramInterface) : boolean => {

            stage.reset();
            return true;
        }),
        new MenuButton("SOUND: ON", (button : MenuButton, prog : ProgramInterface) : boolean => {

            prog.audio.toggleAudio();
            button.changeText(prog.audio.getStateString());
            return false;
        }),
        new MenuButton("QUIT", (button : MenuButton, prog : ProgramInterface) : boolean => {

            onQuit();
            return true;
        }),

        ], false, true);
}