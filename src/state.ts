import {
    Action,
    Constants,
    DigitBank,
    FallingTargetView,
    State,
} from "./types";
import { bitsToNumber, updateAt } from "./util";

/**
 * The state the game begins in. //Make ReadOnly
 */
export const initialState: State = {
    digitBank: { bits: Array.from({ length: Constants.DIGIT_COUNT }, () => 0) },
    allCurrentTargetsInPlay: [],
    healthReserve: 3, //
    score: 0,
    gameEnd: false,
    nextTargetId: 0,
    elapsedMs: 0,
    displayBase: 16,
};

const BASE_FALL_SPEED = 0.5; // px/tick at game start — matches the original hardcoded value
const MAX_FALL_SPEED = 8; // hard cap so late-game isn't literally unplayable
const SPEED_INCREMENT_PER_INTERVAL = 0.5; // px/tick gained per SPEED_INTERVAL_MS survived

/**
 * Fall speed (px/tick), increasing in steps every SPEED_INTERVAL_MS of
 * survival, capped at MAX_FALL_SPEED. Pure function of elapsed time so
 * it's trivially testable and reusable, independent of when/how often
 * Tick actually fires.
 */
const speedForElapsed = (elapsedMs: number): number => {
    const stepsElapsed = Math.floor(elapsedMs / Constants.SPEED_INTERVAL_MS);
    const rawSpeed =
        BASE_FALL_SPEED + stepsElapsed * SPEED_INCREMENT_PER_INTERVAL;
    return Math.min(rawSpeed, MAX_FALL_SPEED);
};

const moveTargetsDown = (
    targets: ReadonlyArray<FallingTargetView>,
    fallSpeed: number,
): ReadonlyArray<FallingTargetView> =>
    targets.map(t => ({ ...t, y: t.y + fallSpeed }));

const CHECK_LINE_Y = 300; // TODO: move to Constants in types.ts

/**
 * Returns a new DigitBank with the bit at `index` flipped (0 -> 1, 1 -> 0).
 *
 */
export const flipDigit = (bank: DigitBank, index: number): DigitBank => ({
    bits: updateAt(bank.bits, index, bit => (bit === 0 ? 1 : 0)),
});

/**
 * The single reducer that interprets every Action against the current
 * State.
 */
export const reduceState = (s: State, a: Action): State => {
    switch (a.kind) {
        case "FlipDigit":
            if (s.gameEnd) {
                return s; // ignore digit flips once the game is over
            }
            return { ...s, digitBank: flipDigit(s.digitBank, a.index) };
        case "Tick": {
            if (s.gameEnd) {
                return s;
            }

            const elapsedMs = s.elapsedMs + Constants.TICK_RATE_MS;
            const fallSpeed = speedForElapsed(elapsedMs);
            const movedTargets = moveTargetsDown(
                s.allCurrentTargetsInPlay,
                fallSpeed,
            );

            const lowestTarget =
                movedTargets.length === 0
                    ? undefined
                    : movedTargets.reduce((lowest, t) =>
                          t.y > lowest.y ? t : lowest,
                      );

            if (lowestTarget === undefined) {
                return {
                    ...s,
                    elapsedMs,
                    allCurrentTargetsInPlay: movedTargets,
                };
            }

            if (lowestTarget.y < CHECK_LINE_Y) {
                return {
                    ...s,
                    elapsedMs,
                    allCurrentTargetsInPlay: movedTargets,
                };
            }

            const isCorrect =
                bitsToNumber(s.digitBank.bits) === lowestTarget.targetValue;

            if (isCorrect) {
                return {
                    ...s,
                    elapsedMs,
                    score: s.score + 1,
                    allCurrentTargetsInPlay: movedTargets.filter(
                        t => t.id !== lowestTarget.id,
                    ),
                };
            }

            return { ...s, elapsedMs, gameEnd: true };
        }
        case "SpawnTarget":
            if (s.gameEnd) {
                return s; // ignore all further actions once the game has ended
            }
            return {
                ...s,
                nextTargetId: s.nextTargetId + 1,
                allCurrentTargetsInPlay: [
                    ...s.allCurrentTargetsInPlay,
                    { id: s.nextTargetId, targetValue: a.targetValue, y: 0 },
                ],
            };
        case "Restart":
            return initialState;

        case "SetBase":
            return { ...s, displayBase: a.base };
    }
};
