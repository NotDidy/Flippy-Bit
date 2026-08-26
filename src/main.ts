/**
 * main.ts
 *
 * Wires the action stream through state reduction to rendering.
 */

import "./style.css";
import { scan, switchMap, take } from "rxjs";
import { fromEvent } from "rxjs";
import { initialState, reduceState } from "./state";
import { action$ } from "./observable";
import { render } from "./view";
import { State } from "./types";

export const state$ = () => action$.pipe(scan(reduceState, initialState));

// The following simply runs your main function on window load. Make sure
// to leave it in place. You should not need to change this, beware if
// you are.
if (typeof window !== "undefined") {
    // Observable: wait for first user click
    const click$ = fromEvent(document.body, "mousedown").pipe(take(1));

    click$.pipe(switchMap(() => state$())).subscribe(render());
}