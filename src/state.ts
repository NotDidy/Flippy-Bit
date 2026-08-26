
import { Action, Constants, DigitBank, State } from "./types";
import { updateAt } from "./util";

/**
 * The state the game begins in.
 */
export const initialState: State = {
    digitBank: { bits: Array.from({ length: Constants.DIGIT_COUNT }, () => 0) },
    allCurrentTargetsInPlay: [],
    healthReserve: 3, // 
    score: 0,
    gameEnd: false,
};

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
        case "Tick":
            return s;
        case "SpawnTarget":
            throw new Error("TODO: implement SpawnTarget case");
    }
};

