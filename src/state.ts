
import { Action, Constants, DigitBank, FallingTargetView, State } from "./types";
import { bitsToNumber, updateAt } from "./util";

/**
 * The state the game begins in.
 */
export const initialState: State = {
    digitBank: { bits: Array.from({ length: Constants.DIGIT_COUNT }, () => 0) },
    allCurrentTargetsInPlay: [{ id: 1, hexValue: 0xA, y: 0 }],
    healthReserve: 3, // 
    score: 0,
    gameEnd: false,

    
};

const moveTargetsDown = (
    targets: ReadonlyArray<FallingTargetView>,
): ReadonlyArray<FallingTargetView> =>
    targets.map((t) => ({ ...t, y: t.y + 5 })); // TODO: tune speed, or pass a delta

const CHECK_LINE_Y = 300; // TODO: move to Constants in types.ts

/**
 * Returns a new DigitBank with the bit at `index` flipped (0 -> 1, 1 -> 0).
 *
 */
export const flipDigit = (bank: DigitBank, index: number): DigitBank => ({
    bits: updateAt(bank.bits, index, (bit) => (bit === 0 ? 1 : 0)),
});


/**
 * The single reducer that interprets every Action against the current
 * State.
 */
export const reduceState = (s: State, a: Action): State => {
    switch (a.kind) {
        case "FlipDigit":
            return { ...s, digitBank: flipDigit(s.digitBank, a.index) };
        case "Tick": {
        const movedTargets = moveTargetsDown(s.allCurrentTargetsInPlay);

        const lowestTarget = movedTargets[0]; // only one target in play for now — see note below

        // No target in play: nothing to check, just carry the (empty) move forward.
        if (lowestTarget === undefined) {
            return { ...s, allCurrentTargetsInPlay: movedTargets };
        }

        // Hasn't reached the check line yet — just update positions.
        if (lowestTarget.y < CHECK_LINE_Y) {
            return { ...s, allCurrentTargetsInPlay: movedTargets };
        }

        // Reached the line: judge the digit bank against this target's hexValue.
        const isCorrect = bitsToNumber(s.digitBank.bits) === lowestTarget.hexValue;

        if (isCorrect) {
            return {
                ...s,
                score: s.score + 1,
                allCurrentTargetsInPlay: movedTargets.filter(
                    (t) => t.id !== lowestTarget.id,
                ),
            };
        }

        return { ...s, gameEnd: true };
    }
        case "SpawnTarget":
            throw new Error("TODO: implement SpawnTarget case");
    }
};

