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
    filter(event => {
        console.log("click target:", event.target); // temporary
        return (event.target as SVGElement).hasAttribute("data-fb-digit-index");
    }),
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

const BASE_MIN_DELAY_MS = 2000;
const BASE_MAX_DELAY_MS = 5000;
const DELAY_WIDENING_PER_INTERVAL = 500; // ms added to both bounds per Constants.SPEED_INTERVAL_MS survived
const MAX_MIN_DELAY_MS = 25000; // cap so spawns never become absurdly rare late-game

const delayRangeForElapsed = (
    elapsedMs: number,
): { min: number; max: number } => {
    const stepsElapsed = Math.floor(elapsedMs / Constants.SPEED_INTERVAL_MS);
    const widening = stepsElapsed * DELAY_WIDENING_PER_INTERVAL;
    return {
        min: Math.min(BASE_MIN_DELAY_MS + widening, MAX_MIN_DELAY_MS),
        max: Math.min(
            BASE_MAX_DELAY_MS + widening,
            MAX_MIN_DELAY_MS + (BASE_MAX_DELAY_MS - BASE_MIN_DELAY_MS),
        ),
    };
};

/**
 * Emits a SpawnTarget action at a random interval between 1-3 seconds, each with a fresh id and random hex value.
 *
 */
export const spawn$: Observable<Action> = new Observable(subscriber => {
    const startTime = Date.now(); // fixed once, at subscribe-time — the clock spawn$ measures itself against
    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleNext = () => {
        const elapsedMs = Date.now() - startTime;
        const { min, max } = delayRangeForElapsed(elapsedMs);
        const delayMs = min + Math.random() * (max - min);

        timeoutId = setTimeout(() => {
            subscriber.next({
                kind: "SpawnTarget",
                targetValue: Math.floor(Math.random() * 256),
            });
            scheduleNext();
        }, delayMs);
    };

    scheduleNext();

    return () => clearTimeout(timeoutId);
});

/**
 * Emits a SetBase action whenever the player moves the base slider.
 */
export const baseSlider$: Observable<Action> = fromEvent<Event>(
    document.querySelector("#baseSlider") as HTMLInputElement,
    "input",
).pipe(
    map((event): Action => {
        const base = Number((event.target as HTMLInputElement).value);
        console.log("baseSlider$ fired:", base);
        return { kind: "SetBase", base };
    }),
);

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
    baseSlider$,
    tick$,
    spawn$,
);
