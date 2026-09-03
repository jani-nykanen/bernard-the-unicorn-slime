/* 
 * License: GNU General Public License v3
 * Copyright 2026 Jani Nykänen
 */


export const LOCALSTORAGE_KEY : string = "__jn1";


export const saveData = (levelIndex : number) : void => {

    try {

        // At least earlier versions of Closure tried to
        // compress window.localStorage to something non-existent,
        // so I'm playing safe here.
        window["localStorage"]["setItem"](LOCALSTORAGE_KEY, String(levelIndex));
    }
    catch(e) {};
}


export const loadData = () : number => {

    try {

        return Number(window["localStorage"]["getItem"](LOCALSTORAGE_KEY) ?? 0);
    }
    catch(e) {}

    return 0;
}
