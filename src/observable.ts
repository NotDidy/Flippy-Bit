import { Observable, fromEvent, interval, map, merge } from "rxjs";
import { filter } from "rxjs/operators";
import { Action, Constants } from "./types";

/**
 * Emits a FlipDigit action whenever the player presses a key
 * corresponding to a digit position.
 */
export const flipKey$: Observable<Action> = fromEvent<KeyboardEvent>(
    document,
    "keydown",
).pipe(
    filter(event => event.key >= "1" && event.key <= "8"),
    map(
        (event): Action => ({
            kind: "FlipDigit",
            index: Number(event.key) - 1,
        }),
    ),
);

export const restartKey$: Observable<Action> = fromEvent<KeyboardEvent>(
    document,
    "keydown",
).pipe(
    filter(event => event.key.toLowerCase() === "r"),
    map((): Action => ({ kind: "Restart" })),
);

/**
 * Emits a FlipDigit action whenever the player clicks a digit element
 * on screen.
 */
export const flipClick$: Observable<Action> = fromEvent<MouseEvent>(
    document.querySelector("#svgCanvas") as SVGSVGElement,
    "click",
).pipe(
    filter(event =>
        (event.target as SVGElement).hasAttribute("data-fb-digit-index"),
    ),
    map(
        (event): Action => ({
            kind: "FlipDigit",
            index: Number(
                (event.target as SVGElement).getAttribute(
                    "data-fb-digit-index",
                ),
            ),
        }),
    ),
);

export const restartClick$: Observable<Action> = fromEvent<MouseEvent>(
    document.querySelector("#svgCanvas") as SVGSVGElement,
    "click",
).pipe(
    filter(event => {
        const hit = (event.target as SVGElement).hasAttribute(
            "data-fb-restart-button",
        );
        console.log("restart click filter:", event.target, hit);
        return hit;
    }),
    map((): Action => ({ kind: "Restart" })),
);

/**
 * Drives the game loop. Emits a Tick action at a regular interval.
 *
 */
export const tick$: Observable<Action> = interval(Constants.TICK_RATE_MS).pipe(
    map((elapsed): Action => ({ kind: "Tick", elapsedMs: elapsed })),
);

/**
 * Emits a SpawnTarget action at a random interval between 1-3 seconds, each with a fresh id and random hex value.
 *
 */
export const spawn$: Observable<Action> = new Observable(subscriber => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleNext = () => {
        const delayMs = 1000 + Math.random() * 2000; // random delay in [1000, 3000)

        timeoutId = setTimeout(() => {
            subscriber.next({
                kind: "SpawnTarget",
                hexValue: Math.floor(Math.random() * 256), // 0–255, matches an 8-bit digit bank
            });
            scheduleNext();
        }, delayMs);
    };

    scheduleNext();

    return () => clearTimeout(timeoutId);
});

/**
 * The single merged action stream that main.ts subscribes state
 * management to via scan(reduceState, initialState).
 *
 * TODO: merge in flipClick$ once implemented.
 */
export const action$: Observable<Action> = merge(
    flipKey$,
    flipClick$,
    restartClick$,
    restartKey$,
    tick$,
    spawn$,
);
