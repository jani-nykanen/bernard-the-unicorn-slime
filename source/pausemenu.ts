import { Menu, MenuButton } from "./menu.js";
import { ProgramInterface } from "./program.js";
import { Stage } from "./stage.js";


export const createPauseMenu = (stage : Stage, onQuit : () => void) : Menu => {

    return new Menu(
        [

        new MenuButton("RESUME", () : boolean => {

            return true;
        }),
        new MenuButton("UNDO", () : boolean => {

            stage.undo();
            return true;
        }),
        new MenuButton("RESET", () : boolean => {

            stage.reset();
            return true;
        }),
        new MenuButton("SOUND: ON", (prog? : ProgramInterface) : boolean => {

            // TODO: Toggle audio
            return false;
        }),
        new MenuButton("QUIT", () : boolean => {

            onQuit();
            return true;
        }),

        ], false, true);
}