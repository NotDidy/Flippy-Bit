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

/**
 * Emits a FlipDigit action whenever the player clicks a digit element
 * on screen.
 *
 * TODO: implement once view.ts renders the digit row with data hooks.
 */
export const flipClick$: Observable<Action> | null = null; // placeholder

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
export const action$: Observable<Action> = merge(flipKey$, tick$, spawn$);
