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
    allCurrentTargetsInPlay: [{ id: 1, hexValue: 0xa, y: 0 }],
    healthReserve: 3, //
    score: 0,
    gameEnd: false,
    nextTargetId: 2,
};

const moveTargetsDown = (
    targets: ReadonlyArray<FallingTargetView>,
): ReadonlyArray<FallingTargetView> => targets.map(t => ({ ...t, y: t.y + 5 })); // TODO: tune speed, or pass a delta

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
            return { ...s, digitBank: flipDigit(s.digitBank, a.index) };
        case "Tick": {
            const movedTargets = moveTargetsDown(s.allCurrentTargetsInPlay);

            // "Lowest" = furthest down = largest y, regardless of array order.
            // Explicit rather than relying on insertion order, since that
            // invariant would silently break if targets are ever filtered,
            // reordered, or spawned out of sequence elsewhere.
            const lowestTarget =
                movedTargets.length === 0
                    ? undefined
                    : movedTargets.reduce((lowest, t) =>
                          t.y > lowest.y ? t : lowest,
                      );

            if (lowestTarget === undefined) {
                return { ...s, allCurrentTargetsInPlay: movedTargets };
            }

            if (lowestTarget.y < CHECK_LINE_Y) {
                return { ...s, allCurrentTargetsInPlay: movedTargets };
            }

            const isCorrect =
                bitsToNumber(s.digitBank.bits) === lowestTarget.hexValue;

            if (isCorrect) {
                return {
                    ...s,
                    score: s.score + 1,
                    allCurrentTargetsInPlay: movedTargets.filter(
                        t => t.id !== lowestTarget.id,
                    ),
                };
            }

            return { ...s, gameEnd: true };
        }
        case "SpawnTarget":
            throw new Error("TODO: implement SpawnTarget case");
    }
};
